import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Sparkles, X } from "lucide-react";

interface CelebrationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  points?: number;
  badge?: {
    name: string;
    color?: string;
  };
}

export default function CelebrationPopup({
  isOpen,
  onClose,
  title,
  message,
  points,
  badge
}: CelebrationPopupProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [lottieLoaded, setLottieLoaded] = useState(false);
  const [animationError, setAnimationError] = useState(false);

  useEffect(() => {
    // Load Lottie script dynamically - keep it persistent
    if (!document.querySelector('script[src*="dotlottie-wc"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@lottiefiles/dotlottie-wc@0.8.5/dist/dotlottie-wc.js';
      script.type = 'module';
      script.onload = () => {
        console.log('Lottie script loaded successfully');
        setLottieLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Lottie script');
        setAnimationError(true);
      };
      document.head.appendChild(script);
    } else {
      // Script already exists, check if it's loaded
      setLottieLoaded(true);
    }

    // Set a timeout in case the script takes too long to load
    const timeout = setTimeout(() => {
      if (!lottieLoaded) {
        console.warn('Lottie script loading timeout');
        setAnimationError(true);
      }
    }, 5000);

    return () => {
      clearTimeout(timeout);
      // Don't remove the script - keep it for future use
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] border-0 bg-transparent shadow-none">
        <div className="relative">
          {/* Background with blur effect */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-3xl" />

          {/* Main content */}
          <div className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-3xl p-8 text-center text-white shadow-2xl">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Celebration animation */}
            <div className="mb-6 flex justify-center">
              {showConfetti && (
                <>
                  {lottieLoaded && !animationError ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: `<dotlottie-wc src="https://lottie.host/8b0e1434-69b9-4f60-8fd2-2a566ed842f0/u7tpBzJ1Bg.lottie" style="width: 200px; height: 200px;" autoplay loop></dotlottie-wc>`
                      }}
                    />
                  ) : (
                    // Fallback animation - bouncing trophy
                    <div className="w-48 h-48 flex items-center justify-center">
                      <div className="animate-bounce">
                        <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                          <Trophy className="h-12 w-12 text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Trophy icon */}
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full">
                <Trophy className="h-10 w-10 text-yellow-300" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-3">{title}</h2>

            {/* Message */}
            <p className="text-white/90 mb-4 leading-relaxed">{message}</p>

            {/* Points display */}
            {points && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <Star className="h-4 w-4 text-yellow-300" />
                  <span className="font-bold">+{points} puntos</span>
                </div>
              </div>
            )}

            {/* Badge display */}
            {badge && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <div
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2"
                  style={{ backgroundColor: badge.color ? `${badge.color}20` : undefined }}
                >
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                  <span className="font-bold">{badge.name}</span>
                </div>
              </div>
            )}

            {/* Action button */}
            <Button
              onClick={onClose}
              className="bg-white text-orange-600 hover:bg-white/90 font-semibold px-6 py-2 rounded-full transition-all duration-200"
            >
              ¡Genial!
            </Button>
          </div>

          {/* Floating confetti effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: ['#FFD700', '#FF6B35', '#F7931E', '#FFD23F'][Math.floor(Math.random() * 4)]
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}