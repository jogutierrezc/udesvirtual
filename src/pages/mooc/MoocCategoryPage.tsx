import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopNavigationBar from "@/components/TopNavigationBar";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, PlayCircle, Clock, Users } from "lucide-react";

export default function MoocCategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [categoryRow, setCategoryRow] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (category) loadCategoryCourses(decodeURIComponent(category));
  }, [category]);

  const loadCategoryCourses = async (cat: string) => {
    try {
      setLoading(true);
      // First try to resolve the param to a category (by slug, id or title)
      let categoryRow: any = null;
      try {
        // Try by slug exact match
        const { data: bySlug } = await supabase.from('mooc_categories').select('id, title').eq('slug', cat).limit(1).maybeSingle();
        if (bySlug) categoryRow = bySlug;
      } catch (e) {
        // ignore
      }

      if (!categoryRow) {
        // Try by id (uuid)
        try {
          const { data: byId } = await supabase.from('mooc_categories').select('id, title').eq('id', cat).limit(1).maybeSingle();
          if (byId) categoryRow = byId;
        } catch (e) {}
      }

      if (!categoryRow) {
        // Try by title (case-insensitive)
        try {
          const { data: byTitle } = await supabase.from('mooc_categories').select('id, title').ilike('title', cat).limit(1).maybeSingle();
          if (byTitle) categoryRow = byTitle;
        } catch (e) {}
      }

      let coursesData: any = [];

      if (categoryRow) {
        // If we resolved a category, fetch courses by category_id
        const { data, error } = await supabase
          .from('mooc_courses')
          .select('*')
          .eq('status', 'approved')
          .eq('category_id', categoryRow.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        coursesData = data || [];
      } else {
        // Fallback: search by tags containing the param
        const { data, error } = await supabase
          .from('mooc_courses')
          .select('*')
          .eq('status', 'approved')
          .contains('tags', [cat])
          .order('created_at', { ascending: false });
        if (error) throw error;
        coursesData = data || [];
      }

      // Optionally load creators info (lightweight)
      const withCreators = await Promise.all(
        (coursesData || []).map(async (c: any) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', c.created_by)
            .single();
          return { ...c, creator: profileData ? { full_name: profileData.full_name } : undefined };
        })
      );

      setCourses(withCreators || []);
      setCategoryRow(categoryRow || null);
    } catch (err) {
      console.error("Error loading category courses:", err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const categoryRowTitle = categoryRow && categoryRow.title ? categoryRow.title : (category ? decodeURIComponent(category) : undefined);

  return (
    <div className="min-h-screen bg-white">
      <TopNavigationBar />
      <Navbar topOffset={40} />

      <div className="container mx-auto px-4 py-12">
        {/* HERO / HEADER */}
        <div className="mb-6">
          <div className="rounded-lg overflow-hidden bg-indigo-50 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-indigo-800 leading-tight">{category ? decodeURIComponent(category) : "Categoría"}</h1>
                <p className="text-indigo-700/80 mt-3 max-w-3xl">{categoryRowTitle || (category ? `Explora cursos y recursos en la categoría ${decodeURIComponent(category)}.` : 'Cursos relacionados')}</p>
                <div className="flex gap-3 mt-4 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1 bg-white/60 rounded text-sm font-medium text-indigo-700">{courses.length} cursos</span>
                  <span className="inline-flex items-center px-3 py-1 bg-white/60 rounded text-sm font-medium text-indigo-700">{new Set(courses.map(c=>c.created_by)).size} instructores</span>
                </div>
              </div>

              {/* Right-side stats removed per request: only left summary remains */}
            </div>
          </div>
          {/* Roles section removed */}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No hay cursos en esta categoría aún.</p>
            <div className="mt-4">
              <Button onClick={() => navigate('/mooc')}>Volver a todos los cursos</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
                  {course.course_image_url ? (
                    <img src={course.course_image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-indigo-300" />
                    </div>
                  )}
                  {course.tags && course.tags.length > 0 && (
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="secondary">{course.tags[0]}</Badge>
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2 group-hover:text-indigo-600 transition-colors">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.creator && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{course.creator.full_name}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <PlayCircle className="h-4 w-4 text-indigo-600" />
                      <span>{course.lesson_count || 0} lecciones</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-pink-600" />
                      <span>{course.total_duration || 0}h</span>
                    </div>
                  </div>

                  <Button className="w-full" variant="outline" onClick={() => navigate(`/mooc/${course.id}`)}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Ver Curso
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
