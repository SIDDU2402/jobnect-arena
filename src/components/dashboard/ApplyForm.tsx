
import { useState } from "react";
import { Job } from "@/types/job";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { X, Upload, FileText, Check, Loader2 } from "lucide-react";
import SkillRecommendations from "./skills/SkillRecommendations";
import { motion, AnimatePresence } from "framer-motion";

interface ApplyFormProps {
  job: Job;
  onClose: () => void;
  onSubmit: (coverLetter: string, resumeUrl: string | null, resumeText: string) => void;
}

const ApplyForm = ({ job, onClose, onSubmit }: ApplyFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      setUploadComplete(false);
      setShowAnalysis(false);
    }
  };
  
  const handleUploadResume = async () => {
    if (!resumeFile || !user) return;
    
    setIsUploading(true);
    
    try {
      // Upload the file to Supabase Storage
      const fileExt = resumeFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('resumes')
        .upload(fileName, resumeFile);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);
      
      setResumeUrl(publicUrl);
      
      // Simulate parsing the resume text (in a real app, you'd use a PDF parsing service)
      setIsAnalyzing(true);
      
      // This is a mock function to simulate extracting text from a resume
      // In a real application, you would use a PDF parsing service or library
      setTimeout(() => {
        // Generate some mock resume text based on the job description
        const jobSkills = [
          "communication", "teamwork", "problem-solving", "time management",
          "creativity", "leadership", "adaptability", "technical skills"
        ];
        
        // Randomly include some of the job skills in the "resume"
        const includedSkills = jobSkills.filter(() => Math.random() > 0.3);
        
        const mockResumeText = `
          Professional Summary
          Experienced professional with a proven track record in ${includedSkills.slice(0, 3).join(", ")}.
          
          Skills
          ${includedSkills.join(", ")}
          
          Work Experience
          Company XYZ - Senior Position
          Led projects and demonstrated strong ${includedSkills.slice(0, 2).join(" and ")}.
          
          Education
          University of Excellence - Degree in Related Field
        `;
        
        setResumeText(mockResumeText);
        setIsAnalyzing(false);
        setShowAnalysis(true);
        setUploadComplete(true);
        
      }, 2000); // Simulate 2 second parsing delay
      
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };
  
  const handleSubmit = () => {
    if (!coverLetter.trim()) {
      toast({
        title: "Cover letter required",
        description: "Please provide a cover letter.",
        variant: "destructive",
      });
      return;
    }
    
    onSubmit(coverLetter, resumeUrl, resumeText);
  };
  
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="cover-letter">Cover Letter</Label>
            <Textarea
              id="cover-letter"
              placeholder="Tell the employer why you're the perfect fit for this role..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          
          <div className="space-y-4">
            <Label>Resume</Label>
            
            <AnimatePresence mode="wait">
              {!resumeFile ? (
                <motion.div
                  key="upload-area"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center"
                >
                  <input
                    type="file"
                    id="resume-upload"
                    onChange={handleResumeChange}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />
                  
                  <label
                    htmlFor="resume-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                    </motion.div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Click to upload your resume
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, or DOCX (Max 10MB)
                    </p>
                  </label>
                </motion.div>
              ) : (
                <motion.div
                  key="file-selected"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-secondary rounded-md">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">{resumeFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!uploadComplete && (
                        <>
                          {isUploading ? (
                            <Button size="sm" variant="ghost" disabled>
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="secondary" onClick={handleUploadResume}>
                              Upload
                            </Button>
                          )}
                        </>
                      )}
                      
                      {uploadComplete && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        >
                          <Button size="sm" variant="ghost" className="text-green-500 p-0 w-8 h-8">
                            <Check className="h-5 w-5" />
                          </Button>
                        </motion.div>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => {
                          setResumeFile(null);
                          setResumeUrl(null);
                          setUploadComplete(false);
                          setShowAnalysis(false);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center p-4"
              >
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">Analyzing your resume...</p>
              </motion.div>
            )}
            
            {showAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SkillRecommendations job={job} resumeText={resumeText} />
              </motion.div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!coverLetter.trim() || isUploading}
          >
            Submit Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyForm;
