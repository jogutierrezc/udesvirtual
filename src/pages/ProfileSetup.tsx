import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const documentTypes = [
  "Cédula de Ciudadanía",
  "Tarjeta de Identidad",
  "Pasaporte",
  "Documento Extranjero",
  "DNI",
  "Otro"
];

const countries = [
  "Colombia", "Argentina", "Brasil", "Chile", "México", "Perú", "Venezuela",
  "Ecuador", "Bolivia", "Paraguay", "Uruguay", "Estados Unidos", "Canadá",
  "España", "Francia", "Alemania", "Italia", "Reino Unido", "Portugal",
  "China", "Japón", "Corea del Sur", "India", "Australia", "Otro"
];

const colombianDepartments = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá",
  "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba",
  "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena",
  "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda",
  "San Andrés y Providencia", "Santander", "Sucre", "Tolima", "Valle del Cauca",
  "Vaupés", "Vichada"
];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    documentType: "",
    documentNumber: "",
    isInternationalStudent: false,
    isOtherUniversity: false,
    isPrivateStudent: false,
    universityName: "",
    phone: "",
    address: "",
    country: "Colombia",
    city: "",
    department: "",
    // nuevos campos añadidos a profiles
    biography: "",
    orcid_link: "",
    cvlac_link: "",
    isUdesStudent: false,
  });
  const [isProfessor, setIsProfessor] = useState(false);

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      // Verificar si el perfil ya está completo
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if ((profile as any)?.profile_completed) {
        // Si el perfil ya está completo, redirigir al welcome
        navigate("/welcome");
      } else {
        // Pre-llenar con datos disponibles
          setFormData(prev => ({
            ...prev,
            fullName: profile?.full_name || session.user.user_metadata?.full_name || "",
            // manejar distintos nombres posibles de columna añadida
            biography: (profile as any)?.bio || (profile as any)?.biography || (profile as any)?.profile_description || "",
            orcid_link: (profile as any)?.orcid_link || "",
            cvlac_link: (profile as any)?.cvlac_link || "",
            isUdesStudent: (profile as any)?.is_udes || (profile as any)?.is_udes_student || false,
          }));

          // Verificar roles del usuario para saber si es profesor o admin (ambos ven el formulario de profesor)
          try {
            const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id);
            const hasProfessorOrAdmin = (roles || []).some((r: any) => r.role === 'professor' || r.role === 'admin');
            setIsProfessor(hasProfessorOrAdmin);
          } catch (err) {
            console.error('Error checking roles', err);
          }
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Lógicas condicionales
    if (field === "isPrivateStudent" && value === true) {
      setFormData(prev => ({
        ...prev,
        isInternationalStudent: false,
        isOtherUniversity: false,
        universityName: ""
      }));
    }

    if (field === "country" && value !== "Colombia") {
      setFormData(prev => ({ ...prev, department: "" }));
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast({
        title: "Error",
        description: "El nombre completo es obligatorio",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.documentType) {
      toast({
        title: "Error",
        description: "Selecciona un tipo de documento",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.documentNumber.trim()) {
      toast({
        title: "Error",
        description: "El número de documento es obligatorio",
        variant: "destructive"
      });
      return false;
    }

    if ((formData.isInternationalStudent || formData.isOtherUniversity) && !formData.universityName.trim()) {
      toast({
        title: "Error",
        description: "Indica el nombre de tu universidad",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Error",
        description: "El teléfono es obligatorio",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.address.trim()) {
      toast({
        title: "Error",
        description: "La dirección es obligatoria",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.country) {
      toast({
        title: "Error",
        description: "Selecciona un país",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.city.trim()) {
      toast({
        title: "Error",
        description: "La ciudad es obligatoria",
        variant: "destructive"
      });
      return false;
    }

    if (formData.country === "Colombia" && !formData.department) {
      toast({
        title: "Error",
        description: "Selecciona un departamento",
        variant: "destructive"
      });
      return false;
    }

    // Si es profesor, no validamos los campos opcionales (biografía, links) — son opcionales

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !userId) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          document_type: formData.documentType,
          document_number: formData.documentNumber,
          is_international_student: formData.isInternationalStudent,
          is_other_university: formData.isOtherUniversity,
          is_private_student: formData.isPrivateStudent,
          university_name: formData.universityName || null,
          phone: formData.phone,
          address: formData.address,
          country: formData.country,
          city: formData.city,
          department: formData.department || null,
          profile_completed: true,
          // Guardar nuevos campos añadidos en profiles (bio se usa como columna)
          bio: (formData as any).biography || null,
          orcid_link: (formData as any).orcid_link || null,
          cvlac_link: (formData as any).cvlac_link || null,
          ...(typeof (formData as any).isUdesStudent !== 'undefined' ? { is_udes: (formData as any).isUdesStudent } : {}),
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) throw error;

      // Los campos de profesor (biography, orcid_link, cvlac_link) se guardan ahora en la tabla profiles

      toast({
        title: "¡Perfil completado!",
        description: "Tu información ha sido guardada exitosamente",
      });

      // Redirigir a la página de bienvenida
      navigate("/welcome");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el perfil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img
                src="https://udes.edu.co/images/logo/logo-con-acreditada-color.png"
                alt="Logo UDES"
                className="h-16 w-auto object-contain"
              />
            </div>
            <CardTitle className="text-2xl md:text-3xl">Completa tu Perfil</CardTitle>
            <CardDescription>
              Por favor, completa tu información para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre Completo */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="Ej: Juan Pérez García"
                />
              </div>

              {/* Tipo y Número de Documento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documentType">Tipo de Documento *</Label>
                  <Select
                    value={formData.documentType}
                    onValueChange={(value) => handleChange("documentType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentNumber">Número de Documento *</Label>
                  <Input
                    id="documentNumber"
                    value={formData.documentNumber}
                    onChange={(e) => handleChange("documentNumber", e.target.value)}
                    placeholder="Ej: 1234567890"
                  />
                </div>
              </div>

              {/* Tipo de Estudiante (oculto para profesores/admins) */}
              {!isProfessor && (
                <>
                  <div className="space-y-3">
                    <Label>Tipo de Estudiante</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isUdesStudent"
                        checked={(formData as any).isUdesStudent || false}
                        onCheckedChange={(checked) => handleChange("isUdesStudent", checked)}
                      />
                      <label htmlFor="isUdesStudent" className="text-sm font-medium leading-none">Estudiante UDES</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isPrivateStudent"
                        checked={formData.isPrivateStudent}
                        onCheckedChange={(checked) => handleChange("isPrivateStudent", checked)}
                      />
                      <label
                        htmlFor="isPrivateStudent"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Particular
                      </label>
                    </div>

                    {!formData.isPrivateStudent && (
                      <>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isInternationalStudent"
                            checked={formData.isInternationalStudent}
                            onCheckedChange={(checked) => handleChange("isInternationalStudent", checked)}
                          />
                          <label
                            htmlFor="isInternationalStudent"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Estudiante Extranjero
                          </label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isOtherUniversity"
                            checked={formData.isOtherUniversity}
                            onCheckedChange={(checked) => handleChange("isOtherUniversity", checked)}
                          />
                          <label
                            htmlFor="isOtherUniversity"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Estudiante de Otra IES
                          </label>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Universidad (condicional) */}
                  {(formData.isInternationalStudent || formData.isOtherUniversity) && (
                    <div className="space-y-2">
                      <Label htmlFor="universityName">Nombre de la Universidad *</Label>
                      <Input
                        id="universityName"
                        value={formData.universityName}
                        onChange={(e) => handleChange("universityName", e.target.value)}
                        placeholder="Ej: Universidad Nacional"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono de Contacto *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="Ej: +57 300 123 4567"
                />
              </div>

              {/* Dirección */}
              <div className="space-y-2">
                <Label htmlFor="address">Dirección de Residencia *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Ej: Calle 123 #45-67"
                />
              </div>

              {/* País y Ciudad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">País *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleChange("country", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad de Residencia *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Ej: Bucaramanga"
                  />
                </div>
              </div>

              {/* Departamento (solo para Colombia) */}
              {formData.country === "Colombia" && (
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleChange("department", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {colombianDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Campos para Profesores */}
              {isProfessor && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Perfil de Profesor</h3>
                      <div className="space-y-2">
                        <Label htmlFor="biography">Biografía / Descripción</Label>
                        <textarea id="biography" value={(formData as any).biography} onChange={(e) => handleChange('biography', e.target.value)} className="w-full p-2 border rounded" rows={4} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="orcid_link">Link ORCID (Opcional)</Label>
                          <Input id="orcid_link" value={(formData as any).orcid_link} onChange={(e) => handleChange('orcid_link', e.target.value)} placeholder="https://orcid.org/0000-0000-0000-0000" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvlac_link">Link CVLAC (Opcional)</Label>
                          <Input id="cvlac_link" value={(formData as any).cvlac_link} onChange={(e) => handleChange('cvlac_link', e.target.value)} placeholder="https://scienti.minciencias.gov.co/cvlac/" />
                        </div>
                      </div>
                </div>
              )}

              {/* Botón de envío */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Completar Registro"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
