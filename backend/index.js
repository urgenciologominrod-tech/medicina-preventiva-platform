require('dotenv').config({ path: './.env' });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const examsRoutes = require('./routes/exams');
const certificatesRoutes = require('./routes/certificates');
const calendarRoutes = require('./routes/calendar');
const competencyRoutes = require('./routes/competency');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/courses', coursesRoutes);
app.use('/exams', examsRoutes);
app.use('/certificates', certificatesRoutes);
app.use('/calendar', calendarRoutes);
app.use('/competency-matrix', competencyRoutes);
app.use('/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
