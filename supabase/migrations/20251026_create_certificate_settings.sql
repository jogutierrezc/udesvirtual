-- Create certificate settings table for customizable certificate templates
create table if not exists public.certificate_settings (
  id uuid primary key default gen_random_uuid(),
  template_html text not null,
  signature_name text not null default 'Dra. Mónica Beltrán',
  signature_title text not null default 'Directora General de MOOC UDES',
  qr_base_url text not null default 'https://udesvirtual.com/verificar-certificado',
  verification_url text not null default 'https://mooc.udes.edu.co/verificar-certificado',
  logo_url text not null default 'https://udes.edu.co/images/logo/logo-con-acreditada-color.png',
  primary_color text not null default '#052c4e',
  secondary_color text not null default '#2c3e50',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Insert default settings based on current template
insert into public.certificate_settings (
  template_html,
  signature_name,
  signature_title,
  qr_base_url,
  verification_url,
  logo_url,
  primary_color,
  secondary_color
) values (
  '<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado de Curso Mooc UDES</title>
    <!-- Incluye Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Definición de la tipografía Montserrat única */
        @import url(''https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap'');
        
        /* Colores del esquema */
        :root {
            --color-primary: #052c4e; /* Deep Navy (Azul UDES) - Color principal y acento */
            --color-secondary: #2c3e50; /* Dark Grey - Para títulos y texto base */
        }
        
        body {
            font-family: ''Montserrat'', sans-serif; /* Usamos Montserrat para todo */
            background-color: #e5e7eb;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 30px;
        }

        /* Contenedor del certificado (tamaño CARTA horizontal: 11in x 8.5in) */
        .certificado-container {
            width: 27.94cm; 
            height: 21.59cm; 
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1); 
            margin: 30px;
            background-color: #ffffff; /* Blanco limpio */
            position: relative;
            overflow: hidden;
            border-radius: 0; 
            border: 2px solid #ddd; /* Borde muy sutil */
        }
        
        /* Fondo decorativo sutil (patrón de textura) */
        .certificado-container::before {
            content: '''';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(#e5e7eb 1px, transparent 0);
            background-size: 5px 5px;
            opacity: 0.1; 
            pointer-events: none;
            z-index: 0;
        }
        
        /* Línea de acento superior dinámica (AZUL) */
        .accent-line {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 5px;
            background-color: var(--color-primary); /* AZUL principal */
            z-index: 2;
        }

        /* Estilos de título elegante y minimalista */
        .title-display {
            font-family: ''Montserrat'', sans-serif; 
            color: var(--color-secondary); 
            letter-spacing: 0.5px;
            font-weight: 500; 
        }

        /* Estilos del nombre del recipiente con alto impacto */
        .recipient-name {
            font-family: ''Montserrat'', sans-serif;
            color: var(--color-primary); 
            font-weight: 800; 
        }

        /* Estilos para la impresión */
        @media print {
            .certificado-container {
                box-shadow: none !important;
                margin: 0 !important;
            }
        }
    </style>
    <!-- Dependencias para QR y PDF -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>

    <!-- Botón de Exportación (Fuera del Certificado) -->
    <button id="export-btn" class="bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-8 rounded-full shadow-xl transition duration-300 transform hover:scale-105 mb-10 text-lg">
         Exportar Certificado a PDF
    </button>

    <!-- CERTIFICADO CONTAINER -->
    <div id="certificado-template" class="certificado-container">
        
        <!-- Línea de Acento Superior -->
        <div class="accent-line"></div>

        <div class="p-10 flex flex-col justify-between h-full relative z-10">
            
            <!-- Logo y Encabezado (AHORA CENTRADO) -->
            <header class="mb-10 w-full flex flex-col items-center text-center">
                
                <!-- Logo Centrado -->
                <div class="mb-2">
                    <img src="{{LOGO_URL}}" 
                         alt="Logo de la Institución" 
                         class="h-16 w-auto mx-auto"
                         onerror="this.onerror=null; this.src=''https://placehold.co/150x60/f0f0f0/333?text=Logo+Placeholder'';">
                </div>

                <!-- Bloque de Título Centrado debajo del logo -->
                <div class="mt-1"> 
                    <h1 class="title-display text-3xl leading-none tracking-wider uppercase">Certificado de Curso Mooc</h1>
                </div>
            </header>

            <!-- Cuerpo Principal del Certificado -->
            <main class="flex-grow flex flex-col justify-center items-center py-4">
                <p class="text-xl text-gray-600 mb-6 font-light uppercase">Se otorga este reconocimiento a:</p>
                
                <p id="nombreParticipante" class="recipient-name text-5xl pb-3 mb-8 px-12">
                    {{STUDENT_NAME}}
                </p>
                
                <div class="max-w-4xl text-center">
                    <p class="text-2xl text-gray-700 leading-normal">
                        Por completar con éxito el programa especializado de:
                        <!-- Título del curso en AZUL (color-primary) -->
                        <span id="evento" class="font-bold italic" style="color: var(--color-primary);">"{{COURSE_TITLE}}"</span>,
                        equivalente a <span class="font-bold">{{HOURS}} horas</span> de contenido curricular.
                    </p>
                    <p class="text-lg mt-6 text-gray-500">
                        Finalizado el <span id="fechaEmision" class="font-bold">{{ISSUED_DATE}}</span>{{CITY_TEXT}}.
                    </p>
                </div>
            </main>

            <!-- Pie de Página y Elementos de Verificación (QR y Firma) -->
            <footer class="flex justify-between items-end mt-8">
                
                <!-- Área de Firma (Centralizada en el espacio disponible) -->
                <div class="flex-grow flex justify-center items-end">
                    <div class="text-center w-auto">
                        <!-- Línea de Firma (Color Primario: Azul) -->
                        <div class="h-0.5 w-64 mb-2 mx-auto" style="background-color: var(--color-primary);"></div>
                        <p class="text-lg font-semibold text-gray-800">{{SIGNATURE_NAME}}</p>
                        <p class="text-sm text-gray-500 font-light">{{SIGNATURE_TITLE}}</p>
                        
                        <!-- Texto de Certificación Electrónica -->
                        <p class="text-xs mt-3 text-gray-600 font-medium">Firma electrónica certificada mediante criptografía</p>
                        <p class="text-xs font-mono text-gray-500 mt-1">MD5: <span id="md5-code">{{MD5_HASH}}</span></p> 
                        
                        <!-- Nueva instrucción de verificación -->
                        <p class="text-[10px] text-gray-500 mt-2 leading-tight max-w-xs mx-auto">
                            Para verificar la autenticidad de este código debe ingresar a {{VERIFICATION_URL}} 
                            e ingresar el código del certificado para convalidar el mismo.
                        </p>
                    </div>
                </div>

                <!-- Código QR de Verificación (Derecha, sin cambios) -->
                <div class="text-right flex-shrink-0">
                    <p class="text-sm text-gray-600 mb-2 font-semibold">Verificación Digital:</p>
                    <div id="qrcodeContainer" class="p-1 border border-gray-300 shadow-sm inline-block bg-white">
                        <!-- QR se inyecta aquí -->
                    </div>
                    <p class="text-xs font-mono text-gray-500 mt-1">ID: <span id="verification-id">{{VERIFICATION_CODE}}</span></p>
                </div>

            </footer>
        </div>
    </div>

    <script>
        // --- 1. CONFIGURACIÓN Y DATOS DE EJEMPLO ---
        const ID_VERIFICACION = "{{VERIFICATION_CODE}}";
        const URL_BASE_VERIFICACION = "{{QR_BASE_URL}}";
        const DATA_QR = URL_BASE_VERIFICACION + "?code=" + encodeURIComponent(ID_VERIFICACION);
        
        // Función auxiliar para obtener la URL de las librerías
        const getLibraryUrl = (name) => {
            const scripts = document.head.querySelectorAll(''script'');
            for (let script of scripts) {
                if (script.src.includes(name)) {
                    return script.src;
                }
            }
            return null;
        }

        // --- 2. GENERACIÓN DEL CÓDIGO QR (Requiere qrcode.min.js) ---
        function generarQR() {
            // Verifica si la librería está disponible
            if (typeof QRCode === ''undefined'' && !getLibraryUrl(''qrcode.min.js'')) {
                console.error("Librería qrcode.js no cargada. No se puede generar el QR.");
                return;
            }
            
            const container = document.getElementById("qrcodeContainer");
            container.innerHTML = ""; // Limpia el contenedor

            new QRCode(container, {
                text: DATA_QR,
                width: 100,
                height: 100,
                colorDark : "{{PRIMARY_COLOR}}", /* Usando Deep Navy para el QR */
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        }

        // --- 3. EXPORTACIÓN A PDF (Requiere html2canvas y jspdf) ---
        document.getElementById(''export-btn'').addEventListener(''click'', async () => {
            const element = document.getElementById(''certificado-template'');
            const button = document.getElementById(''export-btn'');

            // 1. Mostrar estado de carga y deshabilitar el botón
            button.innerHTML = ''Generando PDF...'';
            button.disabled = true;

            try {
                // Capturar el contenido del certificado como un Canvas (Imagen)
                const canvas = await html2canvas(element, { 
                    scale: 4, // Aumentado a 4 para una calidad de impresión superior
                    useCORS: true, 
                    logging: false,
                    scrollY: -window.scrollY, 
                    scrollX: -window.scrollX
                });

                // 2. Crear el PDF
                const { jsPDF } = window.jspdf;
                if (!jsPDF) {
                    throw new Error("Librería jsPDF no cargada.");
                }

                // ''l'': landscape (horizontal), ''mm'': unidades en milímetros, ''letter'': tamaño de página
                // Dimensiones del Letter horizontal en mm: 279.4 x 215.9
                const pdf = new jsPDF(''l'', ''mm'', ''letter''); 
                const pdfWidth = 279.4; 
                const pdfHeight = 215.9; 
                
                const imgData = canvas.toDataURL(''image/jpeg'', 1.0); // Usar JPEG con alta calidad

                // Añadir la imagen al PDF
                pdf.addImage(imgData, ''JPEG'', 0, 0, pdfWidth, pdfHeight);
                
                // 3. Descargar el archivo
                pdf.save(`Certificado_Participacion_${ID_VERIFICACION}.pdf`);

            } catch (error) {
                console.error("Error al generar el PDF:", error);
                alert("Ocurrió un error crítico al generar el PDF. Revisa la consola para más detalles.");
            } finally {
                // 4. Restaurar el botón
                button.innerHTML = '' Exportar Certificado a PDF'';
                button.disabled = false;
            }
        });

        // Inicialización al cargar la página
        window.onload = function() {
            // Rellena la información dinámica
            document.getElementById("verification-id").innerText = ID_VERIFICACION;
            // Genera el código QR
            generarQR();
        }

    </script>
</body>
</html>',
  'Dra. Mónica Beltrán',
  'Directora General de MOOC UDES',
  'https://udesvirtual.com/verificar-certificado',
  'https://mooc.udes.edu.co/verificar-certificado',
  'https://udes.edu.co/images/logo/logo-con-acreditada-color.png',
  '#052c4e',
  '#2c3e50'
);

alter table public.certificate_settings enable row level security;

-- Policy: only admins can view/modify certificate settings
drop policy if exists "cert_settings_admin" on public.certificate_settings;
create policy "cert_settings_admin"
  on public.certificate_settings for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));