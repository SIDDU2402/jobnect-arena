import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Clock, Brain } from 'lucide-react';

interface AIInsight {
  type: string;
  result: any;
  timestamp: string;
  userId: string;
}

export function AIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([]);

  useEffect(() => {
    loadInsights();
    const interval = setInterval(loadInsights, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadInsights = () => {
    const stored = localStorage.getItem('ai_agent_results');
    if (stored) {
      const data = JSON.parse(stored);
      setInsights(data.slice(0, 6)); // Show latest 6 insights
    }
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'jobMatching': return Brain;
      case 'careerAnalysis': return TrendingUp;
      case 'marketIntelligence': return Sparkles;
      default: return Clock;
    }
  };

  const getAgentColor = (type: string) => {
    switch (type) {
      case 'jobMatching': return 'bg-blue-100 text-blue-700';
      case 'careerAnalysis': return 'bg-green-100 text-green-700';
      case 'marketIntelligence': return 'bg-purple-100 text-purple-700';
      case 'skillDevelopment': return 'bg-orange-100 text-orange-700';
      case 'networkDiscovery': return 'bg-pink-100 text-pink-700';
      case 'applicationOptimization': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatInsight = (insight: AIInsight) => {
    if (typeof insight.result === 'string') {
      return insight.result.substring(0, 150) + '...';
    }
    
    if (insight.result?.text) {
      return insight.result.text.substring(0, 150) + '...';
    }

    // Handle structured data
    if (insight.type === 'jobMatching' && insight.result?.matchScore) {
      return `Found ${Math.round(insight.result.matchScore * 100)}% job match with key skills alignment`;
    }
    
    if (insight.type === 'careerAnalysis' && insight.result?.skillGaps) {
      return `Identified ${insight.result.skillGaps.length} skill gaps for career advancement`;
    }
    
    if (insight.type === 'marketIntelligence' && insight.result?.growingSkills) {
      return `Market analysis shows ${insight.result.growingSkills.length} growing skills in demand`;
    }

    return 'AI analysis completed successfully';
  };

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Real-time AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Activate AI agents to see real-time insights here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Real-time AI Insights
          <Badge variant="secondary" className="ml-auto">
            {insights.length} recent
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const Icon = getAgentIcon(insight.type);
            const colorClass = getAgentColor(insight.type);
            
            return (
              <div
                key={`${insight.timestamp}-${index}`}
                className="flex gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm capitalize">
                      {insight.type.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {new Date(insight.timestamp).toLocaleTimeString()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatInsight(insight)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}