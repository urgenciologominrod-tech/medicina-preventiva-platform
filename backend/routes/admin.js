const express = require('express');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();
router.use(authMiddleware, isAdmin);

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

module.exports = router;
