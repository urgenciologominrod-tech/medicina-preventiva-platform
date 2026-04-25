const express = require('express');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();
router.use(authMiddleware);

// Matriz del usuario autenticado
router.get('/my', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM competency_matrix WHERE user_id=$1 ORDER BY competency_area ASC',
      [req.user.id]
    );
    res.json(rows);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Matriz de cualquier usuario (admin)
router.get('/:userId', isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM competency_matrix WHERE user_id=$1 ORDER BY competency_area ASC',
      [req.params.userId]
    );
    res.json(rows);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Actualizar nivel de competencia (admin)
router.patch('/:userId/:area', isAdmin, async (req, res) => {
  const { level } = req.body;
  try {
    const { rows } = await pool.query(`
      INSERT INTO competency_matrix(user_id,competency_area,level)
      VALUES($1,$2,$3)
      ON CONFLICT(user_id,competency_area) DO UPDATE SET level=$3,updated_at=NOW()
      RETURNING *
    `, [req.params.userId, req.params.area, level]);
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

module.exports = router;
