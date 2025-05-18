
import { supabase } from "@/integrations/supabase/client";
import { Job, UserProfile } from "@/types/job";
import { calculateCosineSimilarity } from "@/utils/skillsAnalysis";

export interface JobMatch {
  job: Job;
  score: number;
  matchReason: string;
}

export class AIJobAgent {
  private static MIN_MATCH_SCORE = 0.5; // Minimum match score to consider a job suitable
  private static MAX_AUTO_APPLICATIONS_PER_DAY = 3; // Limit auto-applications to avoid spamming
  private static LEARNING_RATE = 0.1; // Rate at which agent learns from feedback
  
  /**
   * Finds matching jobs for a user based on their profile and resume
   * with enhanced matching algorithm
   */
  static async findMatchingJobs(
    userProfile: UserProfile,
    resumeText: string
  ): Promise<JobMatch[]> {
    try {
      // Load user preferences and application history
      const { data: userPreferences } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", userProfile.id)
        .single();
        
      const { data: applicationHistory } = await supabase
        .from("applications")
        .select("job_id, status, created_at")
        .eq("applicant_id", userProfile.id)
        .order("created_at", { ascending: false });
      
      // Fetch available jobs
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "active");

      if (error) throw error;
      if (!jobs?.length) return [];
      
      // Applied job IDs to avoid recommending jobs user already applied to
      const appliedJobIds = (applicationHistory || []).map(app => app.job_id);

      // Calculate match score for each job with enhanced algorithm
      const jobMatches = jobs
        .filter(job => !appliedJobIds.includes(job.id)) // Filter out already applied jobs
        .map((job) => {
          const jobText = `${job.title} ${job.description} ${job.requirements}`;
          
          // Calculate semantic similarity between resume and job description (60% weight)
          const semanticScore = calculateCosineSimilarity(resumeText, jobText);
          
          // Calculate skill match percentage (30% weight)
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
          
          // Calculate company fit and career trajectory alignment (10% weight)
          const careerAlignmentScore = this.calculateCareerAlignment(
            userProfile, 
            job,
            applicationHistory || []
          );
          
          // Combined weighted score
          const combinedScore = (semanticScore * 0.6) + 
                               (skillMatchPercentage * 0.3) + 
                               (careerAlignmentScore * 0.1);
          
          // Generate detailed match reason with actionable insights
          const matchReason = this.generateDetailedMatchReason(
            combinedScore,
            semanticScore,
            skillMatchPercentage,
            careerAlignmentScore,
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
      return [];
    }
  }
  
  /**
   * Automatically applies to a job using AI-generated content
   * with enhanced personalization and learning capabilities
   */
  static async autoApplyToJob(
    job: Job,
    userProfile: UserProfile,
    resumeUrl: string | null,
    resumeText: string
  ): Promise<boolean> {
    try {
      // Check daily auto-application limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayApplications, error: countError } = await supabase
        .from("applications")
        .select("id")
        .eq("applicant_id", userProfile.id)
        .eq("auto_applied", true)
        .gte("created_at", today.toISOString());
        
      if (countError) throw countError;
      
      if ((todayApplications || []).length >= this.MAX_AUTO_APPLICATIONS_PER_DAY) {
        console.log(`Daily auto-application limit of ${this.MAX_AUTO_APPLICATIONS_PER_DAY} reached`);
        return false;
      }
      
      // Check if already applied to this job
      const { data: existingApplications } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", job.id)
        .eq("applicant_id", userProfile.id)
        .maybeSingle();
        
      if (existingApplications) {
        console.log("Already applied to this job");
        return false;
      }
      
      // Get successful applications to learn from them
      const { data: successfulApplications } = await supabase
        .from("applications")
        .select("cover_letter, ats_score, job_id")
        .eq("applicant_id", userProfile.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(3);
        
      // Fetch job details for successful applications to improve learning
      const jobIds = (successfulApplications || []).map(app => app.job_id);
      let successfulJobDetails = [];
      
      if (jobIds.length > 0) {
        const { data: relatedJobs } = await supabase
          .from("jobs")
          .select("*")
          .in("id", jobIds);
          
        successfulJobDetails = relatedJobs || [];
      }
      
      // Generate personalized cover letter with learned patterns
      const coverLetter = await this.generatePersonalizedCoverLetter(
        job, 
        userProfile, 
        resumeText,
        successfulApplications || [],
        successfulJobDetails
      );
      
      if (!coverLetter) {
        throw new Error("Failed to generate cover letter");
      }
      
      // Calculate ATS score with enhanced algorithm
      const resumeJobMatch = this.calculateResumeJobMatch(
        resumeText,
        `${job.title} ${job.description} ${job.requirements}`
      );
      
      // Submit application
      const { error } = await supabase.from("applications").insert({
        job_id: job.id,
        applicant_id: userProfile.id,
        cover_letter: coverLetter,
        resume_url: resumeUrl,
        ats_score: resumeJobMatch.score,
        status: "pending",
        auto_applied: true,
        application_metadata: {
          agent_version: "2.0",
          match_details: resumeJobMatch.details,
          applied_at: new Date().toISOString()
        }
      });
      
      if (error) throw error;
      
      // Log this application for learning - Fix: Store in applications table instead of non-existent agent_learning_data
      await this.logApplicationForLearning(userProfile.id, job.id);
      
      return true;
    } catch (error) {
      console.error("Error auto-applying to job:", error);
      return false;
    }
  }
  
  /**
   * Log application for future learning
   */
  private static async logApplicationForLearning(userId: string, jobId: string): Promise<void> {
    try {
      // Store application attempt in applications table with metadata instead of non-existent agent_learning_data table
      await supabase
        .from("applications")
        .insert({
          applicant_id: userId, // Fixed: using applicant_id instead of user_id
          job_id: jobId,
          status: "learning",
          application_metadata: {
            action: "auto_apply",
            timestamp: new Date().toISOString(),
            learning_data: true
          }
        });
    } catch (error) {
      console.error("Error logging application for learning:", error);
    }
  }
  
  /**
   * Generates a personalized cover letter using Gemini API
   * with enhanced learning from successful applications
   */
  private static async generatePersonalizedCoverLetter(
    job: Job,
    userProfile: UserProfile,
    resumeText: string,
    successfulApplications: any[],
    successfulJobDetails: any[]
  ): Promise<string | null> {
    try {
      // Create enhanced context with successful patterns
      let learningContext = "";
      
      if (successfulApplications.length > 0) {
        learningContext = "\nSuccessful application patterns:";
        successfulApplications.forEach((app, index) => {
          const relatedJob = successfulJobDetails.find(j => j.id === app.job_id);
          if (relatedJob) {
            learningContext += `\nExample ${index + 1}: Job Title: ${relatedJob.title}, Company: ${relatedJob.company}`;
          }
        });
      }
      
      const response = await supabase.functions.invoke("generate-cover-letter", {
        body: {
          jobDescription: `${job.title}. ${job.description} ${job.requirements}`,
          userProfile,
          resumeText,
          learningContext,
          jobTitle: job.title,
          company: job.company,
          enhanced: true
        }
      });
      
      if (response.error) throw new Error(response.error.message);
      
      return response.data.coverLetter;
    } catch (error) {
      console.error("Error generating personalized cover letter:", error);
      return null;
    }
  }
  
  /**
   * Calculate enhanced resume-job match with detailed analysis
   */
  private static calculateResumeJobMatch(
    resumeText: string,
    jobText: string
  ): { score: number, details: any } {
    const similarityScore = calculateCosineSimilarity(resumeText, jobText);
    const atsScore = Math.round(similarityScore * 100);
    
    // Extract key terms from job description
    const keyTerms = this.extractKeyTerms(jobText);
    
    // Calculate presence of key terms in resume
    const termPresence = keyTerms.map(term => ({
      term,
      present: resumeText.toLowerCase().includes(term.toLowerCase())
    }));
    
    const presentTermsCount = termPresence.filter(t => t.present).length;
    const termPresenceScore = keyTerms.length > 0 
      ? (presentTermsCount / keyTerms.length) * 100 
      : 0;
      
    return {
      score: atsScore,
      details: {
        semantic_similarity: similarityScore,
        key_term_match_percentage: Math.round(termPresenceScore),
        key_terms_total: keyTerms.length,
        key_terms_present: presentTermsCount,
        analyzed_at: new Date().toISOString()
      }
    };
  }
  
  /**
   * Extract key terms from job text for ATS matching
   */
  private static extractKeyTerms(jobText: string): string[] {
    const text = jobText.toLowerCase();
    const commonKeywords = [
      "experience", "skills", "qualification", "degree", "proficient",
      "expert", "knowledge", "familiar", "background", "track record",
      "certified", "trained", "proficiency", "understanding", "ability",
      "capable", "demonstrated", "proven", "years", "mastery"
    ];
    
    // Extract sentences that likely contain key requirements
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const keyTermCandidates = new Set<string>();
    
    sentences.forEach(sentence => {
      if (commonKeywords.some(keyword => sentence.includes(keyword))) {
        // Extract potential key terms from the sentence
        const words = sentence.split(/\s+/)
          .filter(word => word.length > 3)
          .map(word => word.replace(/[^\w\s]/g, '').trim())
          .filter(Boolean);
          
        words.forEach(word => {
          if (!commonKeywords.includes(word)) {
            keyTermCandidates.add(word);
          }
        });
      }
    });
    
    // Combine with directly extracted skills
    const extractedSkills = this.extractSkillsFromText(jobText);
    extractedSkills.forEach(skill => keyTermCandidates.add(skill));
    
    return Array.from(keyTermCandidates);
  }
  
  /**
   * Calculate career alignment score based on job history and trajectory
   */
  private static calculateCareerAlignment(
    userProfile: UserProfile,
    job: Job,
    applicationHistory: any[]
  ): number {
    // For now, use a simpler heuristic based on skill match
    // In a real implementation, this would analyze career progression patterns
    const professionalSummary = userProfile.professional_summary || '';
    const isFieldMentioned = job.title.split(' ').some(word => 
      professionalSummary.toLowerCase().includes(word.toLowerCase())
    );
    
    // Check if user has applied to similar roles
    const appliedToSimilar = applicationHistory.some(app => 
      app.job_title && app.job_title.toLowerCase().includes(job.title.toLowerCase())
    );
    
    return (isFieldMentioned ? 0.6 : 0.3) + (appliedToSimilar ? 0.4 : 0);
  }
  
  /**
   * Extracts skills from text based on common skill keywords
   * with enhanced pattern recognition
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
      "management", "communication", "teamwork", "problem solving", "critical thinking",
      "project management", "strategic planning", "financial analysis", "budgeting",
      "stakeholder management", "content creation", "copywriting", "a/b testing",
      "customer experience", "user research", "web accessibility", "responsive design",
      "cross-browser compatibility", "performance optimization", "security",
      "authentication", "authorization", "oauth", "jwt", "rest apis", "microservices",
      "serverless", "cloud architecture", "database design", "data modeling",
      "etl", "big data", "hadoop", "spark", "tableau", "power bi", "excel",
      "statistical analysis", "quantum computing", "virtual reality", "augmented reality"
    ];
    
    const textLower = text.toLowerCase();
    
    // First pass: direct keyword matching
    const directMatches = skillKeywords.filter(skill => textLower.includes(skill));
    
    // Second pass: pattern-based extraction for multi-word skills not in our list
    const skillPatterns = [
      /proficient in ([\w\s]+)/g,
      /experience with ([\w\s]+)/g,
      /knowledge of ([\w\s]+)/g,
      /familiar with ([\w\s]+)/g,
      /skilled in ([\w\s]+)/g
    ];
    
    const patternMatches = new Set<string>();
    
    skillPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(textLower)) !== null) {
        if (match[1] && match[1].length > 3 && match[1].length < 30) {
          patternMatches.add(match[1].trim());
        }
      }
    });
    
    return [...new Set([...directMatches, ...patternMatches])];
  }
  
  /**
   * Generates a detailed match reason with actionable insights
   */
  private static generateDetailedMatchReason(
    overallScore: number,
    semanticScore: number,
    skillMatchPercentage: number,
    careerAlignmentScore: number,
    matchingSkills: string[],
    requiredSkills: string[]
  ): string {
    if (overallScore >= 0.8) {
      return `Excellent match! You have ${matchingSkills.length} of ${requiredSkills.length} required skills and your resume aligns strongly with the job description.`;
    } else if (overallScore >= 0.6) {
      const missingSkillsCount = Math.max(0, requiredSkills.length - matchingSkills.length);
      return `Good match. You have ${matchingSkills.length} of ${requiredSkills.length} required skills. Consider highlighting your experience with ${matchingSkills.slice(0, 3).join(", ")}.`;
    } else {
      const missingSkills = requiredSkills.filter(skill => 
        !matchingSkills.includes(skill)
      );
      return `Potential match. You have ${matchingSkills.length} of ${requiredSkills.length} required skills. Consider developing skills in ${missingSkills.slice(0, 3).join(", ")} to improve your match.`;
    }
  }
  
  /**
   * Checks if a user's profile and resume are ready for agent operation
   * with enhanced verification
   */
  static isProfileReadyForAgent(profile: UserProfile | null, resumeText: string | null): boolean {
    if (!profile || !resumeText) return false;
    
    // Check if profile has necessary information
    const hasBasicInfo = profile.first_name && profile.last_name;
    const hasSkills = Array.isArray(profile.skills) && profile.skills.length >= 3; // Require at least 3 skills
    const hasSummary = !!profile.professional_summary && profile.professional_summary.length >= 50; // Require substantial summary
    
    // Check if resume text is substantial enough (at least 200 characters)
    const hasResumeContent = resumeText.length >= 200;
    
    // Additional check for professional links - at least one is recommended
    const hasProfessionalLink = !!profile.linkedin_url || !!profile.github_url || !!profile.website_url;
    
    return hasBasicInfo && hasSkills && hasSummary && hasResumeContent && hasProfessionalLink;
  }
  
  /**
   * Gets agent status and statistics
   */
  static async getAgentStats(userId: string): Promise<any> {
    try {
      // Get total auto applications made
      const { data: applications, error } = await supabase
        .from("applications")
        .select("id, status, created_at")
        .eq("applicant_id", userId)
        .eq("auto_applied", true);
        
      if (error) throw error;
      
      // Calculate success rate
      const totalAutoApplications = applications?.length || 0;
      const successfulApplications = applications?.filter(app => 
        app.status === "approved"
      ).length || 0;
      
      const successRate = totalAutoApplications > 0 
        ? (successfulApplications / totalAutoApplications) * 100 
        : 0;
        
      // Get applications by month
      const applicationsByMonth: Record<string, number> = {};
      applications?.forEach(app => {
        const month = new Date(app.created_at).toISOString().substring(0, 7); // YYYY-MM format
        applicationsByMonth[month] = (applicationsByMonth[month] || 0) + 1;
      });
      
      return {
        totalAutoApplications,
        successfulApplications,
        successRate,
        applicationsByMonth,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error getting agent stats:", error);
      return {
        error: "Failed to retrieve agent statistics"
      };
    }
  }
  
  /**
   * Analyze job market trends based on available jobs
   */
  static async analyzeJobMarketTrends(): Promise<any> {
    try {
      // Get all active jobs
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "active");
        
      if (error) throw error;
      if (!jobs?.length) return { trends: [] };
      
      // Extract skills from all job descriptions
      const allSkills: Record<string, number> = {};
      jobs.forEach(job => {
        const jobText = `${job.title} ${job.description} ${job.requirements}`;
        const skills = this.extractSkillsFromText(jobText);
        
        skills.forEach(skill => {
          allSkills[skill] = (allSkills[skill] || 0) + 1;
        });
      });
      
      // Sort skills by demand
      const topSkills = Object.entries(allSkills)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill, count]) => ({
          skill,
          count,
          percentage: Math.round((count / jobs.length) * 100)
        }));
        
      // Analyze job types
      const jobTypes: Record<string, number> = {};
      jobs.forEach(job => {
        jobTypes[job.type] = (jobTypes[job.type] || 0) + 1;
      });
      
      // Analyze locations
      const locations: Record<string, number> = {};
      jobs.forEach(job => {
        locations[job.location] = (locations[job.location] || 0) + 1;
      });
      
      return {
        topSkills,
        jobTypes: Object.entries(jobTypes).map(([type, count]) => ({ type, count })),
        topLocations: Object.entries(locations)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([location, count]) => ({ location, count })),
        totalJobs: jobs.length,
        analysisDate: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error analyzing job market trends:", error);
      return {
        error: "Failed to analyze job market trends"
      };
    }
  }
}
