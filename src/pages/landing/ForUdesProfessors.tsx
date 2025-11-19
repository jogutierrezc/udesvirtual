import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, BookOpen, Users, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import TopNavigationBar from "@/components/TopNavigationBar";
import Navbar from "@/components/Navbar";

const ForUdesProfessors = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <TopNavigationBar />
      <Navbar topOffset={40} />

      {/* Hero Section - Full-width two columns: left text, right full-bleed image */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-16 px-0">
        <div className="w-full">
          <div className="grid lg:grid-cols-2 items-stretch gap-0">
            {/* Left: Text content (kept centered within a padded column) */}
            <div className="px-6 sm:px-12 lg:px-24 flex items-center bg-white">
              <div className="py-8 lg:py-16">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Fortalece la inserción laboral para atraer a un mayor número de estudiantes
                </h1>
                <p className="mt-6 text-lg text-gray-700 leading-relaxed max-w-2xl">
                  Capacita a los estudiantes con las habilidades más demandadas y prepáralos 
                  para alcanzar el éxito en el mundo laboral.
                </p>
                <div className="mt-8">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                    Comenzar
                  </Button>
                </div>
                <div className="pt-4">
                  <Link to="#" className="text-blue-600 hover:underline font-medium">
                    Consulta tus opciones, comparar planes →
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Image - full-bleed to the edge of the page */}
            <div className="w-full">
              <div className="w-full h-[520px] lg:h-[640px]">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=2000&auto=format&fit=crop"
                  alt="Profesores colaborando"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Dark background with 3 columns */}
      <section className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold">76%</div>
              <p className="text-gray-300 text-sm leading-relaxed">
                El 76 % de los estudiantes tiene más posibilidades de inscribirse en un programa 
                de grado que ofrece microcredenciales de la industria
              </p>
              <div className="text-xs text-gray-500">[1]</div>
            </div>

            <div className="text-center space-y-4">
              <div className="text-6xl font-bold">88%</div>
              <p className="text-gray-300 text-sm leading-relaxed">
                de los empleadores consideran que los certificados profesionales mejoran las 
                aptitudes de los candidatos
              </p>
              <div className="text-xs text-gray-500">[2]</div>
            </div>

            <div className="text-center space-y-4">
              <div className="text-6xl font-bold">90%</div>
              <p className="text-gray-300 text-sm leading-relaxed">
                de los estudiantes afirman que un certificado profesional los ayudará a conseguir empleo
              </p>
              <div className="text-xs text-gray-500">[3]</div>
            </div>
          </div>
        </div>
      </section>

      {/* Career Academy Section - Image left, content right */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Image */}
            <div>
              <img
                src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&auto=format&fit=crop"
                alt="Career Academy"
                className="rounded-2xl shadow-xl w-full h-auto object-cover"
              />
            </div>

            {/* Right: Content */}
            <div className="space-y-6">
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                CAREER ACADEMY
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Prepara a los estudiantes para puestos de trabajo de gran demanda
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Refuerza la inserción laboral de los estudiantes mediante la capacitación en 
                habilidades ofrecida por las principales empresas del mundo.
              </p>
              <div className="space-y-3">
                <p className="font-semibold text-gray-900">
                  Gracias a Career Academy, los estudiantes podrán realizar lo siguiente:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Obtén un certificado profesional diseñado para facilitar la inserción laboral
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Desarrolla las habilidades laborales básicas más demandadas por los empleadores
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Demuestra el dominio de habilidades mediante un portafolio de trabajo
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Explora una gran variedad de puestos de trabajo de gran demanda en diferentes industrias
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <Link to="#" className="text-blue-600 hover:underline font-medium inline-flex items-center gap-2">
                  Obtén más información sobre Career →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Certificates Section - Content left, video/image right */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-6">
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                CERTIFICADOS PROFESIONALES
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Descubra por qué los estudiantes y las empresas valoran el Certificado profesional
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Una encuesta realizada a 5.000 estudiantes y empleadores de 11 países revela 
                que la mayoría valora el Certificado profesional para impulsar los resultados 
                laborales. Los certificados profesionales ayudan a los estudiantes a demostrar 
                a las empresas que están cualificados y preparados para el empleo.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Utilice estos conocimientos para mejorar su plan de estudios y reforzar los 
                resultados del empleo.
              </p>
              <div>
                <Link to="#" className="text-blue-600 hover:underline font-medium inline-flex items-center gap-2">
                  Obtener el informe →
                </Link>
              </div>
            </div>

            {/* Right: Video placeholder with play button */}
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop"
                alt="Certificados profesionales"
                className="rounded-2xl shadow-xl w-full h-auto object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 transition-transform">
                  <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-blue-600 border-b-[12px] border-b-transparent ml-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section - Blue background with 2x2 grid */}
      <section className="bg-blue-600 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left: Title */}
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Amplía el plan de estudios y capacita al personal académico
              </h2>
              <p className="text-white/90 text-lg leading-relaxed">
                Ofrece experiencias de aprendizaje prácticas y relevantes para el trabajo 
                con contenido profesional y cursos a cargo de expertos universitarios y de la industria.
              </p>
            </div>

            {/* Right: Empty space or could add image */}
            <div></div>

            {/* Features Grid 2x2 */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Contenido de nivel mundial</h3>
                  <p className="text-white/90 text-sm leading-relaxed">
                    Conecta a los estudiantes con una amplia variedad de contenido de cientos de 
                    líderes de la industria y universidades.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Certificados profesionales</h3>
                  <p className="text-white/90 text-sm leading-relaxed">
                    Ayuda a los estudiantes a ganar confianza en el trabajo, poner en práctica lo 
                    aprendido y perfeccionar habilidades clave en campos de gran crecimiento.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Proyectos guiados</h3>
                  <p className="text-white/90 text-sm leading-relaxed">
                    Ofrece a los estudiantes proyectos prácticos para que puedan poner en 
                    práctica sus habilidades y diferenciarse ante los empleadores.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Integración LMS</h3>
                  <p className="text-white/90 text-sm leading-relaxed">
                    Agiliza la experiencia de aprendizaje al vincular Coursera a tu sistema de gestión 
                    de aprendizaje.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            ¿Listo para fortalecer las capacidades de tus estudiantes?
          </h2>
          <p className="text-lg text-gray-700">
            Únete a cientos de universidades que ya están transformando la educación con UDES E-Exchange
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6">
              Contáctanos
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-gray-300 px-8 py-6">
              Ver Planes
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ForUdesProfessors;
