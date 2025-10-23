import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CertificateItem {
  id: string;
  course_id: string;
  hours: number;
  verification_code: string;
  issued_at: string;
  course?: {
    title: string;
  };
}

export default function Certificates() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CertificateItem[]>([]);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("mooc_certificates" as any)
        .select("id, course_id, hours, verification_code, issued_at, course:mooc_courses(title)")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false });

      if (error) throw error;
      setItems(data as any || []);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "No se pudieron cargar los certificados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mis Certificaciones</h2>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aún no tienes certificados emitidos.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((cert) => (
            <Card key={cert.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="line-clamp-2 text-base">{cert.course?.title || "Curso"}</span>
                  <Award className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">Horas certificadas: <span className="font-medium text-foreground">{cert.hours}</span></div>
                <div className="text-xs text-muted-foreground">Emitido: {new Date(cert.issued_at).toLocaleDateString()}</div>
                <Button onClick={() => navigate(`/certificado/${cert.id}`)} className="w-full">Generar certificado</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
