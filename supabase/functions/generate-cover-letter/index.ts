
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

    const { 
      jobDescription, 
      userProfile, 
      resumeText, 
      learningContext = "",
      jobTitle = "",
      company = "",
      enhanced = false 
    } = await req.json();

    if (!jobDescription || !userProfile) {
      throw new Error('Missing required parameters');
    }
    
    // Enhanced prompting for better cover letter generation
    const userFullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
    const userSkills = Array.isArray(userProfile.skills) ? userProfile.skills.join(', ') : '';
    
    // Create advanced cover letter prompt with improved structure
    const prompt = `
      You are an expert job application assistant with years of experience helping candidates land interviews.
      Write a highly personalized, compelling cover letter for the following job:
      
      Job Title: ${jobTitle || "Position"}
      Company: ${company || "Company"}
      Job Description: ${jobDescription}
      
      CANDIDATE PROFILE:
      Full Name: ${userFullName}
      Professional Summary: ${userProfile.professional_summary || 'Not provided'}
      Skills: ${userSkills}
      
      Resume Text: ${resumeText || 'Not provided'}
      ${learningContext ? `\nLEARNING CONTEXT:\n${learningContext}` : ''}
      
      IMPORTANT GUIDELINES:
      1. Begin with a professional greeting and an engaging opening paragraph that shows enthusiasm
      2. In the body paragraphs, demonstrate a clear understanding of the role and how the candidate's experience aligns with it
      3. Highlight 2-3 specific achievements or skills from the resume that directly relate to this position
      4. Mention the company by name and why the candidate wants to work there specifically
      5. End with a confident closing paragraph expressing interest in an interview
      6. Include a formal closing with the candidate's full name
      7. Keep the letter professional, concise (250-300 words), and focused on value the candidate brings
      8. Avoid generic statements and focus on specific, relevant skills and experiences
      9. Do NOT include today's date or addresses - just the body of the letter
      10. Make sure the tone is confident but not arrogant, professional but personable
      ${enhanced ? 
        `11. Use advanced persuasive writing techniques to make the letter stand out
         12. Incorporate industry-specific terminology that shows deep understanding of the field
         13. Address potential objections or gaps preemptively with positive framing
         14. Subtly emphasize growth mindset and adaptability` 
        : ''}
      
      OUTPUT SHOULD BE FORMATTED AS A COMPLETE, READY-TO-SUBMIT COVER LETTER WITH NO PLACEHOLDERS.
    `;
    
    console.log("Sending request to Gemini API...");

    // Call Gemini API with improved parameters
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
          temperature: enhanced ? 0.7 : 0.5,
          maxOutputTokens: 1000,
          topP: 0.95,
          topK: 40,
        },
      }),
    });

    const data = await response.json();
    
    // Extract the generated cover letter with better error handling
    let coverLetter = '';
    if (data.candidates && data.candidates[0]?.content?.parts?.length > 0) {
      coverLetter = data.candidates[0].content.parts[0].text;
      console.log("Cover letter generated successfully");
    } else if (data.promptFeedback) {
      throw new Error(`Generation failed: ${data.promptFeedback.blockReason || 'Unknown reason'}`);
    } else {
      throw new Error('Failed to generate cover letter: No content returned');
    }
    
    // Add job application metadata
    let enhancedCoverLetter = coverLetter;
    if (enhanced) {
      // Add invisible metadata as an HTML comment that won't be visible when rendered
      enhancedCoverLetter = `${coverLetter}
<!-- 
Job Application Metadata:
Generated: ${new Date().toISOString()}
Job: ${jobTitle}
Company: ${company}
Match Quality: Enhanced with AI optimization
-->`;
    }

    return new Response(JSON.stringify({ coverLetter: enhancedCoverLetter }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating cover letter:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
