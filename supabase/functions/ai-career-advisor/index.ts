import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, context, agentType, userProfile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Initialize Supabase client for analytics
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get market data for context
    const { data: jobs } = await supabase
      .from('jobs')
      .select('title, company, requirements, salary, type')
      .eq('status', 'active')
      .limit(100);

    const marketContext = jobs ? `
CURRENT MARKET DATA:
Top companies hiring: ${[...new Set(jobs.map(j => j.company))].slice(0, 10).join(', ')}
Common job types: ${[...new Set(jobs.map(j => j.type))].slice(0, 5).join(', ')}
Salary ranges: ${[...new Set(jobs.map(j => j.salary))].slice(0, 5).join(', ')}
In-demand skills from job postings: ${jobs.flatMap(j => j.requirements.toLowerCase().split(/[,\s]+/))
  .filter(skill => skill.length > 3)
  .slice(0, 20).join(', ')}
` : '';

    let systemPrompt = '';
    let analysisStructure = {};

    switch (agentType) {
      case 'careerAnalysis':
        systemPrompt = `You are an expert career analyst. Provide comprehensive career guidance based on the user's profile and current market trends. Focus on actionable insights and growth opportunities.`;
        analysisStructure = {
          careerStage: "string",
          strengths: ["string"],
          areasForImprovement: ["string"],
          careerPath: {
            shortTerm: ["string"],
            longTerm: ["string"]
          },
          salaryProjections: {
            current: "string",
            oneYear: "string",
            fiveYear: "string"
          },
          marketPosition: "string",
          actionItems: ["string"]
        };
        break;

      case 'marketIntelligence':
        systemPrompt = `You are a market intelligence analyst. Provide detailed insights about job market trends, salary data, and industry analysis relevant to the user's profile.`;
        analysisStructure = {
          industryTrends: {
            growing: ["string"],
            declining: ["string"],
            stable: ["string"]
          },
          salaryTrends: {
            averageByRole: [{ role: "string", salary: "string" }],
            locationFactors: ["string"],
            skillPremiums: [{ skill: "string", premium: "string" }]
          },
          demandAnalysis: {
            hotSkills: ["string"],
            emergingRoles: ["string"],
            companiesHiring: ["string"]
          },
          forecast: {
            sixMonths: "string",
            oneYear: "string",
            trends: ["string"]
          }
        };
        break;

      case 'skillDevelopment':
        systemPrompt = `You are a skill development coach. Recommend specific learning paths, resources, and skill development strategies based on market demands and the user's current abilities.`;
        analysisStructure = {
          skillGaps: ["string"],
          learningPath: {
            immediate: [{ skill: "string", priority: "string", resources: ["string"] }],
            shortTerm: [{ skill: "string", priority: "string", resources: ["string"] }],
            longTerm: [{ skill: "string", priority: "string", resources: ["string"] }]
          },
          recommendations: {
            courses: ["string"],
            certifications: ["string"],
            projects: ["string"],
            communities: ["string"]
          },
          timeline: "string",
          roi: "string"
        };
        break;

      case 'networkDiscovery':
        systemPrompt = `You are a professional networking strategist. Provide networking opportunities, strategies, and relationship-building advice based on the user's career goals.`;
        analysisStructure = {
          networkingStrategy: "string",
          targetConnections: ["string"],
          platforms: [{ platform: "string", strategy: "string" }],
          events: ["string"],
          mentorship: {
            findMentors: ["string"],
            becomeMentor: ["string"]
          },
          personalBrand: {
            strengths: ["string"],
            improvements: ["string"],
            contentStrategy: ["string"]
          }
        };
        break;

      case 'applicationOptimization':
        systemPrompt = `You are an application optimization expert. Analyze and improve job application strategies, resume optimization, and interview preparation based on current market standards.`;
        analysisStructure = {
          resumeOptimization: {
            strengths: ["string"],
            improvements: ["string"],
            keywords: ["string"],
            formatting: ["string"]
          },
          applicationStrategy: {
            targetCompanies: ["string"],
            applicationTiming: "string",
            customization: ["string"]
          },
          interviewPrep: {
            commonQuestions: ["string"],
            technicalPrep: ["string"],
            behavioralPrep: ["string"]
          },
          followUp: ["string"],
          successMetrics: ["string"]
        };
        break;

      default:
        systemPrompt = `You are a general career advisor. Provide helpful career guidance and insights.`;
        analysisStructure = {
          analysis: "string",
          recommendations: ["string"],
          nextSteps: ["string"]
        };
    }

    // Call Lovable AI for analysis
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}

Return your analysis as a JSON object with this structure:
${JSON.stringify(analysisStructure, null, 2)}

Provide specific, actionable insights based on the current job market and user's profile.`
          },
          {
            role: 'user',
            content: `${prompt}

CONTEXT:
${context}

${marketContext}

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

Please provide a comprehensive ${agentType} analysis.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_career_analysis",
              description: `Provide ${agentType} analysis`,
              parameters: {
                type: "object",
                properties: analysisStructure,
                required: Object.keys(analysisStructure)
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_career_analysis" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('AI service quota exceeded. Please contact support.');
      }
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error('Invalid AI response format');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Log analytics
    try {
      await supabase.from('agent_analytics').insert({
        agent_type: agentType,
        user_id: userProfile?.id,
        session_data: {
          analysis_type: agentType,
          prompt_length: prompt.length,
          context_length: context.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (e) {
      console.error('Failed to log analytics:', e);
    }

    return new Response(JSON.stringify({
      success: true,
      analysis,
      agentType,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`AI career advisor error:`, error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      analysis: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});