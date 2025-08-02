import { supabase } from "@/integrations/supabase/client";
import { Job, UserProfile } from "@/types/job";

// Export interfaces
export interface JobMatch {
  job: Job;
  score: number;
  reason: string;
  matchReason?: string; // For backward compatibility
}

// Simple interfaces for applications
interface SimpleApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  created_at: string;
  status: string;
}

interface SimpleJobDetail {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string;
}

// Skill keywords for matching
const SKILL_KEYWORDS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "C#",
  "Angular", "Vue", "Svelte", "HTML", "CSS", "SCSS", "Tailwind", "Bootstrap",
  "Express", "Fastify", "Django", "Flask", "Spring", "Laravel", "Ruby on Rails",
  "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "GraphQL", "REST API",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "CI/CD", "Git",
  "Linux", "Unix", "Windows", "MacOS", "Nginx", "Apache", "Microservices",
  "Machine Learning", "AI", "Data Science", "TensorFlow", "PyTorch", "Pandas",
  "Communication", "Leadership", "Problem Solving", "Team Work", "Project Management"
];

export class AIJobAgent {
  private static instance: AIJobAgent | null = null;

  private constructor() {}

  static getInstance(): AIJobAgent {
    if (!AIJobAgent.instance) {
      AIJobAgent.instance = new AIJobAgent();
    }
    return AIJobAgent.instance;
  }

  static async findMatchingJobs(userProfile: UserProfile, resumeText: string): Promise<JobMatch[]> {
    try {
      // Get active jobs
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "active");

      if (error) throw error;
      if (!jobs || jobs.length === 0) return [];

      // Get user's existing applications to filter out
      const { data: applications } = await supabase
        .from("applications")
        .select("job_id")
        .eq("applicant_id", userProfile.id);

      const appliedJobIds = new Set(applications?.map(app => app.job_id) || []);

      // Calculate matches for jobs not yet applied to
      const matches: JobMatch[] = [];
      for (const job of jobs) {
        if (appliedJobIds.has(job.id)) continue;

        const jobText = `${job.title} ${job.company} ${job.description} ${job.requirements}`;
        const { score } = this.calculateResumeJobMatch(resumeText, jobText);
        
        if (score > 60) { // Only include good matches
          const reason = this.generateSimpleMatchReason(score);
          matches.push({
            job: job as Job,
            score,
            reason,
            matchReason: reason // For backward compatibility
          });
        }
      }

      return matches.sort((a, b) => b.score - a.score).slice(0, 10);
    } catch (error) {
      console.error("Error finding matching jobs:", error);
      return [];
    }
  }

  static async autoApplyToJob(
    job: Job, 
    userProfile: UserProfile, 
    resumeUrl: string | null, 
    resumeText: string
  ): Promise<boolean> {
    try {
      // Check daily limit (simplified)
      const today = new Date().toISOString().split('T')[0];
      const dailyApplications = JSON.parse(
        localStorage.getItem(`daily_applications_${today}`) || '[]'
      );
      
      if (dailyApplications.length >= 5) {
        console.log("Daily application limit reached");
        return false;
      }

      // Generate cover letter
      const coverLetter = await this.generateBasicCoverLetter(job, userProfile, resumeText);
      if (!coverLetter) return false;

      // Submit application
      const { data, error } = await supabase
        .from("applications")
        .insert({
          job_id: job.id,
          applicant_id: userProfile.id,
          cover_letter: coverLetter,
          resume_url: resumeUrl,
          auto_applied: true,
          status: "pending"
        });

      if (error) throw error;

      // Track daily applications
      dailyApplications.push({
        jobId: job.id,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(`daily_applications_${today}`, JSON.stringify(dailyApplications));

      return true;
    } catch (error) {
      console.error("Error auto-applying to job:", error);
      return false;
    }
  }

  private static async generateBasicCoverLetter(
    job: Job, 
    userProfile: UserProfile, 
    resumeText: string
  ): Promise<string | null> {
    try {
      // Basic template-based cover letter generation
      const skills = this.extractSkillsFromText(resumeText);
      const relevantSkills = skills.slice(0, 5).join(", ");

      return `Dear ${job.company} Hiring Team,

I am writing to express my interest in the ${job.title} position. With my background in ${relevantSkills}, I believe I would be a valuable addition to your team.

My experience aligns well with your requirements, and I am excited about the opportunity to contribute to ${job.company}'s continued success.

Thank you for considering my application. I look forward to hearing from you.

Best regards,
${userProfile.first_name} ${userProfile.last_name}`;
    } catch (error) {
      console.error("Error generating cover letter:", error);
      return null;
    }
  }

  private static calculateResumeJobMatch(resumeText: string, jobText: string) {
    const resumeWords = resumeText.toLowerCase().split(/\s+/);
    const jobWords = jobText.toLowerCase().split(/\s+/);
    
    // Simple keyword matching
    let matchCount = 0;
    const totalJobWords = jobWords.length;
    
    for (const word of jobWords) {
      if (resumeWords.includes(word) && word.length > 3) {
        matchCount++;
      }
    }
    
    const score = Math.min(95, (matchCount / totalJobWords) * 100 * 3);
    
    return {
      score: Math.round(score),
      details: { matchCount, totalJobWords }
    };
  }

  private static extractSkillsFromText(text: string): string[] {
    const extractedSkills: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const skill of SKILL_KEYWORDS) {
      if (lowerText.includes(skill.toLowerCase())) {
        extractedSkills.push(skill);
      }
    }
    
    return extractedSkills;
  }

  private static generateSimpleMatchReason(score: number): string {
    if (score >= 90) return "Excellent match - Strong alignment with requirements";
    if (score >= 80) return "Very good match - Good skill alignment";
    if (score >= 70) return "Good match - Relevant experience found";
    return "Decent match - Some relevant skills identified";
  }

  static isProfileReadyForAgent(profile: UserProfile | null, resumeText: string | null): boolean {
    if (!profile || !resumeText) return false;
    if (!profile.first_name || !profile.last_name) return false;
    if (resumeText.length < 100) return false;
    return true;
  }

  static async getAgentStats(userId: string) {
    try {
      // Get applications count
      const { data: applications } = await supabase
        .from("applications")
        .select("id, status, created_at")
        .eq("applicant_id", userId)
        .eq("auto_applied", true);

      const totalApplications = applications?.length || 0;
      const successfulApplications = applications?.filter(app => 
        app.status === 'accepted' || app.status === 'interviewed'
      ).length || 0;

      return {
        totalAutoApplications: totalApplications,
        successfulApplications,
        successRate: totalApplications > 0 ? (successfulApplications / totalApplications) * 100 : 0,
        lastActivity: applications?.[0]?.created_at || null,
        applicationsByMonth: [] // For backward compatibility
      };
    } catch (error) {
      console.error("Error getting agent stats:", error);
      return {
        totalAutoApplications: 0,
        successfulApplications: 0,
        successRate: 0,
        lastActivity: null,
        applicationsByMonth: []
      };
    }
  }

  static async analyzeJobMarketTrends() {
    try {
      const { data: jobs } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "active");

      if (!jobs || jobs.length === 0) {
        return {
          totalActiveJobs: 0,
          topSkills: [],
          topCompanies: [],
          averageSalary: "Not available",
          topLocations: [],
          jobTypes: [],
          error: null
        };
      }

      // Analyze skills mentioned in job descriptions
      const skillCounts: Record<string, number> = {};
      const companyCounts: Record<string, number> = {};

      for (const job of jobs) {
        const jobText = `${job.description} ${job.requirements}`.toLowerCase();
        
        // Count skills
        for (const skill of SKILL_KEYWORDS) {
          if (jobText.includes(skill.toLowerCase())) {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          }
        }
        
        // Count companies
        companyCounts[job.company] = (companyCounts[job.company] || 0) + 1;
      }

      const topSkills = Object.entries(skillCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, count }));

      const topCompanies = Object.entries(companyCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([company, jobs]) => ({ company, jobs }));

      return {
        totalActiveJobs: jobs.length,
        topSkills,
        topCompanies,
        averageSalary: "Market rate varies by role",
        topLocations: [], // For backward compatibility
        jobTypes: [], // For backward compatibility
        error: null
      };
    } catch (error) {
      console.error("Error analyzing job market trends:", error);
      return {
        totalActiveJobs: 0,
        topSkills: [],
        topCompanies: [],
        averageSalary: "Not available",
        topLocations: [],
        jobTypes: [],
        error: null
      };
    }
  }
}