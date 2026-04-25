const express = require('express');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Constancias del usuario autenticado
router.get('/my', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT cert.*, c.title AS course_title, c.category
      FROM certificates cert
      JOIN courses c ON c.id=cert.course_id
      WHERE cert.user_id=$1
      ORDER BY cert.issued_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Constancia específica por id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT cert.*, c.title AS course_title, u.name AS user_name
      FROM certificates cert
      JOIN courses c ON c.id=cert.course_id
      JOIN users u ON u.id=cert.user_id
      WHERE cert.id=$1 AND (cert.user_id=$2 OR $3='admin')
    `, [req.params.id, req.user.id, req.user.role]);
    if (!rows[0]) return res.status(404).json({ error: 'Constancia no encontrada' });
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

module.exports = router;
