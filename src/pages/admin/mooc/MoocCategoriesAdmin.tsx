import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImagePlus, Trash2, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MoocCategoryFormModal from './modals/MoocCategoryFormModal';

export const MoocCategoriesAdmin = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('mooc_categories').select('*').order('title');
      if (error) throw error;
      setCategories(data || []);
    } catch (e:any) {
      console.error('Error loading categories', e);
      toast({ title: 'Error', description: 'No se pudieron cargar las categorías', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar categoría?')) return;
    try {
      const { error } = await supabase.from('mooc_categories').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Eliminada', description: 'Categoría eliminada correctamente' });
      load();
    } catch (e:any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const filtered = categories.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Categorías MOOC</h1>
          <p className="text-sm text-muted-foreground">Administra las categorías usadas por los cursos MOOC</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Buscar..." value={query} onChange={(e:any)=>setQuery(e.target.value)} />
          <Button onClick={() => setShowCreate(true)}>
            <ImagePlus className="h-4 w-4 mr-2" /> Crear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map(cat => (
          <Card key={cat.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{cat.title}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline"><Edit2 className="h-4 w-4" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cat.image_url ? <img src={cat.image_url} alt={cat.title} className="w-full h-36 object-cover rounded" /> : <div className="w-full h-36 bg-muted flex items-center justify-center text-sm">Sin imagen</div>}
              <p className="text-sm mt-2 text-muted-foreground line-clamp-3">{cat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <MoocCategoryFormModal open={showCreate} onOpenChange={setShowCreate} onCreated={(id) => { load(); }} />
    </div>
  );
};

export default MoocCategoriesAdmin;
