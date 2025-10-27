import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarSelector } from "@/components/AvatarSelector";
import { Loader2, Upload, Save, User2 } from "lucide-react";

// Shapes based on src/integrations/supabase/types.ts
// profiles table fields available

type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  country: string | null;
  department: string | null;
  city: string | null;
  address: string | null;
  document_type: string | null;
  document_number: string | null;
  university_name: string | null;
  is_international_student: boolean | null;
  is_other_university: boolean | null;
  is_private_student: boolean | null;
  profile_completed: boolean | null;
  // nuevos campos
  bio?: string | null;
  orcid_link?: string | null;
  cvlac_link?: string | null;
  is_udes?: boolean | null;
};

type UserRoleRow = {
  role: "admin" | "professor" | "student";
};

export default function Profile() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<UserRoleRow["role"] | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fileUploading, setFileUploading] = useState(false);

  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const initials = useMemo(() => {
    const name = profile?.full_name || email || "";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";
  }, [profile?.full_name, email]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        toast({ title: "No autenticado", description: "Inicia sesión para editar tu perfil", variant: "destructive" });
        return;
      }
      setUserId(user.id);
      setEmail(user.email || "");

      // metadata avatar
      const metaAvatar = (user.user_metadata as any)?.avatar_url || null;
      setAvatarUrl(metaAvatar);

      // role from user_roles
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      setRole((roleRow as any)?.role ?? null);

      // profile row
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (prof) {
        setProfile(prof as unknown as ProfileRow);
      } else {
        // create a minimal profile row if not exists
        const insertRow = {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || "",
        } as any;
        const { data: created, error } = await supabase.from("profiles").insert(insertRow).select("*").single();
        if (error) {
          console.error("Profile insert error", error);
        }
        setProfile(created as unknown as ProfileRow);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo cargar tu perfil", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!userId || !profile) return;
    try {
      setSaving(true);
      const update = {
        ...profile,
        id: userId,
        email,
        profile_completed: true,
      } as any;

      // Use upsert with onConflict to properly handle the update
      const { error } = await supabase
        .from("profiles")
        .upsert(update, { onConflict: 'id' });

      if (error) throw error;
      toast({ title: "Perfil actualizado", description: "Tus cambios se han guardado." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "No se pudo guardar.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = async (avatarUrl: string) => {
    if (!userId) return;
    try {
      setFileUploading(true);
      setAvatarUrl(avatarUrl);

      // Guardar en user metadata
      const { error: metaError } = await supabase.auth.updateUser({ 
        data: { avatar_url: avatarUrl } 
      });
      if (metaError) throw metaError;

      toast({ 
        title: "Avatar actualizado", 
        description: "Tu avatar ha sido actualizado correctamente." 
      });
    } catch (e: any) {
      console.error(e);
      toast({ 
        title: "Error", 
        description: e.message || "No se pudo actualizar el avatar.", 
        variant: "destructive" 
      });
    } finally {
      setFileUploading(false);
    }
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    try {
      setFileUploading(true);
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);
      const publicUrl = urlData.publicUrl;
      setAvatarUrl(publicUrl);

      // store in user metadata for now
      const { error: metaError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (metaError) throw metaError;

      toast({ title: "Foto actualizada", description: "Tu foto de perfil ha sido subida." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error subiendo avatar", description: e.message || "Revisa el bucket 'avatars' y permisos.", variant: "destructive" });
    } finally {
      setFileUploading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar and role */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User2 className="h-5 w-5" /> Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt="Avatar" />
                  ) : (
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-2xl">{initials}</AvatarFallback>
                  )}
                </Avatar>
                <div className="w-full space-y-3">
                  <Label>Foto de perfil</Label>
                  
                  {/* Selector de avatares de galería */}
                  <div className="flex flex-col gap-2">
                    <AvatarSelector 
                      currentAvatar={avatarUrl || undefined}
                      onSelect={handleAvatarSelect}
                    />
                    
                    {/* Separador */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 border-t"></div>
                      <span className="text-xs text-muted-foreground">o</span>
                      <div className="flex-1 border-t"></div>
                    </div>

                    {/* Subir imagen personalizada */}
                    <div className="space-y-2">
                      <Input 
                        id="avatar" 
                        type="file" 
                        accept="image/*" 
                        onChange={onAvatarChange} 
                        disabled={fileUploading}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground">
                        Sube tu propia imagen
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground text-center pt-2 border-t">
                Rol: <span className="font-medium capitalize">{role || "-"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Profile form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre completo</Label>
                  <Input value={profile.full_name || ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={email} disabled />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Universidad</Label>
                  <Input value={profile.university_name || ""} onChange={(e) => setProfile({ ...profile, university_name: e.target.value })} />
                </div>
                {/* Campos de profesor/admin: biografía y enlaces */}
                {(role === 'professor' || role === 'admin') && (
                  <div className="md:col-span-2">
                    <Label>Biografía / Descripción</Label>
                    <Textarea value={(profile as any).bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <Label>ORCID</Label>
                        <Input value={(profile as any).orcid_link || ""} onChange={(e) => setProfile({ ...profile, orcid_link: e.target.value })} />
                      </div>
                      <div>
                        <Label>CvLAC</Label>
                        <Input value={(profile as any).cvlac_link || ""} onChange={(e) => setProfile({ ...profile, cvlac_link: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <Label>País</Label>
                  <Input value={profile.country || ""} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
                </div>
                <div>
                  <Label>Departamento</Label>
                  <Input value={profile.department || ""} onChange={(e) => setProfile({ ...profile, department: e.target.value })} />
                </div>
                <div>
                  <Label>Ciudad</Label>
                  <Input value={profile.city || ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
                </div>
                <div>
                  <Label>Dirección</Label>
                  <Input value={profile.address || ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
                </div>
                <div>
                  <Label>Tipo de documento</Label>
                  <Select value={profile.document_type || ""} onValueChange={(v) => setProfile({ ...profile, document_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                      <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                      <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                      <SelectItem value="PA">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Número de documento</Label>
                  <Input value={profile.document_number || ""} onChange={(e) => setProfile({ ...profile, document_number: e.target.value })} />
                </div>
              </div>

              {/* Mostrar opciones de estudiante solo si no es profesor/admin */}
              {(role !== 'professor' && role !== 'admin') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <Label>Estudiante internacional</Label>
                      <p className="text-xs text-muted-foreground">Fuera de Colombia</p>
                    </div>
                    <Switch checked={!!profile.is_international_student} onCheckedChange={(v) => setProfile({ ...profile, is_international_student: v })} />
                  </div>
                  <div className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <Label>De otra universidad</Label>
                      <p className="text-xs text-muted-foreground">No UDES</p>
                    </div>
                    <Switch checked={!!profile.is_other_university} onCheckedChange={(v) => setProfile({ ...profile, is_other_university: v })} />
                  </div>
                  <div className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <Label>Estudiante particular</Label>
                      <p className="text-xs text-muted-foreground">Independiente</p>
                    </div>
                    <Switch checked={!!profile.is_private_student} onCheckedChange={(v) => setProfile({ ...profile, is_private_student: v })} />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
