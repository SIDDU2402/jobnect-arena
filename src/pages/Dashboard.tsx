
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import EmployerDashboard from "@/components/dashboard/EmployerDashboard";
import JobSeekerDashboard from "@/components/dashboard/JobSeekerDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<"employer" | "job_seeker" | null>(null);
  
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) {
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
  });
  
  useEffect(() => {
    if (profile && !profileLoading) {
      setUserRole(profile.role as "employer" | "job_seeker");
    }
  }, [profile, profileLoading]);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Card className="w-[300px] shadow-md">
          <CardContent className="pt-6 flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {userRole === "employer" ? (
        <EmployerDashboard profile={profile} />
      ) : (
        <JobSeekerDashboard profile={profile} />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
