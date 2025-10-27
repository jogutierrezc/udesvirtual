import { useState, useEffect } from "react";
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
};

export const CertificationsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [courses, setCourses] = useState<{id: string, title: string}[]>([]);

  useEffect(() => {
    loadCertificates();
    loadCourses();
  }, []);

  useEffect(() => {
    filterCertificates();
  }, [certificates, searchTerm, courseFilter]);

  const loadCertificates = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("mooc_certificates")
        .select(`
          id,
          user_id,
          certificate_url,
          issued_at,
          mooc_course:course_id (
            title
          ),
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order("issued_at", { ascending: false });

      if (error) throw error;

      const formattedCertificates: Certificate[] = (data || []).map((cert: any) => ({
        id: cert.id,
        user_id: cert.user_id,
        certificate_url: cert.certificate_url,
        issued_at: cert.issued_at,
        course_title: cert.mooc_course?.title || "Curso desconocido",
        user_name: cert.profiles?.full_name || "Usuario desconocido",
        user_email: cert.profiles?.email || "",
        course_id: cert.course_id
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

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Award className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{certificates.length}</p>
                  <p className="text-sm text-muted-foreground">Total de certificaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{courses.length}</p>
                  <p className="text-sm text-muted-foreground">Cursos con certificaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <User className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{new Set(certificates.map(c => c.user_id)).size}</p>
                  <p className="text-sm text-muted-foreground">Estudiantes certificados</p>
                </div>
              </div>
            </CardContent>
          </Card>
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