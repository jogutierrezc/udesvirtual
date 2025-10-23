import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, User } from "lucide-react";

type AvatarOption = {
  id: string;
  url: string;
  category: string;
};

interface AvatarSelectorProps {
  currentAvatar?: string;
  onSelect: (avatarUrl: string) => void;
}

export function AvatarSelector({ currentAvatar, onSelect }: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || "");
  const [open, setOpen] = useState(false);

  // Generar opciones de avatares basados en la API de iran.liara.run
  const avatarCategories = [
    { value: "hombre", label: "Hombre", api: "boy", count: 70 },
    { value: "mujer", label: "Mujer", api: "girl", count: 70 },
  ];

  const generateAvatars = (apiCategory: string, count: number): AvatarOption[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${i + 1}`,
      url: `https://avatar.iran.liara.run/public/${apiCategory}?username=${i + 1}`,
      category: apiCategory,
    }));
  };

  const handleSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
  };

  const handleConfirm = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          <User className="h-4 w-4 mr-2" />
          Elegir Avatar
        </Button>
      </DialogTrigger>
  <DialogContent className="max-w-4xl w-[min(90vw,900px)] h-[80vh] p-6 flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Selecciona tu Avatar</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="hombre" className="w-full flex flex-col flex-1 min-h-0 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            {avatarCategories.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {avatarCategories.map((cat) => (
            <TabsContent key={cat.value} value={cat.value} className="mt-4 flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full flex-1 pr-2">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {generateAvatars(cat.api, cat.count).map((avatar) => (
                    <button
                      key={avatar.url}
                      type="button"
                      onClick={() => handleSelect(avatar.url)}
                      className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${
                        selectedAvatar === avatar.url
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={avatar.url}
                        alt={`Avatar ${avatar.id}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {selectedAvatar === avatar.url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary rounded-full p-1">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedAvatar}>
            Confirmar Selección
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
