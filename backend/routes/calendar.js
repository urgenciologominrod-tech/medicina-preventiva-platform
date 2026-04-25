const express = require('express');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();
router.use(authMiddleware);

// Eventos del mes
router.get('/', async (req, res) => {
  const { year, month } = req.query;
  try {
    let query = `
      SELECT ce.*, c.title AS course_title, c.category
      FROM calendar_events ce
      JOIN courses c ON c.id=ce.course_id
    `;
    const params = [];
    if (year && month) {
      query += ' WHERE EXTRACT(YEAR FROM ce.scheduled_date)=$1 AND EXTRACT(MONTH FROM ce.scheduled_date)=$2';
      params.push(year, month);
    }
    query += ' ORDER BY ce.scheduled_date ASC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Todos los eventos del año
router.get('/annual', async (req, res) => {
  const { year } = req.query;
  try {
    const { rows } = await pool.query(`
      SELECT ce.*, c.title AS course_title, c.category, c.is_mandatory
      FROM calendar_events ce
      JOIN courses c ON c.id=ce.course_id
      WHERE EXTRACT(YEAR FROM ce.scheduled_date)=$1 OR ce.recurrence IN ('annual','monthly')
      ORDER BY ce.scheduled_date ASC
    `, [year || new Date().getFullYear()]);
    res.json(rows);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Crear evento (admin)
router.post('/', isAdmin, async (req, res) => {
  const { course_id, title, scheduled_date, recurrence, is_mandatory, description } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO calendar_events(course_id,title,scheduled_date,recurrence,is_mandatory,description) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
      [course_id, title, scheduled_date, recurrence || 'once', is_mandatory || false, description]
    );
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Eliminar evento (admin)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM calendar_events WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

module.exports = router;
