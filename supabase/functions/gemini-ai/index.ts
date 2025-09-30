import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeminiRequest {
  prompt: string;
  context?: string;
  agentType?: string;
  maxTokens?: number;
  temperature?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, context, agentType, maxTokens = 2048, temperature = 0.7 }: GeminiRequest = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Build the system prompt based on agent type
    const systemPrompts = {
      jobMatching: `You are an AI job matching agent. Analyze job requirements and candidate profiles to provide accurate match scores and detailed reasoning. Return structured JSON data.`,
      careerAnalysis: `You are an AI career analysis agent. Analyze career profiles and resumes to provide insights on career level, skill gaps, and growth opportunities. Return structured JSON data.`,
      marketIntelligence: `You are an AI market intelligence agent. Analyze job market trends, salary data, and industry insights. Return structured JSON data with comprehensive market analysis.`,
      applicationOptimization: `You are an AI application optimization agent. Analyze job applications and provide optimization recommendations for cover letters, resumes, and application strategy. Return structured JSON data.`,
      skillDevelopment: `You are an AI skill development agent. Analyze skill gaps and provide personalized learning recommendations with specific resources and timelines. Return structured JSON data.`,
      networkDiscovery: `You are an AI network discovery agent. Analyze professional networks and provide networking recommendations and strategies. Return structured JSON data.`,
      general: `You are a helpful AI assistant specializing in career and job-related queries. Provide accurate, actionable insights.`
    };

    const systemPrompt = systemPrompts[agentType as keyof typeof systemPrompts] || systemPrompts.general;
    
    const fullPrompt = context 
      ? `${systemPrompt}\n\nContext: ${context}\n\nRequest: ${prompt}`
      : `${systemPrompt}\n\nRequest: ${prompt}`;

    console.log(`Gemini AI request for ${agentType}:`, { prompt: prompt.substring(0, 100) + '...' });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: maxTokens,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Gemini');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log(`Gemini AI response for ${agentType}:`, generatedText.substring(0, 200) + '...');

    // Try to parse as JSON if it's structured data
    let result;
    try {
      result = JSON.parse(generatedText);
    } catch {
      result = { text: generatedText };
    }

    return new Response(JSON.stringify({
      success: true,
      result,
      agentType,
      usage: {
        prompt_tokens: fullPrompt.length / 4, // Rough estimate
        completion_tokens: generatedText.length / 4,
        total_tokens: (fullPrompt.length + generatedText.length) / 4
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-ai function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});