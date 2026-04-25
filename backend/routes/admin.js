const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();
router.use(authMiddleware, isAdmin);

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_STANDARD_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.pdf',
  '.doc', '.docx', '.ppt', '.pptx',
  '.mp4', '.webm', '.mov'
]);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov']);

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const baseName = path.basename(file.originalname || 'archivo', ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'archivo';
    cb(null, `${Date.now()}-${baseName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error('Tipo de archivo no permitido'));
    }
    return cb(null, true);
  }
});

const uploadSingle = (req, res, next) => {
  upload.single('file')(req, res, err => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo excede el máximo permitido (100MB para video).' });
    }
    return res.status(400).json({ error: err.message || 'Error al subir archivo' });
  });
};

// Estadísticas generales
router.get('/stats', async (req, res) => {
  try {
    const [users, courses, certs, results] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE role='employee' AND is_active=TRUE"),
      pool.query('SELECT COUNT(*) FROM courses'),
      pool.query('SELECT COUNT(*) FROM certificates'),
      pool.query('SELECT COUNT(*) FILTER(WHERE passed=TRUE) AS passed, COUNT(*) AS total FROM exam_results')
    ]);
    res.json({
      totalEmployees: parseInt(users.rows[0].count),
      totalCourses: parseInt(courses.rows[0].count),
      totalCertificates: parseInt(certs.rows[0].count),
      examPassRate: results.rows[0].total > 0
        ? Math.round((results.rows[0].passed / results.rows[0].total) * 100)
        : 0
    });
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Listar usuarios
router.get('/users', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id,name,email,role,department,is_active,created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Activar/desactivar usuario
router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE users SET is_active=NOT is_active WHERE id=$1 RETURNING id,name,is_active',
      [req.params.id]
    );
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Progreso de todos los empleados por curso
router.get('/progress', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.name, u.department, c.title AS course_title,
        COALESCE(up.status,'pending') AS status, up.completed_at
      FROM users u
      CROSS JOIN courses c
      LEFT JOIN user_progress up ON up.user_id=u.id AND up.course_id=c.id
      WHERE u.role='employee' AND u.is_active=TRUE
      ORDER BY u.name, c.title
    `);
    res.json(rows);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Todas las constancias
router.get('/certificates', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT cert.*, u.name AS user_name, u.department, c.title AS course_title
      FROM certificates cert
      JOIN users u ON u.id=cert.user_id
      JOIN courses c ON c.id=cert.course_id
      ORDER BY cert.issued_at DESC
    `);
    res.json(rows);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Subida de archivos para contenidos del curso (admin)
router.post('/upload', uploadSingle, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const ext = path.extname(req.file.originalname || '').toLowerCase();
    const isVideo = VIDEO_EXTENSIONS.has(ext);

    if (!isVideo && req.file.size > MAX_STANDARD_SIZE) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'El archivo excede 20MB. Para videos el límite es 100MB.' });
    }

    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    return res.status(201).json({
      url: publicUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch {
    return res.status(500).json({ error: 'Error al procesar la subida del archivo' });
  }
});

module.exports = router;
