-- =====================================================
-- Migración 004: Sistema de Autenticación de Alumnos
-- =====================================================
-- Agrega soporte para que alumnos se registren y accedan
-- a un portal con sus datos (créditos, clases, pagos).
-- =====================================================

-- 1. Agregar columna auth_user_id a students
-- =====================================================
ALTER TABLE students
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Índice único para la relación 1:1 (nullable)
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_auth_user
ON students(auth_user_id)
WHERE auth_user_id IS NOT NULL;

-- 2. Tabla de tokens de registro
-- =====================================================
CREATE TABLE IF NOT EXISTS registration_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para registration_tokens
CREATE INDEX IF NOT EXISTS idx_registration_tokens_token ON registration_tokens(token);
CREATE INDEX IF NOT EXISTS idx_registration_tokens_student_id ON registration_tokens(student_id);
CREATE INDEX IF NOT EXISTS idx_registration_tokens_expires_at ON registration_tokens(expires_at);

-- RLS para registration_tokens
ALTER TABLE registration_tokens ENABLE ROW LEVEL SECURITY;

-- 3. Función helper para obtener el rol del usuario actual
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'role',
    'anonymous'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Función helper para verificar si es trainer
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_trainer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role() = 'trainer';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. Función helper para obtener student_id del usuario actual
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM students
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- 6. Actualizar políticas RLS
-- =====================================================

-- 6.1 Students: trainer ve todos, student solo su registro
-- =====================================================
DROP POLICY IF EXISTS "Trainer can view all students" ON students;
DROP POLICY IF EXISTS "Trainer can insert students" ON students;
DROP POLICY IF EXISTS "Trainer can update students" ON students;
DROP POLICY IF EXISTS "Trainer can delete students" ON students;

CREATE POLICY "Trainer can manage students"
ON students FOR ALL
USING (public.is_trainer());

CREATE POLICY "Student can view own record"
ON students FOR SELECT
USING (auth_user_id = auth.uid());

-- 6.2 Credit Balances: trainer ve todos, student solo sus créditos
-- =====================================================
DROP POLICY IF EXISTS "Trainer can view credit balances" ON credit_balances;
DROP POLICY IF EXISTS "Service can manage credit balances" ON credit_balances;

CREATE POLICY "Trainer can manage credit balances"
ON credit_balances FOR ALL
USING (public.is_trainer());

CREATE POLICY "Student can view own credit balances"
ON credit_balances FOR SELECT
USING (student_id = public.get_current_student_id());

-- Service role tiene acceso total (para cron jobs)
CREATE POLICY "Service can manage credit balances"
ON credit_balances FOR ALL
USING (auth.role() = 'service_role');

-- 6.3 Credit Transactions: trainer ve todos, student solo sus movimientos
-- =====================================================
DROP POLICY IF EXISTS "Trainer can view credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Service can manage credit transactions" ON credit_transactions;

CREATE POLICY "Trainer can manage credit transactions"
ON credit_transactions FOR ALL
USING (public.is_trainer());

CREATE POLICY "Student can view own credit transactions"
ON credit_transactions FOR SELECT
USING (student_id = public.get_current_student_id());

CREATE POLICY "Service can manage credit transactions"
ON credit_transactions FOR ALL
USING (auth.role() = 'service_role');

-- 6.4 Bookings: trainer ve todos, student solo sus reservas
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Trainer can update bookings" ON bookings;
DROP POLICY IF EXISTS "Trainer can delete bookings" ON bookings;

CREATE POLICY "Trainer can manage bookings"
ON bookings FOR ALL
USING (public.is_trainer());

CREATE POLICY "Student can view own bookings"
ON bookings FOR SELECT
USING (student_id = public.get_current_student_id());

-- Service role para cron jobs
CREATE POLICY "Service can manage bookings"
ON bookings FOR ALL
USING (auth.role() = 'service_role');

-- 6.5 Payment Proofs: trainer ve todos, student solo sus pagos
-- =====================================================
DROP POLICY IF EXISTS "Anyone can insert payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Trainer can view all payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Trainer can update payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Students can view own payment proofs" ON payment_proofs;

CREATE POLICY "Trainer can manage payment proofs"
ON payment_proofs FOR ALL
USING (public.is_trainer());

CREATE POLICY "Student can view own payment proofs"
ON payment_proofs FOR SELECT
USING (student_id = public.get_current_student_id());

CREATE POLICY "Student can insert own payment proofs"
ON payment_proofs FOR INSERT
WITH CHECK (student_id = public.get_current_student_id());

-- 6.6 Frequency Prices: todos pueden leer activos
-- =====================================================
-- (mantener política existente, student necesita ver su precio)
DROP POLICY IF EXISTS "Anyone can view active frequencies" ON frequency_prices;
DROP POLICY IF EXISTS "Trainer can manage frequencies" ON frequency_prices;

CREATE POLICY "Anyone can view active frequencies"
ON frequency_prices FOR SELECT
USING (is_active = true);

CREATE POLICY "Trainer can manage frequencies"
ON frequency_prices FOR ALL
USING (public.is_trainer());

-- 6.7 Registration Tokens: trainer crea, validación pública por token
-- =====================================================
CREATE POLICY "Trainer can manage registration tokens"
ON registration_tokens FOR ALL
USING (public.is_trainer());

-- Permitir SELECT público solo para validar token específico
-- (la validación real se hace en server action con service role)
CREATE POLICY "Public can validate token"
ON registration_tokens FOR SELECT
USING (
  token IS NOT NULL
  AND used_at IS NULL
  AND expires_at > NOW()
);

-- 6.8 Classes: mantener acceso público para ver clases programadas
-- =====================================================
-- (no modificar, estudiantes necesitan ver clases disponibles)

-- 6.9 Class Plans: mantener acceso público para ver planes activos
-- =====================================================
-- (no modificar para backwards compatibility)

-- =====================================================
-- 7. Notas de migración
-- =====================================================
--
-- IMPORTANTE: Después de aplicar esta migración, ejecutar:
--
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "trainer"}'
-- WHERE email = 'EMAIL_DEL_ENTRENADOR';
--
-- Esto asigna el rol 'trainer' al usuario existente.
-- =====================================================
