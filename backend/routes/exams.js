const express = require('express');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const generateCertificate = require('../utils/generateCertificate');

const router = express.Router();
router.use(authMiddleware);

// Obtener examen de un curso
router.get('/course/:courseId', async (req, res) => {
  try {
    const exam = await pool.query('SELECT * FROM exams WHERE course_id=$1', [req.params.courseId]);
    if (!exam.rows[0]) return res.status(404).json({ error: 'Examen no encontrado' });
    const questions = await pool.query(
      'SELECT id,question,option_a,option_b,option_c,option_d FROM exam_questions WHERE exam_id=$1 ORDER BY RANDOM()',
      [exam.rows[0].id]
    );
    res.json({ ...exam.rows[0], questions: questions.rows });
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Enviar respuestas y calificar
router.post('/course/:courseId/submit', async (req, res) => {
  const { answers } = req.body; // { questionId: 'a'|'b'|'c'|'d' }
  try {
    const exam = await pool.query('SELECT * FROM exams WHERE course_id=$1', [req.params.courseId]);
    if (!exam.rows[0]) return res.status(404).json({ error: 'Examen no encontrado' });
    const examData = exam.rows[0];

    const questions = await pool.query(
      'SELECT id,correct_option FROM exam_questions WHERE exam_id=$1', [examData.id]
    );
    const total = questions.rows.length;
    if (total === 0) return res.status(400).json({ error: 'El examen no tiene preguntas' });

    let correct = 0;
    for (const q of questions.rows) {
      if (answers[q.id] === q.correct_option) correct++;
    }
    const score = Math.round((correct / total) * 100);
    const passed = score >= examData.passing_score;

    await pool.query(
      'INSERT INTO exam_results(user_id,exam_id,score,passed) VALUES($1,$2,$3,$4)',
      [req.user.id, examData.id, score, passed]
    );

    let certificate = null;
    if (passed) {
      // Verificar si ya tiene constancia
      const existing = await pool.query(
        'SELECT * FROM certificates WHERE user_id=$1 AND course_id=$2', [req.user.id, req.params.courseId]
      );
      if (!existing.rows[0]) {
        const course = await pool.query('SELECT title FROM courses WHERE id=$1', [req.params.courseId]);
        const now = new Date();
        const year = now.getFullYear();
        const yearlyCount = await pool.query(
          "SELECT COUNT(*)::int AS total FROM certificates WHERE EXTRACT(YEAR FROM issued_at) = $1",
          [year]
        );
        const serial = String((yearlyCount.rows[0]?.total || 0) + 1).padStart(3, '0');
        const folio = `REMEINIA-ACAD-${year}-${serial}`;
        const pdfBuffer = await generateCertificate({
          userName: req.user.name,
          courseName: course.rows[0]?.title,
          folio,
          date: now.toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' }),
          score,
          hours: null
        });
        const pdfBase64 = pdfBuffer.toString('base64');
        const { rows } = await pool.query(
          'INSERT INTO certificates(user_id,course_id,folio,pdf_url) VALUES($1,$2,$3,$4) RETURNING *',
          [req.user.id, req.params.courseId, folio, `data:application/pdf;base64,${pdfBase64}`]
        );
        certificate = rows[0];
        // Actualizar progreso a completado
        await pool.query(`
          INSERT INTO user_progress(user_id,course_id,status,completed_at)
          VALUES($1,$2,'completed',NOW())
          ON CONFLICT(user_id,course_id) DO UPDATE SET status='completed', completed_at=NOW()
        `, [req.user.id, req.params.courseId]);
      } else {
        certificate = existing.rows[0];
      }
    }

    res.json({ score, passed, total, correct, passingScore: examData.passing_score, certificate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Crear examen para un curso (admin)
router.post('/course/:courseId', isAdmin, async (req, res) => {
  const { passing_score, time_limit_min } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO exams(course_id,passing_score,time_limit_min) VALUES($1,$2,$3) RETURNING *',
      [req.params.courseId, passing_score || 70, time_limit_min || 30]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'El curso ya tiene un examen' });
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Agregar pregunta al examen (admin)
router.post('/:examId/questions', isAdmin, async (req, res) => {
  const { question, option_a, option_b, option_c, option_d, correct_option } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO exam_questions(exam_id,question,option_a,option_b,option_c,option_d,correct_option) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [req.params.examId, question, option_a, option_b, option_c || null, option_d || null, correct_option]
    );
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Eliminar pregunta (admin)
router.delete('/questions/:questionId', isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM exam_questions WHERE id=$1', [req.params.questionId]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

// Obtener preguntas de un examen con respuestas (admin)
router.get('/:examId/questions', isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM exam_questions WHERE exam_id=$1', [req.params.examId]);
    res.json(rows);
  } catch { res.status(500).json({ error: 'Error del servidor' }); }
});

module.exports = router;
