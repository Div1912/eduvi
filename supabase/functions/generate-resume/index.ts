import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Credential {
  degree: string;
  university: string;
  issuedDate: string;
  studentName: string;
}

interface ResumeRequest {
  credentials: Credential[];
  format: 'standard' | 'academic' | 'professional' | 'minimal';
  additionalInfo?: {
    skills?: string[];
    experience?: string;
    objective?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { credentials, format, additionalInfo } = await req.json() as ResumeRequest;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!credentials || credentials.length === 0) {
      return new Response(
        JSON.stringify({ error: "No verified credentials provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const credentialsList = credentials.map((c, i) => 
      `${i + 1}. ${c.degree} from ${c.university} (Issued: ${c.issuedDate})`
    ).join('\n');

    const formatInstructions = {
      standard: "Create a well-balanced professional resume with clear sections for education, skills, and summary.",
      academic: "Create an academic CV format emphasizing educational achievements, research experience, and publications.",
      professional: "Create a modern professional resume focused on career readiness and transferable skills.",
      minimal: "Create a clean, minimalist resume with essential information only."
    };

    const systemPrompt = `You are an expert resume writer. Generate a professional resume based on verified blockchain credentials. 
The resume should be well-formatted, professional, and ready to use.
Format the output in Markdown for easy rendering.
Include sections for: Summary/Objective, Education (from verified credentials), Skills, and any additional relevant sections.
${formatInstructions[format] || formatInstructions.standard}`;

    const userPrompt = `Generate a ${format} resume for a candidate with the following verified blockchain credentials:

VERIFIED CREDENTIALS:
${credentialsList}

${additionalInfo?.skills ? `SKILLS: ${additionalInfo.skills.join(', ')}` : ''}
${additionalInfo?.experience ? `EXPERIENCE: ${additionalInfo.experience}` : ''}
${additionalInfo?.objective ? `CAREER OBJECTIVE: ${additionalInfo.objective}` : ''}

Please generate a complete, professional resume in Markdown format.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate resume. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Resume generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});