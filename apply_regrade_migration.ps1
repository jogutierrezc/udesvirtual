# Script to apply the regrade exam migration to Supabase
# This script applies the migration using Supabase CLI or direct SQL execution

Write-Host "=== Aplicando migracion de recalificacion de examenes ===" -ForegroundColor Green
Write-Host ""

$migrationFile = "supabase\migrations\20260114_add_exam_regrade_function.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "Error: Archivo de migracion no encontrado: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Archivo de migracion encontrado: $migrationFile" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabaseCLI = Get-Command supabase -ErrorAction SilentlyContinue

if ($supabaseCLI) {
    Write-Host "Detectado Supabase CLI. Aplicando migracion..." -ForegroundColor Cyan
    Write-Host ""
    
    # Apply migration using Supabase CLI
    supabase db push --include-all
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Migracion aplicada exitosamente usando Supabase CLI" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Error al aplicar la migracion con Supabase CLI" -ForegroundColor Red
        Write-Host "Por favor, aplica manualmente el archivo: $migrationFile" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Supabase CLI no encontrado." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor, aplica la migracion manualmente:" -ForegroundColor Cyan
    Write-Host "1. Ve al panel de Supabase: https://ovdeaweddxafslbrflor.supabase.co" -ForegroundColor White
    Write-Host "2. Navega a SQL Editor" -ForegroundColor White
    Write-Host "3. Copia y ejecuta el contenido del archivo:" -ForegroundColor White
    Write-Host "   $migrationFile" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Contenido de la migracion:" -ForegroundColor Cyan
    Write-Host "-------------------------------------------" -ForegroundColor Gray
    Get-Content $migrationFile | Write-Host -ForegroundColor White
    Write-Host "-------------------------------------------" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Despues de aplicar la migracion en el SQL Editor de Supabase," -ForegroundColor Yellow
    Write-Host "la funcionalidad de recalificacion estara disponible." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Funcionalidad de recalificacion ===" -ForegroundColor Green
Write-Host "- Ve a la pagina de resultados de un curso como profesor" -ForegroundColor White
Write-Host "- En la seccion 'Estadisticas por Examen', haz clic en 'Recalificar'" -ForegroundColor White
Write-Host "- Confirma la accion para recalcular todas las notas" -ForegroundColor White
Write-Host "- Las notas se actualizaran basandose en las respuestas correctas actuales" -ForegroundColor White
Write-Host ""
