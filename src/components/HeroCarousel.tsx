import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

interface CarouselSlide {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  video_url?: string | null;
  media_type?: string;
  link_url: string | null;
  button_text?: string | null;
  order_index: number;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const HeroCarousel = () => {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_carousel")
        .select("*")
        .eq("active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      
      let slidesData = data || [];
      
      // Si no hay slides activos, usar slides por defecto
      if (slidesData.length === 0) {
        slidesData = [
          {
            id: "default-1",
            title: "Bienvenido a UDES Virtual",
            description: "Explora nuestra plataforma de cursos MOOC de alta calidad",
            image_url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920&h=720&fit=crop",
            link_url: "/catalog",
            order_index: 1,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "default-2", 
            title: "Aprende a tu ritmo",
            description: "Cursos flexibles diseñados para tu éxito profesional",
            image_url: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1920&h=720&fit=crop",
            link_url: "/catalog",
            order_index: 2,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "default-3",
            title: "Certificados verificables",
            description: "Obtén certificados al completar tus cursos",
            image_url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1920&h=720&fit=crop",
            link_url: "/catalog", 
            order_index: 3,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ];
      }
      
      setSlides(slidesData);
    } catch (error) {
      console.error("Error fetching carousel slides:", error);
      // En caso de error, usar slides por defecto
      setSlides([
        {
          id: "default-1",
          title: "Bienvenido a UDES Virtual",
          description: "Explora nuestra plataforma de cursos MOOC de alta calidad",
          image_url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920&h=720&fit=crop",
          link_url: "/catalog",
          order_index: 1,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-play: cambiar slide cada 5 segundos
  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, slides.length]);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleSlideClick = (link_url: string | null) => {
    if (link_url) {
      window.location.href = link_url;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[720px] bg-gray-200 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (slides.length === 0) {
    // Mostrar carrusel por defecto si no hay slides configurados
    return (
      <div className="relative w-full h-[720px] overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-7xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Bienvenido a UDES Virtual
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mb-8 drop-shadow-md">
            Explora nuestra plataforma de cursos MOOC de alta calidad
          </p>
          <Button
            size="lg"
            className="w-fit bg-[#9b87f5] hover:bg-[#7E69AB] text-white font-semibold px-8 py-6 text-lg"
            onClick={() => window.location.href = '/catalog'}
          >
            Explorar cursos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[720px] overflow-hidden bg-black group">
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            onClick={() => handleSlideClick(slide.link_url)}
            style={{ cursor: slide.link_url ? "pointer" : "default" }}
          >
            {/* Media de fondo (imagen o video) */}
            {slide.media_type === 'video' && slide.video_url ? (
              <video
                src={slide.video_url}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
                onLoadedData={() => {
                  // Video cargado, asegurar que esté reproduciendo
                  const video = document.querySelector(`video[src="${slide.video_url}"]`) as HTMLVideoElement;
                  if (video && index === currentIndex) {
                    video.play().catch(() => {
                      // Silenciar errores de autoplay
                    });
                  }
                }}
              />
            ) : (
              <img
                src={slide.image_url}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

            {/* Contenido */}
            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-7xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                {slide.title}
              </h1>
              {slide.description && (
                <p className="text-xl md:text-2xl text-white/90 max-w-2xl mb-8 drop-shadow-md">
                  {slide.description}
                </p>
              )}
              {slide.link_url && (
                <Button
                  size="lg"
                  className="w-fit bg-[#9b87f5] hover:bg-[#7E69AB] text-white font-semibold px-8 py-6 text-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSlideClick(slide.link_url);
                  }}
                >
                  {slide.button_text || "Explorar cursos"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Botones de navegación */}
      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Slide siguiente"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Indicadores */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
