import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail,
  MapPin,
  Phone,
  Pencil,
  Briefcase,
  Link as LinkIcon,
  BookOpen,
  MonitorPlay,
  ExternalLink,
  School,
  User,
  Copy,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Simple brand SVG icons (inline to avoid new dependencies)
const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 4.99 3.66 9.13 8.44 9.88v-6.99H8.07v-2.89h2.23V9.41c0-2.2 1.31-3.41 3.32-3.41.96 0 1.97.17 1.97.17v2.17h-1.11c-1.09 0-1.43.68-1.43 1.38v1.65h2.43l-.39 2.89h-2.04V22c4.78-.75 8.44-4.89 8.44-9.93z" />
  </svg>
);

const XIconBrand: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M23.36 4.46c-.33.15-.68.25-1.05.3.38-.23.67-.59.8-1.02-.36.21-.76.36-1.18.44-.34-.36-.83-.59-1.37-.59-1.04 0-1.88.85-1.88 1.9 0 .15.02.3.05.44-4.15-.21-7.84-2.2-10.31-5.22-.43.74-.68 1.6-.68 2.51 0 1.73.88 3.26 2.23 4.16-.32-.01-.62-.1-.88-.24v.02c0 2.42 1.72 4.44 4.01 4.9-.42.12-.86.18-1.31.18-.32 0-.63-.03-.93-.09.63 1.96 2.45 3.39 4.61 3.43-1.69 1.33-3.83 2.12-6.15 2.12-.4 0-.79-.02-1.17-.07 2.2 1.4 4.8 2.22 7.6 2.22 9.12 0 14.11-7.55 14.11-14.11v-.64c.97-.7 1.8-1.57 2.46-2.56-.9.4-1.86.66-2.86.78z" />
  </svg>
);

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M20.52 3.48A11.93 11.93 0 0012 .5C5.65.5.99 5.16.99 11.5c0 2.04.55 3.93 1.51 5.6L.5 23.5l6.6-1.71a11.9 11.9 0 005.4 1.22c6.35 0 11.01-4.66 11.01-11.01 0-2.95-1.15-5.7-3.09-7.52zM12 21.5c-1.66 0-3.28-.36-4.72-1.06l-.34-.18-3.92 1.02 1.03-3.81-.2-.37A8.49 8.49 0 013.5 11.5c0-4.69 3.81-8.5 8.5-8.5 2.27 0 4.41.88 6.02 2.49 1.59 1.59 2.48 3.7 2.48 6.01 0 4.69-3.81 8.5-8.5 8.5z" />
    <path d="M17.2 14.1c-.3-.15-1.78-.88-2.05-.98-.27-.1-.47-.15-.67.15-.2.3-.78.98-.95 1.19-.17.2-.34.22-.63.07-.3-.15-1.24-.46-2.36-1.45-.88-.78-1.47-1.74-1.64-2.04-.17-.3-.02-.46.13-.61.13-.12.3-.33.45-.5.15-.17.2-.28.3-.47.1-.2.05-.37-.02-.52-.07-.15-.67-1.63-.92-2.23-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.02 1-1.02 2.47 0 1.46 1.05 2.87 1.19 3.07.14.2 2.06 3.15 5 4.42 2.93 1.28 2.93.85 3.46.8.53-.06 1.78-.72 2.03-1.42.25-.7.25-1.3.17-1.42-.08-.12-.3-.2-.6-.35z" />
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2c1.65 0 3 1.35 3 3v10c0 1.65-1.35 3-3 3H7c-1.65 0-3-1.35-3-3V7c0-1.65 1.35-3 3-3h10z" />
    <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zM17.5 6a1 1 0 100 2 1 1 0 000-2z" />
  </svg>
);

type VinculoUdes = "Profesor" | "Estudiante" | "Otro";

type CursoAcademico = {
  nombre: string;
  tipo: "E-Exchange" | "COIL" | "MOOC";
  anio: number;
  enlace: string;
  destacado: boolean;
};

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  city?: string;
  department?: string;
  bio?: string;
  orcid_link?: string;
  cvlac_link?: string;
  is_udes: boolean;
  udes_vinculo?: VinculoUdes;
  is_other_university?: boolean;
  university_name?: string;
  avatar_url?: string;
  cursosCreados?: CursoAcademico[];
};

const mockProfileProfesor: UserProfile = {
  id: "d9b1c7f4-5e9a-4c8d-8e5f-5b3a4a6e0c2f",
  full_name: "Dr. Santiago Ramírez",
  email: "sramirez@udes.edu.co",
  phone: "+57 317 5551234",
  address: "Calle 10 # 15-20",
  country: "Colombia",
  city: "Bucaramanga",
  department: "Ingeniería de Sistemas",
  bio: "Profesor e investigador en metodologías de aprendizaje activo y tecnologías educativas. Especializado en el diseño y ejecución de programas COIL e intercambio virtual.",
  orcid_link: "https://orcid.org/0000-0002-1825-0000",
  cvlac_link: "https://scienti.minciencias.gov.co/cvlac/123456789",
  is_udes: true,
  udes_vinculo: "Profesor",
  is_other_university: false,
  university_name: "Universidad de Santander (UDES)",
  cursosCreados: [
    { nombre: "Fundamentos de Inteligencia Artificial (MOOC)", tipo: "MOOC", anio: 2024, enlace: "#", destacado: true },
    { nombre: "Desarrollo de Soluciones Sostenibles (COIL)", tipo: "COIL", anio: 2023, enlace: "#", destacado: true },
    { nombre: "Gestión de Proyectos Virtuales (E-Exchange)", tipo: "E-Exchange", anio: 2022, enlace: "#", destacado: false },
  ],
};

function getRole(profile: UserProfile) {
  if (profile.is_udes && profile.udes_vinculo === "Profesor") return "PROFESOR";
  if (profile.is_udes && profile.udes_vinculo === "Estudiante") return "ESTUDIANTE";
  return profile.is_other_university ? "OTRO" : "INVITADO";
}

function ResearchLinks({ profile }: { profile: UserProfile }) {
  const role = getRole(profile);
  const links: React.ReactNode[] = [];

  if (profile.orcid_link) {
    links.push(
      <a key="orcid" href={profile.orcid_link} target="_blank" rel="noreferrer" className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
        <LinkIcon className="w-5 h-5" />
        <span className="font-medium">ORCID</span>
      </a>
    );
  }

  if (profile.cvlac_link && role === "PROFESOR") {
    links.push(
      <a key="cvlac" href={profile.cvlac_link} target="_blank" rel="noreferrer" className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
        <BookOpen className="w-5 h-5" />
        <span className="font-medium">CvLAC</span>
      </a>
    );
  }

  if (links.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg shadow-inner mb-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
        <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
        Vínculos de Investigación
      </h3>
      <div className="flex flex-wrap gap-4">{links}</div>
    </div>
  );
}

function CursoCard({ curso }: { curso: CursoAcademico }) {
  const accent = curso.destacado ? "border-l-4 border-yellow-300" : "border-l-4 border-gray-200";
  return (
    <div className={`p-4 bg-white shadow-md rounded-lg ${accent} mb-4 hover:shadow-lg transition duration-300`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className={`text-xl ${curso.destacado ? "text-gray-900 font-bold" : "text-gray-800"}`}>{curso.nombre}</h4>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{curso.anio}</span>
      </div>

      <div className="flex space-x-4 mb-3 text-sm text-gray-600">
        <span className="flex items-center font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
          <MonitorPlay className="w-4 h-4 mr-1" /> {curso.tipo}
        </span>
        {curso.destacado && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md font-semibold">Destacado</span>}
      </div>

      <a href={curso.enlace} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold text-sm flex items-center transition duration-150 mt-2">
        <ExternalLink className="w-4 h-4 mr-1" /> Ir al Curso
      </a>
    </div>
  );
}

const PublicProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: profile, isLoading, error } = useQuery<UserProfile | null, Error>({
    queryKey: ["publicProfile", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await (supabase.from("profiles") as any)
        .select("*")
        .eq("id", id)
        .single();
      if (res.error) throw res.error;
      return res.data as UserProfile;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const roleText = profile ? (getRole(profile) === "PROFESOR" ? "Profesor Investigador UDES" : "Usuario") : "";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Cargando perfil...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-medium">Perfil no encontrado o no público</p>
          <p className="text-sm text-gray-500 mt-2">Es posible que el perfil no exista o que no esté marcado como público.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden transform transition-all duration-300">
        <div className="relative h-32 bg-blue-600">
          {/* Back button */}
          <div className="absolute left-4 top-4 z-40">
            <Link to="/profesores" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full shadow-sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">Volver a Profesores</span>
            </Link>
          </div>

          {/* Share buttons positioned on the blue header */}
          <div className="absolute right-4 top-4 flex items-center space-x-2 z-40">
            <button
              onClick={() => {
                const shareUrl = window.location.href;
                const text = `${profile.full_name} — ${roleText}\n${(profile.bio || '').slice(0,140)}`;
                const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`;
                window.open(fb, "_blank", "noopener,noreferrer");
              }}
              aria-label="Compartir en Facebook"
              className="p-2 rounded-full shadow-sm text-sm font-medium bg-[#1877F2] hover:bg-[#145db0]"
            >
              <FacebookIcon className="w-5 h-5 text-white" />
              <span className="sr-only">Compartir en Facebook</span>
            </button>

            <button
              onClick={() => {
                const shareUrl = window.location.href;
                const text = `${profile.full_name} — ${roleText}`;
                const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
                window.open(x, "_blank", "noopener,noreferrer");
              }}
              aria-label="Compartir en X"
              className="p-2 rounded-full shadow-sm text-sm font-medium bg-black hover:brightness-90"
            >
              <XIconBrand className="w-5 h-5 text-white" />
              <span className="sr-only">Compartir en X</span>
            </button>

            <button
              onClick={() => {
                const shareUrl = window.location.href;
                const text = `${profile.full_name} — ${roleText} ${shareUrl}`;
                const wa = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                window.open(wa, "_blank", "noopener,noreferrer");
              }}
              aria-label="Compartir en WhatsApp"
              className="p-2 rounded-full shadow-sm text-sm font-medium bg-green-600 hover:bg-green-700"
            >
              <WhatsAppIcon className="w-5 h-5 text-white" />
              <span className="sr-only">Compartir en WhatsApp</span>
            </button>

            <button
              onClick={async () => {
                const shareUrl = window.location.href;
                const text = `${profile.full_name} — ${roleText}\n${profile.bio || ''}`;
                // Instagram doesn't have a web share URL; try Web Share API first, otherwise copy link
                if (navigator.share) {
                  try {
                    await navigator.share({ title: profile.full_name, text, url: shareUrl });
                    return;
                  } catch (e) {
                    // fallthrough to copy
                  }
                }
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  toast({ title: 'Enlace copiado', description: 'Pega el enlace en Instagram para compartir el perfil.' });
                } catch (err) {
                  toast({ title: 'No se pudo copiar', description: 'Tu navegador no permite copiar al portapapeles.' , variant: 'destructive'});
                }
              }}
              aria-label="Compartir en Instagram"
              className="p-2 rounded-full shadow-sm text-sm font-medium bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 hover:from-yellow-500"
            >
              <InstagramIcon className="w-5 h-5 text-white" />
              <span className="sr-only">Compartir en Instagram</span>
            </button>

            <button
              onClick={async () => {
                const shareUrl = window.location.href;
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  toast({ title: 'Enlace copiado', description: 'Enlace del perfil copiado al portapapeles.' });
                } catch (err) {
                  toast({ title: 'No se pudo copiar', description: 'Tu navegador no permite copiar al portapapeles.' , variant: 'destructive'});
                }
              }}
              aria-label="Copiar enlace"
              className="bg-white/90 hover:bg-white/100 px-3 py-1 rounded-lg shadow-sm text-sm font-medium"
            >
              <Copy className="inline-block w-4 h-4 mr-1 -mt-0.5" /> Copiar
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 -mt-16 sm:px-10">
          <div className="relative w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center shadow-lg mb-4 text-blue-600 text-4xl font-bold overflow-hidden z-30">
            {/* If there is an avatar URL render it, otherwise initials */}
              {profile.avatar_url ? (
              // prefer avatar_url stored in profiles
              <img src={profile.avatar_url} alt={profile.full_name} className="w-32 h-32 object-cover rounded-full" />
            ) : profile.full_name ? (
              <div>{profile.full_name.split(" ").map((n: string) => n[0]).slice(0,2).join("")}</div>
            ) : (
              <User className="w-8 h-8" />
            )}
          </div>

          <div id="profile-content">
            <h1 className="text-3xl font-extrabold text-gray-900">{profile.full_name}</h1>
            <p className="text-lg text-blue-600 mb-4 font-medium">{roleText}</p>

            <div className="flex flex-wrap items-center space-x-6 text-gray-600 mb-6 border-b pb-4">
              <span className="flex items-center space-x-1"><Mail className="w-4 h-4 text-blue-600" /><span>{profile.email}</span></span>
              <span className="flex items-center space-x-1"><MapPin className="w-4 h-4 text-blue-600" /><span>{profile.city}, {profile.country}</span></span>
              {profile.phone && <span className="flex items-center space-x-1"><Phone className="w-4 h-4 text-blue-600" /><span>{profile.phone}</span></span>}
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-3 flex items-center"><Pencil className="w-5 h-5 mr-2 text-blue-600" />Biografía</h2>
              <p className="text-gray-600 leading-relaxed text-justify">{profile.bio || 'Perfil sin biografía disponible.'}</p>
            </div>

            <ResearchLinks profile={profile} />

            {profile.cursosCreados && profile.cursosCreados.length > 0 ? (
              <div className="mb-8 pt-4 border-t border-gray-100">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><MonitorPlay className="w-5 h-5 mr-2 text-blue-600" />Cursos E-Exchange, COIL y MOOC Creados ({profile.cursosCreados.length})</h2>
                {profile.cursosCreados.map((c, i) => <CursoCard key={i} curso={c} />)}
              </div>
            ) : (
              <div className="text-center text-gray-500 bg-gray-50 p-6 rounded-lg my-6">
                <MonitorPlay className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="font-medium">¡Aún no hay cursos en esta sección!</p>
                <p className="text-sm">Publica tus cursos E-Exchange, COIL o MOOC para destacarlos aquí.</p>
              </div>
            )}

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700 mb-3 flex items-center"><School className="w-5 h-5 mr-2 text-blue-600" />Información Académica</h2>
              <p className="text-gray-600 text-justify"><span className="font-semibold text-gray-800">Institución:</span> {profile.university_name || 'Universidad de Santander (UDES)'}</p>
              <p className="text-gray-600 text-justify"><span className="font-semibold text-gray-800">Facultad/Departamento:</span> {profile.department || 'No especificado'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
