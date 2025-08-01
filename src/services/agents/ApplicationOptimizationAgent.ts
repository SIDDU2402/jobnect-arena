import { supabase } from "@/integrations/supabase/client";
import { Job, UserProfile } from "@/types/job";
import { calculateCosineSimilarity } from "@/utils/skillsAnalysis";

export interface ApplicationOptimizationResult {
  optimizedCoverLetter: {
    content: string;
    personalizedElements: string[];
    atsOptimization: {
      keywordMatch: number;
      readabilityScore: number;
      structureScore: number;
    };
  };
  resumeOptimization: {
    suggestions: Array<{
      type: 'keyword' | 'structure' | 'content' | 'formatting';
      priority: 'high' | 'medium' | 'low';
      description: string;
      impact: number;
    }>;
    atsCompatibility: {
      score: number;
      issues: string[];
      improvements: string[];
    };
  };
  applicationTiming: {
    optimalTime: string;
    reasoning: string;
    competitionLevel: 'low' | 'medium' | 'high';
  };
  successPrediction: {
    probability: number;
    factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      weight: number;
    }>;
    comparisonToBenchmark: number;
  };
  followUpStrategy: {
    timeline: Array<{
      action: string;
      timing: string;
      message: string;
    }>;
    personalizedTips: string[];
  };
}

export class ApplicationOptimizationAgent {
  async execute(payload: {
    userProfile: UserProfile;
    job: Job;
    resumeText: string;
    existingCoverLetter?: string;
  }): Promise<ApplicationOptimizationResult> {
    const { userProfile, job, resumeText, existingCoverLetter } = payload;

    try {
      // Get historical performance data
      const historicalData = await this.getHistoricalPerformance(userProfile.id);
      
      // Generate optimized cover letter
      const optimizedCoverLetter = await this.generateOptimizedCoverLetter(
        userProfile, 
        job, 
        resumeText, 
        existingCoverLetter,
        historicalData
      );

      // Optimize resume recommendations
      const resumeOptimization = await this.optimizeResume(resumeText, job, historicalData);

      // Determine optimal application timing
      const applicationTiming = await this.optimizeApplicationTiming(job);

      // Predict success probability
      const successPrediction = await this.predictSuccess(
        userProfile, 
        job, 
        resumeText, 
        historicalData
      );

      // Generate follow-up strategy
      const followUpStrategy = this.generateFollowUpStrategy(job, userProfile);

      const result: ApplicationOptimizationResult = {
        optimizedCoverLetter,
        resumeOptimization,
        applicationTiming,
        successPrediction,
        followUpStrategy
      };

      // Log optimization session
      await this.logOptimizationSession(userProfile.id, job.id, result);

      return result;
    } catch (error) {
      console.error("ApplicationOptimizationAgent execution failed:", error);
      throw error;
    }
  }

  private async getHistoricalPerformance(userId: string): Promise<any> {
    const { data: applications } = await supabase
      .from('applications')
      .select(`
        *,
        jobs!applications_job_id_fkey(title, company, requirements)
      `)
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    const successfulApps = (applications || []).filter(app => app.status === 'approved');
    const rejectedApps = (applications || []).filter(app => app.status === 'rejected');

    return {
      totalApplications: applications?.length || 0,
      successfulApplications: successfulApps.length,
      rejectedApplications: rejectedApps.length,
      averageAtsScore: this.calculateAverageAtsScore(applications || []),
      successPatterns: this.analyzeSuccessPatterns(successfulApps),
      rejectionPatterns: this.analyzeRejectionPatterns(rejectedApps)
    };
  }

  private async generateOptimizedCoverLetter(
    userProfile: UserProfile,
    job: Job,
    resumeText: string,
    existingCoverLetter?: string,
    historicalData?: any
  ): Promise<ApplicationOptimizationResult['optimizedCoverLetter']> {
    // Extract key requirements from job posting
    const keyRequirements = this.extractKeyRequirements(job);
    
    // Analyze successful cover letter patterns
    const successPatterns = historicalData?.successPatterns || {};
    
    // Generate personalized elements
    const personalizedElements = await this.generatePersonalizedElements(
      userProfile, 
      job, 
      resumeText
    );

    // Create optimized cover letter using Supabase function
    const { data: coverLetterResponse } = await supabase.functions.invoke('generate-cover-letter', {
      body: {
        jobDescription: `${job.title}. ${job.description} ${job.requirements}`,
        userProfile,
        resumeText,
        optimization: {
          keyRequirements,
          personalizedElements,
          successPatterns,
          existingCoverLetter
        },
        enhanced: true
      }
    });

    const content = coverLetterResponse?.coverLetter || '';

    // Calculate ATS optimization metrics
    const atsOptimization = this.calculateAtsOptimization(content, job);

    return {
      content,
      personalizedElements,
      atsOptimization
    };
  }

  private async optimizeResume(
    resumeText: string, 
    job: Job, 
    historicalData: any
  ): Promise<ApplicationOptimizationResult['resumeOptimization']> {
    const suggestions: Array<{
      type: 'keyword' | 'structure' | 'content' | 'formatting';
      priority: 'high' | 'medium' | 'low';
      description: string;
      impact: number;
    }> = [];

    // Keyword optimization analysis
    const keywordAnalysis = this.analyzeKeywordOptimization(resumeText, job);
    if (keywordAnalysis.missingKeywords.length > 0) {
      suggestions.push({
        type: 'keyword',
        priority: 'high',
        description: `Add key terms: ${keywordAnalysis.missingKeywords.slice(0, 5).join(', ')}`,
        impact: 85
      });
    }

    // Structure analysis
    const structureAnalysis = this.analyzeResumeStructure(resumeText);
    if (structureAnalysis.issues.length > 0) {
      structureAnalysis.issues.forEach(issue => {
        suggestions.push({
          type: 'structure',
          priority: issue.priority,
          description: issue.description,
          impact: issue.impact
        });
      });
    }

    // Content optimization
    const contentAnalysis = this.analyzeResumeContent(resumeText, job);
    contentAnalysis.suggestions.forEach(suggestion => {
      suggestions.push(suggestion);
    });

    // ATS compatibility assessment
    const atsCompatibility = this.assessAtsCompatibility(resumeText);

    return {
      suggestions: suggestions.sort((a, b) => b.impact - a.impact),
      atsCompatibility
    };
  }

  private async optimizeApplicationTiming(
    job: Job
  ): Promise<ApplicationOptimizationResult['applicationTiming']> {
    // Analyze application patterns for this job
    const { data: existingApplications } = await supabase
      .from('applications')
      .select('created_at')
      .eq('job_id', job.id);

    const applicationCount = existingApplications?.length || 0;
    const jobAge = Math.floor((Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24));

    let optimalTime = 'Apply now';
    let reasoning = 'Good timing for application';
    let competitionLevel: 'low' | 'medium' | 'high' = 'medium';

    if (applicationCount < 5 && jobAge < 7) {
      optimalTime = 'Apply immediately';
      reasoning = 'Early application window with low competition';
      competitionLevel = 'low';
    } else if (applicationCount > 20) {
      optimalTime = 'Consider waiting for similar opportunities';
      reasoning = 'High competition - focus on optimization';
      competitionLevel = 'high';
    }

    return {
      optimalTime,
      reasoning,
      competitionLevel
    };
  }

  private async predictSuccess(
    userProfile: UserProfile,
    job: Job,
    resumeText: string,
    historicalData: any
  ): Promise<ApplicationOptimizationResult['successPrediction']> {
    const factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      weight: number;
    }> = [];

    // Skill match factor
    const skillMatch = this.calculateSkillMatch(userProfile, job);
    factors.push({
      factor: 'Skills alignment',
      impact: skillMatch > 0.7 ? 'positive' : skillMatch > 0.4 ? 'neutral' : 'negative',
      weight: skillMatch
    });

    // Experience factor
    const experienceMatch = this.calculateExperienceMatch(resumeText, job);
    factors.push({
      factor: 'Experience level',
      impact: experienceMatch > 0.8 ? 'positive' : experienceMatch > 0.5 ? 'neutral' : 'negative',
      weight: experienceMatch
    });

    // Historical performance factor
    const historicalSuccess = historicalData.totalApplications > 0 
      ? historicalData.successfulApplications / historicalData.totalApplications 
      : 0.5;
    factors.push({
      factor: 'Historical success rate',
      impact: historicalSuccess > 0.3 ? 'positive' : historicalSuccess > 0.15 ? 'neutral' : 'negative',
      weight: historicalSuccess
    });

    // Profile completeness factor
    const profileCompleteness = this.calculateProfileCompleteness(userProfile);
    factors.push({
      factor: 'Profile completeness',
      impact: profileCompleteness > 0.8 ? 'positive' : 'neutral',
      weight: profileCompleteness
    });

    // Calculate overall probability
    const probability = factors.reduce((acc, factor) => acc + factor.weight, 0) / factors.length;
    const comparisonToBenchmark = ((probability - 0.6) / 0.6) * 100; // Compare to 60% benchmark

    return {
      probability: Math.round(probability * 100),
      factors,
      comparisonToBenchmark: Math.round(comparisonToBenchmark)
    };
  }

  private generateFollowUpStrategy(
    job: Job, 
    userProfile: UserProfile
  ): ApplicationOptimizationResult['followUpStrategy'] {
    const timeline = [
      {
        action: 'Submit application',
        timing: 'Immediately',
        message: 'Complete and submit your optimized application'
      },
      {
        action: 'LinkedIn connection',
        timing: '1-2 days after application',
        message: 'Connect with hiring manager or team members with a personalized note'
      },
      {
        action: 'Follow-up email',
        timing: '1 week after application',
        message: 'Send a brief follow-up expressing continued interest'
      },
      {
        action: 'Value-add follow-up',
        timing: '2 weeks after application',
        message: 'Share relevant industry insights or portfolio updates'
      }
    ];

    const personalizedTips = [
      `Research ${job.company} recent news and mention it in your follow-up`,
      'Prepare for potential technical questions based on job requirements',
      'Practice explaining your experience with specific examples',
      'Prepare thoughtful questions about the role and company culture'
    ];

    return { timeline, personalizedTips };
  }

  // Helper methods
  private extractKeyRequirements(job: Job): string[] {
    const text = job.requirements.toLowerCase();
    const patterns = [
      /required:?\s*([^.!?]+)/gi,
      /must have:?\s*([^.!?]+)/gi,
      /essential:?\s*([^.!?]+)/gi
    ];

    const requirements: string[] = [];
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        requirements.push(match[1].trim());
      }
    });

    return requirements;
  }

  private async generatePersonalizedElements(
    userProfile: UserProfile,
    job: Job,
    resumeText: string
  ): Promise<string[]> {
    const elements: string[] = [];

    // Company-specific elements
    elements.push(`Specific interest in ${job.company}'s mission and values`);
    
    // Role-specific elements
    elements.push(`Direct experience relevant to ${job.title} responsibilities`);
    
    // Skill-specific elements
    const matchingSkills = (userProfile.skills || []).filter(skill =>
      job.requirements.toLowerCase().includes(skill.toLowerCase())
    );
    if (matchingSkills.length > 0) {
      elements.push(`Demonstrated expertise in ${matchingSkills.slice(0, 3).join(', ')}`);
    }

    return elements;
  }

  private calculateAtsOptimization(content: string, job: Job): {
    keywordMatch: number;
    readabilityScore: number;
    structureScore: number;
  } {
    // Keyword matching
    const jobKeywords = this.extractKeywords(job.requirements);
    const contentKeywords = this.extractKeywords(content);
    const matchingKeywords = jobKeywords.filter(keyword => 
      contentKeywords.includes(keyword)
    );
    const keywordMatch = jobKeywords.length > 0 
      ? (matchingKeywords.length / jobKeywords.length) * 100 
      : 0;

    // Readability (simplified)
    const sentences = content.split(/[.!?]+/).filter(Boolean);
    const avgSentenceLength = content.split(' ').length / sentences.length;
    const readabilityScore = Math.max(0, 100 - (avgSentenceLength - 15) * 2);

    // Structure (check for standard elements)
    const hasIntro = content.toLowerCase().includes('dear') || content.toLowerCase().includes('hello');
    const hasClosing = content.toLowerCase().includes('sincerely') || content.toLowerCase().includes('best regards');
    const hasBody = content.length > 200;
    const structureScore = (hasIntro ? 33 : 0) + (hasBody ? 34 : 0) + (hasClosing ? 33 : 0);

    return {
      keywordMatch: Math.round(keywordMatch),
      readabilityScore: Math.round(readabilityScore),
      structureScore
    };
  }

  private analyzeKeywordOptimization(resumeText: string, job: Job): {
    missingKeywords: string[];
    presentKeywords: string[];
  } {
    const jobKeywords = this.extractKeywords(job.requirements);
    const resumeKeywords = this.extractKeywords(resumeText);
    
    return {
      missingKeywords: jobKeywords.filter(keyword => !resumeKeywords.includes(keyword)),
      presentKeywords: jobKeywords.filter(keyword => resumeKeywords.includes(keyword))
    };
  }

  private analyzeResumeStructure(resumeText: string): {
    issues: Array<{
      priority: 'high' | 'medium' | 'low';
      description: string;
      impact: number;
    }>;
  } {
    const issues: Array<{
      priority: 'high' | 'medium' | 'low';
      description: string;
      impact: number;
    }> = [];

    // Check for contact information
    if (!resumeText.toLowerCase().includes('@')) {
      issues.push({
        priority: 'high',
        description: 'Add email address for contact',
        impact: 90
      });
    }

    // Check for experience section
    if (!resumeText.toLowerCase().includes('experience')) {
      issues.push({
        priority: 'high',
        description: 'Include clear work experience section',
        impact: 85
      });
    }

    // Check length
    if (resumeText.length < 500) {
      issues.push({
        priority: 'medium',
        description: 'Resume content appears too brief',
        impact: 70
      });
    }

    return { issues };
  }

  private analyzeResumeContent(resumeText: string, job: Job): {
    suggestions: Array<{
      type: 'content';
      priority: 'high' | 'medium' | 'low';
      description: string;
      impact: number;
    }>;
  } {
    const suggestions: Array<{
      type: 'content';
      priority: 'high' | 'medium' | 'low';
      description: string;
      impact: number;
    }> = [];

    // Check for quantified achievements
    const hasNumbers = /\d+/.test(resumeText);
    if (!hasNumbers) {
      suggestions.push({
        type: 'content',
        priority: 'high',
        description: 'Add quantified achievements and metrics',
        impact: 80
      });
    }

    // Check for action verbs
    const actionVerbs = ['developed', 'implemented', 'managed', 'led', 'created', 'improved'];
    const hasActionVerbs = actionVerbs.some(verb => resumeText.toLowerCase().includes(verb));
    if (!hasActionVerbs) {
      suggestions.push({
        type: 'content',
        priority: 'medium',
        description: 'Use stronger action verbs to describe accomplishments',
        impact: 75
      });
    }

    return { suggestions };
  }

  private assessAtsCompatibility(resumeText: string): {
    score: number;
    issues: string[];
    improvements: string[];
  } {
    const issues: string[] = [];
    const improvements: string[] = [];
    let score = 100;

    // Check for formatting issues
    if (resumeText.includes('•') || resumeText.includes('◦')) {
      issues.push('Special bullet characters may not parse correctly');
      score -= 10;
    }

    // Check for standard section headers
    const standardHeaders = ['experience', 'education', 'skills'];
    const missingHeaders = standardHeaders.filter(header => 
      !resumeText.toLowerCase().includes(header)
    );
    
    if (missingHeaders.length > 0) {
      issues.push(`Missing standard sections: ${missingHeaders.join(', ')}`);
      score -= missingHeaders.length * 15;
    }

    // Improvements
    improvements.push('Use standard fonts like Arial or Calibri');
    improvements.push('Ensure consistent formatting throughout');
    improvements.push('Save as both PDF and Word document');

    return {
      score: Math.max(0, score),
      issues,
      improvements
    };
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    return [...new Set(words)];
  }

  private calculateSkillMatch(userProfile: UserProfile, job: Job): number {
    const userSkills = (userProfile.skills || []).map(s => s.toLowerCase());
    const jobText = `${job.requirements} ${job.description}`.toLowerCase();
    
    const matchingSkills = userSkills.filter(skill => jobText.includes(skill));
    return userSkills.length > 0 ? matchingSkills.length / userSkills.length : 0;
  }

  private calculateExperienceMatch(resumeText: string, job: Job): number {
    // Simplified experience matching
    const resumeExp = this.extractExperienceYears(resumeText);
    const jobExp = this.extractRequiredExperience(job.requirements);
    
    if (jobExp === 0) return 0.8; // No specific requirement
    if (resumeExp >= jobExp) return 1.0;
    if (resumeExp >= jobExp * 0.8) return 0.9;
    if (resumeExp >= jobExp * 0.6) return 0.7;
    return 0.5;
  }

  private extractExperienceYears(resumeText: string): number {
    const matches = resumeText.match(/(\d+)\s*years?\s*(?:of\s*)?experience/gi);
    if (!matches) return 0;
    
    const years = matches.map(match => parseInt(match.match(/\d+/)?.[0] || '0'));
    return Math.max(...years);
  }

  private extractRequiredExperience(requirements: string): number {
    const matches = requirements.match(/(\d+)\s*years?\s*(?:of\s*)?experience/gi);
    if (!matches) return 0;
    
    const years = matches.map(match => parseInt(match.match(/\d+/)?.[0] || '0'));
    return Math.max(...years);
  }

  private calculateProfileCompleteness(userProfile: UserProfile): number {
    let completeness = 0.2; // Base score
    
    if (userProfile.skills && userProfile.skills.length > 3) completeness += 0.2;
    if (userProfile.professional_summary && userProfile.professional_summary.length > 50) completeness += 0.2;
    if (userProfile.linkedin_url) completeness += 0.15;
    if (userProfile.github_url) completeness += 0.15;
    if (userProfile.resume_url) completeness += 0.1;
    
    return Math.min(1.0, completeness);
  }

  private calculateAverageAtsScore(applications: any[]): number {
    const scoresWithAts = applications.filter(app => app.ats_score !== null);
    if (scoresWithAts.length === 0) return 0;
    
    return scoresWithAts.reduce((sum, app) => sum + app.ats_score, 0) / scoresWithAts.length;
  }

  private analyzeSuccessPatterns(successfulApps: any[]): any {
    // Analyze patterns in successful applications
    return {
      averageAtsScore: this.calculateAverageAtsScore(successfulApps),
      commonFactors: ['Complete profile', 'Tailored applications', 'Quick response time']
    };
  }

  private analyzeRejectionPatterns(rejectedApps: any[]): any {
    // Analyze patterns in rejected applications
    return {
      commonIssues: ['Low ATS score', 'Generic applications', 'Missing requirements']
    };
  }

  private async logOptimizationSession(
    userId: string, 
    jobId: string, 
    result: ApplicationOptimizationResult
  ): Promise<void> {
    try {
      await supabase.from('agent_analytics').insert({
        agent_type: 'application_optimization',
        user_id: userId,
        session_data: {
          job_id: jobId,
          success_prediction: result.successPrediction.probability,
          optimization_suggestions: result.resumeOptimization.suggestions.length,
          ats_keyword_match: result.optimizedCoverLetter.atsOptimization.keywordMatch,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log optimization session:', error);
    }
  }
}