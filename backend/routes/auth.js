const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email=$1 AND is_active=TRUE',
      [email]
    );

    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('ERROR LOGIN:', error);
    res.status(500).json({ error: error.message });
  }
});

// Solo admin puede registrar usuarios
router.post('/register', authMiddleware, isAdmin, async (req, res) => {
  const { name, email, password, role = 'employee', department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      'INSERT INTO users (name,email,password_hash,role,department) VALUES($1,$2,$3,$4,$5) RETURNING id,name,email,role,department',
      [name, email, hash, role, department]
    );

    const newUser = rows[0];

    if (role === 'employee') {
      const areas = [
        'Epidemiología y Vigilancia',
        'Bioseguridad',
        'Salud Ocupacional',
        'Primeros Auxilios',
        'Enfermedades Crónicas',
        'Salud Mental',
        'Nutrición y Dietética',
        'Vacunación e Inmunología'
      ];

      for (const area of areas) {
        await pool.query(
          'INSERT INTO competency_matrix(user_id,competency_area,level) VALUES($1,$2,0) ON CONFLICT DO NOTHING',
          [newUser.id, area]
        );
      }
    }

    res.status(201).json(newUser);
  } catch (error) {
    console.error('ERROR REGISTER:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id,name,email,role,department FROM users WHERE id=$1',
    [req.user.id]
  );

  res.json(rows[0]);
});

module.exports = router;