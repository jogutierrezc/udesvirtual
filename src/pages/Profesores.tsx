import React, { useMemo, useState } from "react";
import { Search, MapPin, Building2, UserCheck, GraduationCap, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Helper for initials
const getInitials = (fullName: string) => {
  const parts = fullName.split(" ").filter(Boolean);
  if (parts.length === 0) return "??";
  const firstInitial = parts[0][0];
  // find last meaningful part (skip titles)
  const skip = ['dr', 'ph', 'ph.d', 'ing', 'msc', 'dr.', 'ph.d.', 'ing.', 'msc.'];
  let lastMeaningful = '';
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i].toLowerCase().replace('.', '');
    if (!skip.includes(p)) {
      lastMeaningful = parts[i];
      break;
    }
  }
  const secondInitial = (lastMeaningful && lastMeaningful !== parts[0]) ? lastMeaningful[0] : (parts.length > 1 ? parts[1][0] : '');
  return (firstInitial + (secondInitial || '')).toUpperCase();
};

// We will fetch professors from Supabase; keep a fallback empty array
async function fetchProfessors() {
  // Filter to those who marked udes_vinculo as 'udes_profesor' in DB
  const { data, error } = await (supabase.from("profiles") as any)
  .select("id, full_name, department, city, udes_vinculo, is_udes, bio, public_profile, avatar_url")
    .eq("udes_vinculo", "udes_profesor")
    .eq("public_profile", true) // ensure only explicitly public profiles are returned
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data || [];
}

const colombianDepartments = [
  'Todos los Departamentos','Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas',
  'Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca','Guainía','Guaviare',
  'Huila','La Guajira','Magdalena','Meta','Nariño','Norte de Santander','Putumayo','Quindío',
  'Risaralda','San Andrés y Providencia','Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada'
];

const ProfileCard: React.FC<{ profile: any }> = ({ profile }) => {
  const getRoleInfo = (prof: any) => {
    if (prof.is_udes) {
      const v = (prof.udes_vinculo || '').toString().toLowerCase();
      if (v.includes('profesor')) {
        return { roleText: 'Profesor UDES', colorClass: 'text-blue-700 bg-blue-100', Icon: UserCheck };
      }
      if (v.includes('estudiante')) {
        return { roleText: 'Estudiante UDES', colorClass: 'text-teal-700 bg-teal-100', Icon: GraduationCap };
      }
    }
    return { roleText: 'Externo/Visitante', colorClass: 'text-gray-700 bg-gray-200', Icon: Users };
  };

  const { roleText, colorClass, Icon } = getRoleInfo(profile);

  return (
    <div className="group relative bg-white p-6 rounded-xl shadow-lg border-b-4 border-[#007BFF] hover:shadow-2xl transition duration-300 transform hover:-translate-y-1">
      <div className="flex flex-col items-center text-center">
        {/* Avatar: prefer Supabase `avatar_url`, fallback to `avatarUrl` or initials */}
        {((profile.avatar_url && profile.avatar_url.length) || profile.avatarUrl) ? (
          <img src={profile.avatar_url || profile.avatarUrl} alt={profile.full_name} className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-xl mb-3" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#007BFF] flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-xl mb-3">
            {getInitials(profile.full_name)}
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900 mb-1">{profile.full_name}</h2>
        <div className={`text-sm font-medium ${colorClass} inline-flex items-center px-3 py-0.5 rounded-full mb-3`}>
          <Icon className="w-4 h-4 mr-1" /> {roleText}
        </div>

        <div className="text-sm text-gray-600 space-y-1 w-full">
          <p className="flex items-center justify-center"><Building2 className="w-4 h-4 mr-1 text-gray-400" />{profile.department || 'N/A'}</p>
          <p className="flex items-center justify-center"><MapPin className="w-4 h-4 mr-1 text-gray-400" />{profile.city || 'N/A'}</p>
        </div>

        <p className="text-xs text-gray-500 mt-4 italic line-clamp-2 w-full h-8 overflow-hidden">{profile.bio || 'Sin biografía corta disponible.'}</p>

        <Link to={`/profile/${profile.id}`} className="mt-4 w-full px-4 py-2 bg-[#007BFF] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition duration-150 shadow-md text-center">
          Ver Perfil Completo
        </Link>
      </div>
    </div>
  );
};

export default function Profesores(): JSX.Element {
  const [searchName, setSearchName] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("Todos los Departamentos");

  const { data: profiles = [], isLoading, error } = useQuery<any[], Error>({ queryKey: ['professorsDirectory'], queryFn: fetchProfessors });

  const filteredProfiles = useMemo(() => {
    const list = profiles || [];
    return list.filter((profile: any) => {
      const nameMatch = (profile.full_name || '').toLowerCase().includes(searchName.toLowerCase());
      const departmentMatch = selectedDepartment === 'Todos los Departamentos' || (profile.department && profile.department.toLowerCase() === selectedDepartment.toLowerCase());
      return nameMatch && departmentMatch;
    });
  }, [profiles, searchName, selectedDepartment]);

  return (
    <div className="p-4 md:p-10 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto mb-8 p-6 bg-white shadow-2xl rounded-xl">
        <h1 className="text-2xl font-extrabold text-gray-800 mb-6 flex items-center"><Search className="w-6 h-6 mr-3 text-[#007BFF]" /> Buscar Académicos</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-2 relative">
            <input type="text" placeholder="Buscar por Nombre..." value={searchName} onChange={(e) => setSearchName(e.target.value)} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-[#007BFF] focus:border-[#007BFF] transition duration-150 shadow-sm" />
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="col-span-1 p-3 border border-gray-300 rounded-lg focus:ring-[#007BFF] focus:border-[#007BFF] transition duration-150 shadow-sm appearance-none bg-white pr-8" style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239CA3AF"><path d="M7 10l5 5 5-5z"/></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '12px' }}>
            {colombianDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {filteredProfiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : (
          <div className="text-center bg-white p-12 rounded-xl shadow-lg border border-gray-200 mt-8">
            <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-xl font-medium text-gray-700">¡No se encontraron resultados!</p>
            <p className="text-gray-500 mt-2">Intenta ajustar tu búsqueda por nombre o seleccionar otro departamento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
