
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { resumeUrl } = await req.json();

    if (!resumeUrl) {
      throw new Error('Missing resume URL');
    }

    // For demo purposes, we're simulating text extraction
    // In a real implementation, you would:
    // 1. Fetch the PDF/file from the URL
    // 2. Extract text using a PDF parsing library
    // 3. Return the extracted text
    
    // Simple mock implementation that returns placeholder text
    const extractedText = `
      John Doe
      Software Engineer
      
      Professional Summary:
      Experienced software engineer with 5+ years of experience in full-stack development.
      Skilled in JavaScript, TypeScript, React, Node.js, and cloud technologies.
      Passionate about building innovative solutions and solving complex problems.
      
      Experience:
      Senior Software Engineer | ABC Tech | 2020 - Present
      - Developed and maintained multiple web applications using React and Node.js
      - Led a team of 3 developers to successfully deliver projects on time
      - Implemented CI/CD pipelines to improve deployment efficiency by 50%
      - Reduced application loading time by 40% through performance optimization
      
      Frontend Developer | XYZ Solutions | 2018 - 2020
      - Built responsive user interfaces using React and TypeScript
      - Collaborated with UX designers to implement intuitive user experiences
      - Refactored legacy code to improve maintainability and performance
      
      Education:
      BSc in Computer Science | University of Technology | 2018
      
      Skills:
      JavaScript, TypeScript, React, Node.js, Express, MongoDB, SQL, AWS, Docker, Git
    `;

    return new Response(JSON.stringify({ text: extractedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error extracting resume text:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
