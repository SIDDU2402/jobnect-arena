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

    console.log(`Analyzing ${availableJobs.length} jobs for ${userProfile.first_name}`);

    // Enhanced AI prompt with advanced matching criteria
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
            content: `You are an expert AI career advisor and job matching specialist with deep knowledge in:
- Technical skill analysis and semantic matching
- Transferable skills identification
- Career trajectory assessment
- Industry trends and market intelligence
- ATS (Applicant Tracking System) optimization

Your task is to perform advanced job matching using multi-factor analysis:

SCORING METHODOLOGY (Total: 100 points):
1. Skills Alignment (40 points):
   - Direct skill matches: Exact matches get full points
   - Semantic matches: Related/synonym skills get 80% points
   - Transferable skills: Adjacent skills get 60% points
   - Weight by importance: "Required" > "Preferred" > "Nice to have"
   
2. Experience Level (25 points):
   - Years of experience vs. job requirements
   - Seniority level alignment (Junior/Mid/Senior/Lead)
   - Industry-specific experience
   
3. Technical Depth (15 points):
   - Expertise level in key technologies
   - Breadth vs. depth of skills
   - Recent vs. outdated technologies
   
4. Culture & Growth Fit (10 points):
   - Company culture indicators
   - Career advancement opportunities
   - Learning and development potential
   
5. Practical Factors (10 points):
   - Location/remote compatibility
   - Salary range alignment
   - Job type (full-time, contract, etc.)

ANALYSIS REQUIREMENTS:
- Identify not just keyword matches, but semantic relationships
- Recognize skill synonyms (e.g., JS = JavaScript = ECMAScript)
- Detect transferable skills (e.g., React experience → Vue.js potential)
- Consider skill recency and market demand
- Evaluate experience quality, not just quantity
- Only return matches with score >= 60 (good fit threshold)`
          },
          {
            role: 'user',
            content: `
🎯 CANDIDATE PROFILE ANALYSIS:

BASIC INFO:
• Name: ${userProfile.first_name} ${userProfile.last_name}
• Role: ${userProfile.role || 'Not specified'}

SKILLS INVENTORY (${userProfile.skills?.length || 0} skills):
${userProfile.skills?.length > 0 ? userProfile.skills.map((skill, i) => `${i + 1}. ${skill}`).join('\n') : '• No skills listed'}

PROFESSIONAL SUMMARY:
${userProfile.professional_summary || 'Not provided - this will lower match confidence'}

COMPLETE RESUME CONTENT:
${resumeText || 'No resume provided - matching will be limited to profile data only'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 AVAILABLE JOB OPPORTUNITIES (${availableJobs.length} positions):

${availableJobs.map((job, index) => `
═══════ JOB #${index + 1} ═══════
🆔 Job ID: ${job.id}
💼 Position: ${job.title}
🏢 Company: ${job.company}
📍 Location: ${job.location}
💰 Compensation: ${job.salary}
⏰ Type: ${job.type}

📝 FULL JOB DESCRIPTION:
${job.description}

✅ COMPLETE REQUIREMENTS LIST:
${job.requirements}

`).join('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTRUCTIONS:
1. Analyze EACH job thoroughly against the candidate profile
2. Use semantic matching for skills (recognize synonyms and related technologies)
3. Identify transferable skills that aren't exact matches but indicate adaptability
4. Consider experience level and seniority alignment
5. Evaluate career growth potential based on job description language
6. Generate specific, actionable reasons for each match
7. Identify critical skill gaps that could be addressed with training
8. Provide strategic career advice based on market analysis

Return comprehensive matching results using the function call.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_job_matches",
              description: "Perform advanced multi-factor job matching analysis",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    description: "Only include matches with score >= 60",
                    items: {
                      type: "object",
                      properties: {
                        job: { 
                          type: "object",
                          description: "The complete job object"
                        },
                        score: { 
                          type: "number", 
                          minimum: 60, 
                          maximum: 100,
                          description: "Overall match score (only include if >= 60)"
                        },
                        reasons: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Specific reasons why this is a good match (3-5 reasons)"
                        },
                        skillsMatch: { 
                          type: "number", 
                          minimum: 0, 
                          maximum: 100,
                          description: "Skills alignment score with semantic matching"
                        },
                        experienceMatch: { 
                          type: "number", 
                          minimum: 0, 
                          maximum: 100,
                          description: "Experience level match score"
                        },
                        cultureFit: { 
                          type: "number", 
                          minimum: 0, 
                          maximum: 100,
                          description: "Company culture and growth fit score"
                        },
                        matchedSkills: {
                          type: "array",
                          items: { type: "string" },
                          description: "List of key skills that match (5-10 skills)"
                        },
                        skillGaps: {
                          type: "array",
                          items: { type: "string" },
                          description: "Critical missing skills (3-5 skills)"
                        },
                        transferableSkills: {
                          type: "array",
                          items: { type: "string" },
                          description: "Skills that can transfer to this role (2-4 skills)"
                        },
                        careerGrowth: {
                          type: "number",
                          minimum: 0,
                          maximum: 100,
                          description: "Career advancement potential score"
                        },
                        confidence: {
                          type: "number",
                          minimum: 0,
                          maximum: 100,
                          description: "Confidence level in this match based on data quality"
                        }
                      },
                      required: ["job", "score", "reasons", "skillsMatch", "experienceMatch", "cultureFit", "matchedSkills", "skillGaps", "careerGrowth", "confidence"]
                    }
                  },
                  analytics: {
                    type: "object",
                    properties: {
                      totalJobsAnalyzed: { type: "number" },
                      qualityMatchesFound: { type: "number", description: "Matches with score >= 60" },
                      averageMatchScore: { type: "number" },
                      topSkillsInDemand: { 
                        type: "array", 
                        items: { type: "string" },
                        description: "5-10 most in-demand skills across all jobs"
                      },
                      marketTrends: { 
                        type: "string",
                        description: "2-3 sentence analysis of current job market trends"
                      },
                      competitivenessRating: {
                        type: "string",
                        enum: ["Highly Competitive", "Competitive", "Moderate", "Needs Improvement"],
                        description: "Overall competitiveness assessment"
                      }
                    },
                    required: ["totalJobsAnalyzed", "qualityMatchesFound", "averageMatchScore", "topSkillsInDemand", "marketTrends", "competitivenessRating"]
                  },
                  recommendations: {
                    type: "object",
                    properties: {
                      profileImprovements: { 
                        type: "array", 
                        items: { type: "string" },
                        description: "3-5 specific ways to improve the profile"
                      },
                      skillsToLearn: { 
                        type: "array", 
                        items: { type: "string" },
                        description: "5-8 high-impact skills to learn based on market demand"
                      },
                      careerAdvice: { 
                        type: "string",
                        description: "3-4 sentences of strategic career guidance"
                      },
                      immediateActions: {
                        type: "array",
                        items: { type: "string" },
                        description: "3-4 actionable steps to take right now"
                      }
                    },
                    required: ["profileImprovements", "skillsToLearn", "careerAdvice", "immediateActions"]
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
      const errorText = await response.text();
      console.error('Lovable AI API error:', errorText);
      throw new Error(`Lovable AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response received');
    
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error('Invalid AI response format:', JSON.stringify(aiResponse));
      throw new Error('Invalid AI response format - no tool call found');
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);

    // Ensure job objects are complete
    const enrichedMatches = analysisResult.matches.map((match: any) => ({
      ...match,
      job: availableJobs.find(job => job.id === match.job.id) || match.job
    }));

    console.log(`Found ${enrichedMatches.length} quality matches (score >= 60)`);

    // Log detailed analytics to database
    try {
      await supabase.from('agent_analytics').insert({
        agent_type: 'job_matching',
        user_id: userProfile.id,
        session_data: {
          total_jobs_analyzed: availableJobs.length,
          matches_found: enrichedMatches.length,
          average_score: analysisResult.analytics.averageMatchScore,
          top_skills_demand: analysisResult.analytics.topSkillsInDemand,
          competitiveness: analysisResult.analytics.competitivenessRating,
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
      analytics: null,
      recommendations: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
