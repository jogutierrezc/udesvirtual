-- Migration: insert default certificate_settings row if none exists
-- This is idempotent: it only inserts when the table has 0 rows

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.certificate_settings) THEN
    INSERT INTO public.certificate_settings (
      template_html,
      signature_name,
      signature_title,
      qr_base_url,
      verification_url,
      logo_url,
      primary_color,
      secondary_color,
      created_at,
      updated_at
    ) VALUES (
      $$
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado de Curso Mooc UDES</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap');
        body { font-family: 'Montserrat', sans-serif; background-color: #e5e7eb; display: flex; flex-direction: column; align-items: center; padding: 30px; }
        .certificado-container { width: 27.94cm; height: 21.59cm; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1); margin: 30px; background-color: #ffffff; position: relative; overflow: hidden; border-radius: 0; border: 2px solid #ddd; }
        .certificado-container::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(#e5e7eb 1px, transparent 0); background-size: 5px 5px; opacity: 0.1; pointer-events: none; z-index: 0; }
        .accent-line { position: absolute; top: 0; left: 0; width: 100%; height: 5px; background-color: var(--color-primary); z-index: 2; }
        .title-display { font-family: 'Montserrat', sans-serif; color: var(--color-secondary); letter-spacing: 0.5px; font-weight: 500; }
        .recipient-name { font-family: 'Montserrat', sans-serif; color: var(--color-primary); font-weight: 800; }
        @media print { .certificado-container { box-shadow: none !important; margin: 0 !important; } }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>
    <button id="export-btn" class="bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-8 rounded-full shadow-xl transition duration-300 transform hover:scale-105 mb-10 text-lg">Exportar Certificado a PDF</button>
    <div id="certificado-template" class="certificado-container">
        <div class="accent-line"></div>
        <div class="p-10 flex flex-col justify-between h-full relative z-10">
            <header class="mb-10 w-full flex flex-col items-center text-center">
                <div class="mb-2">
                    <img src="{{LOGO_URL}}" alt="Logo de la Institución" class="h-16 w-auto mx-auto" onerror="this.onerror=null; this.src='https://placehold.co/150x60/f0f0f0/333?text=Logo+Placeholder';">
                </div>
                <div class="mt-1">
                    <h1 class="title-display text-3xl leading-none tracking-wider uppercase">Certificado de Curso Mooc</h1>
                </div>
            </header>
            <main class="flex-grow flex flex-col justify-center items-center py-4">
                <p class="text-xl text-gray-600 mb-6 font-light uppercase">Se otorga este reconocimiento a:</p>
                <p id="nombreParticipante" class="recipient-name text-5xl pb-3 mb-8 px-12">{{STUDENT_NAME}}</p>
                <div class="max-w-4xl text-center">
                    <p class="text-2xl text-gray-700 leading-normal">
                        Por completar con éxito el programa especializado de:
                        <span class="font-bold italic" style="color: var(--color-primary);">"{{COURSE_TITLE}}"</span>,
                        equivalente a <span class="font-bold">{{HOURS}} horas</span> de contenido curricular.
                    </p>
                    <p class="text-lg mt-6 text-gray-500">
                        Finalizado el <span class="font-bold">{{ISSUED_DATE}}</span>{{CITY_TEXT}}.
                    </p>
                </div>
            </main>
            <footer class="flex justify-between items-end mt-8">
                <div class="flex-grow flex justify-center items-end">
                    <div class="text-center w-auto">
                        <div class="h-0.5 w-64 mb-2 mx-auto" style="background-color: var(--color-primary);"></div>
                        <p class="text-lg font-semibold text-gray-800">{{SIGNATURE_NAME}}</p>
                        <p class="text-sm text-gray-500 font-light">{{SIGNATURE_TITLE}}</p>
                        <p class="text-xs mt-3 text-gray-600 font-medium">Firma electrónica certificada mediante criptografía</p>
                        <p class="text-xs font-mono text-gray-500 mt-1">MD5: <span id="md5-code">{{MD5_HASH}}</span></p>
                        <p class="text-[10px] text-gray-500 mt-2 leading-tight max-w-xs mx-auto">
                            Para verificar la autenticidad de este código debe ingresar a {{VERIFICATION_URL}}
                            e ingresar el código del certificado para convalidar el mismo.
                        </p>
                    </div>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-sm text-gray-600 mb-2 font-semibold">Verificación Digital:</p>
                    <div id="qrcodeContainer" class="p-1 border border-gray-300 shadow-sm inline-block bg-white"></div>
                    <p class="text-xs font-mono text-gray-500 mt-1">ID: <span id="verification-id">{{VERIFICATION_CODE}}</span></p>
                </div>
            </footer>
        </div>
    </div>
    <script>
        const ID_VERIFICACION = "{{VERIFICATION_CODE}}";
        const URL_BASE_VERIFICACION = "{{QR_BASE_URL}}";
        const DATA_QR = URL_BASE_VERIFICACION + "?code=" + encodeURIComponent(ID_VERIFICACION);
        function generarQR() {
            const container = document.getElementById("qrcodeContainer");
            container.innerHTML = "";
            new QRCode(container, {
                text: DATA_QR,
                width: 100,
                height: 100,
                colorDark : "{{PRIMARY_COLOR}}",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        }
        document.getElementById('export-btn').addEventListener('click', async () => {
            const element = document.getElementById('certificado-template');
            const button = document.getElementById('export-btn');
            button.innerHTML = 'Generando PDF...';
            button.disabled = true;
            try {
                const canvas = await html2canvas(element, { scale: 4, useCORS: true, logging: false, scrollY: -window.scrollY, scrollX: -window.scrollX });
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('l', 'mm', 'letter');
                const pdfWidth = 279.4;
                const pdfHeight = 215.9;
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pdf.save('Certificado_Participacion_' + ID_VERIFICACION + '.pdf');
            } catch (error) {
                console.error("Error al generar el PDF:", error);
                alert("Ocurrió un error crítico al generar el PDF. Revisa la consola para más detalles.");
            } finally {
                button.innerHTML = ' Exportar Certificado a PDF';
                button.disabled = false;
            }
        });
        window.onload = function() {
            document.getElementById("verification-id").innerText = ID_VERIFICACION;
            generarQR();
        }
    </script>
</body>
</html>
      $$,
      'Dra. Mónica Beltrán',
      'Directora General de MOOC UDES',
      'https://udesvirtual.com/verificar-certificado',
      'https://mooc.udes.edu.co/verificar-certificado',
      'https://udes.edu.co/images/logo/logo-con-acreditada-color.png',
      '#052c4e',
      '#2c3e50',
      now(),
      now()
    );
  END IF;
END
$$;
