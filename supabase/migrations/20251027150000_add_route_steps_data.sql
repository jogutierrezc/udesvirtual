-- Add route steps for each pathway
-- This migration creates the step structure for each of the 3 pathways

-- Insert steps for "Sendero de Conocimiento"
INSERT INTO public.passport_route_steps (route_id, order_index, title, description, points_required)
SELECT
  pr.id,
  step_data.order_index,
  step_data.title,
  step_data.description,
  step_data.points_required
FROM public.passport_routes pr
CROSS JOIN (
  VALUES
    (1, 'Fundamentos Académicos', 'Desarrolla bases sólidas en tu área de conocimiento a través de cursos y actividades formativas básicas', 50),
    (2, 'Especialización Técnica', 'Profundiza en conocimientos específicos mediante seminarios, talleres y actividades especializadas', 100),
    (3, 'Investigación y Aplicación', 'Participa en semilleros de investigación y aplica conocimientos en proyectos reales', 150)
) AS step_data(order_index, title, description, points_required)
WHERE pr.name = 'Sendero de Conocimiento'
ORDER BY step_data.order_index;

-- Insert steps for "Sendero de Descubrimiento"
INSERT INTO public.passport_route_steps (route_id, order_index, title, description, points_required)
SELECT
  pr.id,
  step_data.order_index,
  step_data.title,
  step_data.description,
  step_data.points_required
FROM public.passport_routes pr
CROSS JOIN (
  VALUES
    (1, 'Introducción Cultural', 'Inicia tu viaje de descubrimiento con experiencias culturales locales e internacionales virtuales', 50),
    (2, 'Experiencias Internacionales', 'Participa en actividades de intercambio y colaboración con instituciones internacionales', 150),
    (3, 'Inmersión Global', 'Sumérgete completamente en experiencias internacionales presenciales o de alto impacto', 200)
) AS step_data(order_index, title, description, points_required)
WHERE pr.name = 'Sendero de Descubrimiento'
ORDER BY step_data.order_index;

-- Insert steps for "Sendero de Impacto Social"
INSERT INTO public.passport_route_steps (route_id, order_index, title, description, points_required)
SELECT
  pr.id,
  step_data.order_index,
  step_data.title,
  step_data.description,
  step_data.points_required
FROM public.passport_routes pr
CROSS JOIN (
  VALUES
    (1, 'Sensibilización Social', 'Desarrolla conciencia sobre temas sociales y comunitarios a través de actividades iniciales', 40),
    (2, 'Participación Comunitaria', 'Involúcrate activamente en proyectos y actividades de servicio comunitario', 80),
    (3, 'Liderazgo Social', 'Lidera o coordina proyectos de impacto social con transformación comunitaria', 120)
) AS step_data(order_index, title, description, points_required)
WHERE pr.name = 'Sendero de Impacto Social'
ORDER BY step_data.order_index;