import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, MessageSquare, Globe, Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const Index = () => {
  const [stats, setStats] = useState({
    offerings: 0,
    classes: 0,
    teachers: 0,
    coilProposals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [offeringsRes, classesRes, teachersRes, coilRes] = await Promise.all([
        supabase.from("course_offerings").select("id", { count: "exact", head: true }),
        supabase.from("classes").select("id", { count: "exact", head: true }),
        supabase.from("teachers").select("id", { count: "exact", head: true }),
        supabase.from("coil_proposals").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        offerings: offeringsRes.count || 0,
        classes: classesRes.count || 0,
        teachers: teachersRes.count || 0,
        coilProposals: coilRes.count || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, gradient, delay }: any) => (
    <Card 
      className={`relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border-0 ${gradient}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      <div className="relative p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <Icon className="h-8 w-8 opacity-80 group-hover:scale-110 transition-transform" />
          <TrendingUp className="h-5 w-5 opacity-60" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium opacity-90">{label}</p>
          <p className="text-4xl font-bold tracking-tight">
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              <CountUp end={value} />
            )}
          </p>
        </div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mb-16 group-hover:scale-150 transition-transform duration-700"></div>
      </div>
    </Card>
  );

  const CountUp = ({ end }: { end: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      let start = 0;
      const duration = 2000;
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }, [end]);

    return <>{count}</>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Lado izquierdo: Contenido */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm shadow-lg">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Universidad de Santander - UDES
                </span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    UDES
                  </span>
                  <br />
                  <span className="text-gray-800">Virtual</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-xl">
                  Conectando el mundo a través de la 
                  <span className="font-semibold text-indigo-600"> educación internacional</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/lia" className="group">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all text-lg px-8 py-6">
                    <MessageSquare className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                    Hablar con LIA
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/catalog">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-indigo-300 hover:bg-indigo-50 text-indigo-700 font-semibold text-lg px-8 py-6">
                    Explorar Catálogo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>

              {/* Mini badges */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-4">
                <span className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 shadow-md">
                  🌍 Intercambio Internacional
                </span>
                <span className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 shadow-md">
                  🎓 Clases Espejo
                </span>
                <span className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 shadow-md">
                  💻 COIL Virtual
                </span>
              </div>
            </div>

            {/* Lado derecho: Logo/Animación */}
            <div className="relative">
              <div className="relative z-10 bg-white/60 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
                <img
                  src="https://udes.edu.co/images/logo/logo-con-acreditada-color.png"
                  alt="Logo UDES"
                  className="w-full h-auto object-contain"
                />
                <div className="absolute -top-4 -right-4 bg-gradient-to-br from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full shadow-xl font-bold text-sm">
                  ✨ Potenciado por IA
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-3xl blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Nuestra Oferta Académica
              </span>
            </h2>
            <p className="text-gray-600 text-lg">En tiempo real, conectando el mundo</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Globe}
              label="Ofertas de Intercambio"
              value={stats.offerings}
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
              delay={0}
            />
            <StatCard
              icon={BookOpen}
              label="Clases Espejo & MasterClass"
              value={stats.classes}
              gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
              delay={100}
            />
            <StatCard
              icon={Users}
              label="Profesores Investigadores"
              value={stats.teachers}
              gradient="bg-gradient-to-br from-purple-500 to-purple-600"
              delay={200}
            />
            <StatCard
              icon={Sparkles}
              label="Propuestas COIL"
              value={stats.coilProposals}
              gradient="bg-gradient-to-br from-pink-500 to-pink-600"
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* LIA Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Animación LIA */}
            <div className="order-2 lg:order-1">
              <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 shadow-2xl">
                <div className="absolute inset-0 bg-white/10 rounded-3xl backdrop-blur-sm"></div>
                <div className="relative">
                  <DotLottieReact
                    src="https://lottie.host/c823e524-4a8b-4e38-80a6-80f9789bde03/HiEXkWlwCj.lottie"
                    loop
                    autoplay
                    className="w-full max-w-md mx-auto"
                  />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white text-indigo-600 px-6 py-3 rounded-full shadow-xl font-bold text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Powered by AI
                </div>
              </div>
            </div>

            {/* Contenido LIA */}
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm shadow-lg">
                <MessageSquare className="w-4 h-4" />
                <span className="font-semibold">Conoce a LIA</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
                Tu Asistente Inteligente
                <span className="block text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
                  Siempre Lista para Ayudarte
                </span>
              </h2>

              <p className="text-lg text-gray-600 leading-relaxed">
                LIA es la embajadora digital de UDES, potenciada por inteligencia artificial 
                para brindarte información instantánea sobre clases, profesores, programas 
                de intercambio y mucho más.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-all border border-indigo-100">
                  <div className="text-3xl mb-3">🌟</div>
                  <h3 className="font-bold text-gray-800 mb-2">Humana y Cercana</h3>
                  <p className="text-sm text-gray-600">
                    Lenguaje natural y amigable
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-all border border-purple-100">
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="font-bold text-gray-800 mb-2">Respuestas Instantáneas</h3>
                  <p className="text-sm text-gray-600">
                    Información al momento
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-all border border-pink-100">
                  <div className="text-3xl mb-3">🎓</div>
                  <h3 className="font-bold text-gray-800 mb-2">Experta en UDES</h3>
                  <p className="text-sm text-gray-600">
                    Conoce toda la oferta académica
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-all border border-blue-100">
                  <div className="text-3xl mb-3">🌍</div>
                  <h3 className="font-bold text-gray-800 mb-2">Multilingüe</h3>
                  <p className="text-sm text-gray-600">
                    Español, inglés y portugués
                  </p>
                </div>
              </div>

              <Link to="/lia">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl text-lg px-8 py-6">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Conversar con LIA Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features/Benefits Section */}
      <section className="relative py-16 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
              ¿Por qué elegir UDES Virtual?
            </h2>
            <p className="text-gray-600 text-lg">Conecta tu futuro con el mundo</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-blue-100 hover:border-blue-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Alcance Global</h3>
              <p className="text-gray-600 leading-relaxed">
                Accede a programas de intercambio con universidades de todo el mundo. 
                Expande tus horizontes académicos sin límites.
              </p>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-indigo-100 hover:border-indigo-300">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Catálogo Diverso</h3>
              <p className="text-gray-600 leading-relaxed">
                Clases Espejo, MasterClass, COIL y más. Encuentra el programa perfecto 
                para tu perfil académico y profesional.
              </p>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-purple-100 hover:border-purple-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">IA a tu Servicio</h3>
              <p className="text-gray-600 leading-relaxed">
                LIA te guía en todo momento. Encuentra ofertas, profesores y respuestas 
                en segundos con ayuda de inteligencia artificial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10"></div>
            <div className="relative z-10 space-y-6 text-white">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                ¿Listo para comenzar tu aventura académica?
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Únete a miles de estudiantes que ya están explorando oportunidades 
                internacionales con UDES Virtual
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto font-semibold text-lg px-8 py-6 bg-white text-indigo-600 hover:bg-gray-100">
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Crear Cuenta Gratis
                  </Button>
                </Link>
                <Link to="/catalog">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 font-semibold text-lg px-8 py-6">
                    Explorar Ofertas
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CSS Animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Index;
