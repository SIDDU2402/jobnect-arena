import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Github, Linkedin, FileText, Award, ExternalLink, Bot, AlertTriangle, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserProfile } from "@/types/job";
import { AIJobAgent } from "@/services/AIJobAgent";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProfileSectionProps {
  profile: any;
  isLoading: boolean;
  resumeText: string | null;
}

const ProfileSection = ({ profile, isLoading, resumeText }: ProfileSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    skills: profile?.skills || [],
    professional_summary: profile?.professional_summary || "",
    resume_url: profile?.resume_url || "",
    github_url: profile?.github_url || "",
    linkedin_url: profile?.linkedin_url || "",
    website_url: profile?.website_url || "",
  });
  
  // Check if profile is ready for AI Agent operations
  const isProfileReadyForAgent = profile && resumeText 
    ? AIJobAgent.isProfileReadyForAgent(profile, resumeText) 
    : false;

  // Format skills as a string for the textarea
  const skillsString = Array.isArray(formData.skills) 
    ? formData.skills.join(", ") 
    : "";
  
  // Get missing profile items for agent readiness
  const getMissingProfileItems = () => {
    const missingItems = [];
    
    if (!profile?.professional_summary) {
      missingItems.push("Professional summary");
    }
    
    if (!Array.isArray(profile?.skills) || profile.skills.length === 0) {
      missingItems.push("Skills");
    }
    
    if (!profile?.resume_url) {
      missingItems.push("Resume URL");
    }
    
    if (!resumeText || resumeText.length < 100) {
      missingItems.push("Valid resume content");
    }
    
    return missingItems;
  };
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      if (!user) throw new Error("User not authenticated");
      
      // Process skills - convert from comma-separated string to array
      let processedData = { ...data };
      
      // Ensure skills is handled as an array
      if (typeof processedData.skills === 'string') {
        processedData.skills = (processedData.skills as string).split(',').map(skill => skill.trim()).filter(Boolean);
      }
      
      const { error } = await supabase
        .from("profiles")
        .update({
          professional_summary: processedData.professional_summary,
          resume_url: processedData.resume_url,
          github_url: processedData.github_url,
          linkedin_url: processedData.linkedin_url,
          website_url: processedData.website_url,
          skills: processedData.skills,
        })
        .eq("id", user.id);
        
      if (error) throw error;
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile", user?.id] });
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      setEditMode(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const skillsText = e.target.value;
    setFormData(prev => ({
      ...prev,
      skills: skillsText.split(',').map(skill => skill.trim()).filter(Boolean)
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };
  
  const renderViewMode = () => {
    if (isLoading) {
      return <ProfileSkeleton />;
    }
    
    const missingItems = getMissingProfileItems();
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Profile</h2>
          <Button 
            variant="outline" 
            onClick={() => setEditMode(true)}
          >
            Edit Profile
          </Button>
        </div>
        
        {/* Agent Readiness Status */}
        {isProfileReadyForAgent ? (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
            <AlertTitle className="text-green-800 dark:text-green-500">AI Job Agent Ready</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              Your profile is ready for AI job matching and auto-applications. Go to the Jobs section to activate the agent!
            </AlertDescription>
          </Alert>
        ) : missingItems.length > 0 ? (
          <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <AlertTitle className="text-amber-800 dark:text-amber-500">Complete Your Profile</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              To enable the AI Job Agent, please add: {missingItems.join(", ")}
            </AlertDescription>
          </Alert>
        ) : null}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Professional Summary */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Professional Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {profile?.professional_summary ? (
                <p className="text-muted-foreground">{profile.professional_summary}</p>
              ) : (
                <p className="text-muted-foreground italic">Add a professional summary to help employers learn more about you.</p>
              )}
            </CardContent>
          </Card>
          
          {/* Skills */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Skills</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {profile?.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string, index: number) => (
                    <div 
                      key={index} 
                      className="px-3 py-1 bg-secondary rounded-full text-sm"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">Add your skills to highlight your expertise.</p>
              )}
            </CardContent>
          </Card>
          
          {/* Professional Links */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Professional Links</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile?.github_url && (
                  <a 
                    href={profile.github_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    <span>GitHub Profile</span>
                  </a>
                )}
                {profile?.linkedin_url && (
                  <a 
                    href={profile.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span>LinkedIn Profile</span>
                  </a>
                )}
                {profile?.website_url && (
                  <a 
                    href={profile.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Personal Website</span>
                  </a>
                )}
                {profile?.resume_url && (
                  <a 
                    href={profile.resume_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Resume/CV</span>
                  </a>
                )}
                
                {!profile?.github_url && !profile?.linkedin_url && !profile?.website_url && !profile?.resume_url && (
                  <p className="text-muted-foreground italic">Add your professional links to help employers connect with you.</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* AI Agent Information */}
          <Card className="md:col-span-2 border-primary/10">
            <CardHeader className="bg-primary/5">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">AI Job Agent</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm">
                The AI Job Agent helps you find and apply to jobs that match your profile. 
                It analyzes your skills, resume, and professional experiences to identify 
                suitable opportunities, then automatically generates personalized cover letters 
                tailored to each job description.
              </p>
              
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-sm">To enable the AI Job Agent, you need:</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li className={profile?.professional_summary ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                    Professional summary {profile?.professional_summary ? "✓" : ""}
                  </li>
                  <li className={profile?.skills && profile.skills.length > 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                    List of skills {profile?.skills && profile.skills.length > 0 ? "✓" : ""}
                  </li>
                  <li className={profile?.resume_url ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                    Resume URL {profile?.resume_url ? "✓" : ""}
                  </li>
                  <li className={resumeText && resumeText.length >= 100 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                    Valid resume content {resumeText && resumeText.length >= 100 ? "✓" : ""}
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  const renderEditMode = () => {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Edit Your Profile</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => setEditMode(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="professional_summary" className="block text-sm font-medium mb-1">
              Professional Summary
            </label>
            <Textarea
              id="professional_summary"
              name="professional_summary"
              value={formData.professional_summary || ""}
              onChange={handleChange}
              placeholder="Write a brief summary of your professional experience and goals..."
              className="h-32"
            />
          </div>
          
          <div>
            <label htmlFor="skills" className="block text-sm font-medium mb-1">
              Skills (comma separated)
            </label>
            <Textarea
              id="skills"
              name="skills"
              value={skillsString}
              onChange={handleSkillsChange}
              placeholder="JavaScript, React, TypeScript, Node.js, etc."
              className="h-24"
            />
          </div>
          
          <Separator />
          
          <div>
            <label htmlFor="resume_url" className="block text-sm font-medium mb-1">
              Resume/CV URL
            </label>
            <Input
              id="resume_url"
              name="resume_url"
              type="url"
              value={formData.resume_url || ""}
              onChange={handleChange}
              placeholder="https://example.com/my-resume.pdf"
            />
          </div>
          
          <div>
            <label htmlFor="github_url" className="block text-sm font-medium mb-1">
              GitHub URL
            </label>
            <Input
              id="github_url"
              name="github_url"
              type="url"
              value={formData.github_url || ""}
              onChange={handleChange}
              placeholder="https://github.com/yourusername"
            />
          </div>
          
          <div>
            <label htmlFor="linkedin_url" className="block text-sm font-medium mb-1">
              LinkedIn URL
            </label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              value={formData.linkedin_url || ""}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/yourusername"
            />
          </div>
          
          <div>
            <label htmlFor="website_url" className="block text-sm font-medium mb-1">
              Personal Website
            </label>
            <Input
              id="website_url"
              name="website_url"
              type="url"
              value={formData.website_url || ""}
              onChange={handleChange}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>
      </form>
    );
  };
  
  return (
    <div className="space-y-4">
      {editMode ? renderEditMode() : renderViewMode()}
    </div>
  );
};

const ProfileSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-28" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSection;
