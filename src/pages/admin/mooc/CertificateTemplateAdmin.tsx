import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";

export default function CertificateTemplateAdmin() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({
    is_global: false,
    course_id: null,
    template_html: '',
    signature_profile_id: null,
    signer_name: '',
    signer_title: '',
    active: true
  });
  const [signatureProfiles, setSignatureProfiles] = useState<any[]>([]);
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [zoom, setZoom] = useState<number>(0.9);

  useEffect(() => {
    loadCourses();
    loadTemplates();
    loadSignatureProfiles();
  }, []);

  async function loadCourses() {
    const { data } = await supabase.from('mooc_courses').select('id, title').order('title');
    setCourses(data || []);
  }
  async function loadTemplates() {
    setLoading(true);
  const { data } = await supabase.from('certificate_templates' as any).select('*').order('created_at', { ascending: false });
    setTemplates(data || []);
    setLoading(false);
  }
  async function loadSignatureProfiles() {
    const { data } = await supabase.from('signature_profiles').select('id, name, filename');
    setSignatureProfiles(data || []);
  }

  useEffect(() => {
    const profile = signatureProfiles.find(p => p.id === form.signature_profile_id);
    if (profile?.filename) {
      const pub = supabase.storage.from('certificate-signatures').getPublicUrl(profile.filename).data.publicUrl;
      setSignatureUrl(pub || '');
    } else {
      setSignatureUrl('');
    }
  }, [form.signature_profile_id, signatureProfiles]);

  function handleEdit(template: any) {
    setEditing(template.id);
    setForm({ ...template });
  }
  function handleNew() {
    setEditing('new');
    setForm({
      is_global: false,
      course_id: null,
      template_html: '',
      signature_profile_id: null,
      signer_name: '',
      signer_title: '',
      active: true
    });
  }
  async function handleSave() {
    setLoading(true);
    try {
      if (editing === 'new') {
        await supabase.from('certificate_templates' as any).insert([{ ...form }]);
      } else {
        await supabase.from('certificate_templates' as any).update({ ...form }).eq('id', editing);
      }
      toast({ title: 'Plantilla guardada' });
      setEditing(null);
      loadTemplates();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  // Campos disponibles y helper de inserción
  const availableFields = [
    { key: 'student_name', label: 'Nombre del estudiante' },
    { key: 'student_email', label: 'Email del estudiante' },
    { key: 'student_city', label: 'Ciudad' },
    { key: 'course_title', label: 'Título del curso' },
    { key: 'hours', label: 'Horas' },
    { key: 'issued_date', label: 'Fecha emisión' },
    { key: 'verification_code', label: 'Código verificación' },
    { key: 'signer_name', label: 'Nombre firmante' },
    { key: 'signer_title', label: 'Cargo firmante' },
  ];

  const insertPlaceholder = (field: string) => {
    const token = `{{${field}}}`;
    const ta = editorRef.current;
    if (!ta) {
      setForm((f: any) => ({ ...f, template_html: (f.template_html || '') + token }));
      return;
    }
    const start = ta.selectionStart || 0;
    const end = ta.selectionEnd || 0;
    const val = form.template_html || '';
    const next = val.slice(0, start) + token + val.slice(end);
    setForm((f: any) => ({ ...f, template_html: next }));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + token.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  // Datos de vista previa
  const previewData = useMemo(() => {
    const selectedCourse = courses.find(c => c.id === form.course_id);
    return {
      student_name: 'Juan Manuel Garcia',
      student_email: 'estudiante@mail.udes.edu.co',
      student_city: 'Cúcuta',
      course_title: selectedCourse?.title || 'Curso MOOC',
      hours: 40,
      issued_date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
      verification_code: 'CERT-XXXX-YYYY',
      signer_name: form.signer_name || 'Nombre Firmante',
      signer_title: form.signer_title || 'Cargo Firmante',
    } as Record<string, string | number>;
  }, [courses, form.course_id, form.signer_name, form.signer_title]);

  const renderTemplate = (tpl: string) => {
    let out = tpl || '';
    Object.entries(previewData).forEach(([k, v]) => {
      const re = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
      out = out.replace(re, String(v));
    });
    return out;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Plantillas de Certificado</h2>
        <Button onClick={handleNew}>Nueva Plantilla</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((tpl: any) => (
          <Card key={tpl.id}>
            <CardHeader>
              <CardTitle>{tpl.is_global ? 'General' : (courses.find(c => c.id === tpl.course_id)?.title || 'Curso')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-2">{tpl.active ? 'Activa' : 'Inactiva'}</div>
              <div className="mb-2 line-clamp-3 text-sm">{tpl.template_html}</div>
              <Button size="sm" onClick={() => handleEdit(tpl)}>Editar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded shadow-lg w-[95vw] max-w-[1200px] h-[90vh] overflow-y-auto relative">
            <button className="absolute top-2 right-2" onClick={() => setEditing(null)}>✕</button>
            <h3 className="text-xl font-bold mb-4">{editing === 'new' ? 'Nueva Plantilla' : 'Editar Plantilla'}</h3>
            {/* Toolbar superior fija */}
            <div className="sticky top-0 z-10 bg-white pb-3 mb-3 border-b">
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                <div className="text-xs text-muted-foreground">
                  Usa los campos disponibles para personalizar el certificado. A la derecha verás una vista previa.
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Zoom</span>
                  <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.5, +(z - 0.1).toFixed(2)))}>-</Button>
                  <div className="w-14 text-center text-sm font-medium">{Math.round(zoom * 100)}%</div>
                  <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(1.5, +(z + 0.1).toFixed(2)))}>+</Button>
                  <Button variant="ghost" size="sm" onClick={() => setZoom(1)}>Restablecer</Button>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <Select value={form.is_global ? 'global' : (form.course_id ?? undefined)} onValueChange={val => {
                  if (val === 'global') setForm(f => ({ ...f, is_global: true, course_id: null }));
                  else setForm(f => ({ ...f, is_global: false, course_id: val }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona curso o global" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">General (todos los cursos)</SelectItem>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
                <div className="flex flex-col min-h-0 h-full">
                  <Label className="mb-1 block">Texto/HTML de la certificación</Label>
                  <Textarea ref={editorRef} className="flex-1 resize-none h-full min-h-[300px] font-mono text-sm" rows={12} value={form.template_html} onChange={e => setForm(f => ({ ...f, template_html: e.target.value }))} placeholder="Ej: Certificamos que {{student_name}} completó el curso {{course_title}} el {{issued_date}}..." />
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground mb-1">Insertar campos</div>
                    <div className="flex flex-wrap gap-2">
                      {availableFields.map(f => (
                        <Button key={f.key} size="sm" variant="outline" onClick={() => insertPlaceholder(f.key)}>{`{{${f.key}}}`}</Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="min-h-0 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground"><Eye className="h-4 w-4"/> Vista previa</div>
                  <Card>
                    <CardContent className="p-0 h-full">
                      <div className="border rounded bg-neutral-50 h-full min-h-[300px] overflow-auto">
                        {/* Lienzo centrado con escala */}
                        <div className="mx-auto my-6" style={{ width: 1100 }}>
                          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }} className="bg-white shadow-sm rounded border p-6">
                            <style>{`.cert-preview .sign { text-align:center; margin-top:16px } .sign img{ height:60px; object-fit:contain } .title { font-weight:700; font-size:20px; margin-bottom:8px } .muted{color:#6b7280}`}</style>
                            <div className="cert-preview">
                              {/* Título de referencia (no se exporta, solo guía) */}
                              <div className="title mb-4">Certificado (vista previa)</div>
                              <div dangerouslySetInnerHTML={{ __html: renderTemplate(form.template_html || '') }} />
                              {(signatureUrl || form.signer_name) && (
                                <div className="sign">
                                  {signatureUrl && <img src={signatureUrl} alt="Firma" />}
                                  <div className="font-semibold">{form.signer_name || previewData.signer_name}</div>
                                  <div className="text-sm muted">{form.signer_title || previewData.signer_title}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre firmante</label>
                  <Input value={form.signer_name} onChange={e => setForm(f => ({ ...f, signer_name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cargo firmante</label>
                  <Input value={form.signer_title} onChange={e => setForm(f => ({ ...f, signer_title: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">Perfil de firma</label>
                  <Select value={form.signature_profile_id || 'none'} onValueChange={(v) => setForm(f => ({ ...f, signature_profile_id: v === 'none' ? null : v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona firma (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin firma</SelectItem>
                      {signatureProfiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {signatureUrl && (
                  <div>
                    <Label className="block text-sm font-medium mb-1">Vista firma</Label>
                    <img src={signatureUrl} alt="Firma" className="h-12 object-contain" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <Button onClick={handleSave} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
