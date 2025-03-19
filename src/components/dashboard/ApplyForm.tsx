
import { useState } from "react";
import { Job } from "@/types/job";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import SkillRecommendations from "./skills/SkillRecommendations";

interface ApplyFormProps {
  job: Job;
  onClose: () => void;
  onSubmit: (coverLetter: string) => void;
}

const ApplyForm = ({ job, onClose, onSubmit }: ApplyFormProps) => {
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // In a real app, we would upload the resume here
    // For now, we just submit the cover letter
    onSubmit(coverLetter);
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResume(file);
      
      // In a real app, we would parse the resume to extract text
      // For demonstration, we'll use a mock parsed text
      setResumeText(`
        Experienced software developer with 5 years of experience in frontend development.
        Proficient in JavaScript, HTML, CSS, and React.
        Built responsive web applications and collaborated with cross-functional teams.
        Bachelor's degree in Computer Science.
      `);
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
              <Input
                id="resume"
                type="file"
                onChange={handleResumeUpload}
                accept=".pdf,.doc,.docx"
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, DOC, DOCX
              </p>
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
              <Button type="submit" disabled={isSubmitting}>
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
