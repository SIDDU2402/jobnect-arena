
import { supabase } from "@/integrations/supabase/client";
import { Job, UserProfile } from "@/types/job";
import { calculateCosineSimilarity } from "@/utils/skillsAnalysis";
import { toast } from "sonner";

export interface JobMatch {
  job: Job;
  score: number;
  matchReason: string;
}

export class AIJobAgent {
  private static MIN_MATCH_SCORE = 0.5; // Minimum match score to consider a job suitable
  
  /**
   * Finds matching jobs for a user based on their profile and resume
   */
  static async findMatchingJobs(
    userProfile: UserProfile,
    resumeText: string
  ): Promise<JobMatch[]> {
    try {
      // Fetch available jobs
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "active");

      if (error) throw error;
      if (!jobs?.length) return [];

      // Calculate match score for each job
      const jobMatches = jobs.map((job) => {
        const jobText = `${job.title} ${job.description} ${job.requirements}`;
        
        // Calculate similarity between resume and job description
        const similarityScore = calculateCosineSimilarity(resumeText, jobText);
        
        // Calculate skill match percentage
        const userSkills = userProfile.skills || [];
        const requiredSkills = this.extractSkillsFromText(job.requirements);
        const matchingSkills = requiredSkills.filter(skill => 
          userSkills.some(userSkill => 
            userSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        
        const skillMatchPercentage = requiredSkills.length > 0 
          ? matchingSkills.length / requiredSkills.length 
          : 0;
        
        // Combined score (60% similarity, 40% skill match)
        const combinedScore = (similarityScore * 0.6) + (skillMatchPercentage * 0.4);
        
        // Generate match reason
        const matchReason = this.generateMatchReason(
          combinedScore, 
          matchingSkills, 
          requiredSkills
        );
        
        return {
          job,
          score: combinedScore,
          matchReason
        };
      });

      // Sort by score (highest first) and filter by minimum match score
      return jobMatches
        .filter(match => match.score >= this.MIN_MATCH_SCORE)
        .sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error("Error finding matching jobs:", error);
      toast.error("Failed to find job matches");
      return [];
    }
  }
  
  /**
   * Automatically applies to a job using AI-generated content
   */
  static async autoApplyToJob(
    job: Job,
    userProfile: UserProfile,
    resumeUrl: string | null,
    resumeText: string
  ): Promise<boolean> {
    try {
      // Check if already applied to this job
      const { data: existingApplications } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", job.id)
        .eq("applicant_id", userProfile.id)
        .maybeSingle();
        
      if (existingApplications) {
        toast.info("Already applied", {
          description: `You've already applied to "${job.title}".`
        });
        return false;
      }
      
      // Generate cover letter using Gemini API
      const coverLetter = await this.generateCoverLetter(job, userProfile, resumeText);
      
      if (!coverLetter) {
        throw new Error("Failed to generate cover letter");
      }
      
      // Calculate ATS score
      const similarityScore = calculateCosineSimilarity(
        resumeText,
        `${job.description} ${job.requirements}`
      );
      const atsScore = Math.round(similarityScore * 100);
      
      // Submit application
      const { error } = await supabase.from("applications").insert({
        job_id: job.id,
        applicant_id: userProfile.id,
        cover_letter: coverLetter,
        resume_url: resumeUrl,
        ats_score: atsScore,
        status: "pending",
        auto_applied: true
      });
      
      if (error) throw error;
      
      toast.success("Successfully applied to job", {
        description: `Your application for "${job.title}" has been submitted.`
      });
      
      return true;
    } catch (error) {
      console.error("Error auto-applying to job:", error);
      toast.error("Failed to auto-apply to job");
      return false;
    }
  }
  
  /**
   * Generates a cover letter using Gemini API
   */
  private static async generateCoverLetter(
    job: Job,
    userProfile: UserProfile,
    resumeText: string
  ): Promise<string | null> {
    try {
      const response = await supabase.functions.invoke("generate-cover-letter", {
        body: {
          jobDescription: `${job.title}. ${job.description} ${job.requirements}`,
          userProfile,
          resumeText
        }
      });
      
      if (response.error) throw new Error(response.error.message);
      
      return response.data.coverLetter;
    } catch (error) {
      console.error("Error generating cover letter:", error);
      return null;
    }
  }
  
  /**
   * Extracts skills from text based on common skill keywords
   */
  private static extractSkillsFromText(text: string): string[] {
    // Common skill keywords to look for
    const skillKeywords = [
      "javascript", "typescript", "html", "css", "react", "vue", "angular", 
      "node", "express", "mongodb", "sql", "postgresql", "mysql", "graphql",
      "rest", "api", "aws", "azure", "gcp", "docker", "kubernetes", "python",
      "django", "flask", "ruby", "rails", "php", "laravel", "java", "spring",
      "c#", ".net", "scala", "swift", "kotlin", "flutter", "dart", "mobile",
      "android", "ios", "react native", "design", "figma", "sketch", "adobe",
      "photoshop", "illustrator", "xd", "ui", "ux", "frontend", "backend",
      "fullstack", "devops", "cicd", "git", "github", "gitlab", "product",
      "agile", "scrum", "kanban", "marketing", "seo", "analytics", "data",
      "science", "machine learning", "ai", "blockchain", "crypto", "leadership",
      "management", "communication", "teamwork", "problem solving", "critical thinking"
    ];
    
    const textLower = text.toLowerCase();
    return skillKeywords.filter(skill => textLower.includes(skill));
  }
  
  /**
   * Generates a human-readable match reason
   */
  private static generateMatchReason(
    score: number, 
    matchingSkills: string[], 
    requiredSkills: string[]
  ): string {
    if (score >= 0.8) {
      return `Excellent match! You have ${matchingSkills.length} of ${requiredSkills.length} required skills.`;
    } else if (score >= 0.6) {
      return `Good match. You have ${matchingSkills.length} of ${requiredSkills.length} required skills.`;
    } else {
      return `Potential match. You have ${matchingSkills.length} of ${requiredSkills.length} required skills.`;
    }
  }
  
  /**
   * Checks if a user's profile and resume are ready for agent operation
   */
  static isProfileReadyForAgent(profile: UserProfile | null, resumeText: string | null): boolean {
    if (!profile || !resumeText) return false;
    
    // Check if profile has necessary information
    const hasBasicInfo = profile.first_name && profile.last_name;
    const hasSkills = Array.isArray(profile.skills) && profile.skills.length > 0;
    const hasSummary = !!profile.professional_summary;
    
    // Check if resume text is substantial enough (at least 100 characters)
    const hasResumeContent = resumeText.length >= 100;
    
    return hasBasicInfo && hasSkills && hasSummary && hasResumeContent;
  }
}
