
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Github, Linkedin, FileText, Award, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfileData {
  id: string;
  first_name: string;
  last_name: string;
  skills: string[];
  resume_url: string | null;
  professional_summary: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
}

interface ProfileSectionProps {
  profile: any;
  isLoading: boolean;
}

const ProfileSection = ({ profile, isLoading }: ProfileSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfileData>>({
    skills: profile?.skills || [],
    professional_summary: profile?.professional_summary || "",
    resume_url: profile?.resume_url || "",
    github_url: profile?.github_url || "",
    linkedin_url: profile?.linkedin_url || "",
    website_url: profile?.website_url || "",
  });
  
  // Format skills as a string for the textarea
  const skillsString = Array.isArray(formData.skills) 
    ? formData.skills.join(", ") 
    : formData.skills || "";
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfileData>) => {
      if (!user) throw new Error("User not authenticated");
      
      // Process skills - convert from comma-separated string to array
      if (typeof data.skills === 'string') {
        data.skills = data.skills.split(',').map(skill => skill.trim()).filter(Boolean);
      }
      
      const { data: result, error } = await supabase
        .from("profiles")
        .update({
          professional_summary: data.professional_summary,
          resume_url: data.resume_url,
          github_url: data.github_url,
          linkedin_url: data.linkedin_url,
          website_url: data.website_url,
          skills: data.skills,
        })
        .eq("id", user.id);
        
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert skills from string to array before saving
    const dataToUpdate = {
      ...formData,
      skills: skillsString, // This will be processed in the mutation function
    };
    updateProfileMutation.update(dataToUpdate);
  };
  
  const renderViewMode = () => {
    if (isLoading) {
      return <ProfileSkeleton />;
    }
    
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
              onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
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
