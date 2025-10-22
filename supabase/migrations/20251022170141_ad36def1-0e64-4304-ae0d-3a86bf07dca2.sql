-- Arreglar el search_path en la función calculate_course_duration
-- La función ya tiene SECURITY DEFINER y search_path, así que verificamos si hay otras

-- Listar todas las funciones para verificar cuáles necesitan search_path
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_functiondef(p.oid) as function_def
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname NOT LIKE 'pg_%'
    LOOP
        -- Solo informar, no modificar
        RAISE NOTICE 'Function: %.%', func_record.schema_name, func_record.function_name;
    END LOOP;
END $$;