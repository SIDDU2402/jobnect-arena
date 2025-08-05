import { supabase } from "@/integrations/supabase/client";

export interface MarketIntelligenceResult {
  industryTrends: {
    growingSkills: Array<{
      skill: string;
      growthRate: number;
      demandScore: number;
      averageSalary: string;
    }>;
    decliningSkills: Array<{
      skill: string;
      declineRate: number;
      reason: string;
    }>;
    emergingRoles: Array<{
      title: string;
      description: string;
      requiredSkills: string[];
      salaryRange: string;
      growthProjection: number;
    }>;
  };
  salaryBenchmarks: {
    byRole: Array<{
      role: string;
      averageSalary: number;
      salaryRange: { min: number; max: number };
      experienceLevel: string;
    }>;
    byLocation: Array<{
      location: string;
      averageSalary: number;
      costOfLivingIndex: number;
      jobAvailability: number;
    }>;
    bySkill: Array<{
      skill: string;
      salaryPremium: number;
      demandLevel: 'high' | 'medium' | 'low';
    }>;
  };
  competitionAnalysis: {
    candidatePool: {
      totalCandidates: number;
      averageExperience: number;
      commonSkills: string[];
      competitionLevel: 'low' | 'medium' | 'high' | 'very_high';
    };
    hiringTrends: {
      timeToHire: number;
      applicationSuccessRate: number;
      mostSoughtSkills: string[];
      preferredExperience: string;
    };
  };
  recommendations: Array<{
    type: 'skill_investment' | 'location_strategy' | 'salary_negotiation' | 'market_timing';
    priority: 'high' | 'medium' | 'low';
    description: string;
    expectedImpact: string;
    timeframe: string;
  }>;
  marketOutlook: {
    nextQuarter: 'excellent' | 'good' | 'stable' | 'challenging';
    nextYear: 'excellent' | 'good' | 'stable' | 'challenging';
    keyDrivers: string[];
    riskFactors: string[];
  };
}

export class MarketIntelligenceAgent {
  async execute(payload: {
    industry?: string;
    location?: string;
    experienceLevel?: string;
    skills?: string[];
  }): Promise<MarketIntelligenceResult> {
    try {
      // Gather comprehensive market data
      const [
        jobsData,
        applicationsData,
        recentTrends
      ] = await Promise.all([
        this.gatherJobsData(),
        this.gatherApplicationsData(),
        this.analyzeRecentTrends()
      ]);

      // Analyze industry trends
      const industryTrends = await this.analyzeIndustryTrends(jobsData, recentTrends);
      
      // Calculate salary benchmarks
      const salaryBenchmarks = this.calculateSalaryBenchmarks(jobsData);
      
      // Perform competition analysis
      const competitionAnalysis = await this.analyzeCompetition(applicationsData, jobsData);
      
      // Generate strategic recommendations
      const recommendations = this.generateStrategicRecommendations(
        industryTrends,
        salaryBenchmarks,
        competitionAnalysis,
        payload
      );
      
      // Project market outlook
      const marketOutlook = this.projectMarketOutlook(industryTrends, competitionAnalysis);

      const result: MarketIntelligenceResult = {
        industryTrends,
        salaryBenchmarks,
        competitionAnalysis,
        recommendations,
        marketOutlook
      };

      // Cache results for performance
      await this.cacheResults(result, payload);

      return result;
    } catch (error) {
      console.error("MarketIntelligenceAgent execution failed:", error);
      throw error;
    }
  }

  private async gatherJobsData(): Promise<any[]> {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // Last 90 days

    if (error) throw error;
    return jobs || [];
  }

  private async gatherApplicationsData(): Promise<any[]> {
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs!applications_job_id_fkey(title, company, location, salary)
      `)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;
    return applications || [];
  }

  private async analyzeRecentTrends(): Promise<any> {
    // Get jobs from different time periods for trend analysis
    const periods = [
      { days: 30, label: 'recent' },
      { days: 60, label: 'medium' },
      { days: 90, label: 'older' }
    ];

    const trendData = await Promise.all(
      periods.map(async period => {
        const { data } = await supabase
          .from('jobs')
          .select('requirements, title, salary')
          .eq('status', 'active')
          .gte('created_at', new Date(Date.now() - period.days * 24 * 60 * 60 * 1000).toISOString())
          .lt('created_at', new Date(Date.now() - (period.days - 30) * 24 * 60 * 60 * 1000).toISOString());
        
        return { period: period.label, jobs: data || [] };
      })
    );

    return trendData;
  }

  private async analyzeIndustryTrends(jobsData: any[], recentTrends: any): Promise<MarketIntelligenceResult['industryTrends']> {
    try {
      // Use Gemini AI for intelligent market analysis
      const jobSample = jobsData.slice(0, 50).map(job => ({
        title: job.title,
        requirements: job.requirements.substring(0, 200),
        salary: job.salary,
        location: job.location
      }));

      const prompt = `Analyze current job market trends and provide comprehensive market intelligence.
      
      Job Market Sample (${jobsData.length} total jobs):
      ${JSON.stringify(jobSample, null, 2)}
      
      Analyze the market and return a JSON object with:
      {
        "growingSkills": [
          {
            "skill": "skill name",
            "growthRate": 0-100,
            "demandScore": 0-100,
            "averageSalary": "$XXX,XXX",
            "marketProjection": "excellent|good|stable|declining"
          }
        ],
        "decliningSkills": [
          {
            "skill": "skill name",
            "declineRate": 0-100,
            "reason": "automation|outdated|replaced by X"
          }
        ],
        "emergingRoles": [
          {
            "title": "role title",
            "description": "role description",
            "requiredSkills": ["skill1", "skill2"],
            "salaryRange": "$XX,XXX - $XXX,XXX",
            "growthProjection": 0-100
          }
        ],
        "keyInsights": ["insight 1", "insight 2"]
      }`;

      const { data: geminiResponse } = await supabase.functions.invoke('gemini-ai', {
        body: {
          prompt,
          agentType: 'marketIntelligence',
          context: 'Job market trends analysis',
          temperature: 0.3,
          maxTokens: 2000
        }
      });

      if (geminiResponse?.success && geminiResponse.result) {
        const result = geminiResponse.result;
        return {
          growingSkills: result.growingSkills || [],
          decliningSkills: result.decliningSkills || [],
          emergingRoles: result.emergingRoles || []
        };
      }
    } catch (error) {
      console.error('Gemini market analysis failed, using fallback:', error);
    }

    // Fallback to original algorithm
    const skillsData = this.extractSkillsFromJobs(jobsData);
    const skillTrends = this.calculateSkillTrends(recentTrends);
    
    const growingSkills = skillTrends
      .filter(skill => skill.growthRate > 10)
      .sort((a, b) => b.growthRate - a.growthRate)
      .slice(0, 10)
      .map(skill => ({
        skill: skill.name,
        growthRate: skill.growthRate,
        demandScore: skill.demandScore,
        averageSalary: skill.averageSalary
      }));

    const decliningSkills = skillTrends
      .filter(skill => skill.growthRate < -10)
      .sort((a, b) => a.growthRate - b.growthRate)
      .slice(0, 5)
      .map(skill => ({
        skill: skill.name,
        declineRate: Math.abs(skill.growthRate),
        reason: this.getDeclineReason(skill.name)
      }));

    const emergingRoles = this.identifyEmergingRoles(jobsData);

    return {
      growingSkills,
      decliningSkills,
      emergingRoles
    };
  }

  private extractSkillsFromJobs(jobs: any[]): Record<string, { count: number; salaries: number[] }> {
    const commonSkills = [
      'javascript', 'python', 'react', 'node.js', 'typescript', 'aws', 'docker',
      'kubernetes', 'sql', 'mongodb', 'postgresql', 'redis', 'elasticsearch',
      'machine learning', 'artificial intelligence', 'data science', 'devops',
      'agile', 'scrum', 'git', 'linux', 'java', 'c#', 'go', 'rust', 'swift',
      'flutter', 'vue.js', 'angular', 'django', 'flask', 'spring boot',
      'microservices', 'graphql', 'rest api', 'ci/cd', 'terraform'
    ];

    const skillsData: Record<string, { count: number; salaries: number[] }> = {};

    jobs.forEach(job => {
      const jobText = `${job.title} ${job.requirements} ${job.description}`.toLowerCase();
      const salary = this.extractSalaryNumber(job.salary);

      commonSkills.forEach(skill => {
        if (jobText.includes(skill.toLowerCase())) {
          if (!skillsData[skill]) {
            skillsData[skill] = { count: 0, salaries: [] };
          }
          skillsData[skill].count++;
          if (salary > 0) {
            skillsData[skill].salaries.push(salary);
          }
        }
      });
    });

    return skillsData;
  }

  private calculateSkillTrends(trendData: any[]): Array<{
    name: string;
    growthRate: number;
    demandScore: number;
    averageSalary: string;
  }> {
    const recentPeriod = trendData.find(t => t.period === 'recent')?.jobs || [];
    const olderPeriod = trendData.find(t => t.period === 'older')?.jobs || [];

    const recentSkills = this.extractSkillsFromJobs(recentPeriod);
    const olderSkills = this.extractSkillsFromJobs(olderPeriod);

    const trends: Array<{
      name: string;
      growthRate: number;
      demandScore: number;
      averageSalary: string;
    }> = [];

    Object.keys({ ...recentSkills, ...olderSkills }).forEach(skill => {
      const recentCount = recentSkills[skill]?.count || 0;
      const olderCount = olderSkills[skill]?.count || 0;
      
      const growthRate = olderCount > 0 
        ? ((recentCount - olderCount) / olderCount) * 100 
        : recentCount > 0 ? 100 : 0;

      const demandScore = recentCount + (olderCount * 0.5);
      const salaries = recentSkills[skill]?.salaries || [];
      const averageSalary = salaries.length > 0 
        ? `$${Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length).toLocaleString()}`
        : 'Data unavailable';

      trends.push({
        name: skill,
        growthRate: Math.round(growthRate),
        demandScore: Math.round(demandScore),
        averageSalary
      });
    });

    return trends;
  }

  private identifyEmergingRoles(jobs: any[]): Array<{
    title: string;
    description: string;
    requiredSkills: string[];
    salaryRange: string;
    growthProjection: number;
  }> {
    // Analyze job titles for emerging patterns
    const roleCounts: Record<string, { count: number; salaries: number[]; requirements: string[] }> = {};

    jobs.forEach(job => {
      const title = job.title.toLowerCase();
      const salary = this.extractSalaryNumber(job.salary);
      
      // Look for emerging role patterns
      const emergingPatterns = [
        'ai engineer', 'ml engineer', 'data engineer', 'devops engineer',
        'cloud architect', 'security engineer', 'site reliability engineer',
        'blockchain developer', 'prompt engineer', 'automation engineer'
      ];

      emergingPatterns.forEach(pattern => {
        if (title.includes(pattern)) {
          if (!roleCounts[pattern]) {
            roleCounts[pattern] = { count: 0, salaries: [], requirements: [] };
          }
          roleCounts[pattern].count++;
          if (salary > 0) roleCounts[pattern].salaries.push(salary);
          roleCounts[pattern].requirements.push(job.requirements);
        }
      });
    });

    return Object.entries(roleCounts)
      .filter(([_, data]) => data.count >= 3) // Only roles with sufficient data
      .map(([title, data]) => ({
        title: title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        description: this.generateRoleDescription(title),
        requiredSkills: this.extractTopSkillsFromRequirements(data.requirements),
        salaryRange: this.calculateSalaryRange(data.salaries),
        growthProjection: Math.min(95, data.count * 10) // Simplified growth projection
      }));
  }

  private calculateSalaryBenchmarks(jobs: any[]): MarketIntelligenceResult['salaryBenchmarks'] {
    // Group by roles
    const roleGroups = this.groupJobsByRole(jobs);
    const byRole = Object.entries(roleGroups).map(([role, jobList]) => {
      const salaries = jobList.map(job => this.extractSalaryNumber(job.salary)).filter(s => s > 0);
      return {
        role,
        averageSalary: salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0,
        salaryRange: {
          min: salaries.length > 0 ? Math.min(...salaries) : 0,
          max: salaries.length > 0 ? Math.max(...salaries) : 0
        },
        experienceLevel: this.determineExperienceLevel(role)
      };
    });

    // Group by locations
    const locationGroups = this.groupJobsByLocation(jobs);
    const byLocation = Object.entries(locationGroups).map(([location, jobList]) => {
      const salaries = jobList.map(job => this.extractSalaryNumber(job.salary)).filter(s => s > 0);
      return {
        location,
        averageSalary: salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0,
        costOfLivingIndex: this.getCostOfLivingIndex(location),
        jobAvailability: jobList.length
      };
    });

    // Analyze by skills
    const skillsData = this.extractSkillsFromJobs(jobs);
    const bySkill = Object.entries(skillsData)
      .filter(([_, data]) => data.count >= 5) // Only skills with sufficient data
      .map(([skill, data]) => {
        const avgSalary = data.salaries.length > 0 
          ? data.salaries.reduce((a, b) => a + b, 0) / data.salaries.length 
          : 0;
        return {
          skill,
          salaryPremium: Math.round(((avgSalary - 75000) / 75000) * 100), // Premium over base salary
          demandLevel: data.count > 20 ? 'high' as const : data.count > 10 ? 'medium' as const : 'low' as const
        };
      });

    return { byRole, byLocation, bySkill };
  }

  private async analyzeCompetition(applications: any[], jobs: any[]): Promise<MarketIntelligenceResult['competitionAnalysis']> {
    // Calculate application-to-job ratios
    const jobApplicationCounts: Record<string, number> = {};
    applications.forEach(app => {
      jobApplicationCounts[app.job_id] = (jobApplicationCounts[app.job_id] || 0) + 1;
    });

    const avgApplicationsPerJob = Object.values(jobApplicationCounts).reduce((a, b) => a + b, 0) / Object.keys(jobApplicationCounts).length || 0;
    
    // Calculate success rates
    const successfulApplications = applications.filter(app => app.status === 'approved').length;
    const applicationSuccessRate = applications.length > 0 ? (successfulApplications / applications.length) * 100 : 0;

    // Determine competition level
    const competitionLevel = 
      avgApplicationsPerJob > 50 ? 'very_high' as const :
      avgApplicationsPerJob > 25 ? 'high' as const :
      avgApplicationsPerJob > 10 ? 'medium' as const : 'low' as const;

    const candidatePool = {
      totalCandidates: applications.length,
      averageExperience: 5, // Simplified calculation
      commonSkills: this.extractMostCommonSkills(jobs),
      competitionLevel
    };

    const hiringTrends = {
      timeToHire: 14, // Average days (simplified)
      applicationSuccessRate: Math.round(applicationSuccessRate),
      mostSoughtSkills: this.extractMostSoughtSkills(jobs),
      preferredExperience: '3-5 years'
    };

    return { candidatePool, hiringTrends };
  }

  private generateStrategicRecommendations(
    trends: MarketIntelligenceResult['industryTrends'],
    salary: MarketIntelligenceResult['salaryBenchmarks'],
    competition: MarketIntelligenceResult['competitionAnalysis'],
    payload: any
  ): MarketIntelligenceResult['recommendations'] {
    const recommendations: MarketIntelligenceResult['recommendations'] = [];

    // Skill investment recommendations
    if (trends.growingSkills.length > 0) {
      recommendations.push({
        type: 'skill_investment',
        priority: 'high',
        description: `Focus on developing ${trends.growingSkills[0].skill} - showing ${trends.growingSkills[0].growthRate}% growth`,
        expectedImpact: 'Significant salary increase and job opportunities',
        timeframe: '3-6 months'
      });
    }

    // Market timing recommendations
    if (competition.hiringTrends.applicationSuccessRate > 15) {
      recommendations.push({
        type: 'market_timing',
        priority: 'medium',
        description: 'Current market conditions are favorable for job seekers',
        expectedImpact: 'Higher success rate and better negotiation position',
        timeframe: 'Next 3 months'
      });
    }

    // Location strategy
    const topLocation = salary.byLocation.sort((a, b) => b.averageSalary - a.averageSalary)[0];
    if (topLocation) {
      recommendations.push({
        type: 'location_strategy',
        priority: 'medium',
        description: `Consider opportunities in ${topLocation.location} for higher compensation`,
        expectedImpact: `Potential ${Math.round(((topLocation.averageSalary - 75000) / 75000) * 100)}% salary increase`,
        timeframe: '6-12 months'
      });
    }

    return recommendations;
  }

  private projectMarketOutlook(
    trends: MarketIntelligenceResult['industryTrends'],
    competition: MarketIntelligenceResult['competitionAnalysis']
  ): MarketIntelligenceResult['marketOutlook'] {
    // Simplified outlook projection
    const growthIndicators = trends.growingSkills.length;
    const competitionLevel = competition.candidatePool.competitionLevel;
    
    let nextQuarter: 'excellent' | 'good' | 'stable' | 'challenging' = 'stable';
    let nextYear: 'excellent' | 'good' | 'stable' | 'challenging' = 'good';

    if (growthIndicators > 5 && competitionLevel !== 'very_high') {
      nextQuarter = 'good';
      nextYear = 'excellent';
    } else if (competitionLevel === 'very_high') {
      nextQuarter = 'challenging';
    }

    return {
      nextQuarter,
      nextYear,
      keyDrivers: [
        'AI and automation adoption',
        'Remote work normalization',
        'Cloud infrastructure growth',
        'Cybersecurity demands'
      ],
      riskFactors: [
        'Economic uncertainty',
        'Technology disruption',
        'Skill automation',
        'Geographic competition'
      ]
    };
  }

  // Helper methods
  private extractSalaryNumber(salaryString: string): number {
    const match = salaryString.match(/\$?(\d+(?:,\d+)*(?:k|000)?)/i);
    if (!match) return 0;
    
    let amount = parseInt(match[1].replace(/,/g, ''));
    if (match[1].toLowerCase().includes('k')) {
      amount *= 1000;
    }
    return amount;
  }

  private groupJobsByRole(jobs: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    jobs.forEach(job => {
      const role = job.title.toLowerCase();
      const baseRole = this.normalizeRoleTitle(role);
      if (!groups[baseRole]) groups[baseRole] = [];
      groups[baseRole].push(job);
    });
    return groups;
  }

  private groupJobsByLocation(jobs: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    jobs.forEach(job => {
      const location = job.location || 'Remote';
      if (!groups[location]) groups[location] = [];
      groups[location].push(job);
    });
    return groups;
  }

  private normalizeRoleTitle(title: string): string {
    // Normalize similar role titles
    if (title.includes('engineer')) return 'Software Engineer';
    if (title.includes('developer')) return 'Developer';
    if (title.includes('manager')) return 'Manager';
    if (title.includes('analyst')) return 'Analyst';
    if (title.includes('designer')) return 'Designer';
    return title;
  }

  private determineExperienceLevel(role: string): string {
    if (role.includes('senior') || role.includes('lead')) return 'Senior';
    if (role.includes('junior') || role.includes('entry')) return 'Entry';
    return 'Mid-level';
  }

  private getCostOfLivingIndex(location: string): number {
    // Simplified cost of living data
    const costIndexes: Record<string, number> = {
      'San Francisco': 180,
      'New York': 150,
      'Seattle': 130,
      'Austin': 110,
      'Remote': 100,
      'Denver': 105,
      'Chicago': 120
    };
    return costIndexes[location] || 100;
  }

  private extractMostCommonSkills(jobs: any[]): string[] {
    const skillsData = this.extractSkillsFromJobs(jobs);
    return Object.entries(skillsData)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([skill]) => skill);
  }

  private extractMostSoughtSkills(jobs: any[]): string[] {
    return this.extractMostCommonSkills(jobs).slice(0, 5);
  }

  private getDeclineReason(skill: string): string {
    const reasons: Record<string, string> = {
      'flash': 'Technology obsolescence',
      'silverlight': 'Platform discontinuation',
      'jquery': 'Modern framework adoption',
      'perl': 'Language modernization trends'
    };
    return reasons[skill.toLowerCase()] || 'Market evolution';
  }

  private generateRoleDescription(title: string): string {
    const descriptions: Record<string, string> = {
      'ai engineer': 'Develops and implements artificial intelligence solutions and machine learning models',
      'ml engineer': 'Designs and maintains machine learning systems and data pipelines',
      'devops engineer': 'Manages infrastructure, automation, and deployment processes',
      'cloud architect': 'Designs scalable cloud infrastructure and migration strategies'
    };
    return descriptions[title] || 'Emerging technology role with growing market demand';
  }

  private extractTopSkillsFromRequirements(requirements: string[]): string[] {
    const skillsData = this.extractSkillsFromJobs(requirements.map(req => ({ requirements: req })));
    return Object.entries(skillsData)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([skill]) => skill);
  }

  private calculateSalaryRange(salaries: number[]): string {
    if (salaries.length === 0) return 'Data unavailable';
    const min = Math.min(...salaries);
    const max = Math.max(...salaries);
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  }

  private async cacheResults(result: MarketIntelligenceResult, payload: any): Promise<void> {
    try {
      const cacheItem = {
        cache_key: JSON.stringify(payload),
        data: result,
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
        timestamp: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem('market_intelligence_cache') || '[]');
      existing.push(cacheItem);
      localStorage.setItem('market_intelligence_cache', JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to cache market intelligence results:', error);
    }
  }
}