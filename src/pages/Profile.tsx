
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
import { Loader2, Save, User2 } from "lucide-react";
import QualificationModal from '@/components/Research/QualificationModal';
import PublicationsModal from '@/components/Research/PublicationsModal';

// Minimal types for this file
type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  country?: string | null;
  department?: string | null;
  city?: string | null;
  address?: string | null;
  document_type?: string | null;
  document_number?: string | null;
  university_name?: string | null;
  is_international_student?: boolean | null;
  is_other_university?: boolean | null;
  is_private_student?: boolean | null;
  profile_completed?: boolean | null;
  bio?: string | null;
  orcid_link?: string | null;
  cvlac_link?: string | null;
  avatar_url?: string | null;
};

type UserRole = "admin" | "professor" | "student";

export default function Profile() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fileUploading, setFileUploading] = useState(false);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [qualOpen, setQualOpen] = useState(false);
  const [pubOpen, setPubOpen] = useState(false);
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const metaAvatar = (user.user_metadata as any)?.avatar_url || null;
      setAvatarUrl(metaAvatar);

      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      setRole((roleRow as any)?.role ?? null);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (prof) {
        setProfile(prof as unknown as ProfileRow);
        fetchQualifications(prof.id);
        fetchPublications(prof.id);
      } else {
        const insertRow = {
          id: user.id,
          email: user.email!,
          full_name: (user.user_metadata as any)?.full_name || "",
        } as any;
        const { data: created, error } = await supabase.from("profiles").insert(insertRow).select("*").single();
        if (error) {
          console.error("Profile insert error", error);
        }
        setProfile(created as unknown as ProfileRow);
        fetchQualifications(created.id);
        fetchPublications(created.id);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo cargar tu perfil", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchQualifications = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from("academic_qualifications")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setQualifications(data || []);
    } catch (err) {
      console.warn("Could not fetch qualifications", err);
    }
  };

  const fetchPublications = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from("publications")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPublications(data || []);
    } catch (err) {
      console.warn("Could not fetch publications", err);
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

      const { error } = await supabase.from("profiles").upsert(update, { onConflict: "id" });
      if (error) throw error;
      toast({ title: "Perfil actualizado", description: "Tus cambios se han guardado." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "No se pudo guardar.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = async (avatar: string) => {
    if (!userId) return;
    try {
      setFileUploading(true);
      setAvatarUrl(avatar);
      const { error: metaError } = await supabase.auth.updateUser({ data: { avatar_url: avatar } });
      if (metaError) throw metaError;
      try {
        const { error: profileError } = await supabase.from("profiles").update({ avatar_url: avatar } as any).eq("id", userId);
        if (profileError) console.warn("Could not update profiles.avatar_url", profileError);
      } catch (err) {
        console.warn("profiles update failed", err);
      }
      toast({ title: "Avatar actualizado", description: "Tu avatar ha sido actualizado correctamente." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "No se pudo actualizar el avatar.", variant: "destructive" });
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
      const { data: uploadData, error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, cacheControl: "3600" });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);
      const publicUrl = urlData.publicUrl;
      setAvatarUrl(publicUrl);
      const { error: metaError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (metaError) throw metaError;
      try {
        const { error: profileError } = await supabase.from("profiles").update({ avatar_url: publicUrl } as any).eq("id", userId);
        if (profileError) console.warn("Could not update profiles.avatar_url", profileError);
      } catch (err) {
        console.warn("profiles update failed", err);
      }
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
                  <div className="flex flex-col gap-2">
                    <AvatarSelector currentAvatar={avatarUrl || undefined} onSelect={handleAvatarSelect} />
                    <div className="flex items-center gap-2">
                      <div className="flex-1 border-t" />
                      <span className="text-xs text-muted-foreground">o</span>
                      <div className="flex-1 border-t" />
                    </div>
                    <div className="space-y-2">
                      <Input id="avatar" type="file" accept="image/*" onChange={onAvatarChange} disabled={fileUploading} className="cursor-pointer" />
                      <p className="text-xs text-muted-foreground">Súbe tu propia imagen</p>
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
                {(role === "professor" || role === "admin") && (
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

              {(role !== "professor" && role !== "admin") && (
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

          {/* Perfil de investigador - solo para profesores/admin (moved under Información Personal) */}
          {(role === "professor" || role === "admin") && (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Perfil de investigador</CardTitle>
                  <CardDescription>Agrega tu formación y publicaciones para enriquecer tu perfil público</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Button onClick={() => setQualOpen(true)}>Agregar Formación</Button>
                    <Button onClick={() => setPubOpen(true)} variant="secondary">Agregar Publicación</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Formación académica</h4>
                      {qualifications.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay registros aún.</p>
                      ) : (
                        <ul className="space-y-2">
                          {qualifications.map((q) => (
                            <li key={q.id} className="border rounded p-3">
                              <div className="font-semibold">{q.level} — {q.program || q.institution}</div>
                              <div className="text-sm text-muted-foreground">{q.campus || ''} {q.start_year ? `· ${q.start_year}` : ''} {q.end_year ? `- ${q.end_year}` : ''}</div>
                              {q.notes && <div className="text-sm mt-1">{q.notes}</div>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Publicaciones</h4>
                      {publications.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay publicaciones registradas.</p>
                      ) : (
                        <ul className="space-y-2">
                          {publications.map((p) => (
                            <li key={p.id} className="border rounded p-3">
                              <div className="font-semibold">{p.title} {p.year ? `(${p.year})` : ''}</div>
                              <div className="text-sm text-muted-foreground">{p.type} {p.issn_isbn ? `· ${p.issn_isbn}` : ''}</div>
                              {p.link && <div className="text-sm mt-1"><a href={p.link} target="_blank" rel="noreferrer" className="text-blue-600 underline">Enlace</a></div>}
                              {p.keywords && p.keywords.length > 0 && <div className="text-xs text-muted-foreground mt-2">Palabras clave: {p.keywords.join(', ')}</div>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <QualificationModal open={qualOpen} onOpenChange={setQualOpen} profileId={profile?.id || null} onSaved={() => profile && fetchQualifications(profile.id)} />
      <PublicationsModal open={pubOpen} onOpenChange={setPubOpen} profileId={profile?.id || null} onSaved={() => profile && fetchPublications(profile.id)} />
    </div>
  );
}
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

      // Also save avatar_url in profiles table so public views can read it
      try {
        const { error: profileError } = await supabase.from('profiles').update(({ avatar_url: avatarUrl } as any)).eq('id', userId);
        if (profileError) console.warn('Could not update profiles.avatar_url', profileError);
      } catch (err) {
        console.warn('profiles update failed', err);
      }

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

      // Also save avatar_url in profiles table so public views can read it
      try {
        const { error: profileError } = await supabase.from('profiles').update(({ avatar_url: publicUrl } as any)).eq('id', userId);
        if (profileError) console.warn('Could not update profiles.avatar_url', profileError);
      } catch (err) {
        console.warn('profiles update failed', err);
      }

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

          {/* Perfil de investigador - solo para profesores/admin (moved under Información Personal) */}
          {(role === 'professor' || role === 'admin') && (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Perfil de investigador</CardTitle>
                  <CardDescription>Agrega tu formación y publicaciones para enriquecer tu perfil público</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Button onClick={() => setQualOpen(true)}>Agregar Formación</Button>
                    <Button onClick={() => setPubOpen(true)} variant="secondary">Agregar Publicación</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Formación académica</h4>
                      {qualifications.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay registros aún.</p>
                      ) : (
                        <ul className="space-y-2">
                          {qualifications.map((q) => (
                            <li key={q.id} className="border rounded p-3">
                              <div className="font-semibold">{q.level} — {q.program || q.institution}</div>
                              <div className="text-sm text-muted-foreground">{q.campus || ''} {q.start_year ? `· ${q.start_year}` : ''} {q.end_year ? `- ${q.end_year}` : ''}</div>
                              {q.notes && <div className="text-sm mt-1">{q.notes}</div>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Publicaciones</h4>
                      {publications.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay publicaciones registradas.</p>
                      ) : (
                        <ul className="space-y-2">
                          {publications.map((p) => (
                            <li key={p.id} className="border rounded p-3">
                              <div className="font-semibold">{p.title} {p.year ? `(${p.year})` : ''}</div>
                              <div className="text-sm text-muted-foreground">{p.type} {p.issn_isbn ? `· ${p.issn_isbn}` : ''}</div>
                              {p.link && <div className="text-sm mt-1"><a href={p.link} target="_blank" rel="noreferrer" className="text-blue-600 underline">Enlace</a></div>}
                              {p.keywords && p.keywords.length > 0 && <div className="text-xs text-muted-foreground mt-2">Palabras clave: {p.keywords.join(', ')}</div>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <QualificationModal open={qualOpen} onOpenChange={setQualOpen} profileId={profile?.id || null} onSaved={() => profile && fetchQualifications(profile.id)} />
      <PublicationsModal open={pubOpen} onOpenChange={setPubOpen} profileId={profile?.id || null} onSaved={() => profile && fetchPublications(profile.id)} />
    </div>
  );
}
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
        // load researcher data
        fetchQualifications(prof.id);
        fetchPublications(prof.id);
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
        // fetch empty lists for new profile
        fetchQualifications(created.id);
        fetchPublications(created.id);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo cargar tu perfil", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
    const fetchQualifications = async (profileId: string) => {
      try {
        const { data, error } = await supabase.from('academic_qualifications').select('*').eq('profile_id', profileId).order('created_at', { ascending: false });
        if (error) throw error;
        setQualifications(data || []);
      } catch (err) {
        console.warn('Could not fetch qualifications', err);
      }
    };

    const fetchPublications = async (profileId: string) => {
      try {
        const { data, error } = await supabase.from('publications').select('*').eq('profile_id', profileId).order('created_at', { ascending: false });
        if (error) throw error;
        setPublications(data || []);
      } catch (err) {
        console.warn('Could not fetch publications', err);
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

      // Also save avatar_url in profiles table so public views can read it
      try {
        const { error: profileError } = await supabase.from('profiles').update(({ avatar_url: avatarUrl } as any)).eq('id', userId);
        if (profileError) console.warn('Could not update profiles.avatar_url', profileError);
      } catch (err) {
        console.warn('profiles update failed', err);
      }

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

      // Also save avatar_url in profiles table so public views can read it
      try {
        const { error: profileError } = await supabase.from('profiles').update(({ avatar_url: publicUrl } as any)).eq('id', userId);
        if (profileError) console.warn('Could not update profiles.avatar_url', profileError);
      } catch (err) {
        console.warn('profiles update failed', err);
      }

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
        {/* Perfil de investigador - solo para profesores/admin */}
        {(role === 'professor' || role === 'admin') && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Perfil de investigador</CardTitle>
                <CardDescription>Agrega tu formación y publicaciones para enriquecer tu perfil público</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button onClick={() => setQualOpen(true)}>Agregar Formación</Button>
                  <Button onClick={() => setPubOpen(true)} variant="secondary">Agregar Publicación</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Formación académica</h4>
                    {qualifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay registros aún.</p>
                    ) : (
                      <ul className="space-y-2">
                        {qualifications.map((q) => (
                          <li key={q.id} className="border rounded p-3">
                            <div className="font-semibold">{q.level} — {q.program || q.institution}</div>
                            <div className="text-sm text-muted-foreground">{q.campus || ''} {q.start_year ? `· ${q.start_year}` : ''} {q.end_year ? `- ${q.end_year}` : ''}</div>
                            {q.notes && <div className="text-sm mt-1">{q.notes}</div>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Publicaciones</h4>
                    {publications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay publicaciones registradas.</p>
                    ) : (
                      <ul className="space-y-2">
                        {publications.map((p) => (
                          <li key={p.id} className="border rounded p-3">
                            <div className="font-semibold">{p.title} {p.year ? `(${p.year})` : ''}</div>
                            <div className="text-sm text-muted-foreground">{p.type} {p.issn_isbn ? `· ${p.issn_isbn}` : ''}</div>
                            {p.link && <div className="text-sm mt-1"><a href={p.link} target="_blank" rel="noreferrer" className="text-blue-600 underline">Enlace</a></div>}
                            {p.keywords && p.keywords.length > 0 && <div className="text-xs text-muted-foreground mt-2">Palabras clave: {p.keywords.join(', ')}</div>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <QualificationModal open={qualOpen} onOpenChange={setQualOpen} profileId={profile?.id || null} onSaved={() => profile && fetchQualifications(profile.id)} />
        <PublicationsModal open={pubOpen} onOpenChange={setPubOpen} profileId={profile?.id || null} onSaved={() => profile && fetchPublications(profile.id)} />
      </div>
    </div>
  );
}
