import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, Compass, Heart, Award, Globe, Map, QrCode, Plane, Share2, Copy, GraduationCap, Beaker, Scroll, Download, Calendar, Star, CheckCircle2, User
} from 'lucide-react';

interface Pathway {
  id: string;
  name: string;
  description: string;
  pathway_type: string;
}

interface PathwayStep {
  id: string;
  route_id: string;
  order_index: number;
  title: string;
  description: string;
  points_required: number;
}

interface PassportDashboardProps {
  userId: string | null;
  userProfile: any;
  pathways: Pathway[];
  pathwaySteps: PathwayStep[];
  pointsByPathway: Record<string, number>;
  totalPoints: number;
}


const PassportDashboard: React.FC<PassportDashboardProps> = ({
  userId,
  userProfile,
  pathways,
  pathwaySteps,
  pointsByPathway,
  totalPoints,
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<'pasaporte' | 'rutas' | 'logros'>('pasaporte');

  // Helper functions
  const getPathwayIcon = (type: string) => {
    if (type === "conocimiento") return <BookOpen size={20} />;
    if (type === "descubrimiento") return <Compass size={20} />;
    if (type === "impacto_social") return <Heart size={20} />;
    return <Award size={20} />;
  };
  const getPathwayColor = (type: string) => {
    if (type === "conocimiento") return "blue";
    if (type === "descubrimiento") return "teal";
    if (type === "impacto_social") return "rose";
    return "blue";
  };
  const getStepsForPathway = (pathwayType: string) => {
    const route = pathways.find(p => p.pathway_type === pathwayType);
    if (!route) return [];
    return pathwaySteps.filter(step => step.route_id === route.id);
  };
  const generateCardNumber = (userId: string) => {
    const hash = userId.slice(-8).toUpperCase();
    return `UDES-${hash.slice(0, 4)}-${hash.slice(4, 8)}`;
  };

  // Simulated stats for demo (replace with real data as needed)
  const stats = {
    knowledge: pointsByPathway.conocimiento || 0,
    discovery: pointsByPathway.descubrimiento || 0,
    impact: pointsByPathway.impacto_social || 0,
    totalPoints: totalPoints || 0,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-2 font-sans text-slate-800">
      {/* Main Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row min-h-[650px]">
        {/* Left Panel: Passport Identity */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-blue-900 to-blue-800 text-white p-8 relative overflow-hidden flex flex-col justify-between">
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
              <circle cx="80" cy="20" r="30" fill="white" />
            </svg>
            <div className="absolute top-10 right-[-50px] text-white opacity-20 transform rotate-12">
              <Globe size={300} strokeWidth={0.5} />
            </div>
          </div>
          {/* Top Content */}
          <div className="relative z-10 text-center md:text-left">
            <div className="flex justify-between items-start mb-8">
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/20">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Escudo_de_la_Universidad_de_Santander.svg/1200px-Escudo_de_la_Universidad_de_Santander.svg.png" 
                  alt="Logo UDES" 
                  className="h-12 w-auto brightness-0 invert opacity-90"
                  onError={(e) => (e.currentTarget as HTMLImageElement).style.display = 'none'} 
                />
                <div className="text-xs font-mono tracking-widest">PASAPORTE DIGITAL</div>
              </div>
              <Award className="text-yellow-400 drop-shadow-lg" size={32} />
            </div>
            <div className="flex flex-col items-center md:items-start mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white/30 shadow-xl overflow-hidden bg-blue-700 flex items-center justify-center mb-4">
                  <span className="text-4xl font-bold text-blue-200">
                    {userProfile?.full_name ? userProfile.full_name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                  </span>
                </div>
                <div className="absolute bottom-4 right-0 bg-blue-100 text-blue-900 p-1.5 rounded-full border-2 border-blue-900 shadow-lg">
                  <Award size={16} />
                </div>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{userProfile?.full_name || 'Usuario UDES'}</h2>
              <p className="text-blue-200 text-sm mb-1">Estudiante</p>
              <p className="text-blue-300/80 text-xs font-mono">{userProfile?.email}</p>
            </div>
          </div>
          {/* Bottom Content (Passport Data) */}
          <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 mt-4 group hover:bg-white/15 transition-all cursor-default">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-blue-300 uppercase tracking-wider">Número de Pasaporte</span>
              <Copy size={14} className="text-blue-300 cursor-pointer hover:text-white" />
            </div>
            <div className="font-mono text-xl tracking-widest text-blue-400 shadow-black drop-shadow-sm">
              {userId ? generateCardNumber(userId) : 'Cargando...'}
            </div>
            <div className="mt-3 text-[10px] text-blue-300 font-mono leading-3 opacity-60 select-none break-words">
              P&lt;COL{userProfile?.full_name?.replace(/\s/g, '<').toUpperCase()}{'<<<<<<<<<<<<<<<<<'}<br/>
              {userId ? generateCardNumber(userId).replace(/-/g, '') : ''}0COL8801018M2801015{'<<<<<<<<<<<<<<'}04
            </div>
          </div>
        </div>
        {/* Right Panel: Content & Stats */}
        <div className="w-full md:w-3/5 bg-white p-8 flex flex-col">
          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit mx-auto md:mx-0 mb-8">
            {['Pasaporte', 'Rutas', 'Logros'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase() as any)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.toLowerCase() 
                    ? 'bg-white text-blue-900 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Mi {tab}
              </button>
            ))}
          </div>
          {/* Dynamic Content Section */}
          <div className="flex-grow flex flex-col overflow-hidden">
            {/* TAB: PASAPORTE */}
            {activeTab === 'pasaporte' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <StatCard icon={<BookOpen size={20} />} label="Conocimiento" value={stats.knowledge} color="blue" />
                  <StatCard icon={<Compass size={20} />} label="Descubrimiento" value={stats.discovery} color="teal" />
                  <StatCard icon={<Heart size={20} />} label="Impacto Social" value={stats.impact} color="rose" />
                </div>
                <div className="mt-auto mb-6">
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 relative bg-slate-50/50">
                    <div className="absolute top-1/2 -left-3 w-6 h-6 bg-white rounded-full border-r-2 border-slate-200"></div>
                    <div className="absolute top-1/2 -right-3 w-6 h-6 bg-white rounded-full border-l-2 border-slate-200"></div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Puntos Totales</p>
                        <div className="text-4xl font-extrabold text-slate-800 flex items-baseline gap-1">
                          {stats.totalPoints}
                          <span className="text-base font-medium text-slate-400">pts</span>
                        </div>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Award size={24} />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                      <div className="flex gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><Plane size={14}/> Nivel: Explorador</span>
                        <span className="flex items-center gap-1"><Map size={14}/> Región: Santander</span>
                      </div>
                      <QrCode size={32} className="text-slate-300" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* TAB: RUTAS */}
            {activeTab === 'rutas' && (
              <div className="flex-grow overflow-y-auto pr-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Mis Rutas de Aprendizaje</h3>
                <div className="grid gap-4">
                  {pathways.map(route => (
                    <RouteCard key={route.id} route={route} pointsByPathway={pointsByPathway} pathwaySteps={pathwaySteps} />
                  ))}
                </div>
              </div>
            )}
            {/* TAB: LOGROS (placeholder) */}
            {activeTab === 'logros' && (
              <div className="flex-grow overflow-y-auto pr-2 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center text-slate-400 py-12">
                  <Star className="mx-auto mb-4 text-yellow-400" size={40} />
                  <h3 className="text-lg font-bold mb-2">Próximamente: Logros e Insignias</h3>
                  <p className="text-sm">Aquí verás tus insignias, certificados y el historial de puntos.</p>
                </div>
              </div>
            )}
          </div>
          {/* Action Buttons */}
          <div className="flex gap-3 mt-auto pt-6 border-t border-slate-100 justify-end">
            <button className="flex items-center gap-2 text-slate-500 hover:text-blue-900 transition-colors text-sm font-medium px-4 py-2">
              <Share2 size={16} /> Compartir
            </button>
            <button className="bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20">
              {activeTab === 'rutas' ? 'Explorar Rutas' : activeTab === 'logros' ? 'Descargar Todo' : 'Ver Certificados'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper components
function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: 'blue' | 'teal' | 'rose' }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    teal: "bg-teal-50 text-teal-600 border-teal-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };
  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border ${colorClasses[color]} transition-transform hover:-translate-y-1 duration-300`}>
      <div className="mb-3 p-3 rounded-full bg-white shadow-sm">{icon}</div>
      <div className="text-2xl font-bold text-slate-800 mb-1">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</div>
    </div>
  );
}

function RouteCard({ route, pointsByPathway, pathwaySteps }: { route: any, pointsByPathway: any, pathwaySteps: any[] }) {
  const pathwayPoints = pointsByPathway[route.pathway_type] || 0;
  const steps = pathwaySteps.filter((step: any) => step.route_id === route.id);
  const completed = steps.filter((step: any) => pathwayPoints >= step.points_required).length;
  const percentage = steps.length > 0 ? (completed / steps.length) * 100 : 0;
  // Local color and icon logic
  const colorMap = {
    conocimiento: 'blue',
    descubrimiento: 'teal',
    impacto_social: 'rose',
  };
  const colorKey = colorMap[route.pathway_type] || 'blue';
  const colors = {
    blue: { text: 'text-blue-600', bg: 'bg-blue-500', ring: 'text-blue-500' },
    orange: { text: 'text-orange-600', bg: 'bg-orange-500', ring: 'text-orange-500' },
    teal: { text: 'text-teal-600', bg: 'bg-teal-500', ring: 'text-teal-500' },
    rose: { text: 'text-rose-600', bg: 'bg-rose-500', ring: 'text-rose-500' },
  }[colorKey];
  const getIcon = (type: string) => {
    if (type === "conocimiento") return <BookOpen size={20} />;
    if (type === "descubrimiento") return <Compass size={20} />;
    if (type === "impacto_social") return <Heart size={20} />;
    return <Award size={20} />;
  };
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5 group">
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="5" fill="transparent" className="text-slate-100" />
          <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="5" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className={`${colors.ring} transition-all duration-1000 ease-out`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-slate-700">{completed}/{steps.length}</div>
      </div>
      <div className="flex-grow">
        <h4 className="flex items-center gap-2 font-semibold text-lg text-slate-800 mb-1 group-hover:text-blue-900 transition-colors">
          <span className={`${colors.text} bg-slate-50 p-1.5 rounded-lg`}>{getIcon(route.pathway_type)}</span>
          {route.name}
        </h4>
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{route.description}</p>
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <div className="h-2.5 flex-grow bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${colors.bg} transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }} />
          </div>
          <span>{percentage.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

export default PassportDashboard;
