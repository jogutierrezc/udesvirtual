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
import ProfileSetup from "./pages/ProfileSetup";
import Welcome from "./pages/Welcome";
import ProfessorOfferings from "./pages/ProfessorOfferings";
import CoilOfferings from "./pages/CoilOfferings";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { CatalogPage } from "./pages/admin/catalog/CatalogPage";
import { OfferingsPage } from "./pages/admin/offerings/OfferingsPage";
import { RegistrationsPage } from "./pages/admin/registrations/RegistrationsPage";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  
  // Rutas donde se debe ocultar el Navbar
  const hideNavbarRoutes = ['/unauthorized', '/profile-setup', '/welcome'];
  
  // Verificar si es una ruta 404
  const is404 = !['/', '/auth', '/unauthorized', '/dashboard', '/catalog', '/professor-offerings', 
    '/coil-offerings', '/mooc', '/profile-setup', '/welcome', '/admin/catalog', '/admin/offerings', 
    '/admin/registrations', '/admin', '/professor', '/lia'].includes(location.pathname) && 
    !location.pathname.startsWith('/admin/') &&
    !location.pathname.startsWith('/mooc/');

  // Ocultar navbar en 404 o en rutas específicas
  const shouldHideNavbar = is404 || hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/professor-offerings" element={<ProfessorOfferings />} />
        <Route path="/coil-offerings" element={<CoilOfferings />} />
        <Route path="/mooc" element={<Mooc />} />
        <Route path="/mooc/:id" element={<MoocDetail />} />
            
            {/* Admin Routes - Protected */}
            <Route 
              path="/admin/catalog" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <CatalogPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/offerings" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <OfferingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/registrations" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <RegistrationsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <CatalogPage />
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
