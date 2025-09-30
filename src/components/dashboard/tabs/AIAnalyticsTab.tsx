import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Clock, Users, Target, Sparkles } from 'lucide-react';

interface AIAnalyticsTabProps {
  userProfile: any;
}

export function AIAnalyticsTab({ userProfile }: AIAnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [agentInsights, setAgentInsights] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = () => {
    // Load agent results and analytics
    const agentResults = JSON.parse(localStorage.getItem('ai_agent_results') || '[]');
    const agentAnalytics = JSON.parse(localStorage.getItem('agent_analytics') || '[]');
    
    setAgentInsights(agentResults.slice(0, 10));
    
    // Calculate analytics
    const jobMatchingResults = agentResults.filter(r => r.type === 'jobMatching');
    const totalMatches = jobMatchingResults.reduce((sum, r) => sum + (r.result?.totalMatches || 0), 0);
    const totalApplications = jobMatchingResults.reduce((sum, r) => sum + (r.result?.autoApplications || 0), 0);
    
    const analytics = {
      totalAgentActivations: agentResults.length,
      totalJobMatches: totalMatches,
      autoApplications: totalApplications,
      successRate: totalApplications > 0 ? Math.round((totalApplications / totalMatches) * 100) : 0,
      lastActivity: agentResults[0]?.timestamp || null,
      agentTypes: [...new Set(agentResults.map(r => r.type))],
      weeklyTrend: calculateWeeklyTrend(agentResults)
    };
    
    setAnalytics(analytics);
  };

  const calculateWeeklyTrend = (results: any[]) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const thisWeek = results.filter(r => new Date(r.timestamp) > oneWeekAgo).length;
    const lastWeek = results.filter(r => {
      const date = new Date(r.timestamp);
      return date > twoWeeksAgo && date <= oneWeekAgo;
    }).length;
    
    if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'jobMatching': return Brain;
      case 'careerAnalysis': return TrendingUp;
      case 'marketIntelligence': return Sparkles;
      case 'skillDevelopment': return Target;
      case 'networkDiscovery': return Users;
      default: return Clock;
    }
  };

  const formatAgentName = (type: string) => {
    return type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Agent Activations</p>
                <p className="text-2xl font-bold">{analytics.totalAgentActivations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Job Matches Found</p>
                <p className="text-2xl font-bold">{analytics.totalJobMatches}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Auto Applications</p>
                <p className="text-2xl font-bold">{analytics.autoApplications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{analytics.successRate}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs text-muted-foreground">
                    {analytics.weeklyTrend > 0 ? '+' : ''}{analytics.weeklyTrend}% this week
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Agent Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.agentTypes.map((type: string) => {
                const Icon = getAgentIcon(type);
                const count = agentInsights.filter(insight => insight.type === type).length;
                
                return (
                  <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{formatAgentName(type)}</span>
                    </div>
                    <Badge variant="secondary">{count} activations</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Agent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agentInsights.slice(0, 5).map((insight, index) => {
                const Icon = getAgentIcon(insight.type);
                const timeAgo = new Date(insight.timestamp).toLocaleString();
                
                return (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Icon className="h-4 w-4 text-primary mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{formatAgentName(insight.type)}</span>
                        <Badge variant="outline" className="text-xs">
                          {timeAgo}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {insight.type === 'jobMatching' && insight.result?.totalMatches ? 
                          `Found ${insight.result.totalMatches} job matches, applied to ${insight.result.autoApplications || 0}` :
                          'Analysis completed successfully'
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-lg">Most Active Agent</h4>
              <p className="text-muted-foreground">
                {analytics.agentTypes.length > 0 ? formatAgentName(analytics.agentTypes[0]) : 'None yet'}
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-lg">Avg. Matches per Session</h4>
              <p className="text-muted-foreground">
                {analytics.totalJobMatches > 0 ? 
                  Math.round(analytics.totalJobMatches / Math.max(1, agentInsights.filter(i => i.type === 'jobMatching').length)) : 
                  0
                }
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-lg">Last Activity</h4>
              <p className="text-muted-foreground">
                {analytics.lastActivity ? 
                  new Date(analytics.lastActivity).toLocaleDateString() : 
                  'No activity yet'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}