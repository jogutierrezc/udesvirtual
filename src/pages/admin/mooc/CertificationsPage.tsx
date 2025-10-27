import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Award,
  Download,
  Eye,
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  Loader2
} from "lucide-react";

type Certificate = {
  id: string;
  user_id: string;
  certificate_url: string;
  issued_at: string;
  course_title: string;
  user_name: string;
  user_email: string;
  course_id: string;
  signature_code?: string | null;
  signature_filename?: string | null;
  signature_applied?: boolean;
  signature_profile_id?: string | null;
};

export const CertificationsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [courses, setCourses] = useState<{id: string, title: string}[]>([]);
  const [certSettings, setCertSettings] = useState<any | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [signatureProfiles, setSignatureProfiles] = useState<any[]>([]);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [newSignatureName, setNewSignatureName] = useState('');
  // secrets and RPCs removed: we no longer generate or display secrets for signature profiles
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showApplySignatureModal, setShowApplySignatureModal] = useState(false);
  const [selectedCertForSigning, setSelectedCertForSigning] = useState<Certificate | null>(null);
  const [selectedProfileForSigning, setSelectedProfileForSigning] = useState<string | null>(null);
  const [applyingSignature, setApplyingSignature] = useState(false);

  useEffect(() => {
    loadCertificates();
    loadCourses();
    loadCertSettings();
    loadSignatureProfiles();
    // If opened with ?open=settings, show the settings modal automatically
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('open') === 'settings') setShowSettingsModal(true);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    filterCertificates();
  }, [certificates, searchTerm, courseFilter]);

  const loadCertificates = async () => {
    try {
      setLoading(true);

      // First try: attempt to use relationship selects (works if FK relationships exist)
      const { data, error } = await supabase
        .from("mooc_certificates")
        .select(`
          id,
          user_id,
          certificate_url,
          issued_at,
          signature_code,
          signature_filename,
          signature_applied,
          signature_profile_id,
          mooc_course:course_id (
            title
          ),
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order("issued_at", { ascending: false });

      if (!error) {
        const formattedCertificates: Certificate[] = (data || []).map((cert: any) => ({
          id: cert.id,
          user_id: cert.user_id,
          certificate_url: cert.certificate_url,
          issued_at: cert.issued_at,
          course_title: cert.mooc_course?.title || "Curso desconocido",
          user_name: cert.profiles?.full_name || "Usuario desconocido",
          user_email: cert.profiles?.email || "",
          course_id: cert.course_id,
          signature_code: cert.signature_code,
          signature_filename: cert.signature_filename,
          signature_applied: cert.signature_applied,
          signature_profile_id: cert.signature_profile_id
        }));

        setCertificates(formattedCertificates);
        return;
      }

      // If we reach here, the relationship query failed (e.g., PGRST200). Fall back to simpler query and manual joins.
      console.warn('Relationship select failed, falling back to manual joins', error);

      const { data: basicData, error: basicErr } = await supabase.from('mooc_certificates')
        .select('id,user_id,certificate_url,issued_at,signature_code,signature_filename,signature_applied,signature_profile_id,course_id')
        .order('issued_at', { ascending: false });

      if (basicErr) throw basicErr;

      const certs = basicData || [];
      const userIds = Array.from(new Set(certs.map((c: any) => c.user_id).filter(Boolean)));
      const courseIds = Array.from(new Set(certs.map((c: any) => c.course_id).filter(Boolean)));

      // Fetch profiles and courses in batch
      const [{ data: profiles }, { data: coursesData }] = await Promise.all([
        userIds.length > 0 ? supabase.from('profiles').select('id,full_name,email').in('id', userIds) : Promise.resolve({ data: [] }),
        courseIds.length > 0 ? supabase.from('mooc_courses').select('id,title').in('id', courseIds) : Promise.resolve({ data: [] })
      ] as any);

      const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));
      const courseMap = new Map<string, any>((coursesData || []).map((c: any) => [c.id, c]));

      const formattedCertificates: Certificate[] = (certs || []).map((cert: any) => ({
        id: cert.id,
        user_id: cert.user_id,
        certificate_url: cert.certificate_url,
        issued_at: cert.issued_at,
        course_title: courseMap.get(cert.course_id)?.title || 'Curso desconocido',
        user_name: profileMap.get(cert.user_id)?.full_name || 'Usuario desconocido',
        user_email: profileMap.get(cert.user_id)?.email || '',
        course_id: cert.course_id,
        signature_code: cert.signature_code,
        signature_filename: cert.signature_filename,
        signature_applied: cert.signature_applied,
        signature_profile_id: cert.signature_profile_id
      }));

      setCertificates(formattedCertificates);
    } catch (error: any) {
      console.error("Error loading certificates:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las certificaciones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSignatureProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('signature_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSignatureProfiles(data || []);
    } catch (e) {
      console.error('Error loading signature profiles', e);
    }
  };

  const handleSignatureFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!newSignatureName) {
      toast({ title: 'Nombre requerido', description: 'Ingresa un nombre para la firma antes de subir', variant: 'destructive' });
      return;
    }

    // ensure user is authenticated (uploads require an authenticated user unless you open policies)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      toast({ title: 'No autenticado', description: 'Debes iniciar sesión para subir una firma', variant: 'destructive' });
      return;
    }

    // Simpler client-side upload directly to Supabase Storage and create profile row.
    setUploadingSignature(true);
    try {
      const bucket = certSettings?.signature_bucket || 'certificate-signatures';
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name.replace(/\s+/g, '_')}`;

      // Upload file (uses current user's credentials). Bucket must allow uploads from authenticated users.
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filename, file, { cacheControl: '3600', upsert: false });
      if (uploadError) {
        console.error('Storage upload error', uploadError);
        throw uploadError;
      }

      // Insert signature profile row (simple, no secret generation)
      const { data: profileData, error: insertErr } = await supabase.from('signature_profiles').insert({ name: newSignatureName, filename, created_by: session.user.id }).select().limit(1).maybeSingle();
      if (insertErr) {
        console.error('Error inserting signature profile', insertErr);
        // attempt to cleanup uploaded file
        try { await supabase.storage.from(bucket).remove([filename]); } catch(_){}
        throw insertErr;
      }

      setNewSignatureName('');
      loadSignatureProfiles();
      toast({ title: 'Firma subida', description: 'La firma se subió correctamente.' });
    } catch (e: any) {
      console.error('Error uploading signature', e);
      toast({ title: 'Error', description: e?.message || 'No se pudo subir la firma', variant: 'destructive' });
    } finally {
      setUploadingSignature(false);
      // clear input value
      const sigInput = document.getElementById('signature-file') as HTMLInputElement | null;
      if (sigInput) sigInput.value = '';
    }
  };

  // Helper to build a preview URL for a stored signature image.
  // Uses a signed URL first (works for private buckets), falls back to public URL.
  const getSignaturePreviewUrl = async (filename: string) => {
    try {
      const bucket = certSettings?.signature_bucket || 'certificate-signatures';
      // Try signed URL (valid short time)
      const { data: signed, error: signedErr } = await supabase.storage.from(bucket).createSignedUrl(filename, 120);
      if (!signedErr && signed?.signedUrl) return signed.signedUrl;

      // Fallback to public url
      const publicRes = supabase.storage.from(bucket).getPublicUrl(filename);
      const publicUrl = publicRes?.data?.publicUrl;
      return publicUrl;
    } catch (e) {
      console.error('Error creating preview url', e);
      return null;
    }
  };

  // rotate secret RPC removed — no-op; secret handling was intentionally removed

  const handleDeleteProfile = async (profile: any) => {
    try {
      const { error } = await supabase.from('signature_profiles').delete().eq('id', profile.id);
      if (error) throw error;
      // remove storage file
      try { await supabase.storage.from('certificate-signatures').remove([profile.filename]); } catch(_){}
      toast({ title: 'Perfil eliminado' });
      loadSignatureProfiles();
    } catch (e) {
      console.error('Error deleting profile', e);
      toast({ title: 'Error', description: 'No se pudo eliminar el perfil', variant: 'destructive' });
    }
  };

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("mooc_courses")
        .select("id, title")
        .eq("status", "approved")
        .order("title");

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      console.error("Error loading courses:", error);
    }
  };

  const loadCertSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("certificate_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      setCertSettings(data || null);
    } catch (e) {
      console.error("Error loading certificate settings:", e);
    }
  };

  const saveCertSettings = async (payload: any) => {
    try {
      setSavingSettings(true);
      const up = { id: 1, ...payload };
      const { error } = await supabase.from('certificate_settings').upsert(up, { onConflict: 'id' });
      if (error) throw error;
      toast({ title: 'Configuración guardada' });
      loadCertSettings();
    } catch (e: any) {
      console.error('Error saving cert settings', e);
      toast({ title: 'No se pudo guardar configuración', variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleGenerateSignature = async (certId: string) => {
    try {
      const { data, error } = await supabase.rpc('generate_cert_signature', { cert_uuid: certId });
      if (error) throw error;
      const code = data as string;
      // Build QR link using settings
      const base = certSettings?.qr_base_url || window.location.origin + '/verify-cert';
      const qr = `${base}?id=${certId}&code=${code}`;
      // Update the certificate row with qr_link
      const { error: upErr } = await supabase.from('mooc_certificates').update({ qr_link: qr }).eq('id', certId);
      if (upErr) throw upErr;
      toast({ title: 'Firma generada y QR creado' });
      loadCertificates();
    } catch (e: any) {
      console.error('Error generating signature:', e);
      toast({ title: 'No se pudo generar la firma', variant: 'destructive' });
    }
  };

  const filterCertificates = () => {
    let filtered = certificates;

    if (searchTerm) {
      filtered = filtered.filter(cert =>
        cert.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.course_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (courseFilter !== "all") {
      filtered = filtered.filter(cert => cert.course_id === courseFilter);
    }

    setFilteredCertificates(filtered);
  };

  const handleViewCertificate = (certificateUrl: string) => {
    window.open(certificateUrl, '_blank');
  };

  const handleDownloadCertificate = (certificateUrl: string, userName: string, courseTitle: string) => {
    // Crear un enlace temporal para descargar
    const link = document.createElement('a');
    link.href = certificateUrl;
    link.download = `Certificado_${userName}_${courseTitle}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Gestión de Certificaciones</h1>
            <p className="text-sm text-muted-foreground">
              Administra las certificaciones emitidas por los cursos MOOC
            </p>
          </div>
        </div>

        {/* Settings moved to modal; stats cards removed for simplified admin view */}
        <div className="flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowSettingsModal(true)}>Configuración de Firma & QR</Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por estudiante, email o curso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Filtrar por curso</Label>
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los cursos</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de firmas autorizadas - list view with actions */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Firmas autorizadas</h3>
                <p className="text-sm text-muted-foreground">Carga imágenes de firma que podrán usarse en certificados.</p>
              </div>
              <div className="flex items-center gap-2">
                <Input placeholder="Nombre de la firma" value={newSignatureName} onChange={(e) => setNewSignatureName(e.target.value)} />
                <input id="signature-file" type="file" accept="image/*" onChange={handleSignatureFileChange} style={{ display: 'none' }} />
                <Button onClick={() => document.getElementById('signature-file')?.click()} disabled={uploadingSignature || !newSignatureName}>
                  {uploadingSignature ? 'Subiendo...' : 'Subir firma'}
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {signatureProfiles.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aún no hay firmas autorizadas.</div>
              ) : (
                <div className="divide-y">
                  {signatureProfiles.map((p) => {
                    const publicUrl = supabase.storage.from('certificate-signatures').getPublicUrl(p.filename).data.publicUrl;
                    return (
                      <div key={p.id} className="py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img src={publicUrl} alt={p.name} className="h-12 w-40 object-contain border cursor-pointer" onClick={async () => {
                            const url = await getSignaturePreviewUrl(p.filename);
                            if (!url) { toast({ title: 'Error', description: 'No se pudo obtener la vista previa', variant: 'destructive' }); return; }
                            setPreviewImageUrl(url);
                            setShowPreviewModal(true);
                          }} />
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground">Subido: {new Date(p.created_at).toLocaleString()}</div>
                            {certSettings?.default_signature_profile_id === p.id && (
                              <div className="text-xs text-green-600">Perfil por defecto</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => { const newName = window.prompt('Nuevo nombre de la firma', p.name); if (newName && newName.trim() !== '' ) { supabase.from('signature_profiles').update({ name: newName.trim() }).eq('id', p.id).then(res => { if (res.error) { toast({ title: 'Error', description: 'No se pudo renombrar', variant: 'destructive' }); } else { toast({ title: 'Renombrado' }); loadSignatureProfiles(); } }); } }}>Editar</Button>
                          {/* secret rotation removed */}
                          <Button size="sm" variant="secondary" onClick={async () => {
                            // set as default
                            await saveCertSettings({ ...(certSettings || {}), default_signature_profile_id: p.id });
                            loadCertSettings();
                            toast({ title: 'Definido como perfil por defecto' });
                          }}>Definir por defecto</Button>
                          <Button size="sm" variant="ghost" onClick={() => { if (confirm('Eliminar perfil de firma? Esta acción eliminará la imagen también.')) handleDeleteProfile(p); }} className="text-red-600">Eliminar</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Secret modal removed: secrets are no longer generated or shown */}

        {/* Modal: Settings */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white p-6 rounded shadow max-w-lg w-full">
              <h3 className="text-lg font-semibold">Configuración de Firma & QR</h3>
              <p className="text-sm text-muted-foreground mt-2">Configura bucket, URL de verificación y clave secreta.</p>
              <div className="mt-4 space-y-3">
                <div>
                  <Label>Bucket de firmas</Label>
                  <Input value={certSettings?.signature_bucket || 'certificate-signatures'} onChange={(e) => setCertSettings(s => ({...(s||{}), signature_bucket: e.target.value}))} />
                </div>
                <div>
                  <Label>URL base de verificación (QR)</Label>
                  <Input value={certSettings?.qr_base_url || ''} onChange={(e) => setCertSettings(s => ({...(s||{}), qr_base_url: e.target.value}))} />
                </div>
                <div>
                  <Label>Clave secreta (HMAC)</Label>
                  <Input type="password" value={certSettings?.secret || ''} onChange={(e) => setCertSettings(s => ({...(s||{}), secret: e.target.value}))} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={async () => { await saveCertSettings(certSettings); setShowSettingsModal(false); }} disabled={savingSettings}>{savingSettings ? 'Guardando...' : 'Guardar configuración'}</Button>
                  <Button variant="outline" onClick={() => setShowSettingsModal(false)}>Cerrar</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Preview image */}
        {showPreviewModal && previewImageUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white p-4 rounded shadow max-w-3xl w-full">
              <div className="flex justify-end">
                <Button variant="ghost" onClick={() => { setShowPreviewModal(false); setPreviewImageUrl(null); }}>Cerrar</Button>
              </div>
              <div className="mt-2">
                <img src={previewImageUrl} alt="preview" className="w-full h-auto object-contain" />
              </div>
            </div>
          </div>
        )}

        {/* Modal: Apply signature to certificate */}
        {showApplySignatureModal && selectedCertForSigning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white p-6 rounded shadow max-w-lg w-full">
              <h3 className="text-lg font-semibold">Aplicar firma a certificado</h3>
              <p className="text-sm text-muted-foreground mt-2">Selecciona la firma autorizada que deseas aplicar a este certificado.</p>
              <div className="mt-4">
                <Label>Firma autorizada</Label>
                <select value={selectedProfileForSigning || ''} onChange={(e) => setSelectedProfileForSigning(e.target.value)} className="w-full mt-2 p-2 border rounded">
                  <option value="">-- Selecciona una firma --</option>
                  {signatureProfiles.map(sp => (
                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                  ))}
                </select>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowApplySignatureModal(false); setSelectedCertForSigning(null); setSelectedProfileForSigning(null); }}>Cancelar</Button>
                <Button disabled={!selectedProfileForSigning || applyingSignature} onClick={async () => {
                  if (!selectedProfileForSigning || !selectedCertForSigning) return;
                  setApplyingSignature(true);
                  try {
                    // Generate signature code
                    const { data: codeData, error: rpcErr } = await supabase.rpc('generate_cert_signature', { cert_uuid: selectedCertForSigning.id });
                    if (rpcErr) throw rpcErr;
                    const code = Array.isArray(codeData) ? codeData[0] : codeData;

                    // get profile filename
                    const profile = signatureProfiles.find(p => p.id === selectedProfileForSigning);
                    const filename = profile?.filename || null;

                    // update certificate row
                    const { error: upErr } = await supabase.from('mooc_certificates').update({ signature_code: code, signature_filename: filename, signature_applied: true, signature_profile_id: selectedProfileForSigning }).eq('id', selectedCertForSigning.id);
                    if (upErr) throw upErr;

                    toast({ title: 'Firma aplicada' });
                    loadCertificates();
                  } catch (e) {
                    console.error('Error applying signature', e);
                    toast({ title: 'Error', description: 'No se pudo aplicar la firma', variant: 'destructive' });
                  } finally {
                    setApplyingSignature(false);
                    setShowApplySignatureModal(false);
                    setSelectedCertForSigning(null);
                    setSelectedProfileForSigning(null);
                  }
                }}>{applyingSignature ? 'Aplicando...' : 'Aplicar firma'}</Button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de certificaciones */}
        <div className="grid grid-cols-1 gap-4">
          {filteredCertificates.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron certificaciones</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredCertificates.map((certificate) => (
              <Card key={certificate.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-4">
                        <Award className="h-8 w-8 text-primary mt-1" />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{certificate.course_title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Certificado emitido a <span className="font-medium">{certificate.user_name}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{certificate.user_email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Emitido: {new Date(certificate.issued_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewCertificate(certificate.certificate_url)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadCertificate(
                          certificate.certificate_url,
                          certificate.user_name,
                          certificate.course_title
                        )}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => { setSelectedCertForSigning(certificate); setShowApplySignatureModal(true); }}>
                        Aplicar firma
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Additional state hooks for signature application