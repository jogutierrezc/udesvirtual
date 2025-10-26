import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Upload, Eye, EyeOff, Search, Filter } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface PassportBadge {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  color: string;
  badge_type: 'conocimiento' | 'descubrimiento' | 'impacto_social' | 'ciudadano_global';
  points_required: number;
  credits_required: number;
  english_level_required?: string;
  pathway_completion_required: string[];
  key_activities_required: any[];
  criteria: any;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const BadgeManager: React.FC = () => {
  const [badges, setBadges] = useState<PassportBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<PassportBadge | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_url: '',
    color: '#3B82F6',
    badge_type: 'conocimiento' as 'conocimiento' | 'descubrimiento' | 'impacto_social' | 'ciudadano_global',
    points_required: 0,
    credits_required: 0,
    english_level_required: '',
    pathway_completion_required: [] as string[],
    active: true,
  });

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('passport_badges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBadges(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las insignias: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon_url: '',
      color: '#3B82F6',
      badge_type: 'conocimiento',
      points_required: 0,
      credits_required: 0,
      english_level_required: '',
      pathway_completion_required: [],
      active: true,
    });
    setEditingBadge(null);
  };

  const handleCreateBadge = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre de la insignia es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('passport_badges')
        .insert([{
          ...formData,
          criteria: {},
          key_activities_required: [],
        }])
        .select()
        .single();

      if (error) throw error;

      setBadges([data, ...badges]);
      setDialogOpen(false);
      resetForm();

      toast({
        title: 'Éxito',
        description: 'Insignia creada correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la insignia: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateBadge = async () => {
    if (!editingBadge || !formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre de la insignia es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('passport_badges')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingBadge.id)
        .select()
        .single();

      if (error) throw error;

      setBadges(badges.map(b => b.id === editingBadge.id ? data : b));
      setDialogOpen(false);
      resetForm();

      toast({
        title: 'Éxito',
        description: 'Insignia actualizada correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la insignia: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBadge = async (badgeId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('passport_badges')
        .delete()
        .eq('id', badgeId);

      if (error) throw error;

      setBadges(badges.filter(b => b.id !== badgeId));

      toast({
        title: 'Éxito',
        description: 'Insignia eliminada correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la insignia: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (badge: PassportBadge) => {
    try {
      const { data, error } = await (supabase as any)
        .from('passport_badges')
        .update({
          active: !badge.active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', badge.id)
        .select()
        .single();

      if (error) throw error;

      setBadges(badges.map(b => b.id === badge.id ? data : b));

      toast({
        title: 'Éxito',
        description: `Insignia ${data.active ? 'habilitada' : 'deshabilitada'} correctamente`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado de la insignia: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Solo se permiten archivos de imagen',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'La imagen debe ser menor a 2MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `badges/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('passport-badges')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('passport-badges')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, icon_url: publicUrl }));

      toast({
        title: 'Éxito',
        description: 'Imagen subida correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo subir la imagen: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const openEditDialog = (badge: PassportBadge) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description || '',
      icon_url: badge.icon_url || '',
      color: badge.color,
      badge_type: badge.badge_type,
      points_required: badge.points_required,
      credits_required: badge.credits_required || 0,
      english_level_required: badge.english_level_required || '',
      pathway_completion_required: badge.pathway_completion_required || [],
      active: badge.active,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const filteredBadges = badges.filter(badge => {
    const matchesSearch = badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         badge.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || badge.badge_type === filterType;
    const matchesActive = filterActive === 'all' ||
                         (filterActive === 'active' && badge.active) ||
                         (filterActive === 'inactive' && !badge.active);

    return matchesSearch && matchesType && matchesActive;
  });

  const getBadgeTypeLabel = (type: string) => {
    const labels = {
      conocimiento: 'Conocimiento',
      descubrimiento: 'Descubrimiento',
      impacto_social: 'Impacto Social',
      ciudadano_global: 'Ciudadano Global',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getBadgeTypeColor = (type: string) => {
    const colors = {
      conocimiento: 'bg-blue-100 text-blue-800',
      descubrimiento: 'bg-green-100 text-green-800',
      impacto_social: 'bg-yellow-100 text-yellow-800',
      ciudadano_global: 'bg-purple-100 text-purple-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Insignias</h2>
          <p className="text-muted-foreground">Administra las insignias del Programa Passport UDES</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Insignia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBadge ? 'Editar Insignia' : 'Crear Nueva Insignia'}
              </DialogTitle>
              <DialogDescription>
                {editingBadge ? 'Modifica los detalles de la insignia' : 'Define una nueva insignia para el programa Passport'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Imagen de la Insignia</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                    {formData.icon_url ? (
                      <img
                        src={formData.icon_url}
                        alt="Badge preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Upload className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {uploadingImage && (
                      <div className="flex items-center gap-2 mt-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Subiendo imagen...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Insignia de Conocimiento"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="badge_type">Tipo de Insignia *</Label>
                  <Select
                    value={formData.badge_type}
                    onValueChange={(value: 'conocimiento' | 'descubrimiento' | 'impacto_social' | 'ciudadano_global') =>
                      setFormData(prev => ({ ...prev, badge_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conocimiento">Conocimiento</SelectItem>
                      <SelectItem value="descubrimiento">Descubrimiento</SelectItem>
                      <SelectItem value="impacto_social">Impacto Social</SelectItem>
                      <SelectItem value="ciudadano_global">Ciudadano Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe los criterios para obtener esta insignia"
                  rows={3}
                />
              </div>

              {/* Requirements */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="points_required">Puntos Requeridos *</Label>
                  <Input
                    id="points_required"
                    type="number"
                    min="0"
                    value={formData.points_required}
                    onChange={(e) => setFormData(prev => ({ ...prev, points_required: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits_required">Créditos Requeridos</Label>
                  <Input
                    id="credits_required"
                    type="number"
                    min="0"
                    value={formData.credits_required}
                    onChange={(e) => setFormData(prev => ({ ...prev, credits_required: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="english_level">Nivel de Inglés</Label>
                  <Select
                    value={formData.english_level_required}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, english_level_required: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1 - Básico</SelectItem>
                      <SelectItem value="A2">A2 - Elemental</SelectItem>
                      <SelectItem value="B1">B1 - Intermedio</SelectItem>
                      <SelectItem value="B2">B2 - Intermedio Alto</SelectItem>
                      <SelectItem value="C1">C1 - Avanzado</SelectItem>
                      <SelectItem value="C2">C2 - Maestría</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Color and Active Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-10 p-1 border rounded"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                    />
                    <Label>{formData.active ? 'Activa' : 'Inactiva'}</Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={editingBadge ? handleUpdateBadge : handleCreateBadge}>
                {editingBadge ? 'Actualizar' : 'Crear'} Insignia
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar insignias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="conocimiento">Conocimiento</SelectItem>
                <SelectItem value="descubrimiento">Descubrimiento</SelectItem>
                <SelectItem value="impacto_social">Impacto Social</SelectItem>
                <SelectItem value="ciudadano_global">Ciudadano Global</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBadges.map((badge) => (
          <Card key={badge.id} className={`relative ${!badge.active ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: badge.color }}
                  >
                    {badge.icon_url ? (
                      <img
                        src={badge.icon_url}
                        alt={badge.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      badge.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{badge.name}</CardTitle>
                    <Badge className={getBadgeTypeColor(badge.badge_type)}>
                      {getBadgeTypeLabel(badge.badge_type)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(badge)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(badge)}
                  >
                    {badge.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar insignia?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. La insignia "{badge.name}" será eliminada permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteBadge(badge.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {badge.description || 'Sin descripción'}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Puntos requeridos:</span>
                  <span className="font-medium">{badge.points_required}</span>
                </div>
                {badge.credits_required > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Créditos requeridos:</span>
                    <span className="font-medium">{badge.credits_required}</span>
                  </div>
                )}
                {badge.english_level_required && (
                  <div className="flex justify-between text-sm">
                    <span>Nivel de inglés:</span>
                    <span className="font-medium">{badge.english_level_required}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Estado:</span>
                  <Badge variant={badge.active ? "default" : "secondary"}>
                    {badge.active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBadges.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {badges.length === 0 ? 'No hay insignias creadas aún.' : 'No se encontraron insignias con los filtros aplicados.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BadgeManager;