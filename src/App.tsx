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
import Lia from "./pages/Lia";
import Mooc from "./pages/Mooc";
import MoocDetail from "./pages/MoocDetail";
import Profile from "./pages/Profile";
import ProfileSetup from "./pages/ProfileSetup";
import Welcome from "./pages/Welcome";
import ProfessorOfferings from "./pages/ProfessorOfferings";
import CoilOfferings from "./pages/CoilOfferings";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentDashboard from "./pages/student/StudentDashboard";
import CourseLearning from "./pages/student/CourseLearning";
import { CatalogPage } from "./pages/admin/catalog/CatalogPage";
import { OfferingsPage } from "./pages/admin/offerings/OfferingsPage";
import { RegistrationsPage } from "./pages/admin/registrations/RegistrationsPage";
import { MoocPage } from "./pages/admin/mooc/MoocPage";
import { CarouselPage } from "./pages/admin/carousel/CarouselPage";
import { PassportPage } from "./pages/admin/passport/PassportPage";
import { CertificationsPage } from "./pages/admin/mooc/CertificationsPage";
import { StudentsPage } from "./pages/admin/mooc/StudentsPage";
import { AdminLayout } from "./pages/admin/layout/AdminLayout";
import Certificates from "./pages/Certificates";
import CertificateView from "./pages/CertificateView";
import Passport from "./pages/Passport";
import CelebrationTest from "./components/CelebrationTest";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  
  // Rutas donde se debe ocultar el Navbar
  const hideNavbarRoutes = ['/unauthorized', '/profile-setup', '/welcome'];
  
  // Verificar si es una ruta 404
  const is404 = !['/', '/auth', '/unauthorized', '/dashboard', '/catalog', '/professor-offerings', 
    '/coil-offerings', '/mooc', '/profile', '/profile-setup', '/welcome', '/admin/catalog', '/admin/offerings', 
    '/admin/registrations', '/admin/mooc', '/admin/mooc/certifications', '/admin/mooc/students', '/admin/carousel', '/admin/passport', '/admin', '/professor', '/lia', '/passport', '/celebration-test'].includes(location.pathname) && 
    !location.pathname.startsWith('/admin/') &&
    !location.pathname.startsWith('/mooc/') &&
    !location.pathname.startsWith('/courses/') &&
    !location.pathname.startsWith('/certificado');

  // Ocultar navbar en 404 o en rutas específicas
  // Para las rutas de administración usamos un navbar específico (AdminNavbar) dentro del layout,
  // por eso ocultamos el Navbar principal cuando la ruta comienza con /admin
  const shouldHideNavbar = is404 || hideNavbarRoutes.includes(location.pathname) || location.pathname.startsWith('/admin');

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/welcome" element={<Welcome />} />
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
        <Route path="/mooc/:id" element={<MoocDetail />} />
        <Route 
          path="/courses/:courseId/learn" 
          element={
            <ProtectedRoute>
              <CourseLearning />
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
              path="/admin/passport" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout>
                    <PassportPage />
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
            <Route path="/lia" element={<Lia />} />
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
