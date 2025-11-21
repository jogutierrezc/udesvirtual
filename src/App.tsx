import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AdminProvider } from "./contexts/AdminContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import Professor from "./pages/Professor";
import MisEstudiantes from "./pages/professor/MisEstudiantes";
import StudentDetail from "./pages/professor/StudentDetail";
import ProfessorInbox from "./pages/professor/Inbox";
import Lia from "./pages/Lia";
import Mooc from "./pages/Mooc";
import MoocDetail from "./pages/MoocDetail";
import MoocCategories from "./pages/mooc/MoocCategories";
import MoocCategoryPage from "./pages/mooc/MoocCategoryPage";
import CourseCommitmentPage from "./pages/mooc/CourseCommitmentPage";
import Profile from "./pages/ProfileNew";
import PublicProfile from "./pages/PublicProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProfileSetup from "./pages/ProfileSetup";
import Welcome from "./pages/Welcome";
import WelcomeProfesor from "./pages/WelcomeProfesor";
import ProfessorOfferings from "./pages/ProfessorOfferings";
import CoilOfferings from "./pages/CoilOfferings";
import Navbar from "./components/Navbar";
import Profesores from "./pages/Profesores";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentDashboard from "./pages/student/StudentDashboard";
import CourseLearning from "./pages/student/CourseLearning";
import ReadingView from "./pages/student/ReadingView";
import StudentExamPage from "./pages/student/StudentExamPage";
import { CatalogPage } from "./pages/admin/catalog/CatalogPage";
import { OfferingsPage } from "./pages/admin/offerings/OfferingsPage";
import { RegistrationsPage } from "./pages/admin/registrations/RegistrationsPage";
import { MoocPage } from "./pages/admin/mooc/MoocPage";
import CertificateTemplateAdmin from "./pages/admin/mooc/CertificateTemplateAdmin";
import AdminCourseEditorPage from "./pages/admin/mooc/CourseEditorPage";
import CourseEditorPage from "./pages/mooc/CourseEditorPage";
import LessonEditorPage from "./pages/admin/mooc/LessonEditorPage";
import { CarouselPage } from "./pages/admin/carousel/CarouselPage";
// Legacy combined PassportPage route removed; keep component for internal wrappers
import SettingsPage from "./pages/admin/passport/SettingsPage";
import PathwaysPage from "./pages/admin/passport/PathwaysPage";
import ActivitiesPage from "./pages/admin/passport/ActivitiesPage";
import BadgesPage from "./pages/admin/passport/BadgesPage";
import RequestsPage from "./pages/admin/passport/RequestsPage";
import ParticipantsPage from "./pages/admin/passport/ParticipantsPage";
import ReportsPage from "./pages/admin/passport/ReportsPage";
import { CertificationsPage } from "./pages/admin/mooc/CertificationsPage";
import { StudentsPage } from "./pages/admin/mooc/StudentsPage";
import MoocCategoriesAdmin from "./pages/admin/mooc/MoocCategoriesAdmin";
import { AdminLayout } from "./pages/admin/layout/AdminLayout";
import { CertificateSettings } from "./pages/admin/CertificateSettings";
import ProfessorsPage from "./pages/admin/professors/ProfessorsPage";
import BuzonPage from "./pages/admin/BuzonPage";
import Certificates from "./pages/Certificates";
import CertificateView from "./pages/CertificateView";
import Passport from "./pages/Passport";
import CelebrationTest from "./components/CelebrationTest";
import Faq from "./pages/Faq";
import FaqCategory from "./pages/FaqCategory";
import FaqDetail from "./pages/FaqDetail";
import ResendSettings from "./pages/admin/ResendSettings";
import { FaqAdminPage } from "./pages/admin/faq/FaqAdminPage";
import ForUdesProfessors from "./pages/landing/ForUdesProfessors";
import ForUdesStudents from "./pages/landing/ForUdesStudents";
import ForInternationalProfessors from "./pages/landing/ForInternationalProfessors";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  
  // Rutas donde se debe ocultar el Navbar
  const hideNavbarRoutes = ['/unauthorized', '/profile-setup', '/welcome', '/welcome-profesor'];
  
  // Verificar si es una ruta 404
  const is404 = !['/', '/auth', '/unauthorized', '/dashboard', '/catalog', '/professor-offerings', 
    '/coil-offerings', '/mooc', '/profile', '/profile-setup', '/welcome', '/welcome-profesor', '/profesores', '/professor/buzon', '/admin/catalog', '/admin/offerings', 
  '/admin/registrations', '/admin/mooc', '/admin/mooc/certifications', '/admin/mooc/students', '/admin/mooc/templates', '/admin/carousel', '/admin', '/professor', '/professor/mis-estudiantes', '/lia', '/passport', '/celebration-test'].includes(location.pathname) && 
    !location.pathname.startsWith('/admin/') &&
    !location.pathname.startsWith('/mooc/') &&
    !location.pathname.startsWith('/courses/') &&
    !location.pathname.startsWith('/certificado') &&
    !location.pathname.startsWith('/profile/');

  // Ocultar navbar en 404 o en rutas específicas
  // Para las rutas de administración usamos un navbar específico (AdminNavbar) dentro del layout,
  // por eso ocultamos el Navbar principal cuando la ruta comienza con /admin
  // Hide global Navbar on index as it has its own top bar
  const shouldHideNavbar = is404 || hideNavbarRoutes.includes(location.pathname) || location.pathname.startsWith('/admin') || location.pathname === '/';

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/welcome" element={<Welcome />} />
  <Route path="/welcome-profesor" element={<WelcomeProfesor />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/professor-offerings" element={<ProfessorOfferings />} />
        <Route path="/coil-offerings" element={<CoilOfferings />} />
        <Route path="/mooc" element={<Mooc />} />
        <Route path="/mooc/categories" element={<MoocCategories />} />
        <Route path="/mooc/category/:category" element={<MoocCategoryPage />} />
        <Route path="/mooc/:id" element={<MoocDetail />} />
        <Route 
          path="/mooc/courses/:courseId/edit" 
          element={
            <ProtectedRoute>
              <CourseEditorPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/mooc/commitment/:id" 
          element={
            <ProtectedRoute>
              <CourseCommitmentPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/professor/course/:courseId/student/:studentId" 
          element={
            <ProtectedRoute>
              <StudentDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/courses/:courseId/learn" 
          element={
            <ProtectedRoute>
              <CourseLearning />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/courses/:courseId/lessons/:lessonId/reading/:readingId"
          element={<ProtectedRoute><ReadingView /></ProtectedRoute>}
        />
        <Route 
          path="/mooc/:courseId/exam/:examId" 
          element={
            <ProtectedRoute>
              <StudentExamPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/passport" 
          element={
            <ProtectedRoute>
              <Passport />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/celebration-test" 
          element={
            <ProtectedRoute>
              <CelebrationTest />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/certificaciones" 
          element={
            <ProtectedRoute>
              <Certificates />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/certificado/:id" 
          element={
            <ProtectedRoute>
              <CertificateView />
            </ProtectedRoute>
          }
        />
            
            {/* Admin Routes - Protected */}
            <Route 
              path="/admin/catalog" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <CatalogPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/offerings" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <OfferingsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/buzon" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <BuzonPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/registrations" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <RegistrationsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/mooc" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <MoocPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/mooc/course/:courseId/edit"
              element={
                <ProtectedRoute requireAdminOrProfessor={true}>
                  <AdminLayout>
                    <AdminCourseEditorPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/mooc/course/:courseId/lesson/:lessonId/edit"
              element={
                <ProtectedRoute requireAdminOrProfessor={true}>
                  <AdminLayout>
                    <LessonEditorPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/mooc/certifications" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <CertificationsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/mooc/templates" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <CertificateTemplateAdmin />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/mooc/students" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <StudentsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/mooc/categories" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <MoocCategoriesAdmin />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/carousel" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <CarouselPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/faq" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <FaqAdminPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/passport/config" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <SettingsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/passport/senderos" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <PathwaysPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/passport/catalogo" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <ActivitiesPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/passport/insignias" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <BadgesPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/passport/solicitudes" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <RequestsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/passport/participantes" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <ParticipantsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/passport/reportes" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <ReportsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/professors" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <ProfessorsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/certificates" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <CertificateSettings />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/resend-settings" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <ResendSettings />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <CatalogPage />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route path="/professor" element={<Professor />} />
              <Route path="/professor/buzon" element={<ProtectedRoute><ProfessorInbox /></ProtectedRoute>} />
          <Route path="/professor/mis-estudiantes" element={<ProtectedRoute><MisEstudiantes /></ProtectedRoute>} />
          {/* Public profile view by id (public) */}
          <Route path="/profile/:id" element={<PublicProfile />} />
        <Route path="/profesores" element={<Profesores />} />
            <Route path="/profesores-udes" element={<ForUdesProfessors />} />
            <Route path="/estudiantes-udes" element={<ForUdesStudents />} />
            <Route path="/profesores-internacionales" element={<ForInternationalProfessors />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/lia" element={<Lia />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/faq/category/:category" element={<FaqCategory />} />
            <Route path="/faq/:category/:id" element={<FaqDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AdminProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AdminProvider>
  </QueryClientProvider>
);

export default App;
