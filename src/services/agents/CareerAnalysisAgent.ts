import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/job";

export interface CareerAnalysisResult {
  currentLevel: 'entry' | 'mid' | 'senior' | 'executive';
  experienceYears: number;
  skillGaps: Array<{
    skill: string;
    importance: 'high' | 'medium' | 'low';
    marketDemand: number;
    learningPath: string[];
  }>;
  careerTrajectory: {
    nextRoles: Array<{
      title: string;
      timeToAchieve: string;
      requiredSkills: string[];
      salaryRange: string;
      probability: number;
    }>;
    fiveYearProjection: {
      potentialRoles: string[];
      salaryGrowth: number;
      marketOutlook: 'excellent' | 'good' | 'moderate' | 'challenging';
    };
  };
  strengths: string[];
  recommendations: Array<{
    type: 'skill_development' | 'networking' | 'experience' | 'certification';
    priority: 'high' | 'medium' | 'low';
    description: string;
    estimatedImpact: number;
  }>;
  marketPosition: {
    percentile: number;
    competitiveness: 'highly_competitive' | 'competitive' | 'moderate' | 'developing';
    uniqueValue: string[];
  };
}

export class CareerAnalysisAgent {
  async execute(payload: {
    userProfile: UserProfile;
    resumeText: string;
    targetRole?: string;
  }): Promise<CareerAnalysisResult> {
    const { userProfile, resumeText, targetRole } = payload;

    try {
      // Analyze current career level
      const currentLevel = this.analyzeCareerLevel(resumeText, userProfile);
      const experienceYears = this.extractExperienceYears(resumeText);

      // Get market data for analysis
      const marketData = await this.getMarketData(userProfile.skills || []);
      
      // Analyze skill gaps
      const skillGaps = await this.analyzeSkillGaps(userProfile, resumeText, targetRole);
      
      // Project career trajectory
      const careerTrajectory = await this.projectCareerTrajectory(
        currentLevel, 
        userProfile, 
        experienceYears,
        targetRole
      );
      
      // Identify strengths
      const strengths = this.identifyStrengths(userProfile, resumeText);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        skillGaps, 
        currentLevel, 
        careerTrajectory,
        marketData
      );
      
      // Assess market position
      const marketPosition = await this.assessMarketPosition(userProfile, experienceYears);

      const result: CareerAnalysisResult = {
        currentLevel,
        experienceYears,
        skillGaps,
        careerTrajectory,
        strengths,
        recommendations,
        marketPosition
      };

      // Log analysis for learning
      await this.logAnalysis(userProfile.id, result);

      return result;
    } catch (error) {
      console.error("CareerAnalysisAgent execution failed:", error);
      throw error;
    }
  }

  private analyzeCareerLevel(resumeText: string, userProfile: UserProfile): 'entry' | 'mid' | 'senior' | 'executive' {
    const text = resumeText.toLowerCase();
    const experienceYears = this.extractExperienceYears(resumeText);
    
    // Look for leadership indicators
    const leadershipKeywords = ['managed', 'led', 'directed', 'supervised', 'coordinated', 'mentored'];
    const hasLeadership = leadershipKeywords.some(keyword => text.includes(keyword));
    
    // Look for senior-level responsibilities
    const seniorKeywords = ['strategy', 'architecture', 'design', 'strategic', 'architect', 'senior'];
    const hasSeniorResponsibilities = seniorKeywords.some(keyword => text.includes(keyword));
    
    // Look for executive indicators
    const executiveKeywords = ['ceo', 'cto', 'vp', 'director', 'head of', 'chief'];
    const hasExecutiveRole = executiveKeywords.some(keyword => text.includes(keyword));

    if (hasExecutiveRole || experienceYears > 15) return 'executive';
    if (hasSeniorResponsibilities || hasLeadership || experienceYears > 7) return 'senior';
    if (experienceYears > 2) return 'mid';
    return 'entry';
  }

  private extractExperienceYears(resumeText: string): number {
    const expPatterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/gi,
      /(\d+)\+?\s*yrs?\s*(?:of\s*)?(?:experience|exp)/gi,
      /(\d+)\+?\s*years?\s*in/gi
    ];

    let maxYears = 0;
    
    expPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(resumeText)) !== null) {
        const years = parseInt(match[1]);
        maxYears = Math.max(maxYears, years);
      }
    });

    return maxYears;
  }

  private async getMarketData(skills: string[]): Promise<any> {
    try {
      // Get job market data for user's skills
      const { data: jobs } = await supabase
        .from('jobs')
        .select('requirements, salary, type')
        .eq('status', 'active')
        .limit(100);

      if (!jobs) return {};

      // Analyze skill demand
      const skillDemand: Record<string, number> = {};
      
      jobs.forEach(job => {
        const jobText = job.requirements.toLowerCase();
        skills.forEach(skill => {
          if (jobText.includes(skill.toLowerCase())) {
            skillDemand[skill] = (skillDemand[skill] || 0) + 1;
          }
        });
      });

      return { skillDemand, totalJobs: jobs.length };
    } catch (error) {
      console.error('Failed to get market data:', error);
      return {};
    }
  }

  private async analyzeSkillGaps(
    userProfile: UserProfile, 
    resumeText: string, 
    targetRole?: string
  ): Promise<CareerAnalysisResult['skillGaps']> {
    const userSkills = (userProfile.skills || []).map(s => s.toLowerCase());
    
    // Get trending skills from job market
    const { data: recentJobs } = await supabase
      .from('jobs')
      .select('requirements, title')
      .eq('status', 'active')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(50);

    if (!recentJobs) return [];

    // Extract required skills from job postings
    const skillFrequency: Record<string, number> = {};
    const commonSkills = [
      'python', 'javascript', 'react', 'node.js', 'aws', 'docker', 'kubernetes',
      'sql', 'mongodb', 'typescript', 'vue', 'angular', 'java', 'c#', 'go',
      'machine learning', 'ai', 'data science', 'devops', 'agile', 'scrum'
    ];

    recentJobs.forEach(job => {
      const text = `${job.title} ${job.requirements}`.toLowerCase();
      commonSkills.forEach(skill => {
        if (text.includes(skill)) {
          skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
        }
      });
    });

    // Find missing high-demand skills
    const skillGaps = Object.entries(skillFrequency)
      .filter(([skill]) => !userSkills.includes(skill))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, demand]) => ({
        skill,
        importance: demand > 20 ? 'high' as const : demand > 10 ? 'medium' as const : 'low' as const,
        marketDemand: Math.round((demand / recentJobs.length) * 100),
        learningPath: this.generateLearningPath(skill)
      }));

    return skillGaps;
  }

  private generateLearningPath(skill: string): string[] {
    const learningPaths: Record<string, string[]> = {
      'python': ['Python Basics', 'Data Structures', 'Web Development with Flask/Django', 'Advanced Python'],
      'javascript': ['JS Fundamentals', 'ES6+', 'Async Programming', 'Node.js'],
      'react': ['HTML/CSS/JS', 'React Basics', 'State Management', 'Advanced React Patterns'],
      'aws': ['AWS Basics', 'EC2 & S3', 'Lambda & Serverless', 'AWS Certified Solutions Architect'],
      'docker': ['Containerization Basics', 'Docker Fundamentals', 'Docker Compose', 'Kubernetes'],
      'machine learning': ['Statistics & Math', 'Python for ML', 'ML Algorithms', 'Deep Learning'],
      'default': ['Fundamentals', 'Intermediate Concepts', 'Advanced Topics', 'Certification']
    };

    return learningPaths[skill.toLowerCase()] || learningPaths['default'];
  }

  private async projectCareerTrajectory(
    currentLevel: string,
    userProfile: UserProfile,
    experienceYears: number,
    targetRole?: string
  ): Promise<CareerAnalysisResult['careerTrajectory']> {
    const trajectoryMap: Record<string, any> = {
      'entry': {
        nextRoles: [
          {
            title: 'Mid-Level Developer',
            timeToAchieve: '2-3 years',
            requiredSkills: ['advanced programming', 'system design basics'],
            salaryRange: '$70K - $100K',
            probability: 85
          },
          {
            title: 'Specialist Role',
            timeToAchieve: '1-2 years',
            requiredSkills: ['specialized expertise', 'domain knowledge'],
            salaryRange: '$65K - $90K',
            probability: 70
          }
        ],
        fiveYearProjection: {
          potentialRoles: ['Senior Developer', 'Tech Lead', 'Product Manager'],
          salaryGrowth: 80,
          marketOutlook: 'excellent' as const
        }
      },
      'mid': {
        nextRoles: [
          {
            title: 'Senior Developer',
            timeToAchieve: '2-4 years',
            requiredSkills: ['system architecture', 'mentoring', 'leadership'],
            salaryRange: '$100K - $140K',
            probability: 75
          },
          {
            title: 'Tech Lead',
            timeToAchieve: '1-3 years',
            requiredSkills: ['team leadership', 'project management'],
            salaryRange: '$110K - $150K',
            probability: 65
          }
        ],
        fiveYearProjection: {
          potentialRoles: ['Engineering Manager', 'Principal Engineer', 'Architect'],
          salaryGrowth: 60,
          marketOutlook: 'good' as const
        }
      },
      'senior': {
        nextRoles: [
          {
            title: 'Principal Engineer',
            timeToAchieve: '3-5 years',
            requiredSkills: ['technical strategy', 'cross-team collaboration'],
            salaryRange: '$150K - $200K',
            probability: 60
          },
          {
            title: 'Engineering Manager',
            timeToAchieve: '2-4 years',
            requiredSkills: ['people management', 'business acumen'],
            salaryRange: '$140K - $180K',
            probability: 70
          }
        ],
        fiveYearProjection: {
          potentialRoles: ['Director of Engineering', 'VP Engineering', 'CTO'],
          salaryGrowth: 40,
          marketOutlook: 'good' as const
        }
      },
      'executive': {
        nextRoles: [
          {
            title: 'VP Engineering',
            timeToAchieve: '2-5 years',
            requiredSkills: ['strategic planning', 'organizational leadership'],
            salaryRange: '$200K - $300K',
            probability: 50
          }
        ],
        fiveYearProjection: {
          potentialRoles: ['CTO', 'CPO', 'CEO'],
          salaryGrowth: 25,
          marketOutlook: 'moderate' as const
        }
      }
    };

    return trajectoryMap[currentLevel] || trajectoryMap['entry'];
  }

  private identifyStrengths(userProfile: UserProfile, resumeText: string): string[] {
    const strengths: string[] = [];
    const text = resumeText.toLowerCase();
    
    // Technical strengths
    if (userProfile.skills && userProfile.skills.length > 10) {
      strengths.push('Diverse technical skill set');
    }
    
    // Leadership strengths
    const leadershipWords = ['led', 'managed', 'coordinated', 'mentored', 'supervised'];
    if (leadershipWords.some(word => text.includes(word))) {
      strengths.push('Leadership and management experience');
    }
    
    // Communication strengths
    if (userProfile.linkedin_url || userProfile.github_url) {
      strengths.push('Professional online presence');
    }
    
    // Experience strengths
    const projectWords = ['project', 'implemented', 'developed', 'built', 'designed'];
    const projectCount = projectWords.reduce((count, word) => {
      return count + (text.match(new RegExp(word, 'g')) || []).length;
    }, 0);
    
    if (projectCount > 5) {
      strengths.push('Strong project implementation experience');
    }

    return strengths.length > 0 ? strengths : ['Dedicated professional with growth potential'];
  }

  private generateRecommendations(
    skillGaps: CareerAnalysisResult['skillGaps'],
    currentLevel: string,
    trajectory: CareerAnalysisResult['careerTrajectory'],
    marketData: any
  ): CareerAnalysisResult['recommendations'] {
    const recommendations: CareerAnalysisResult['recommendations'] = [];

    // High-priority skill development
    const highPrioritySkills = skillGaps.filter(gap => gap.importance === 'high').slice(0, 3);
    highPrioritySkills.forEach(skill => {
      recommendations.push({
        type: 'skill_development',
        priority: 'high',
        description: `Develop ${skill.skill} skills - high market demand (${skill.marketDemand}% of jobs)`,
        estimatedImpact: 85
      });
    });

    // Networking recommendations
    if (currentLevel === 'entry' || currentLevel === 'mid') {
      recommendations.push({
        type: 'networking',
        priority: 'medium',
        description: 'Build professional network through industry events and online communities',
        estimatedImpact: 70
      });
    }

    // Certification recommendations
    if (skillGaps.some(gap => ['aws', 'azure', 'gcp'].includes(gap.skill.toLowerCase()))) {
      recommendations.push({
        type: 'certification',
        priority: 'high',
        description: 'Pursue cloud platform certification to increase market competitiveness',
        estimatedImpact: 80
      });
    }

    // Experience recommendations
    recommendations.push({
      type: 'experience',
      priority: 'medium',
      description: 'Seek projects that align with next career level requirements',
      estimatedImpact: 75
    });

    return recommendations;
  }

  private async assessMarketPosition(
    userProfile: UserProfile,
    experienceYears: number
  ): Promise<CareerAnalysisResult['marketPosition']> {
    // Simplified market position assessment
    const skillCount = userProfile.skills?.length || 0;
    const hasLinks = !!(userProfile.linkedin_url || userProfile.github_url);
    const hasSummary = !!(userProfile.professional_summary && userProfile.professional_summary.length > 50);

    let percentile = 50; // Base percentile
    
    // Adjust based on experience and skills
    percentile += Math.min(experienceYears * 3, 30);
    percentile += Math.min(skillCount * 2, 20);
    if (hasLinks) percentile += 10;
    if (hasSummary) percentile += 10;

    percentile = Math.min(percentile, 95);

    const competitiveness = 
      percentile > 80 ? 'highly_competitive' as const :
      percentile > 60 ? 'competitive' as const :
      percentile > 40 ? 'moderate' as const : 'developing' as const;

    const uniqueValue = [];
    if (skillCount > 15) uniqueValue.push('Diverse technical expertise');
    if (experienceYears > 10) uniqueValue.push('Extensive industry experience');
    if (hasLinks) uniqueValue.push('Strong professional presence');

    return {
      percentile,
      competitiveness,
      uniqueValue
    };
  }

  private async logAnalysis(userId: string, result: CareerAnalysisResult): Promise<void> {
    try {
      await supabase.from('agent_analytics').insert({
        agent_type: 'career_analysis',
        user_id: userId,
        session_data: {
          current_level: result.currentLevel,
          experience_years: result.experienceYears,
          skill_gaps_count: result.skillGaps.length,
          recommendations_count: result.recommendations.length,
          market_percentile: result.marketPosition.percentile,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log career analysis:', error);
    }
  }
}