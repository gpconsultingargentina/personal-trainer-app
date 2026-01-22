-- Script para corregir políticas RLS de payment_proofs
-- Ejecutar en el SQL Editor de Supabase

-- Primero, eliminamos las políticas existentes para payment_proofs
DROP POLICY IF EXISTS "Anyone can insert payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Trainer can view all payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Trainer can update payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Students can view own payment proofs" ON payment_proofs;

-- Crear nuevas políticas que permitan todo para usuarios autenticados
-- Esto permite que el entrenador (autenticado) pueda hacer todas las operaciones

-- Política de inserción: permitir a todos (público y autenticados)
CREATE POLICY "Allow insert payment proofs" 
ON payment_proofs 
FOR INSERT 
WITH CHECK (true);

-- Política de lectura: permitir a todos los autenticados ver todos los comprobantes
CREATE POLICY "Allow authenticated users to view payment proofs" 
ON payment_proofs 
FOR SELECT 
USING (true);

-- Política de actualización: permitir a todos los autenticados
CREATE POLICY "Allow authenticated users to update payment proofs" 
ON payment_proofs 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Política de eliminación: permitir a todos los autenticados
CREATE POLICY "Allow authenticated users to delete payment proofs" 
ON payment_proofs 
FOR DELETE 
USING (true);

