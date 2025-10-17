import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface EmptyStateProps {
  type: 'professor-offerings' | 'catalog' | 'coil';
  searchTerm?: string;
}

const emptyMessages = {
  'professor-offerings': [
    "🌍 Tantos lugares en el mundo, tanta oferta académica... ¡pero esta búsqueda se fue de intercambio!",
    "✈️ Recorrimos el mundo entero buscando tu oferta, pero parece que está en otra universidad",
    "🎓 Tu búsqueda viajó por 5 continentes y no encontró coincidencias. ¡Intenta con otros términos!",
    "🌎 UDES tiene ofertas en todo el mundo, pero esta no está en nuestro mapa de intercambio",
    "🔍 Buscamos en América, Europa, Asia... ¡Esta oferta debe estar en Marte!",
  ],
  'catalog': [
    "📚 Revisamos todo el catálogo internacional y no encontramos coincidencias",
    "🌐 Nuestro catálogo virtual es enorme, pero esta búsqueda se perdió en el ciberespacio",
    "🎯 ¡Ups! Parece que esta clase no está en ninguna universidad aliada",
    "🗺️ Exploramos todas las alianzas UDES y no hay resultados para tu búsqueda",
    "💼 Tantos programas académicos y esta búsqueda sigue de viaje... ¡Prueba con otros términos!",
  ],
  'coil': [
    "🤝 Buscamos en todas las propuestas COIL del planeta... ¡Nada por aquí!",
    "💻 Colaboración internacional, aprendizaje virtual... pero no para esta búsqueda",
    "🌍 COIL conecta el mundo, pero esta búsqueda se quedó sin conexión",
    "🎓 Tantas oportunidades de colaboración internacional... ¡Esta no es una de ellas!",
    "✨ Revisamos todas las propuestas COIL y ninguna coincide. ¡Intenta de nuevo!",
  ],
};

export const EmptyState = ({ type, searchTerm }: EmptyStateProps) => {
  const messages = emptyMessages[type];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <DotLottieReact
          src="https://lottie.host/c823e524-4a8b-4e38-80a6-80f9789bde03/HiEXkWlwCj.lottie"
          loop
          autoplay
          className="w-full"
        />
      </div>
      
      <div className="text-center space-y-4 max-w-lg mt-4">
        <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
          ¡No encontramos resultados!
        </h3>
        
        <p className="text-base md:text-lg text-gray-700 leading-relaxed">
          {randomMessage}
        </p>
        
        {searchTerm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-gray-600">
              Buscaste: <span className="font-semibold text-blue-700">"{searchTerm}"</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              💡 Intenta buscar por campus, programa, área de conocimiento o profesor
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-6">
          <span>🌍</span>
          <span>✈️</span>
          <span>🎓</span>
          <span>📚</span>
          <span>💻</span>
        </div>
      </div>
    </div>
  );
};
