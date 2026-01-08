-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios (usando auth.users de Supabase, pero agregando campos adicionales si es necesario)
-- La tabla auth.users ya existe en Supabase, solo necesitamos crear perfiles si es necesario

-- Tabla de estudiantes
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de planes de clases
CREATE TABLE IF NOT EXISTS class_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  cbu_iban VARCHAR(255) NOT NULL,
  description TEXT,
  duration VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de cupones
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de relación cupones-planes (si NULL en plan_id, aplica a todos los planes)
CREATE TABLE IF NOT EXISTS coupon_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES class_plans(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clases
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  max_capacity INTEGER DEFAULT 1,
  current_bookings INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  reminder_24h_sent BOOLEAN DEFAULT false,
  reminder_2h_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de comprobantes de pago
CREATE TABLE IF NOT EXISTS payment_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES class_plans(id),
  coupon_id UUID REFERENCES coupons(id),
  original_price DECIMAL(10, 2) NOT NULL,
  final_price DECIMAL(10, 2) NOT NULL,
  discount_applied DECIMAL(10, 2) DEFAULT 0,
  file_url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de uso de cupones (para analytics)
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  payment_proof_id UUID NOT NULL REFERENCES payment_proofs(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de log de notificaciones
CREATE TABLE IF NOT EXISTS notifications_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('email_24h', 'sms_24h', 'email_2h', 'sms_2h')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed'))
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_bookings_class_id ON bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_classes_scheduled_at ON classes(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_student_id ON payment_proofs(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON payment_proofs(status);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_plans_coupon_id ON coupon_plans(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_plans_plan_id ON coupon_plans(plan_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_plans_updated_at BEFORE UPDATE ON class_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_proofs_updated_at BEFORE UPDATE ON payment_proofs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (ajustar según necesidades específicas)
-- Políticas para estudiantes: solo el entrenador puede ver/editar
CREATE POLICY "Trainer can view all students" ON students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Trainer can insert students" ON students FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Trainer can update students" ON students FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Trainer can delete students" ON students FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para planes: público puede ver, solo entrenador puede modificar
CREATE POLICY "Anyone can view active plans" ON class_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Trainer can manage plans" ON class_plans FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para cupones: público puede ver activos, solo entrenador puede modificar
CREATE POLICY "Anyone can view active coupons" ON coupons FOR SELECT USING (is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));
CREATE POLICY "Trainer can manage coupons" ON coupons FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para relación cupones-planes
CREATE POLICY "Anyone can view coupon plans" ON coupon_plans FOR SELECT USING (true);
CREATE POLICY "Trainer can manage coupon plans" ON coupon_plans FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para clases: público puede ver, solo entrenador puede modificar
CREATE POLICY "Anyone can view scheduled classes" ON classes FOR SELECT USING (status = 'scheduled');
CREATE POLICY "Trainer can manage classes" ON classes FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para reservas
CREATE POLICY "Anyone can view bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Trainer can update bookings" ON bookings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Trainer can delete bookings" ON bookings FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para comprobantes: estudiantes pueden insertar, entrenador puede ver/todo
CREATE POLICY "Anyone can insert payment proofs" ON payment_proofs FOR INSERT WITH CHECK (true);
CREATE POLICY "Trainer can view all payment proofs" ON payment_proofs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Trainer can update payment proofs" ON payment_proofs FOR UPDATE USING (auth.role() = 'authenticated');
-- Los estudiantes pueden ver solo sus propios comprobantes
CREATE POLICY "Students can view own payment proofs" ON payment_proofs FOR SELECT USING (true); -- Ajustar con identificación de estudiante

-- Políticas para uso de cupones
CREATE POLICY "Anyone can insert coupon usage" ON coupon_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Trainer can view coupon usage" ON coupon_usage FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para log de notificaciones
CREATE POLICY "Trainer can view notifications log" ON notifications_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service can insert notifications log" ON notifications_log FOR INSERT WITH CHECK (true);

