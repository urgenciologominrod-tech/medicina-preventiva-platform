const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();
router.use(authMiddleware, isAdmin);


const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const DOCUMENT_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov']);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeBaseName = path.basename(file.originalname, ext)
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'archivo';
      cb(null, `${safeBaseName}-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isAllowed = IMAGE_EXTENSIONS.has(ext) || DOCUMENT_EXTENSIONS.has(ext) || VIDEO_EXTENSIONS.has(ext);

    if (!isAllowed) {
      return cb(new Error('Tipo de archivo no permitido'));
    }

    cb(null, true);
  }
});

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

// Subida de archivos para contenidos
router.post('/upload', (req, res) => {
  console.log('UPLOAD HIT');
  upload.single('file')(req, res, async (error) => {
    try {
      if (error) {
        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'El archivo excede el límite permitido de 100 MB',
            code: 'LIMIT_FILE_SIZE',
            detail: 'Reduce el tamaño del archivo e intenta nuevamente.'
          });
        }

        if (error instanceof multer.MulterError && error.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            error: 'Campo de archivo inválido',
            code: 'LIMIT_UNEXPECTED_FILE',
            detail: 'El backend espera el campo "file" en FormData.'
          });
        }

        return res.status(400).json({
          error: error.message || 'Archivo inválido',
          code: error.code || 'UPLOAD_ERROR',
          detail: 'Verifica el tipo de archivo permitido e intenta de nuevo.'
        });
      }

      console.log(req.file ? req.file.originalname : 'NO FILE');

      if (!req.file) {
        return res.status(400).json({
          error: 'No se recibió archivo',
          code: 'FILE_MISSING',
          detail: 'Adjunta un archivo en el campo "file".'
        });
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      const isVideo = VIDEO_EXTENSIONS.has(ext);
      const maxSize = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024;

      if (req.file.size > maxSize) {
        await fs.promises.unlink(req.file.path).catch(() => {});
        return res.status(400).json({
          error: isVideo
            ? 'El video excede el límite de 100 MB'
            : 'El archivo excede el límite de 20 MB',
          code: 'FILE_SIZE_POLICY',
          detail: isVideo
            ? 'Selecciona un video menor a 100 MB.'
            : 'Selecciona un archivo menor a 20 MB para este tipo de recurso.'
        });
      }

      const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      return res.json({
        url,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } catch (err) {
      console.error('Error en /admin/upload:', err);
      return res.status(500).json({
        error: 'No se pudo subir el archivo',
        code: 'UPLOAD_INTERNAL_ERROR',
        detail: 'Ocurrió un error inesperado en el servidor al procesar la subida.'
      });
    }
  });
});

module.exports = router;
