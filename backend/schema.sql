-- Plataforma LMS Medicina Preventiva
-- Ejecutar en Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  is_mandatory BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE course_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('video', 'infographic')),
  title VARCHAR(200),
  url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID UNIQUE REFERENCES courses(id) ON DELETE CASCADE,
  passing_score INTEGER NOT NULL DEFAULT 70,
  time_limit_min INTEGER NOT NULL DEFAULT 30
);

CREATE TABLE exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT,
  option_d TEXT,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('a','b','c','d'))
);

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

CREATE TABLE exam_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  taken_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  folio VARCHAR(50) UNIQUE,
  pdf_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(200),
  scheduled_date DATE NOT NULL,
  recurrence VARCHAR(20) DEFAULT 'once' CHECK (recurrence IN ('once','monthly','annual')),
  is_mandatory BOOLEAN DEFAULT FALSE,
  description TEXT
);

CREATE TABLE competency_matrix (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  competency_area VARCHAR(150) NOT NULL,
  level INTEGER DEFAULT 0 CHECK (level BETWEEN 0 AND 5),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, competency_area)
);

-- Áreas de competencia iniciales
INSERT INTO competency_matrix (user_id, competency_area, level)
SELECT u.id, area, 0
FROM users u
CROSS JOIN (VALUES
  ('Epidemiología y Vigilancia'),
  ('Bioseguridad'),
  ('Salud Ocupacional'),
  ('Primeros Auxilios'),
  ('Enfermedades Crónicas'),
  ('Salud Mental'),
  ('Nutrición y Dietética'),
  ('Vacunación e Inmunología')
) AS areas(area)
WHERE u.role = 'employee';
