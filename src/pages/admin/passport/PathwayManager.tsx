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
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Route, ChevronUp, ChevronDown, Target } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface PassportRoute {
  id: string;
  name: string;
  description: string;
  pathway_type: 'conocimiento' | 'descubrimiento' | 'impacto_social';
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  steps?: PassportRouteStep[];
}

interface PassportRouteStep {
  id: string;
  route_id: string;
  order_index: number;
  title: string;
  description: string;
  points_required: number;
  created_at: string;
  updated_at: string;
}

const PathwayManager: React.FC = () => {
  const [pathways, setPathways] = useState<PassportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPathway, setEditingPathway] = useState<PassportRoute | null>(null);
  const [stepsDialogOpen, setStepsDialogOpen] = useState(false);
  const [selectedPathway, setSelectedPathway] = useState<PassportRoute | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const { toast } = useToast();

  // Form state for pathways
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pathway_type: 'conocimiento' as 'conocimiento' | 'descubrimiento' | 'impacto_social',
    active: true,
  });

  // Form state for steps
  const [stepFormData, setStepFormData] = useState({
    title: '',
    description: '',
    points_required: 0,
  });
  const [editingStep, setEditingStep] = useState<PassportRouteStep | null>(null);

  useEffect(() => {
    loadPathways();
  }, []);

  const loadPathways = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('passport_routes')
        .select(`
          *,
          steps:passport_route_steps(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Sort steps by order_index for each pathway
      const pathwaysWithSortedSteps = data?.map((pathway: any) => ({
        ...pathway,
        steps: pathway.steps?.sort((a: any, b: any) => a.order_index - b.order_index) || []
      })) || [];

      setPathways(pathwaysWithSortedSteps);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los senderos: ' + error.message,
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
      pathway_type: 'conocimiento',
      active: true,
    });
    setEditingPathway(null);
  };

  const resetStepForm = () => {
    setStepFormData({
      title: '',
      description: '',
      points_required: 0,
    });
    setEditingStep(null);
  };

  const handleCreatePathway = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del sendero es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: createdPathway, error } = await (supabase as any)
        .from('passport_routes')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      // Auto-link existing activities to the new pathway
      try {
        // Get all active activities with matching pathway_type
        const { data: matchingActivities, error: activitiesError } = await (supabase as any)
          .from('passport_activities')
          .select('id, name')
          .eq('pathway_type', formData.pathway_type)
          .eq('active', true);

        if (activitiesError) {
          console.error('Error fetching matching activities:', activitiesError);
        } else if (matchingActivities && matchingActivities.length > 0) {
          // Create route-activity links for all matching activities
          const routeActivityLinks = matchingActivities.map((activity: any, index: number) => ({
            route_id: createdPathway.id,
            activity_id: activity.id,
            order_index: index + 1, // Start from 1
            required: false,
            active: true,
          }));

          // Insert all route-activity links
          const { error: linkInsertError } = await (supabase as any)
            .from('passport_route_activities')
            .insert(routeActivityLinks);

          if (linkInsertError) {
            console.error('Error creating route-activity links:', linkInsertError);
            toast({
              title: 'Advertencia',
              description: 'Sendero creado pero no se pudieron vincular actividades automáticamente',
              variant: 'destructive',
            });
          } else {
            console.log(`Sendero vinculado automáticamente a ${routeActivityLinks.length} actividad(es)`);
            toast({
              title: 'Éxito',
              description: `Sendero creado y vinculado a ${routeActivityLinks.length} actividad(es)`,
            });
          }
        } else {
          toast({
            title: 'Éxito',
            description: 'Sendero creado correctamente',
          });
        }
      } catch (linkError) {
        console.error('Error in auto-linking:', linkError);
        toast({
          title: 'Éxito',
          description: 'Sendero creado correctamente',
        });
        // Don't fail the whole operation if auto-linking fails
      }

      setPathways([createdPathway, ...pathways]);
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el sendero: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePathway = async () => {
    if (!editingPathway || !formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del sendero es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('passport_routes')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPathway.id)
        .select()
        .single();

      if (error) throw error;

      setPathways(pathways.map(p => p.id === editingPathway.id ? data : p));
      setDialogOpen(false);
      resetForm();

      toast({
        title: 'Éxito',
        description: 'Sendero actualizado correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el sendero: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeletePathway = async (pathwayId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('passport_routes')
        .delete()
        .eq('id', pathwayId);

      if (error) throw error;

      setPathways(pathways.filter(p => p.id !== pathwayId));

      toast({
        title: 'Éxito',
        description: 'Sendero eliminado correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el sendero: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (pathway: PassportRoute) => {
    try {
      const { data, error } = await (supabase as any)
        .from('passport_routes')
        .update({
          active: !pathway.active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pathway.id)
        .select()
        .single();

      if (error) throw error;

      setPathways(pathways.map(p => p.id === pathway.id ? data : p));

      toast({
        title: 'Éxito',
        description: `Sendero ${data.active ? 'habilitado' : 'deshabilitado'} correctamente`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado del sendero: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCreateStep = async () => {
    if (!selectedPathway || !stepFormData.title.trim()) {
      toast({
        title: 'Error',
        description: 'El título del paso es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Get the next order_index
      const currentSteps = selectedPathway.steps || [];
      const nextOrderIndex = currentSteps.length > 0 ? Math.max(...currentSteps.map(s => s.order_index)) + 1 : 1;

      const { data, error } = await (supabase as any)
        .from('passport_route_steps')
        .insert([{
          route_id: selectedPathway.id,
          order_index: nextOrderIndex,
          ...stepFormData,
        }])
        .select()
        .single();

      if (error) throw error;

      // Update the pathway with the new step
      const updatedPathway = {
        ...selectedPathway,
        steps: [...currentSteps, data].sort((a, b) => a.order_index - b.order_index)
      };

      setPathways(pathways.map(p => p.id === selectedPathway.id ? updatedPathway : p));
      setSelectedPathway(updatedPathway);
      resetStepForm();

      toast({
        title: 'Éxito',
        description: 'Paso agregado correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar el paso: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStep = async () => {
    if (!selectedPathway || !editingStep || !stepFormData.title.trim()) {
      toast({
        title: 'Error',
        description: 'El título del paso es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('passport_route_steps')
        .update({
          ...stepFormData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingStep.id)
        .select()
        .single();

      if (error) throw error;

      // Update the step in the pathway
      const updatedSteps = selectedPathway.steps?.map(s => s.id === editingStep.id ? data : s) || [];
      const updatedPathway = {
        ...selectedPathway,
        steps: updatedSteps.sort((a, b) => a.order_index - b.order_index)
      };

      setPathways(pathways.map(p => p.id === selectedPathway.id ? updatedPathway : p));
      setSelectedPathway(updatedPathway);
      resetStepForm();
      setEditingStep(null);

      toast({
        title: 'Éxito',
        description: 'Paso actualizado correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el paso: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!selectedPathway) return;

    try {
      const { error } = await (supabase as any)
        .from('passport_route_steps')
        .delete()
        .eq('id', stepId);

      if (error) throw error;

      // Remove the step from the pathway
      const updatedSteps = selectedPathway.steps?.filter(s => s.id !== stepId) || [];
      const updatedPathway = {
        ...selectedPathway,
        steps: updatedSteps
      };

      setPathways(pathways.map(p => p.id === selectedPathway.id ? updatedPathway : p));
      setSelectedPathway(updatedPathway);

      toast({
        title: 'Éxito',
        description: 'Paso eliminado correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el paso: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleMoveStep = async (stepId: string, direction: 'up' | 'down') => {
    if (!selectedPathway) return;

    const steps = selectedPathway.steps || [];
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;

    // Swap order_index values
    const currentStep = steps[stepIndex];
    const targetStep = steps[newIndex];

    try {
      // Update both steps with new order_index values
      await (supabase as any)
        .from('passport_route_steps')
        .update({ order_index: targetStep.order_index, updated_at: new Date().toISOString() })
        .eq('id', currentStep.id);

      await (supabase as any)
        .from('passport_route_steps')
        .update({ order_index: currentStep.order_index, updated_at: new Date().toISOString() })
        .eq('id', targetStep.id);

      // Reload pathways to get updated order
      await loadPathways();

      toast({
        title: 'Éxito',
        description: 'Orden de pasos actualizado',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el orden: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (pathway: PassportRoute) => {
    setEditingPathway(pathway);
    setFormData({
      name: pathway.name,
      description: pathway.description || '',
      pathway_type: pathway.pathway_type,
      active: pathway.active,
    });
    setDialogOpen(true);
  };

  const openStepsDialog = (pathway: PassportRoute) => {
    setSelectedPathway(pathway);
    setStepsDialogOpen(true);
  };

  const openCreateDialog = () => {
    // Prepare dialog for creating a new pathway
    resetForm();
    setEditingPathway(null);
    setDialogOpen(true);
  };

  const handleLinkExistingActivities = async (pathway: PassportRoute) => {
    try {
      // Get all active activities with matching pathway_type that are not already linked to this route
      const { data: existingLinks, error: linksError } = await (supabase as any)
        .from('passport_route_activities')
        .select('activity_id')
        .eq('route_id', pathway.id);

      if (linksError) {
        console.error('Error fetching existing links:', linksError);
        throw linksError;
      }

      const linkedActivityIds = existingLinks?.map((link: any) => link.activity_id) || [];

      const { data: matchingActivities, error: activitiesError } = await (supabase as any)
        .from('passport_activities')
        .select('id, name')
        .eq('pathway_type', pathway.pathway_type)
        .eq('active', true)
        .not('id', 'in', `(${linkedActivityIds.join(',') || 'null'})`);

      if (activitiesError) {
        console.error('Error fetching matching activities:', activitiesError);
        throw activitiesError;
      }

      if (!matchingActivities || matchingActivities.length === 0) {
        toast({
          title: 'Información',
          description: 'No hay actividades nuevas para vincular a este sendero',
        });
        return;
      }

      // Get the next order_index
      const currentMaxOrder = existingLinks && existingLinks.length > 0
        ? Math.max(...existingLinks.map((link: any) => link.order_index || 0))
        : 0;

      // Create route-activity links for new activities
      const routeActivityLinks = matchingActivities.map((activity: any, index: number) => ({
        route_id: pathway.id,
        activity_id: activity.id,
        order_index: currentMaxOrder + index + 1,
        required: false,
        active: true,
      }));

      // Insert all route-activity links
      const { error: linkInsertError } = await (supabase as any)
        .from('passport_route_activities')
        .insert(routeActivityLinks);

      if (linkInsertError) {
        console.error('Error creating route-activity links:', linkInsertError);
        throw linkInsertError;
      }

      // Reload pathways to reflect changes
      await loadPathways();

      toast({
        title: 'Éxito',
        description: `${routeActivityLinks.length} actividad(es) vinculada(s) al sendero`,
      });
    } catch (error: any) {
      console.error('Error linking activities:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron vincular las actividades: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const editStep = (step: PassportRouteStep) => {
    setEditingStep(step);
    setStepFormData({
      title: step.title,
      description: step.description || '',
      points_required: step.points_required,
    });
  };

  const filteredPathways = pathways.filter(pathway => {
    const matchesSearch = pathway.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pathway.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || pathway.pathway_type === filterType;
    const matchesActive = filterActive === 'all' ||
                         (filterActive === 'active' && pathway.active) ||
                         (filterActive === 'inactive' && !pathway.active);

    return matchesSearch && matchesType && matchesActive;
  });

  const getPathwayTypeLabel = (type: string) => {
    const labels = {
      conocimiento: 'Conocimiento',
      descubrimiento: 'Descubrimiento',
      impacto_social: 'Impacto Social',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getPathwayTypeColor = (type: string) => {
    const colors = {
      conocimiento: 'bg-blue-100 text-blue-800',
      descubrimiento: 'bg-green-100 text-green-800',
      impacto_social: 'bg-yellow-100 text-yellow-800',
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
          <h2 className="text-2xl font-bold">Gestión de Senderos</h2>
          <p className="text-muted-foreground">Administra los senderos del Programa Passport UDES. Los nuevos senderos se vinculan automáticamente con actividades existentes.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Sendero con Actividades
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPathway ? 'Editar Sendero' : 'Crear Nuevo Sendero'}
              </DialogTitle>
              <DialogDescription>
                {editingPathway ? 'Modifica los detalles del sendero' : 'Define un nuevo sendero para el programa Passport'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Sendero de Conocimiento"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pathway_type">Tipo de Sendero *</Label>
                  <Select
                    value={formData.pathway_type}
                    onValueChange={(value: 'conocimiento' | 'descubrimiento' | 'impacto_social') =>
                      setFormData(prev => ({ ...prev, pathway_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conocimiento">Conocimiento</SelectItem>
                      <SelectItem value="descubrimiento">Descubrimiento</SelectItem>
                      <SelectItem value="impacto_social">Impacto Social</SelectItem>
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
                  placeholder="Describe el propósito y objetivos de este sendero"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
                <Label htmlFor="active">Sendero activo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
            <Button onClick={editingPathway ? handleUpdatePathway : handleCreatePathway}>
              {editingPathway ? 'Actualizar' : 'Crear y Vincular'} Sendero
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
                  placeholder="Buscar senderos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="conocimiento">Conocimiento</SelectItem>
                <SelectItem value="descubrimiento">Descubrimiento</SelectItem>
                <SelectItem value="impacto_social">Impacto Social</SelectItem>
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

      {/* Pathways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPathways.map((pathway) => (
          <Card key={pathway.id} className={`relative ${!pathway.active ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    <Route className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{pathway.name}</CardTitle>
                    <Badge className={getPathwayTypeColor(pathway.pathway_type)}>
                      {getPathwayTypeLabel(pathway.pathway_type)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openStepsDialog(pathway)}
                    title="Gestionar pasos"
                  >
                    <Target className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLinkExistingActivities(pathway)}
                    title="Vincular actividades existentes"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(pathway)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(pathway)}
                  >
                    {pathway.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar sendero?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. El sendero "{pathway.name}" será eliminado permanentemente,
                          incluyendo todos sus pasos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePathway(pathway.id)}
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
                {pathway.description || 'Sin descripción'}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pasos definidos:</span>
                  <span className="font-medium">{pathway.steps?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Estado:</span>
                  <Badge variant={pathway.active ? "default" : "secondary"}>
                    {pathway.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPathways.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {pathways.length === 0 ? 'No hay senderos creados aún.' : 'No se encontraron senderos con los filtros aplicados.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Steps Management Dialog */}
      <Dialog open={stepsDialogOpen} onOpenChange={setStepsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pasos del Sendero: {selectedPathway?.name}</DialogTitle>
            <DialogDescription>
              Gestiona los pasos y hitos de este sendero
            </DialogDescription>
          </DialogHeader>

          {selectedPathway && (
            <div className="space-y-6">
              {/* Add/Edit Step Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {editingStep ? 'Editar Paso' : 'Agregar Nuevo Paso'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Título del Paso *</Label>
                      <Input
                        value={stepFormData.title}
                        onChange={(e) => setStepFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Paso 1: Introducción"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Puntos Requeridos</Label>
                      <Input
                        type="number"
                        min="0"
                        value={stepFormData.points_required}
                        onChange={(e) => setStepFormData(prev => ({ ...prev, points_required: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={stepFormData.description}
                      onChange={(e) => setStepFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe qué deben lograr los estudiantes en este paso"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={editingStep ? handleUpdateStep : handleCreateStep}>
                      {editingStep ? 'Actualizar Paso' : 'Agregar Paso'}
                    </Button>
                    {editingStep && (
                      <Button variant="outline" onClick={() => { resetStepForm(); setEditingStep(null); }}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Steps List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pasos Definidos ({selectedPathway.steps?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPathway.steps && selectedPathway.steps.length > 0 ? (
                    <div className="space-y-3">
                      {selectedPathway.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveStep(step.id, 'up')}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveStep(step.id, 'down')}
                              disabled={index === selectedPathway.steps!.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{step.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {step.description || 'Sin descripción'}
                            </div>
                          </div>
                          <div className="text-sm font-medium">
                            {step.points_required} pts
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editStep(step)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar paso?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El paso "{step.title}" será eliminado.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteStep(step.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay pasos definidos para este sendero.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setStepsDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PathwayManager;