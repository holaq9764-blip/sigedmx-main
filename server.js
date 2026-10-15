const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.resolve(process.env.DATA_DIR || __dirname);
const USERS_DB_PATH = path.join(DATA_DIR, 'database', 'users.json');
const ORDERS_DB_PATH = path.join(DATA_DIR, 'database', 'orders.json');
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32)) {
    throw new Error('En producción, configura JWT_SECRET con al menos 32 bytes aleatorios.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase();

app.use(express.json());
app.use('/uploads', (_req, res) => res.status(404).end());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para autenticación básica (JWT-like con sesión en headers)
function authenticateRequest(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ ok: false, message: 'No autorizado.' });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.authUser = payload; // { id, email }
        next();
    } catch (err) {
        return res.status(401).json({ ok: false, message: 'Token inválido.' });
    }
}

function signToken(user) {
    return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function getAuthPayload(req) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

function isAdminUser(authUser) {
    return Boolean(ADMIN_EMAIL && authUser && (authUser.email || '').toLowerCase() === ADMIN_EMAIL);
}

function isAdmin(req) {
    return isAdminUser(req.authUser);
}

function isOrderOwner(order, authUser) {
    if (!order || !authUser) return false;
    if (order.userId && authUser.id) {
        return String(order.userId) === String(authUser.id);
    }
    if (order.email && authUser.email) {
        return (order.email || '').toLowerCase() === (authUser.email || '').toLowerCase();
    }
    return false;
}

function sanitizeOrder(order) {
    if (!order) return order;
    const { uploadToken, ...safeOrder } = order;
    return safeOrder;
}

async function ensureUsersDb() {
    try {
        await fs.access(USERS_DB_PATH);
    } catch {
        await fs.mkdir(path.dirname(USERS_DB_PATH), { recursive: true });
        await fs.writeFile(USERS_DB_PATH, '[]', 'utf-8');
    }
}

async function ensureOrdersDb() {
    try {
        await fs.access(ORDERS_DB_PATH);
    } catch {
        await fs.mkdir(path.dirname(ORDERS_DB_PATH), { recursive: true });
        await fs.writeFile(ORDERS_DB_PATH, '[]', 'utf-8');
    }
}

async function ensureUploadsDir() {
    try {
        await fs.access(uploadsDir);
    } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
    }
}

async function authorizeReceiptUpload(req, res, next) {
    try {
        const orders = await readOrders();
        const order = orders.find((item) => item.id === req.params.id);
        if (!order) {
            return res.status(404).json({ ok: false, message: 'Orden no encontrada.' });
        }

        const authUser = getAuthPayload(req);
        const providedUploadToken = String(req.get('x-upload-token') || '');
        const allowedByRole = isAdminUser(authUser) || isOrderOwner(order, authUser);
        const allowedByToken = Boolean(order.uploadToken) && order.uploadToken === providedUploadToken;
        if (!allowedByRole && !allowedByToken) {
            return res.status(403).json({ ok: false, message: 'No autorizado para subir comprobante a esta orden.' });
        }

        req.receiptOrders = orders;
        req.receiptOrder = order;
        next();
    } catch (error) {
        console.error('Receipt upload authorization error:', error);
        return res.status(500).json({ ok: false, message: 'No se pudo autorizar la carga del comprobante.' });
    }
}

function uploadSingleReceipt(req, res, next) {
    upload.single('receipt')(req, res, (error) => {
        if (!error) return next();
        const status = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        const message = status === 413 ? 'El archivo supera el límite de 10 MB.' : error.message;
        return res.status(status).json({ ok: false, message });
    });
}

async function readUsers() {
    await ensureUsersDb();
    const data = await fs.readFile(USERS_DB_PATH, 'utf-8');
    return JSON.parse(data);
}

async function writeUsers(users) {
    await fs.writeFile(USERS_DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
}

async function readOrders() {
    await ensureOrdersDb();
    const data = await fs.readFile(ORDERS_DB_PATH, 'utf-8');
    return JSON.parse(data);
}

async function writeOrders(orders) {
    await ensureOrdersDb();
    await fs.writeFile(ORDERS_DB_PATH, JSON.stringify(orders, null, 2), 'utf-8');
}

// Multer setup for uploads
const uploadsDir = path.join(DATA_DIR, 'storage', 'uploads');
const legacyUploadsDir = path.join(__dirname, 'public', 'uploads');
const upload = multer({
    dest: uploadsDir,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'));
        }
    }
});

function validateRegistration({ fullName, email, password }) {
    if (!fullName || fullName.trim().length < 3) {
        return 'El nombre debe tener al menos 3 caracteres.';
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return 'Ingresa un correo electrónico válido.';
    }

    if (!password || password.length < 6) {
        return 'La contraseña debe tener al menos 6 caracteres.';
    }

    return null;
}

app.post('/api/register', async(req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const validationError = validateRegistration({ fullName, email, password });

        if (validationError) {
            return res.status(400).json({ ok: false, message: validationError });
        }

        const users = await readUsers();
        const existingUser = users.find((user) => user.email.toLowerCase() === email.toLowerCase());

        if (existingUser) {
            return res.status(409).json({ ok: false, message: 'Este correo ya está registrado.' });
        }

        const hashed = await bcrypt.hash(password, 10);

        const newUser = {
            id: Date.now(),
            fullName: fullName.trim(),
            email: email.toLowerCase(),
            password: hashed,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await writeUsers(users);

        return res.status(201).json({
            ok: true,
            message: 'Registro exitoso.',
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email
            },
            token: signToken(newUser)
        });
    } catch (error) {
        return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
    }
});

app.post('/api/login', async(req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ ok: false, message: 'Correo y contraseña son obligatorios.' });
        }

        const users = await readUsers();
        const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return res.status(401).json({ ok: false, message: 'Credenciales inválidas.' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ ok: false, message: 'Credenciales inválidas.' });
        }

        return res.json({
            ok: true,
            message: 'Inicio de sesión exitoso.',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email
            },
            token: signToken(user)
        });
    } catch (error) {
        return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
    }
});

app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'DC Nexus Pro', timestamp: new Date().toISOString() });
});

app.listen(PORT, async() => {
    await ensureUploadsDir();
    await ensureOrdersDb();
    console.log(`DC Nexus Pro ejecutándose en http://localhost:${PORT}`);
});

// Create a new order (pending)
app.post('/api/orders', async(req, res) => {
    try {
        const authUser = getAuthPayload(req);
        const {
            docType,
            fullName,
            email,
            phone,
            price,
            notes
        } = req.body;

        const normalizedDocType = String(docType || '').trim();
        const normalizedName = String(fullName || '').trim();
        const normalizedEmail = authUser && authUser.email
            ? String(authUser.email).trim().toLowerCase()
            : String(email || '').trim().toLowerCase();

        if (!normalizedDocType || !normalizedName || !normalizedEmail) {
            return res.status(400).json({ ok: false, message: 'Faltan datos obligatorios: docType, fullName, email.' });
        }

        if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
            return res.status(400).json({ ok: false, message: 'Ingresa un correo electronico valido.' });
        }

        if (normalizedName.length < 3) {
            return res.status(400).json({ ok: false, message: 'El nombre debe tener al menos 3 caracteres.' });
        }

        const parsedPrice = (price === undefined || price === null || price === '') ? null : Number(price);
        if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
            return res.status(400).json({ ok: false, message: 'El precio debe ser un numero valido mayor o igual a 0.' });
        }

        const orders = await readOrders();
        const newOrder = {
            id: Date.now().toString(),
            userId: authUser && authUser.id ? String(authUser.id) : null,
            docType: normalizedDocType,
            fullName: normalizedName,
            email: normalizedEmail,
            phone: phone ? String(phone).trim() : '',
            price: parsedPrice,
            notes: notes ? String(notes).trim() : '',
            status: 'pending',
            receipt: null,
            uploadToken: crypto.randomBytes(20).toString('hex'),
            createdAt: new Date().toISOString()
        };

        orders.push(newOrder);
        await writeOrders(orders);

        return res.status(201).json({
            ok: true,
            order: sanitizeOrder(newOrder),
            uploadToken: newOrder.uploadToken
        });
    } catch (err) {
        return res.status(500).json({ ok: false, message: 'Error al crear la orden.' });
    }
});

// Upload receipt for an order
app.post('/api/orders/:id/upload', authorizeReceiptUpload, uploadSingleReceipt, async(req, res) => {
    try {
        if (!req.file) return res.status(400).json({ ok: false, message: 'No se subió archivo.' });
        const { receiptOrder: order, receiptOrders: orders } = req;
        order.receipt = req.file.filename;
        order.receiptStorage = 'private';
        order.receiptName = path.basename(req.file.originalname);
        order.status = 'pending_verification';
        await writeOrders(orders);

        return res.json({ ok: true, order: sanitizeOrder(order) });
    } catch (err) {
        console.error('Receipt upload error:', err);
        return res.status(500).json({ ok: false, message: 'Error al subir comprobante.' });
    }
});

app.get('/api/orders/:id/receipt', authenticateRequest, async(req, res) => {
    try {
        const orders = await readOrders();
        const order = orders.find((item) => item.id === req.params.id);
        if (!order) return res.status(404).json({ ok: false, message: 'Orden no encontrada.' });
        if (!isAdmin(req) && !isOrderOwner(order, req.authUser)) {
            return res.status(403).json({ ok: false, message: 'No autorizado para consultar este comprobante.' });
        }
        if (!order.receipt) return res.status(404).json({ ok: false, message: 'La solicitud no tiene comprobante.' });

        const receiptName = path.basename(order.receipt);
        const receiptDirectory = order.receiptStorage === 'private' ? uploadsDir : legacyUploadsDir;
        const receiptPath = path.join(receiptDirectory, receiptName);
        try {
            await fs.access(receiptPath);
        } catch {
            return res.status(404).json({ ok: false, message: 'No se encontró el archivo del comprobante.' });
        }

        const extension = path.extname(order.receiptName || '').toLowerCase();
        return res.download(receiptPath, `comprobante-${order.id}${extension}`);
    } catch (err) {
        console.error('Receipt download error:', err);
        return res.status(500).json({ ok: false, message: 'Error al descargar comprobante.' });
    }
});

// List orders (admin) - protected
app.get('/api/orders', authenticateRequest, async(req, res) => {
    try {
        const orders = await readOrders();
        const userId = req.authUser?.id;
        const userEmail = (req.authUser?.email || '').toLowerCase();
        const admin = isAdmin(req);
        const filtered = admin ? orders : orders.filter((o) => {
            if (o.userId && userId) return String(o.userId) === String(userId);
            if (o.email) return (o.email || '').toLowerCase() === userEmail;
            return false;
        });
        return res.json({ ok: true, orders: filtered.map(sanitizeOrder), admin });
    } catch (err) {
        return res.status(500).json({ ok: false, message: 'Error al leer órdenes.' });
    }
});

// Validate or reject an order - protected
app.post('/api/orders/:id/validate', authenticateRequest, async(req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({ ok: false, message: 'Solo administradores pueden validar órdenes.' });
        }
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'
        const orders = await readOrders();
        const order = orders.find(o => o.id === id);
        if (!order) return res.status(404).json({ ok: false, message: 'Orden no encontrada.' });

        if (action === 'approve') order.status = 'paid';
        else if (action === 'reject') order.status = 'rejected';
        else return res.status(400).json({ ok: false, message: 'Acción inválida.' });

        await writeOrders(orders);
        return res.json({ ok: true, order: sanitizeOrder(order) });
    } catch (err) {
        return res.status(500).json({ ok: false, message: 'Error al validar orden.' });
    }
});

// Password reset: request token
app.post('/api/password-reset-request', async(req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ ok: false, message: 'El correo es requerido.' });

        const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
        if (process.env.NODE_ENV === 'production' && !smtpConfigured) {
            return res.status(503).json({ ok: false, message: 'El restablecimiento de contraseña no está disponible. Comunícate con soporte.' });
        }

        const users = await readUsers();
        const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
        if (!user) {
            // avoid leaking existence
            return res.json({ ok: true, message: 'Si el correo existe, recibirás un token.' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.resetToken = token;
        user.resetTokenExpires = Date.now() + 3600000; // 1 hour
        await writeUsers(users);

        // If SMTP configured, send email; otherwise return token in response (dev mode)
        if (smtpConfigured) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
                secure: false,
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            });

            const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${token}`;
            const mail = {
                from: process.env.FROM_EMAIL || process.env.SMTP_USER,
                to: user.email,
                subject: 'Restablecer contraseña - DC Nexus Pro',
                text: `Usa este enlace para restablecer tu contraseña (1h): ${resetUrl}`
            };
            try {
                await transporter.sendMail(mail);
            } catch (err) {
                console.error('Password reset email error:', err);
                delete user.resetToken;
                delete user.resetTokenExpires;
                await writeUsers(users);
                return res.status(502).json({ ok: false, message: 'No pudimos enviar el correo. Inténtalo de nuevo más tarde.' });
            }

            return res.json({ ok: true, message: 'Si el correo existe, recibirás un email con instrucciones.' });
        }

        // Dev fallback: return token so developer can test
        return res.json({ ok: true, token, message: 'Modo desarrollo: token devuelto en respuesta.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Error generando token.' });
    }
});

// Password reset: perform reset
app.post('/api/password-reset', async(req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) return res.status(400).json({ ok: false, message: 'Token y nueva contraseña son requeridos.' });
        if (password.length < 6) return res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 6 caracteres.' });

        const users = await readUsers();
        const user = users.find(u => u.resetToken === token && u.resetTokenExpires && u.resetTokenExpires > Date.now());
        if (!user) return res.status(400).json({ ok: false, message: 'Token inválido o expirado.' });

        const hashed = await bcrypt.hash(password, 10);
        user.password = hashed;
        delete user.resetToken;
        delete user.resetTokenExpires;
        await writeUsers(users);

        return res.json({ ok: true, message: 'Contraseña actualizada correctamente.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Error restableciendo contraseña.' });
    }
});
