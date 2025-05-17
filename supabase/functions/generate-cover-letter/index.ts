
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || "AIzaSyAAAncr4NWEryjFL7ChNXJZs_k3qvbpIq4";
    if (!GEMINI_API_KEY) {
      throw new Error('Missing Gemini API Key');
    }

    const { jobDescription, userProfile, resumeText } = await req.json();

    if (!jobDescription || !userProfile) {
      throw new Error('Missing required parameters');
    }

    // Create cover letter prompt
    const prompt = `
      You are an expert job application assistant. Write a tailored cover letter for the following job:
      
      Job Description: ${jobDescription}
      
      Based on the candidate profile:
      Professional Summary: ${userProfile.professional_summary || 'Not provided'}
      Skills: ${userProfile.skills ? userProfile.skills.join(', ') : 'Not provided'}
      
      Resume Text: ${resumeText || 'Not provided'}
      
      The cover letter should be professional, highlight relevant skills, show enthusiasm for the position,
      be around 250-300 words, with a formal closing. Don't use placeholder text - personalize based on the actual job and skills.
    `;

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      }),
    });

    const data = await response.json();
    
    // Extract the generated cover letter
    let coverLetter = '';
    if (data.candidates && data.candidates[0]?.content?.parts?.length > 0) {
      coverLetter = data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Failed to generate cover letter');
    }

    return new Response(JSON.stringify({ coverLetter }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating cover letter:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
