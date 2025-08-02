import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/job";

export interface SkillDevelopmentResult {
  skillGapAnalysis: {
    criticalGaps: Array<{
      skill: string;
      currentLevel: 'none' | 'basic' | 'intermediate' | 'advanced';
      targetLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
      marketDemand: number;
      salaryImpact: number;
      urgency: 'high' | 'medium' | 'low';
    }>;
    emergingSkills: Array<{
      skill: string;
      trendScore: number;
      adoptionRate: number;
      futureRelevance: number;
    }>;
  };
  personalizedLearningPaths: Array<{
    skill: string;
    pathway: {
      beginner: Array<{
        resource: string;
        type: 'course' | 'tutorial' | 'book' | 'practice' | 'certification';
        duration: string;
        difficulty: 'easy' | 'medium' | 'hard';
        provider: string;
        cost: 'free' | 'paid' | 'freemium';
        rating: number;
      }>;
      intermediate: Array<{
        resource: string;
        type: 'course' | 'tutorial' | 'book' | 'practice' | 'certification';
        duration: string;
        difficulty: 'easy' | 'medium' | 'hard';
        provider: string;
        cost: 'free' | 'paid' | 'freemium';
        rating: number;
      }>;
      advanced: Array<{
        resource: string;
        type: 'course' | 'tutorial' | 'book' | 'practice' | 'certification';
        duration: string;
        difficulty: 'easy' | 'medium' | 'hard';
        provider: string;
        cost: 'free' | 'paid' | 'freemium';
        rating: number;
      }>;
    };
    estimatedTimeToMastery: string;
    practicalProjects: string[];
  }>;
  certificationRecommendations: Array<{
    certification: string;
    provider: string;
    relevanceScore: number;
    industryRecognition: 'high' | 'medium' | 'low';
    cost: string;
    timeCommitment: string;
    prerequisites: string[];
    careerImpact: number;
  }>;
  practiceOpportunities: {
    projects: Array<{
      title: string;
      description: string;
      skills: string[];
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      estimatedHours: number;
      githubRequired: boolean;
    }>;
    competitions: Array<{
      name: string;
      platform: string;
      frequency: string;
      prizes: string;
      skills: string[];
    }>;
    communityContributions: Array<{
      type: 'open_source' | 'mentoring' | 'content_creation';
      platform: string;
      description: string;
      benefits: string[];
    }>;
  };
  progressTracking: {
    milestones: Array<{
      skill: string;
      milestone: string;
      timeframe: string;
      measurableOutcome: string;
    }>;
    assessmentMethods: Array<{
      skill: string;
      method: string;
      frequency: string;
      tools: string[];
    }>;
  };
}

export class SkillDevelopmentAgent {
  async execute(payload: {
    userProfile: UserProfile;
    targetRole?: string;
    careerGoals?: string[];
    timeCommitment?: 'low' | 'medium' | 'high';
  }): Promise<SkillDevelopmentResult> {
    const { userProfile, targetRole, careerGoals = [], timeCommitment = 'medium' } = payload;

    try {
      // Analyze current market demands
      const marketData = await this.analyzeMarketDemands();
      
      // Perform skill gap analysis
      const skillGapAnalysis = await this.performSkillGapAnalysis(
        userProfile, 
        targetRole, 
        marketData
      );

      // Generate personalized learning paths
      const personalizedLearningPaths = await this.generateLearningPaths(
        skillGapAnalysis,
        timeCommitment
      );

      // Recommend certifications
      const certificationRecommendations = await this.recommendCertifications(
        skillGapAnalysis,
        userProfile
      );

      // Identify practice opportunities
      const practiceOpportunities = await this.identifyPracticeOpportunities(
        skillGapAnalysis
      );

      // Set up progress tracking
      const progressTracking = this.setupProgressTracking(
        skillGapAnalysis,
        personalizedLearningPaths
      );

      const result: SkillDevelopmentResult = {
        skillGapAnalysis,
        personalizedLearningPaths,
        certificationRecommendations,
        practiceOpportunities,
        progressTracking
      };

      // Log development plan
      await this.logDevelopmentPlan(userProfile.id, result);

      return result;
    } catch (error) {
      console.error("SkillDevelopmentAgent execution failed:", error);
      throw error;
    }
  }

  private async analyzeMarketDemands(): Promise<any> {
    // Get recent job postings for market analysis
    const { data: recentJobs } = await supabase
      .from('jobs')
      .select('requirements, title, salary')
      .eq('status', 'active')
      .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
      .limit(200);

    if (!recentJobs) return { skillDemand: {}, totalJobs: 0 };

    // Extract and count skill mentions
    const skillDemand: Record<string, { count: number; salaries: number[] }> = {};
    const commonSkills = [
      'javascript', 'python', 'react', 'node.js', 'typescript', 'java', 'c#',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
      'sql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
      'machine learning', 'artificial intelligence', 'data science',
      'devops', 'ci/cd', 'jenkins', 'git', 'linux',
      'agile', 'scrum', 'project management',
      'react native', 'flutter', 'swift', 'kotlin',
      'vue.js', 'angular', 'svelte', 'next.js',
      'django', 'flask', 'spring boot', 'express.js',
      'graphql', 'rest api', 'microservices', 'serverless',
      'blockchain', 'cybersecurity', 'penetration testing',
      'ui/ux design', 'figma', 'adobe creative suite'
    ];

    recentJobs.forEach(job => {
      const jobText = `${job.title} ${job.requirements}`.toLowerCase();
      const salary = this.extractSalaryFromText(job.salary);

      commonSkills.forEach(skill => {
        if (jobText.includes(skill)) {
          if (!skillDemand[skill]) {
            skillDemand[skill] = { count: 0, salaries: [] };
          }
          skillDemand[skill].count++;
          if (salary > 0) {
            skillDemand[skill].salaries.push(salary);
          }
        }
      });
    });

    return { skillDemand, totalJobs: recentJobs.length };
  }

  private async performSkillGapAnalysis(
    userProfile: UserProfile,
    targetRole?: string,
    marketData?: any
  ): Promise<SkillDevelopmentResult['skillGapAnalysis']> {
    const userSkills = (userProfile.skills || []).map(s => s.toLowerCase());
    const { skillDemand = {}, totalJobs = 0 } = marketData || {};

    // Identify critical gaps
    const criticalGaps = Object.entries(skillDemand)
      .filter(([skill]) => !userSkills.includes(skill))
      .map(([skill, data]: [string, any]) => {
        const marketDemand = totalJobs > 0 ? (data.count / totalJobs) * 100 : 0;
        const salaryImpact = this.calculateSalaryImpact(data.salaries);
        
        return {
          skill,
          currentLevel: 'none' as const,
          targetLevel: this.determineTargetLevel(skill, marketDemand),
          marketDemand: Math.round(marketDemand),
          salaryImpact,
          urgency: this.determineUrgency(marketDemand, salaryImpact)
        };
      })
      .sort((a, b) => b.marketDemand - a.marketDemand)
      .slice(0, 10);

    // Identify emerging skills
    const emergingSkills = this.identifyEmergingSkills(skillDemand, totalJobs);

    return { criticalGaps, emergingSkills };
  }

  private async generateLearningPaths(
    skillGapAnalysis: SkillDevelopmentResult['skillGapAnalysis'],
    timeCommitment: string
  ): Promise<SkillDevelopmentResult['personalizedLearningPaths']> {
    const learningPaths: SkillDevelopmentResult['personalizedLearningPaths'] = [];

    // Generate paths for top critical skills
    const topSkills = skillGapAnalysis.criticalGaps
      .filter(gap => gap.urgency === 'high')
      .slice(0, 5);

    for (const gap of topSkills) {
      const pathway = await this.createLearningPathway(gap.skill, timeCommitment);
      const estimatedTimeToMastery = this.calculateTimeToMastery(gap.skill, timeCommitment);
      const practicalProjects = this.generatePracticalProjects(gap.skill);

      learningPaths.push({
        skill: gap.skill,
        pathway,
        estimatedTimeToMastery,
        practicalProjects
      });
    }

    return learningPaths;
  }

  private async createLearningPathway(skill: string, timeCommitment: string): Promise<any> {
    // This would typically connect to external APIs for course data
    // For now, providing structured recommendations based on skill type
    
    const pathwayTemplates: Record<string, any> = {
      'javascript': {
        beginner: [
          {
            resource: 'JavaScript Fundamentals',
            type: 'course',
            duration: '4-6 weeks',
            difficulty: 'easy',
            provider: 'freeCodeCamp',
            cost: 'free',
            rating: 4.8
          },
          {
            resource: 'Eloquent JavaScript',
            type: 'book',
            duration: '6-8 weeks',
            difficulty: 'medium',
            provider: 'No Starch Press',
            cost: 'paid',
            rating: 4.7
          }
        ],
        intermediate: [
          {
            resource: 'Advanced JavaScript Concepts',
            type: 'course',
            duration: '6-8 weeks',
            difficulty: 'medium',
            provider: 'Udemy',
            cost: 'paid',
            rating: 4.6
          },
          {
            resource: 'JavaScript30',
            type: 'practice',
            duration: '30 days',
            difficulty: 'medium',
            provider: 'Wes Bos',
            cost: 'free',
            rating: 4.9
          }
        ],
        advanced: [
          {
            resource: 'JavaScript Design Patterns',
            type: 'course',
            duration: '4-6 weeks',
            difficulty: 'hard',
            provider: 'Pluralsight',
            cost: 'paid',
            rating: 4.5
          }
        ]
      },
      'react': {
        beginner: [
          {
            resource: 'React Official Tutorial',
            type: 'tutorial',
            duration: '2-3 weeks',
            difficulty: 'easy',
            provider: 'React.dev',
            cost: 'free',
            rating: 4.8
          }
        ],
        intermediate: [
          {
            resource: 'React - The Complete Guide',
            type: 'course',
            duration: '8-10 weeks',
            difficulty: 'medium',
            provider: 'Udemy',
            cost: 'paid',
            rating: 4.7
          }
        ],
        advanced: [
          {
            resource: 'Advanced React Patterns',
            type: 'course',
            duration: '4-6 weeks',
            difficulty: 'hard',
            provider: 'Kent C. Dodds',
            cost: 'paid',
            rating: 4.9
          }
        ]
      },
      'python': {
        beginner: [
          {
            resource: 'Python for Everybody',
            type: 'course',
            duration: '6-8 weeks',
            difficulty: 'easy',
            provider: 'Coursera',
            cost: 'freemium',
            rating: 4.8
          }
        ],
        intermediate: [
          {
            resource: 'Automate the Boring Stuff with Python',
            type: 'book',
            duration: '4-6 weeks',
            difficulty: 'medium',
            provider: 'No Starch Press',
            cost: 'free',
            rating: 4.6
          }
        ],
        advanced: [
          {
            resource: 'Effective Python',
            type: 'book',
            duration: '6-8 weeks',
            difficulty: 'hard',
            provider: 'Addison-Wesley',
            cost: 'paid',
            rating: 4.7
          }
        ]
      }
    };

    // Return pathway for the skill or a default template
    return pathwayTemplates[skill] || {
      beginner: [
        {
          resource: `${skill} Fundamentals`,
          type: 'course',
          duration: '4-6 weeks',
          difficulty: 'easy',
          provider: 'Online Platform',
          cost: 'freemium',
          rating: 4.5
        }
      ],
      intermediate: [
        {
          resource: `Advanced ${skill}`,
          type: 'course',
          duration: '6-8 weeks',
          difficulty: 'medium',
          provider: 'Online Platform',
          cost: 'paid',
          rating: 4.4
        }
      ],
      advanced: [
        {
          resource: `${skill} Mastery`,
          type: 'course',
          duration: '8-10 weeks',
          difficulty: 'hard',
          provider: 'Online Platform',
          cost: 'paid',
          rating: 4.3
        }
      ]
    };
  }

  private async recommendCertifications(
    skillGapAnalysis: SkillDevelopmentResult['skillGapAnalysis'],
    userProfile: UserProfile
  ): Promise<SkillDevelopmentResult['certificationRecommendations']> {
    const recommendations: SkillDevelopmentResult['certificationRecommendations'] = [];

    // Cloud certifications
    const cloudSkills = skillGapAnalysis.criticalGaps.filter(gap => 
      ['aws', 'azure', 'gcp'].includes(gap.skill)
    );

    cloudSkills.forEach(skill => {
      if (skill.skill === 'aws') {
        recommendations.push({
          certification: 'AWS Certified Solutions Architect',
          provider: 'Amazon Web Services',
          relevanceScore: 95,
          industryRecognition: 'high',
          cost: '$150',
          timeCommitment: '3-6 months',
          prerequisites: ['Basic cloud knowledge'],
          careerImpact: 85
        });
      }
    });

    // Programming certifications
    const programmingSkills = skillGapAnalysis.criticalGaps.filter(gap =>
      ['javascript', 'python', 'java'].includes(gap.skill)
    );

    if (programmingSkills.length > 0) {
      recommendations.push({
        certification: 'Microsoft Certified: Azure Developer Associate',
        provider: 'Microsoft',
        relevanceScore: 80,
        industryRecognition: 'high',
        cost: '$165',
        timeCommitment: '4-8 months',
        prerequisites: ['Programming experience'],
        careerImpact: 75
      });
    }

    // Data science certifications
    const dataSkills = skillGapAnalysis.criticalGaps.filter(gap =>
      ['machine learning', 'data science', 'python'].includes(gap.skill)
    );

    if (dataSkills.length > 0) {
      recommendations.push({
        certification: 'Google Data Analytics Professional Certificate',
        provider: 'Google',
        relevanceScore: 85,
        industryRecognition: 'medium',
        cost: '$49/month',
        timeCommitment: '3-6 months',
        prerequisites: ['Basic statistics'],
        careerImpact: 70
      });
    }

    return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private async identifyPracticeOpportunities(
    skillGapAnalysis: SkillDevelopmentResult['skillGapAnalysis']
  ): Promise<SkillDevelopmentResult['practiceOpportunities']> {
    const projects = this.generatePracticeProjects(skillGapAnalysis.criticalGaps);
    const competitions = this.identifyCompetitions(skillGapAnalysis.criticalGaps);
    const communityContributions = this.suggestCommunityContributions();

    return { projects, competitions, communityContributions };
  }

  private generatePracticeProjects(criticalGaps: any[]): any[] {
    const projects = [];

    // Web development projects
    if (criticalGaps.some(gap => ['javascript', 'react', 'node.js'].includes(gap.skill))) {
      projects.push({
        title: 'Personal Portfolio Website',
        description: 'Build a responsive portfolio showcasing your projects and skills',
        skills: ['html', 'css', 'javascript', 'react'],
        difficulty: 'beginner',
        estimatedHours: 20,
        githubRequired: true
      });

      projects.push({
        title: 'Full-Stack Task Management App',
        description: 'Create a complete task management application with user authentication',
        skills: ['react', 'node.js', 'mongodb', 'express'],
        difficulty: 'intermediate',
        estimatedHours: 60,
        githubRequired: true
      });
    }

    // Data science projects
    if (criticalGaps.some(gap => ['python', 'machine learning', 'data science'].includes(gap.skill))) {
      projects.push({
        title: 'Data Analysis Dashboard',
        description: 'Analyze and visualize a public dataset of your choice',
        skills: ['python', 'pandas', 'matplotlib', 'streamlit'],
        difficulty: 'intermediate',
        estimatedHours: 30,
        githubRequired: true
      });
    }

    // DevOps projects
    if (criticalGaps.some(gap => ['docker', 'kubernetes', 'aws'].includes(gap.skill))) {
      projects.push({
        title: 'Containerized Microservices',
        description: 'Deploy a multi-service application using Docker and Kubernetes',
        skills: ['docker', 'kubernetes', 'aws', 'ci/cd'],
        difficulty: 'advanced',
        estimatedHours: 80,
        githubRequired: true
      });
    }

    return projects;
  }

  private identifyCompetitions(criticalGaps: any[]): any[] {
    const competitions = [];

    if (criticalGaps.some(gap => ['javascript', 'python', 'java'].includes(gap.skill))) {
      competitions.push({
        name: 'Codeforces Contests',
        platform: 'Codeforces',
        frequency: 'Weekly',
        prizes: 'Ratings and recognition',
        skills: ['algorithms', 'data structures', 'problem solving']
      });

      competitions.push({
        name: 'LeetCode Weekly Contest',
        platform: 'LeetCode',
        frequency: 'Weekly',
        prizes: 'Ranking and swag',
        skills: ['algorithms', 'programming', 'optimization']
      });
    }

    if (criticalGaps.some(gap => ['machine learning', 'data science'].includes(gap.skill))) {
      competitions.push({
        name: 'Kaggle Competitions',
        platform: 'Kaggle',
        frequency: 'Ongoing',
        prizes: 'Cash prizes and medals',
        skills: ['machine learning', 'data analysis', 'feature engineering']
      });
    }

    return competitions;
  }

  private suggestCommunityContributions(): any[] {
    return [
      {
        type: 'open_source',
        platform: 'GitHub',
        description: 'Contribute to open source projects in your technology stack',
        benefits: ['Real-world experience', 'Network building', 'Portfolio enhancement']
      },
      {
        type: 'mentoring',
        platform: 'Stack Overflow',
        description: 'Answer questions and help other developers',
        benefits: ['Knowledge reinforcement', 'Recognition', 'Communication skills']
      },
      {
        type: 'content_creation',
        platform: 'Dev.to / Medium',
        description: 'Write technical blog posts about your learning journey',
        benefits: ['Thought leadership', 'Writing skills', 'Professional visibility']
      }
    ];
  }

  private setupProgressTracking(
    skillGapAnalysis: any,
    learningPaths: any[]
  ): SkillDevelopmentResult['progressTracking'] {
    const milestones = learningPaths.map(path => ({
      skill: path.skill,
      milestone: `Complete beginner level in ${path.skill}`,
      timeframe: '1-2 months',
      measurableOutcome: 'Build a small project demonstrating basic proficiency'
    }));

    const assessmentMethods = learningPaths.map(path => ({
      skill: path.skill,
      method: 'Practical project and peer review',
      frequency: 'Monthly',
      tools: ['GitHub portfolio', 'Code review', 'Project presentation']
    }));

    return { milestones, assessmentMethods };
  }

  // Helper methods
  private extractSalaryFromText(salaryText: string): number {
    const match = salaryText.match(/\$?(\d+(?:,\d+)*(?:k|000)?)/i);
    if (!match) return 0;
    
    let amount = parseInt(match[1].replace(/,/g, ''));
    if (match[1].toLowerCase().includes('k')) {
      amount *= 1000;
    }
    return amount;
  }

  private calculateSalaryImpact(salaries: number[]): number {
    if (salaries.length === 0) return 0;
    const avgSalary = salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length;
    const baseSalary = 75000; // Base salary for comparison
    return Math.round(((avgSalary - baseSalary) / baseSalary) * 100);
  }

  private determineTargetLevel(skill: string, marketDemand: number): 'basic' | 'intermediate' | 'advanced' | 'expert' {
    if (marketDemand > 30) return 'advanced';
    if (marketDemand > 15) return 'intermediate';
    return 'basic';
  }

  private determineUrgency(marketDemand: number, salaryImpact: number): 'high' | 'medium' | 'low' {
    if (marketDemand > 25 || salaryImpact > 20) return 'high';
    if (marketDemand > 10 || salaryImpact > 10) return 'medium';
    return 'low';
  }

  private identifyEmergingSkills(skillDemand: any, totalJobs: number): any[] {
    // Identify skills with growing demand (simplified)
    const emergingSkillNames = [
      'artificial intelligence', 'machine learning', 'blockchain', 
      'rust', 'go', 'typescript', 'flutter', 'svelte'
    ];

    return emergingSkillNames
      .filter(skill => skillDemand[skill])
      .map(skill => ({
        skill,
        trendScore: Math.min(100, (skillDemand[skill].count / totalJobs) * 500),
        adoptionRate: Math.min(100, skillDemand[skill].count * 2),
        futureRelevance: Math.floor(Math.random() * 30) + 70 // Simplified
      }))
      .sort((a, b) => b.trendScore - a.trendScore);
  }

  private calculateTimeToMastery(skill: string, timeCommitment: string): string {
    const baseHours: Record<string, number> = {
      'javascript': 200,
      'python': 180,
      'react': 150,
      'aws': 250,
      'docker': 100,
      'machine learning': 300
    };

    const skillHours = baseHours[skill] || 200;
    const weeklyHours = timeCommitment === 'high' ? 15 : timeCommitment === 'medium' ? 10 : 5;
    const weeks = Math.ceil(skillHours / weeklyHours);
    const months = Math.ceil(weeks / 4);

    return `${months} month${months > 1 ? 's' : ''}`;
  }

  private generatePracticalProjects(skill: string): string[] {
    const projectIdeas: Record<string, string[]> = {
      'javascript': [
        'Interactive todo list with local storage',
        'Weather app using external API',
        'Simple game (e.g., memory card game)'
      ],
      'react': [
        'Personal blog with routing',
        'E-commerce product catalog',
        'Real-time chat application'
      ],
      'python': [
        'Web scraper for job listings',
        'Data analysis of personal expenses',
        'Automated email sender'
      ],
      'aws': [
        'Static website hosting with S3 and CloudFront',
        'Serverless API with Lambda',
        'Auto-scaling web application'
      ]
    };

    return projectIdeas[skill] || [
      `Build a basic application using ${skill}`,
      `Create a tutorial or guide for ${skill}`,
      `Contribute to an open source project using ${skill}`
    ];
  }

  private async logDevelopmentPlan(userId: string, result: SkillDevelopmentResult): Promise<void> {
    try {
      const analytics = {
        agent_type: 'skill_development',
        user_id: userId,
        session_data: {
          critical_gaps_count: result.skillGapAnalysis.criticalGaps.length,
          learning_paths_count: result.personalizedLearningPaths.length,
          certifications_recommended: result.certificationRecommendations.length,
          practice_projects_count: result.practiceOpportunities.projects.length,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem('agent_analytics') || '[]');
      existing.push(analytics);
      localStorage.setItem('agent_analytics', JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to log skill development plan:', error);
    }
  }
}