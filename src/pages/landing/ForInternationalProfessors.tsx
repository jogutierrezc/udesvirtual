import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import TopNavigationBar from "@/components/TopNavigationBar";
import Navbar from "@/components/Navbar";

const ForInternationalProfessors = () => {
  return (
    <div className="min-h-screen bg-white">
      <TopNavigationBar />
      <Navbar topOffset={40} />

      {/* Hero Section - Full-width two columns: left text, right full-bleed image */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-16 px-0">
        <div className="w-full">
          <div className="grid lg:grid-cols-2 items-stretch gap-0">
            <div className="px-6 sm:px-12 lg:px-24 flex items-center bg-white">
              <div className="py-8 lg:py-16">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Para profesores internacionales
                </h1>
                <p className="mt-6 text-lg text-gray-700 leading-relaxed max-w-2xl">
                  Conéctate con UDES, comparte experiencias con estudiantes y colabora en proyectos
                  de investigación y docencia internacional.
                </p>
                <div className="mt-8">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                    Más información
                  </Button>
                </div>
                <div className="pt-4">
                  <Link to="#" className="text-blue-600 hover:underline font-medium">
                    Requisitos y pasos para participar →
                  </Link>
                </div>
              </div>
            </div>

            <div className="w-full">
              <div className="w-full h-[520px] lg:h-[640px]">
                <img
                  src="https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=2000&auto=format&fit=crop"
                  alt="Profesores internacionales"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900">Únete a nuestra comunidad académica</h2>
          <p className="mt-3 text-gray-700">Explora oportunidades de enseñanza, investigación y movilidad.</p>
        </div>
      </section>
    </div>
  );
};

export default ForInternationalProfessors;
