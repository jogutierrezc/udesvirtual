-- Agregar nuevos campos a la tabla profiles para el flujo de registro con Google

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS document_number TEXT,
ADD COLUMN IF NOT EXISTS is_international_student BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_other_university BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_private_student BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS university_name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Crear índice para búsqueda rápida de perfiles completos
CREATE INDEX IF NOT EXISTS idx_profiles_completed ON profiles(profile_completed);

-- Comentarios para documentación
COMMENT ON COLUMN profiles.document_type IS 'Tipo de documento: Cédula, Pasaporte, DNI, etc.';
COMMENT ON COLUMN profiles.document_number IS 'Número del documento de identidad';
COMMENT ON COLUMN profiles.is_international_student IS 'Indica si es estudiante extranjero';
COMMENT ON COLUMN profiles.is_other_university IS 'Indica si es estudiante de otra IES';
COMMENT ON COLUMN profiles.is_private_student IS 'Indica si es estudiante particular';
COMMENT ON COLUMN profiles.university_name IS 'Nombre de la universidad de origen (si aplica)';
COMMENT ON COLUMN profiles.address IS 'Dirección de residencia';
COMMENT ON COLUMN profiles.country IS 'País de residencia';
COMMENT ON COLUMN profiles.city IS 'Ciudad de residencia';
COMMENT ON COLUMN profiles.department IS 'Departamento (solo para Colombia)';
COMMENT ON COLUMN profiles.profile_completed IS 'Indica si el usuario completó su perfil después del registro';
