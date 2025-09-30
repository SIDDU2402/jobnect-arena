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
    const { userProfile, resumeText, analysisType = 'comprehensive' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .limit(50);

    if (jobsError) throw jobsError;
    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ matches: [], analytics: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's existing applications
    const { data: applications } = await supabase
      .from('applications')
      .select('job_id')
      .eq('applicant_id', userProfile.id);

    const appliedJobIds = new Set(applications?.map(app => app.job_id) || []);
    const availableJobs = jobs.filter(job => !appliedJobIds.has(job.id));

    if (availableJobs.length === 0) {
      return new Response(JSON.stringify({ 
        matches: [], 
        analytics: { message: 'No new jobs available - you\'ve applied to all current openings!' }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use Lovable AI for intelligent job matching
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
            content: `You are an expert AI job matching agent. Analyze the candidate profile and available jobs to find the best matches. Return a JSON response with:
            {
              "matches": [
                {
                  "job": { job object },
                  "score": number (0-100),
                  "reasons": ["reason1", "reason2"],
                  "skillsMatch": number (0-100),
                  "experienceMatch": number (0-100),
                  "cultureFit": number (0-100)
                }
              ],
              "analytics": {
                "totalJobsAnalyzed": number,
                "averageMatchScore": number,
                "topSkillsInDemand": ["skill1", "skill2"],
                "marketTrends": "brief analysis"
              },
              "recommendations": {
                "profileImprovements": ["suggestion1", "suggestion2"],
                "skillsToLearn": ["skill1", "skill2"],
                "careerAdvice": "brief advice"
              }
            }
            
            Scoring criteria:
            - Skills alignment with job requirements (35%)
            - Experience level match (25%)
            - Industry/company culture fit (20%)
            - Location preferences (10%)
            - Career growth potential (10%)
            
            Only include matches with score >= 70.`
          },
          {
            role: 'user',
            content: `
CANDIDATE PROFILE:
Name: ${userProfile.first_name} ${userProfile.last_name}
Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
Professional Summary: ${userProfile.professional_summary || 'Not provided'}
Experience: ${resumeText ? 'Resume provided' : 'No resume'}

RESUME TEXT:
${resumeText.substring(0, 2000)}

AVAILABLE JOBS (${availableJobs.length} total):
${availableJobs.map((job, index) => `
JOB ${index + 1}:
ID: ${job.id}
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Type: ${job.type}
Salary: ${job.salary}
Description: ${job.description.substring(0, 300)}...
Requirements: ${job.requirements.substring(0, 300)}...
`).join('\n')}

Analyze each job and provide comprehensive matching results.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_job_matches",
              description: "Analyze job matches for the candidate",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        job: { type: "object" },
                        score: { type: "number", minimum: 0, maximum: 100 },
                        reasons: { type: "array", items: { type: "string" } },
                        skillsMatch: { type: "number", minimum: 0, maximum: 100 },
                        experienceMatch: { type: "number", minimum: 0, maximum: 100 },
                        cultureFit: { type: "number", minimum: 0, maximum: 100 }
                      },
                      required: ["job", "score", "reasons", "skillsMatch", "experienceMatch", "cultureFit"]
                    }
                  },
                  analytics: {
                    type: "object",
                    properties: {
                      totalJobsAnalyzed: { type: "number" },
                      averageMatchScore: { type: "number" },
                      topSkillsInDemand: { type: "array", items: { type: "string" } },
                      marketTrends: { type: "string" }
                    },
                    required: ["totalJobsAnalyzed", "averageMatchScore", "topSkillsInDemand", "marketTrends"]
                  },
                  recommendations: {
                    type: "object",
                    properties: {
                      profileImprovements: { type: "array", items: { type: "string" } },
                      skillsToLearn: { type: "array", items: { type: "string" } },
                      careerAdvice: { type: "string" }
                    },
                    required: ["profileImprovements", "skillsToLearn", "careerAdvice"]
                  }
                },
                required: ["matches", "analytics", "recommendations"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_job_matches" } }
      }),
    });

    if (!response.ok) {
      throw new Error(`Lovable AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error('Invalid AI response format');
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);

    // Map job IDs back to full job objects
    const enrichedMatches = analysisResult.matches.map((match: any) => ({
      ...match,
      job: availableJobs.find(job => job.id === match.job.id) || match.job
    }));

    // Log analytics to database
    try {
      await supabase.from('agent_analytics').insert({
        agent_type: 'job_matching',
        user_id: userProfile.id,
        session_data: {
          total_jobs_analyzed: availableJobs.length,
          matches_found: enrichedMatches.length,
          average_score: analysisResult.analytics.averageMatchScore,
          analysis_type: analysisType,
          timestamp: new Date().toISOString()
        }
      });
    } catch (e) {
      console.error('Failed to log analytics:', e);
    }

    return new Response(JSON.stringify({
      matches: enrichedMatches,
      analytics: analysisResult.analytics,
      recommendations: analysisResult.recommendations
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI job matching error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      matches: [],
      analytics: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});