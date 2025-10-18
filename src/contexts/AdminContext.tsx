import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Class = Tables<"classes">;
type Teacher = Tables<"teachers">;
type Registration = Tables<"class_registrations"> & {
  classes?: Tables<"classes">;
};
type Offering = Tables<"course_offerings">;
type CoilProposal = Tables<"coil_proposals">;

interface AdminContextType {
  // State
  loading: boolean;
  userId: string;
  
  // Catalog data (approved)
  catalogClasses: Class[];
  catalogTeachers: Teacher[];
  
  // Offerings data (approved)
  catalogOfferings: Offering[];
  catalogCoilProposals: CoilProposal[];
  
  // Pending approvals
  pendingClasses: Class[];
  pendingTeachers: Teacher[];
  pendingOfferings: Offering[];
  pendingCoilProposals: CoilProposal[];
  
  // Registrations
  registrations: Registration[];
  
  // Functions
  loadData: () => Promise<void>;
  
  // Class CRUD
  createClass: (data: any) => Promise<void>;
  updateClass: (id: string, data: any) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  updateClassStatus: (id: string, status: "approved" | "rejected") => Promise<void>;
  
  // Teacher CRUD
  createTeacher: (data: any) => Promise<void>;
  updateTeacher: (id: string, data: any) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  updateTeacherStatus: (id: string, status: "approved" | "rejected") => Promise<void>;
  
  // Offering CRUD
  createOffering: (data: any) => Promise<void>;
  updateOffering: (id: string, data: any) => Promise<void>;
  deleteOffering: (id: string) => Promise<void>;
  updateOfferingStatus: (id: string, status: "approved" | "rejected") => Promise<void>;
  
  // COIL CRUD
  createCoil: (data: any) => Promise<void>;
  updateCoil: (id: string, data: any) => Promise<void>;
  deleteCoil: (id: string) => Promise<void>;
  updateCoilStatus: (id: string, status: "approved" | "rejected") => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
};

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  
  const [catalogClasses, setCatalogClasses] = useState<Class[]>([]);
  const [catalogTeachers, setCatalogTeachers] = useState<Teacher[]>([]);
  const [catalogOfferings, setCatalogOfferings] = useState<Offering[]>([]);
  const [catalogCoilProposals, setCatalogCoilProposals] = useState<CoilProposal[]>([]);
  
  const [pendingClasses, setPendingClasses] = useState<Class[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
  const [pendingOfferings, setPendingOfferings] = useState<Offering[]>([]);
  const [pendingCoilProposals, setPendingCoilProposals] = useState<CoilProposal[]>([]);
  
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    initAuth();
    loadData();
  }, []);

  const initAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        classesPendingRes,
        teachersPendingRes,
        regsRes,
        offeringsPendingRes,
        coilPendingRes,
        classesApprovedRes,
        teachersApprovedRes,
        offeringsApprovedRes,
        coilApprovedRes,
      ] = await Promise.all([
        supabase.from("classes").select("*").eq("status", "pending").order("created_at", { ascending: false }),
        supabase.from("teachers").select("*").eq("status", "pending").order("created_at", { ascending: false }),
        supabase.from("class_registrations").select("*, classes(*)").order("created_at", { ascending: false }),
        supabase.from("course_offerings").select("*").eq("status", "pending").order("created_at", { ascending: false }),
        supabase.from("coil_proposals").select("*").eq("status", "pending").order("created_at", { ascending: false }),
        supabase.from("classes").select("*").eq("status", "approved").order("created_at", { ascending: false }),
        supabase.from("teachers").select("*").eq("status", "approved").order("created_at", { ascending: false }),
        supabase.from("course_offerings").select("*").eq("status", "approved").order("created_at", { ascending: false }),
        supabase.from("coil_proposals").select("*").eq("status", "approved").order("created_at", { ascending: false }),
      ]);

      setPendingClasses(classesPendingRes.data || []);
      setPendingTeachers(teachersPendingRes.data || []);
      setRegistrations(regsRes.data || []);
      setPendingOfferings(offeringsPendingRes.data || []);
      setPendingCoilProposals(coilPendingRes.data || []);

      setCatalogClasses(classesApprovedRes.data || []);
      setCatalogTeachers(teachersApprovedRes.data || []);
      setCatalogOfferings(offeringsApprovedRes.data || []);
      setCatalogCoilProposals(coilApprovedRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Error al cargar datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Class CRUD
  const createClass = async (data: any) => {
    try {
      const { error } = await supabase.from("classes").insert({
        ...data,
        created_by: userId,
        status: "approved",
      });
      if (error) throw error;
      toast({ title: "Éxito", description: "Clase creada y aprobada automáticamente." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateClass = async (id: string, data: any) => {
    try {
      const { error } = await supabase.from("classes").update(data).eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: "Clase actualizada." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const deleteClass = async (id: string) => {
    try {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: "Clase eliminada." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateClassStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase.from("classes").update({ status }).eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: `Clase ${status === "approved" ? "aprobada" : "rechazada"}` });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  // Teacher CRUD
  const createTeacher = async (data: any) => {
    try {
      const { error } = await supabase.from("teachers").insert({
        ...data,
        user_id: userId,
        status: "approved",
      });
      if (error) throw error;
      toast({ title: "Éxito", description: "Perfil de profesor creado." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateTeacher = async (id: string, data: any) => {
    try {
      const { error } = await supabase.from("teachers").update(data).eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: "Profesor actualizado." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const deleteTeacher = async (id: string) => {
    try {
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: "Profesor eliminado." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateTeacherStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase.from("teachers").update({ status }).eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: `Docente ${status === "approved" ? "aprobado" : "rechazado"}` });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  // Offering CRUD
  const createOffering = async (data: any) => {
    try {
      const { error } = await supabase.from("course_offerings").insert({
        ...data,
        created_by: userId,
        status: "approved",
      });
      if (error) throw error;
      toast({ title: "Éxito", description: "Oferta creada y aprobada automáticamente." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateOffering = async (id: string, data: any) => {
    try {
      const { error } = await supabase.from("course_offerings").update(data).eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: "Oferta actualizada." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const deleteOffering = async (id: string) => {
    try {
      const { error } = await supabase.from("course_offerings").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: "Oferta eliminada." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateOfferingStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase.from("course_offerings").update({ status }).eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: `Oferta ${status === "approved" ? "aprobada" : "rechazada"}` });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  // COIL CRUD
  const createCoil = async (data: any) => {
    try {
      const { error } = await supabase.from("coil_proposals").insert({
        ...data,
        created_by: userId,
        status: "approved",
      });
      if (error) throw error;
      toast({ title: "Éxito", description: "Propuesta COIL creada y aprobada automáticamente." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateCoil = async (id: string, data: any) => {
    try {
      const { error } = await supabase.from("coil_proposals").update(data).eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: "Propuesta COIL actualizada." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const deleteCoil = async (id: string) => {
    try {
      const { error } = await supabase.from("coil_proposals").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: "Propuesta COIL eliminada." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateCoilStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase.from("coil_proposals").update({ status }).eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: `Propuesta COIL ${status === "approved" ? "aprobada" : "rechazada"}` });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const value: AdminContextType = {
    loading,
    userId,
    catalogClasses,
    catalogTeachers,
    catalogOfferings,
    catalogCoilProposals,
    pendingClasses,
    pendingTeachers,
    pendingOfferings,
    pendingCoilProposals,
    registrations,
    loadData,
    createClass,
    updateClass,
    deleteClass,
    updateClassStatus,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    updateTeacherStatus,
    createOffering,
    updateOffering,
    deleteOffering,
    updateOfferingStatus,
    createCoil,
    updateCoil,
    deleteCoil,
    updateCoilStatus,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
