
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import EmployerDashboard from "@/components/dashboard/EmployerDashboard";
import JobSeekerDashboard from "@/components/dashboard/JobSeekerDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<"employer" | "job_seeker" | null>(null);
  
  console.log("Dashboard mounting, user:", user?.email);
  
  const { data: profile, isLoading: profileLoading, error } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      console.log("Fetching profile for user:", user.id);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle(); // Use maybeSingle to avoid errors if profile doesn't exist
        
      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      
      // If no profile exists, create one automatically
      if (!data) {
        console.log("No profile found, creating default profile");
        const defaultProfile = {
          id: user.id,
          first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'User',
          last_name: user.user_metadata?.last_name || '',
          role: user.user_metadata?.role || 'job_seeker',
          skills: [],
          preferences: {}
        };
        
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert(defaultProfile)
          .select()
          .single();
          
        if (createError) {
          console.error("Error creating profile:", createError);
          toast.error("Failed to create profile", {
            description: createError.message
          });
          throw createError;
        }
        
        console.log("Profile created:", newProfile);
        return newProfile;
      }
      
      console.log("Profile loaded:", data?.role);
      return data;
    },
    enabled: !!user,
    retry: 2,
  });
  
  useEffect(() => {
    if (profile && !profileLoading) {
      console.log("Setting user role:", profile.role);
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
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Card className="w-[400px] shadow-md">
          <CardContent className="pt-6 flex flex-col items-center">
            <p className="text-red-500 font-medium mb-2">Error loading dashboard</p>
            <p className="text-sm text-muted-foreground">Please refresh the page or try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Card className="w-[400px] shadow-md">
          <CardContent className="pt-6 flex flex-col items-center">
            <p className="font-medium mb-2">Profile not found</p>
            <p className="text-sm text-muted-foreground">Please complete your profile setup.</p>
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
