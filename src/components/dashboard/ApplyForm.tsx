
import { useState, useRef } from "react";
import { Job } from "@/types/job";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import SkillRecommendations from "./skills/SkillRecommendations";

interface ApplyFormProps {
  job: Job;
  onClose: () => void;
  onSubmit: (coverLetter: string, resumeUrl: string | null, resumeText: string) => void;
}

const ApplyForm = ({ job, onClose, onSubmit }: ApplyFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coverLetter.trim()) {
      toast({
        title: "Cover letter required",
        description: "Please provide a cover letter for your application",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    let resumeUrl = null;
    
    // Upload resume if selected
    if (resume && user) {
      setIsUploading(true);
      
      try {
        // Create a unique file name
        const fileExt = resume.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;
        
        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('resumes')
          .upload(filePath, resume, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) throw error;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('resumes')
          .getPublicUrl(filePath);
          
        resumeUrl = urlData.publicUrl;
        
        setIsUploading(false);
        setUploadProgress(100);
        
      } catch (error: any) {
        setIsUploading(false);
        toast({
          title: "Resume upload failed",
          description: error.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    }
    
    // Submit the application
    onSubmit(coverLetter, resumeUrl, resumeText);
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResume(file);
      
      // Simulate parsing the resume to extract text
      // In a real app, you would use a library to extract text from PDF/DOC files
      const reader = new FileReader();
      reader.onload = (event) => {
        // This is a simplified mock parsing of resume text
        // In a real app, you would parse the actual PDF/DOC content
        if (event.target?.result) {
          // For demo purposes, we'll use a mock parsed text with actual file name data
          const mockParsedText = `
            Experienced software developer with 5 years of experience in frontend development.
            Proficient in JavaScript, HTML, CSS, and React.
            Built responsive web applications and collaborated with cross-functional teams.
            Bachelor's degree in Computer Science.
            ${file.name} - ${file.size} bytes
          `;
          setResumeText(mockParsedText);
        }
      };
      reader.readAsText(file);
    }
  };

  const clearResume = () => {
    setResume(null);
    setResumeText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Apply for Job</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-lg">{job.title}</h3>
            <p className="text-muted-foreground">{job.company} • {job.location}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="resume">Upload Resume</Label>
              <div className="relative">
                <Input
                  id="resume"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleResumeUpload}
                  accept=".pdf,.doc,.docx"
                  className="cursor-pointer"
                />
                {resume && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={clearResume}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, DOC, DOCX
              </p>

              {resume && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Upload className="h-4 w-4 text-primary" />
                  <span className="truncate">{resume.name}</span>
                  <span className="text-xs">({(resume.size / 1024).toFixed(2)} KB)</span>
                </div>
              )}
            </div>
            
            {resume && (
              <SkillRecommendations job={job} resumeText={resumeText} />
            )}
            
            <div className="space-y-2">
              <Label htmlFor="coverLetter">Cover Letter</Label>
              <textarea
                id="coverLetter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell us why you're interested in this position and why you'd be a good fit..."
                className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                required
              />
            </div>
            
            <div className="bg-secondary/50 p-4 rounded-lg text-sm">
              <h4 className="font-medium mb-2">Application Tips:</h4>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Tailor your resume and cover letter to the job description</li>
                <li>Highlight relevant skills and experience</li>
                <li>Proofread for spelling and grammar errors</li>
                <li>Keep your cover letter concise and focused</li>
              </ul>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploading}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyForm;
