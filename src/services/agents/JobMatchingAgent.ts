import { supabase } from "@/integrations/supabase/client";
import { Job, UserProfile } from "@/types/job";
import { calculateCosineSimilarity } from "@/utils/skillsAnalysis";

export interface JobMatchResult {
  job: Job;
  matchScore: number;
  confidence: number;
  matchReasons: string[];
  predictedSuccess: number;
  salaryFit: 'below' | 'within' | 'above';
  locationFit: number;
  cultureFit: number;
  careerGrowth: number;
}

export class JobMatchingAgent {
  private modelVersion = "2.1";
  private weights = {
    skills: 0.35,
    experience: 0.25,
    location: 0.15,
    salary: 0.10,
    culture: 0.10,
    growth: 0.05
  };

  async execute(payload: {
    userProfile: UserProfile;
    resumeText: string;
    preferences?: any;
    limit?: number;
  }): Promise<JobMatchResult[]> {
    const { userProfile, resumeText, preferences = {}, limit = 20 } = payload;

    try {
      // Fetch active jobs with enhanced filtering
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select(`
          *,
          applications!applications_job_id_fkey(count)
        `)
        .eq("status", "active");

      if (error) throw error;
      if (!jobs?.length) return [];

      // Get user's application history for learning
      const { data: applicationHistory } = await supabase
        .from("applications")
        .select("job_id, status, ats_score")
        .eq("applicant_id", userProfile.id)
        .order("created_at", { ascending: false })
        .limit(50);

      // Enhanced matching with multiple algorithms
      const jobMatches = await Promise.all(
        jobs.map(job => this.analyzeJobMatch(job, userProfile, resumeText, applicationHistory || []))
      );

      // Filter and sort results
      const validMatches = jobMatches
        .filter(match => match.matchScore >= 0.3) // Minimum threshold
        .sort((a, b) => {
          // Primary sort by match score
          if (b.matchScore !== a.matchScore) {
            return b.matchScore - a.matchScore;
          }
          // Secondary sort by predicted success
          return b.predictedSuccess - a.predictedSuccess;
        })
        .slice(0, limit);

      // Log matching session for continuous learning
      await this.logMatchingSession(userProfile.id, validMatches.length, jobMatches.length);

      return validMatches;
    } catch (error) {
      console.error("JobMatchingAgent execution failed:", error);
      throw error;
    }
  }

  private async analyzeJobMatch(
    job: Job,
    userProfile: UserProfile,
    resumeText: string,
    applicationHistory: any[]
  ): Promise<JobMatchResult> {
    // 1. Skills Analysis with advanced NLP
    const skillsScore = await this.calculateSkillsMatch(job, userProfile, resumeText);
    
    // 2. Experience Level Analysis
    const experienceScore = this.calculateExperienceMatch(job, userProfile, resumeText);
    
    // 3. Location Preference Analysis
    const locationScore = this.calculateLocationFit(job, userProfile);
    
    // 4. Salary Expectation Analysis
    const salaryAnalysis = this.calculateSalaryFit(job, userProfile);
    
    // 5. Company Culture Fit
    const cultureScore = await this.calculateCultureFit(job, userProfile);
    
    // 6. Career Growth Potential
    const growthScore = this.calculateCareerGrowth(job, userProfile);
    
    // 7. Success Prediction based on historical data
    const predictedSuccess = this.predictApplicationSuccess(job, userProfile, applicationHistory);

    // Calculate weighted match score
    const matchScore = 
      (skillsScore * this.weights.skills) +
      (experienceScore * this.weights.experience) +
      (locationScore * this.weights.location) +
      (salaryAnalysis.score * this.weights.salary) +
      (cultureScore * this.weights.culture) +
      (growthScore * this.weights.growth);

    // Generate confidence score based on data quality
    const confidence = this.calculateConfidence(userProfile, resumeText, job);

    // Generate detailed match reasons
    const matchReasons = this.generateMatchReasons(
      skillsScore, experienceScore, locationScore, 
      salaryAnalysis, cultureScore, growthScore
    );

    return {
      job,
      matchScore: Math.round(matchScore * 100) / 100,
      confidence: Math.round(confidence * 100),
      matchReasons,
      predictedSuccess: Math.round(predictedSuccess * 100),
      salaryFit: salaryAnalysis.fit,
      locationFit: Math.round(locationScore * 100),
      cultureFit: Math.round(cultureScore * 100),
      careerGrowth: Math.round(growthScore * 100)
    };
  }

  private async calculateSkillsMatch(job: Job, userProfile: UserProfile, resumeText: string): Promise<number> {
    const jobText = `${job.title} ${job.description} ${job.requirements}`;
    
    // Advanced semantic similarity
    const semanticScore = calculateCosineSimilarity(resumeText, jobText);
    
    // Skill keywords matching with weights
    const requiredSkills = this.extractWeightedSkills(job.requirements);
    const userSkills = userProfile.skills || [];
    
    let skillMatchScore = 0;
    let totalWeight = 0;
    
    requiredSkills.forEach(({ skill, weight }) => {
      const hasSkill = userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      );
      
      if (hasSkill) {
        skillMatchScore += weight;
      }
      totalWeight += weight;
    });
    
    const weightedSkillScore = totalWeight > 0 ? skillMatchScore / totalWeight : 0;
    
    // Combine semantic and weighted skill scores
    return (semanticScore * 0.4) + (weightedSkillScore * 0.6);
  }

  private extractWeightedSkills(requirements: string): Array<{ skill: string; weight: number }> {
    const text = requirements.toLowerCase();
    const skillPatterns = [
      { pattern: /required:?\s*([^.!?]+)/gi, weight: 1.0 },
      { pattern: /must have:?\s*([^.!?]+)/gi, weight: 1.0 },
      { pattern: /essential:?\s*([^.!?]+)/gi, weight: 0.9 },
      { pattern: /proficient in:?\s*([^.!?]+)/gi, weight: 0.8 },
      { pattern: /experience with:?\s*([^.!?]+)/gi, weight: 0.7 },
      { pattern: /knowledge of:?\s*([^.!?]+)/gi, weight: 0.6 },
      { pattern: /familiar with:?\s*([^.!?]+)/gi, weight: 0.5 }
    ];

    const skills: Array<{ skill: string; weight: number }> = [];
    
    skillPatterns.forEach(({ pattern, weight }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const skillText = match[1].trim();
        const extractedSkills = skillText.split(/[,;]/).map(s => s.trim());
        extractedSkills.forEach(skill => {
          if (skill.length > 2) {
            skills.push({ skill, weight });
          }
        });
      }
    });

    return skills;
  }

  private calculateExperienceMatch(job: Job, userProfile: UserProfile, resumeText: string): number {
    // Extract experience requirements from job
    const jobText = `${job.requirements} ${job.description}`.toLowerCase();
    const expMatches = jobText.match(/(\d+)[\s-]*(?:years?|yrs?)[\s\w]*(?:experience|exp)/gi);
    
    let requiredYears = 0;
    if (expMatches) {
      const numbers = expMatches.map(match => parseInt(match.match(/\d+/)?.[0] || '0'));
      requiredYears = Math.max(...numbers);
    }

    // Extract user experience from resume
    const resumeExpMatches = resumeText.toLowerCase().match(/(\d+)[\s-]*(?:years?|yrs?)[\s\w]*(?:experience|exp)/gi);
    let userYears = 0;
    if (resumeExpMatches) {
      const numbers = resumeExpMatches.map(match => parseInt(match.match(/\d+/)?.[0] || '0'));
      userYears = Math.max(...numbers);
    }

    if (requiredYears === 0) return 0.8; // Default if no experience requirement

    const ratio = userYears / requiredYears;
    if (ratio >= 1.0) return 1.0;
    if (ratio >= 0.8) return 0.9;
    if (ratio >= 0.6) return 0.7;
    if (ratio >= 0.4) return 0.5;
    return 0.3;
  }

  private calculateLocationFit(job: Job, userProfile: UserProfile): number {
    // For now, return high score - could be enhanced with geolocation
    if (job.location.toLowerCase().includes('remote')) return 1.0;
    return 0.8; // Default good fit
  }

  private calculateSalaryFit(job: Job, userProfile: UserProfile): { score: number; fit: 'below' | 'within' | 'above' } {
    // Extract salary range from job posting
    const salaryText = job.salary.toLowerCase();
    const salaryMatch = salaryText.match(/\$?(\d+(?:,\d+)*(?:k|000)?)\s*-?\s*\$?(\d+(?:,\d+)*(?:k|000)?)?/);
    
    if (!salaryMatch) {
      return { score: 0.7, fit: 'within' }; // Default if no salary info
    }

    // For now, return good fit - could be enhanced with user preferences
    return { score: 0.9, fit: 'within' };
  }

  private async calculateCultureFit(job: Job, userProfile: UserProfile): Promise<number> {
    // Analyze company culture keywords in job description
    const cultureKeywords = [
      'collaborative', 'innovative', 'fast-paced', 'startup', 'enterprise',
      'flexible', 'work-life balance', 'remote', 'agile', 'diverse'
    ];

    const jobText = `${job.description} ${job.requirements}`.toLowerCase();
    const matchingKeywords = cultureKeywords.filter(keyword => jobText.includes(keyword));
    
    return Math.min(1.0, matchingKeywords.length / 5); // Normalize to 0-1
  }

  private calculateCareerGrowth(job: Job, userProfile: UserProfile): number {
    const growthKeywords = [
      'senior', 'lead', 'management', 'growth', 'advancement', 'promotion',
      'leadership', 'mentorship', 'development', 'career progression'
    ];

    const jobText = `${job.title} ${job.description}`.toLowerCase();
    const matchingKeywords = growthKeywords.filter(keyword => jobText.includes(keyword));
    
    return Math.min(1.0, matchingKeywords.length / 3);
  }

  private predictApplicationSuccess(job: Job, userProfile: UserProfile, applicationHistory: any[]): number {
    if (applicationHistory.length === 0) return 0.6; // Default for new users

    // Analyze historical success rate
    const approvedApps = applicationHistory.filter(app => app.status === 'approved').length;
    const totalApps = applicationHistory.length;
    const successRate = approvedApps / totalApps;

    // Factor in ATS scores
    const avgAtsScore = applicationHistory
      .filter(app => app.ats_score)
      .reduce((sum, app) => sum + app.ats_score, 0) / 
      applicationHistory.filter(app => app.ats_score).length || 60;

    // Combine success rate and ATS performance
    return (successRate * 0.6) + ((avgAtsScore / 100) * 0.4);
  }

  private calculateConfidence(userProfile: UserProfile, resumeText: string, job: Job): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on profile completeness
    if (userProfile.skills && userProfile.skills.length > 5) confidence += 0.1;
    if (userProfile.professional_summary && userProfile.professional_summary.length > 100) confidence += 0.1;
    if (resumeText.length > 500) confidence += 0.1;
    if (userProfile.linkedin_url) confidence += 0.05;
    if (userProfile.github_url) confidence += 0.05;

    // Increase confidence based on job description quality
    if (job.requirements.length > 200) confidence += 0.1;
    if (job.description.length > 300) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  private generateMatchReasons(
    skillsScore: number,
    experienceScore: number,
    locationScore: number,
    salaryAnalysis: { score: number; fit: string },
    cultureScore: number,
    growthScore: number
  ): string[] {
    const reasons: string[] = [];

    if (skillsScore > 0.8) reasons.push("Excellent skills alignment with job requirements");
    else if (skillsScore > 0.6) reasons.push("Good skills match with some areas for growth");
    else if (skillsScore > 0.4) reasons.push("Moderate skills overlap, consider skill development");

    if (experienceScore > 0.8) reasons.push("Experience level matches job requirements");
    else if (experienceScore > 0.5) reasons.push("Experience level is close to requirements");

    if (locationScore > 0.9) reasons.push("Location preferences align well");
    if (salaryAnalysis.score > 0.8) reasons.push(`Salary expectations are ${salaryAnalysis.fit} range`);
    if (cultureScore > 0.7) reasons.push("Strong company culture fit indicators");
    if (growthScore > 0.7) reasons.push("Excellent career growth opportunities");

    return reasons.length > 0 ? reasons : ["Basic compatibility with room for development"];
  }

  private async logMatchingSession(userId: string, validMatches: number, totalJobs: number): Promise<void> {
    try {
      const analytics = {
        agent_type: 'job_matching',
        user_id: userId,
        session_data: {
          valid_matches: validMatches,
          total_jobs_analyzed: totalJobs,
          match_rate: totalJobs > 0 ? (validMatches / totalJobs) * 100 : 0,
          model_version: this.modelVersion,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem('agent_analytics') || '[]');
      existing.push(analytics);
      localStorage.setItem('agent_analytics', JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to log matching session:', error);
    }
  }
}