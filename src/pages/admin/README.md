# Admin Module - Nueva Estructura Modular

## 📁 Estructura de Carpetas

```
src/
├── contexts/
│   └── AdminContext.tsx          # Estado compartido y funciones CRUD
│
├── pages/admin/
│   ├── layout/
│   │   └── AdminLayout.tsx       # Layout compartido (header + navegación)
│   │
│   ├── catalog/
│   │   ├── CatalogPage.tsx       # Página principal de Catálogo
│   │   └── modals/
│   │       ├── ClassFormModal.tsx      # Modal formulario de clases
│   │       └── TeacherFormModal.tsx    # Modal formulario de profesores
│   │
│   ├── offerings/
│   │   ├── OfferingsPage.tsx     # Página principal de Ofertas
│   │   └── modals/
│   │       ├── OfferingFormModal.tsx   # Modal formulario de ofertas
│   │       └── CoilFormModal.tsx       # Modal formulario COIL
│   │
│   └── registrations/
│       └── RegistrationsPage.tsx # Página de registros de estudiantes
│
└── App.tsx                       # Routing actualizado
```

## 🚀 Rutas Admin

- `/admin` → Redirige a `/admin/catalog`
- `/admin/catalog` → Catálogo (Clases + Profesores)
- `/admin/offerings` → Ofertas (Cursos + COIL)
- `/admin/registrations` → Registros de Estudiantes
- `/admin/mooc` → Gestión de MOOC
- `/admin/carousel` → Gestión de Carrusel Hero
- `/admin/passport` → Pasaporte Académico (en desarrollo)

## 🎯 Características

### AdminLayout (Navegación Simplificada con Dropdowns)
- **Exchange Dropdown:** 
  - Catálogo
  - Oferta
  - Registros
- **MOOC:** Botón standalone para gestión de cursos MOOC
- **Pasaporte:** Botón standalone para sistema de pasaportes académicos
- **Configuración Dropdown:**
  - Carrusel (Gestión del hero carousel)
  - Más opciones de configuración en el futuro

### AdminContext (Estado Global)
- **Datos:** Clases, Profesores, Ofertas, COIL, Registros
- **Funciones CRUD:** create, update, delete para cada entidad
- **Aprobaciones:** updateClassStatus, updateTeacherStatus, etc.
- **Loading:** Estado de carga centralizado

### CatalogPage
- **Funcionalidad:**
  - Botón "Crear Clase" → Abre modal ClassFormModal
  - Botón "Crear Profesor" → Abre modal TeacherFormModal
  - Lista de clases aprobadas con acciones (editar, eliminar, deshabilitar)
  - Lista de profesores aprobados con acciones (editar, eliminar)

### OfferingsPage
- **Funcionalidad:**
  - Botón "Crear Oferta" → Abre modal OfferingFormModal
  - Botón "Crear COIL" → Abre modal CoilFormModal
  - Lista de ofertas aprobadas con acciones (editar, eliminar, deshabilitar)
  - Lista de propuestas COIL aprobadas con acciones (editar, eliminar)

### RegistrationsPage
- **Funcionalidad:**
  - Tabla de registros de estudiantes
  - Filtro por clase
  - Vista tipo Excel (limpia y organizada)

## 🛠️ Ventajas de la Nueva Estructura

1. **Modularidad:** Cada página es independiente y fácil de mantener
2. **Reutilización:** Modales separados y reutilizables
3. **Escalabilidad:** Fácil agregar nuevas secciones admin
4. **Estado Compartido:** AdminContext centraliza toda la lógica
5. **URLs Semánticas:** `/admin/catalog`, `/admin/offerings`, etc.
6. **Lazy Loading:** Posible en el futuro
7. **Testing:** Más fácil testear componentes aislados
8. **Mantenibilidad:** Archivos pequeños (~150-300 líneas cada uno)

## 📝 Cómo Agregar Nueva Sección Admin

1. Crear carpeta en `src/pages/admin/nueva-seccion/`
2. Crear `NuevaSeccionPage.tsx`
3. Agregar modales en `nueva-seccion/modals/` si es necesario
4. Agregar funciones CRUD en `AdminContext.tsx`
5. Agregar ruta en `App.tsx`:
   ```tsx
   <Route path="/admin/nueva-seccion" element={<NuevaSeccionPage />} />
   ```
6. Agregar link en `AdminLayout.tsx` navigation

## 🔄 Migración desde Admin.tsx Antiguo

El archivo `Admin.tsx` original (~1500 líneas) ha sido dividido en:

- **AdminContext** → Estado y lógica de negocio
- **AdminLayout** → UI compartida (header + nav)
- **CatalogPage** → Gestión de clases y profesores
- **OfferingsPage** → Gestión de ofertas y COIL
- **RegistrationsPage** → Vista de registros

**Beneficio:** De 1 archivo de 1500 líneas → 10+ archivos de ~150-300 líneas cada uno.

## 🎨 UI/UX Mejoras

- **Modales:** Formularios en pop-ups (mejor UX)
- **Navegación:** Tabs superior para cambiar entre secciones
- **Acciones Inline:** Iconos de editar/eliminar/deshabilitar en cada item
- **Filtros:** En registrations para filtrar por clase
- **Loading States:** Spinner mientras carga datos
- **Confirmaciones:** Antes de eliminar items

## 🧪 Testing

Para testear una página:
```bash
# Navegar a la ruta correspondiente
http://localhost:5173/admin/catalog
http://localhost:5173/admin/offerings
http://localhost:5173/admin/registrations
```

## 📦 Dependencias

- React Router (routing)
- shadcn/ui (componentes UI)
- Supabase (backend)
- React Context (estado)
- Lucide React (iconos)

## ✅ Próximos Pasos (Opcional)

1. [ ] Agregar búsqueda en listas
2. [ ] Paginación para listas largas
3. [ ] Export a CSV de registros
4. [ ] Dashboard con estadísticas
5. [ ] Notificaciones en tiempo real
6. [ ] Lazy loading de páginas
7. [ ] Tests unitarios
