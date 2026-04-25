const express = require('express');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();
router.use(authMiddleware);

// Listar cursos con progreso del usuario
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
        COALESCE(up.status,'pending') AS progress_status,
        up.completed_at
      FROM courses c
      LEFT JOIN user_progress up ON up.course_id=c.id AND up.user_id=$1
      ORDER BY c.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Detalle de curso + contenidos
router.get('/:id', async (req, res) => {
  try {
    const course = await pool.query('SELECT * FROM courses WHERE id=$1', [req.params.id]);
    if (!course.rows[0]) return res.status(404).json({ error: 'Curso no encontrado' });
    const contents = await pool.query(
      'SELECT * FROM course_content WHERE course_id=$1 ORDER BY order_index ASC', [req.params.id]
    );
    const progress = await pool.query(
      'SELECT * FROM user_progress WHERE user_id=$1 AND course_id=$2', [req.user.id, req.params.id]
    );
    res.json({ ...course.rows[0], contents: contents.rows, progress: progress.rows[0] || null });
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Actualizar progreso
router.post('/:id/progress', async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query(`
      INSERT INTO user_progress(user_id,course_id,status,started_at,completed_at)
      VALUES($1,$2,$3,
        CASE WHEN $3='in_progress' THEN NOW() ELSE NULL END,
        CASE WHEN $3='completed' THEN NOW() ELSE NULL END)
      ON CONFLICT(user_id,course_id) DO UPDATE SET
        status=$3,
        started_at=CASE WHEN EXCLUDED.status='in_progress' AND user_progress.started_at IS NULL THEN NOW() ELSE user_progress.started_at END,
        completed_at=CASE WHEN EXCLUDED.status='completed' THEN NOW() ELSE user_progress.completed_at END
    `, [req.user.id, req.params.id, status]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Crear curso (admin)
router.post('/', isAdmin, async (req, res) => {
  const { title, description, category, is_mandatory, thumbnail_url } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO courses(title,description,category,is_mandatory,thumbnail_url,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
      [title, description, category, is_mandatory || false, thumbnail_url, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Agregar contenido al curso (admin)
router.post('/:id/content', isAdmin, async (req, res) => {
  const { type, title, url, order_index } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO course_content(course_id,type,title,url,order_index) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [req.params.id, type, title, url, order_index || 0]
    );
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Editar curso (admin)
router.put('/:id', isAdmin, async (req, res) => {
  const { title, description, category, is_mandatory, thumbnail_url } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE courses SET title=$1,description=$2,category=$3,is_mandatory=$4,thumbnail_url=$5 WHERE id=$6 RETURNING *',
      [title, description, category, is_mandatory, thumbnail_url, req.params.id]
    );
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Eliminar curso (admin)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM courses WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

module.exports = router;
