import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TopNavigationBar from "@/components/TopNavigationBar";
import Navbar from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type Category = {
  id: string;
  title: string;
  slug?: string | null;
  image_url?: string | null;
  description?: string | null;
};

export default function MoocCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('mooc_categories').select('id, title, slug, image_url, description').order('title');
        if (error) throw error;
        setCategories((data as Category[]) || []);
      } catch (e) {
        console.error('Error loading categories', e);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <TopNavigationBar />
      <Navbar topOffset={40} />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold">Explorar categorías</h2>
          <p className="text-gray-600 mt-2">Selecciona una categoría para ver los cursos relacionados</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No hay categorías disponibles.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Card key={cat.id} className="overflow-hidden">
                <div className="relative h-44 w-full overflow-hidden">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">Sin imagen</div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="mt-2">{cat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{cat.description}</p>
                  <div className="flex justify-end">
                    <Link to={`/mooc/category/${encodeURIComponent(cat.slug || cat.title || cat.id)}`}>
                      <Button variant="outline">Ver categoría</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
