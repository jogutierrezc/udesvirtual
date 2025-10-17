# 📥 Guía de Importación de Datos - Panel Admin

## 🎯 Descripción

La funcionalidad de importación permite cargar múltiples registros de **Ofertas de Cursos** o **Propuestas COIL** mediante archivos CSV o texto separado por comas.

## 🚀 Cómo Usar

### 1. Acceder al Modal de Importación

1. Navega a **Panel Admin → Oferta**
2. Haz clic en el botón **"Importar Datos"** (ícono de Upload)

### 2. Seleccionar Tipo de Importación

Elige el tipo de datos que deseas importar:
- **Ofertas de Cursos**: Para course_offerings
- **Propuestas COIL**: Para coil_proposals

La plantilla y campos se ajustarán automáticamente según tu selección.

### 3. Obtener la Plantilla

#### Opción A: Descargar Plantilla CSV
- Haz clic en **"Descargar Plantilla"**
- Se descargará un archivo CSV con la estructura correcta
- Abre el archivo en Excel o Google Sheets
- Completa los datos siguiendo el formato

#### Opción B: Cargar Archivo Existente
- Haz clic en **"Cargar Archivo CSV"**
- Selecciona tu archivo .csv o .txt
- Los datos se cargarán automáticamente en el campo de texto

### 4. Formato de los Datos

#### 📊 Ofertas de Cursos

**Todos los campos son opcionales. Si se dejan vacíos, se asignan valores por defecto:**

| Campo | Tipo | Valor por Defecto si está vacío |
|-------|------|----------------------------------|
| `title` | Texto | "Sin título" |
| `offering_type` | Texto | "programada" (valores válidos: "programada" o "exchange") |
| `campus` | Texto | "Bucaramanga" |
| `capacity` | Número | 0 |
| `hours` | Número | 0 |
| `profession` | Texto | "General" |
| `description` | Texto | "Sin descripción" |
| `knowledge_area` | Array | [] (vacío) |
| `udes_professor_name` | Texto | null |
| `udes_professor_program` | Texto | null |
| `udes_professor_email` | Texto | null |

**Nota sobre Arrays:**
- Para `knowledge_area`, separar valores con punto y coma: `"Tecnología;Informática;IA"`
- Si está vacío, se asigna un array vacío `[]`

**Ejemplo:**
```csv
title,offering_type,campus,capacity,hours,profession,knowledge_area,udes_professor_name,udes_professor_program,udes_professor_email,description
Programación Avanzada,programada,Bucaramanga,30,40,Ingeniería,Tecnología;Informática,Juan Pérez,Ingeniería de Sistemas,juan@udes.edu.co,Curso avanzado de programación
Marketing Digital,exchange,Cúcuta,50,20,Administración,Marketing;Negocios,María García,Administración,maria@udes.edu.co,Fundamentos de marketing digital
```

#### 🌍 Propuestas COIL

**Campos Obligatorios:**
- `course_name`: Nombre del curso
- `full_name`: Nombre completo del profesor
- `email`: Email del profesor
- `academic_program`: Programa académico

**Campos Opcionales:**
- `academic_semester`: Semestre académico (número)
- `external_capacity`: Capacidad externa (número)
- `languages`: Idiomas (separar con `;`)
- `sustainable_development_goals`: ODS (separar con `;`)
- `project_topics`: Temas del proyecto (separar con `;`)

**Ejemplo:**
```csv
course_name,full_name,email,academic_program,academic_semester,external_capacity,languages,sustainable_development_goals,project_topics
Desarrollo Sostenible,Carlos Rodríguez,carlos@udes.edu.co,Ingeniería Ambiental,6,30,"Inglés;Español","Acción por el clima;Energía asequible y no contaminante","Sostenibilidad;Medio ambiente"
Innovación Social,Ana López,ana@udes.edu.co,Trabajo Social,4,25,"Inglés;Francés","Reducción de las desigualdades;Ciudades y comunidades sostenibles","Innovación;Desarrollo social"
```

### 5. Importar los Datos

1. Pega tus datos CSV en el campo de texto (o carga un archivo)
2. Verifica que el formato sea correcto
3. Haz clic en **"Importar"**
4. Espera la confirmación

## ✅ Validaciones

### Antes de Importar:
- **Ofertas de Cursos**: No hay campos obligatorios, todos son opcionales
- **Propuestas COIL**: Se verifica que existan los campos obligatorios (course_name, full_name, email, academic_program)
- Se valida que la estructura del CSV sea correcta
- Los registros inválidos no se importarán (solo aplica para COIL)

### Mensajes de Error:
- **"No se encontraron registros válidos"**: El formato CSV es incorrecto
- **"Registros inválidos en las líneas: X"**: Faltan campos obligatorios en propuestas COIL
- Los números de línea incluyen el encabezado

## 📝 Notas Importantes

### Formato de Arrays
Los campos que permiten múltiples valores deben separarse con **punto y coma (;)**:
```csv
knowledge_area,languages
"Tecnología;Informática;IA","Inglés;Español;Francés"
```

### Campos Numéricos
Los campos numéricos (`capacity`, `hours`, `academic_semester`, `external_capacity`):
- **Para Ofertas de Cursos**: `capacity` y `hours` son obligatorios en la base de datos
  - Si están vacíos o inválidos, se asigna **0** automáticamente
- **Para Propuestas COIL**: Campos opcionales
  - Si están vacíos se guardan como `null`
- No uses comas como separador de miles (usa `1000` no `1,000`)

### Valores Por Defecto (Solo Ofertas)
Para facilitar la importación masiva, los campos de **Ofertas de Cursos** tienen valores por defecto:
- `title`: "Sin título"
- `offering_type`: "programada" (⚠️ Solo valores válidos: **"programada"** o **"exchange"**)
- `campus`: "Bucaramanga"
- `capacity`: 0
- `hours`: 0
- `profession`: "General"
- `description`: "Sin descripción"

**Recomendación**: Completa todos los campos importantes para evitar registros con datos genéricos.

### Caracteres Especiales
- Si un campo contiene comas, enciérralo entre comillas: `"Descripción, con comas"`
- Si un campo contiene comillas, duplícalas: `"Dice ""hola"" al mundo"`
- Los saltos de línea dentro de un campo no están soportados
- Asegúrate de que cada línea de datos tenga el mismo número de campos que el encabezado

### Estado Automático
- Todos los registros importados se crean con `status: "approved"`
- Los registros aparecen inmediatamente en el catálogo

### Campos de Sistema
Estos campos se agregan automáticamente:
- `status`: "approved"
- `created_at`: Fecha y hora actual de la importación
- `created_by`: ID del usuario admin que realiza la importación
- `id`: Generado por Supabase

## 🔧 Solución de Problemas

### El archivo no se carga
- Verifica que sea formato .csv o .txt
- Asegúrate de que use codificación UTF-8
- Revisa que no tenga caracteres especiales en los nombres de campos
- Verifica que la primera línea sea exactamente los encabezados
- Asegúrate de que cada línea tenga el mismo número de campos

### No se encuentran registros válidos
- Verifica que haya al menos 2 líneas (encabezados + datos)
- Asegúrate de usar comas como separador (no punto y coma)
- No dejes líneas vacías entre registros
- Revisa que los encabezados coincidan con los nombres de campos exactos

### Error de validación
- Verifica que la primera línea sean los encabezados
- **Para Propuestas COIL**: Asegúrate de incluir TODOS los campos obligatorios (course_name, full_name, email, academic_program)
- **Para Ofertas de Cursos**: No hay campos obligatorios, solo verifica el formato CSV
- Revisa que no haya líneas vacías entre registros

### Importación parcial
- Si algunos registros fallan, revisa los números de línea indicados
- Los registros válidos SÍ se importan, solo fallan los inválidos

## 💡 Consejos

1. **Prueba primero con pocos registros** para verificar el formato
2. **Usa la plantilla descargada** como base
3. **Revisa en Excel/Sheets** antes de importar
4. **Mantén copias de seguridad** de tus datos antes de importar en masa
5. **Los arrays vacíos** se manejan automáticamente como arrays vacíos []

## 📧 Soporte

Si encuentras problemas con la importación:
1. Verifica este documento
2. Revisa los logs de la consola del navegador
3. Contacta al equipo de desarrollo con el mensaje de error específico
