import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation constants
const ALLOWED_FORMATS = ['standard', 'academic', 'professional', 'minimal'] as const;
const MAX_SKILLS_COUNT = 20;
const MAX_SKILL_LENGTH = 100;
const MAX_OBJECTIVE_LENGTH = 500;
const MAX_EXPERIENCE_LENGTH = 2000;
const MAX_CREDENTIALS = 50;
const MAX_STRING_LENGTH = 500;

interface Credential {
  degree: string;
  university: string;
  issuedDate: string;
  studentName: string;
}

interface ResumeRequest {
  credentials: Credential[];
  format: typeof ALLOWED_FORMATS[number];
  additionalInfo?: {
    skills?: string[];
    experience?: string;
    objective?: string;
  };
}

// Sanitize text to prevent prompt injection
function sanitizeText(text: string, maxLength: number): string {
  if (!text || typeof text !== 'string') return '';
  // Trim and limit length
  let sanitized = text.trim().substring(0, maxLength);
  // Remove common prompt injection patterns
  sanitized = sanitized
    .replace(/ignore\s*(previous|above|all)\s*instructions/gi, '')
    .replace(/you\s*are\s*now/gi, '')
    .replace(/system\s*prompt/gi, '')
    .replace(/\[INST\]/gi, '')
    .replace(/<\/?s>/gi, '');
  return sanitized;
}

// Validate credential structure
function validateCredential(cred: unknown): cred is Credential {
  if (!cred || typeof cred !== 'object') return false;
  const c = cred as Record<string, unknown>;
  return (
    typeof c.degree === 'string' &&
    typeof c.university === 'string' &&
    typeof c.issuedDate === 'string' &&
    typeof c.studentName === 'string'
  );
}

// Validate request body
function validateRequest(body: unknown): { valid: true; data: ResumeRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: "Invalid request body" };
  }

  const req = body as Record<string, unknown>;

  // Validate credentials array
  if (!Array.isArray(req.credentials)) {
    return { valid: false, error: "credentials must be an array" };
  }

  if (req.credentials.length === 0) {
    return { valid: false, error: "No credentials provided" };
  }

  if (req.credentials.length > MAX_CREDENTIALS) {
    return { valid: false, error: `Maximum ${MAX_CREDENTIALS} credentials allowed` };
  }

  for (let i = 0; i < req.credentials.length; i++) {
    if (!validateCredential(req.credentials[i])) {
      return { valid: false, error: `Invalid credential at index ${i}` };
    }
  }

  // Validate format
  const format = req.format as string;
  if (!ALLOWED_FORMATS.includes(format as typeof ALLOWED_FORMATS[number])) {
    return { valid: false, error: `Invalid format. Allowed: ${ALLOWED_FORMATS.join(', ')}` };
  }

  // Validate additionalInfo if provided
  if (req.additionalInfo !== undefined) {
    if (typeof req.additionalInfo !== 'object' || req.additionalInfo === null) {
      return { valid: false, error: "additionalInfo must be an object" };
    }

    const info = req.additionalInfo as Record<string, unknown>;

    if (info.skills !== undefined) {
      if (!Array.isArray(info.skills)) {
        return { valid: false, error: "skills must be an array" };
      }
      if (info.skills.length > MAX_SKILLS_COUNT) {
        return { valid: false, error: `Maximum ${MAX_SKILLS_COUNT} skills allowed` };
      }
      for (const skill of info.skills) {
        if (typeof skill !== 'string') {
          return { valid: false, error: "Each skill must be a string" };
        }
      }
    }

    if (info.experience !== undefined && typeof info.experience !== 'string') {
      return { valid: false, error: "experience must be a string" };
    }

    if (info.objective !== undefined && typeof info.objective !== 'string') {
      return { valid: false, error: "objective must be a string" };
    }
  }

  return { valid: true, data: req as unknown as ResumeRequest };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user with Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validation = validateRequest(requestBody);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { credentials, format, additionalInfo } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize all text inputs
    const sanitizedCredentials = credentials.map((c, i) => ({
      degree: sanitizeText(c.degree, MAX_STRING_LENGTH),
      university: sanitizeText(c.university, MAX_STRING_LENGTH),
      issuedDate: sanitizeText(c.issuedDate, 50),
      studentName: sanitizeText(c.studentName, MAX_STRING_LENGTH),
    }));

    const credentialsList = sanitizedCredentials.map((c, i) => 
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
${formatInstructions[format]}`;

    // Sanitize additionalInfo fields
    const sanitizedSkills = additionalInfo?.skills
      ?.slice(0, MAX_SKILLS_COUNT)
      .map(s => sanitizeText(s, MAX_SKILL_LENGTH))
      .filter(s => s.length > 0) || [];
    
    const sanitizedExperience = additionalInfo?.experience 
      ? sanitizeText(additionalInfo.experience, MAX_EXPERIENCE_LENGTH) 
      : '';
    
    const sanitizedObjective = additionalInfo?.objective 
      ? sanitizeText(additionalInfo.objective, MAX_OBJECTIVE_LENGTH) 
      : '';

    const userPrompt = `Generate a ${format} resume for a candidate with the following verified blockchain credentials:

VERIFIED CREDENTIALS:
${credentialsList}

${sanitizedSkills.length > 0 ? `SKILLS: ${sanitizedSkills.join(', ')}` : ''}
${sanitizedExperience ? `EXPERIENCE: ${sanitizedExperience}` : ''}
${sanitizedObjective ? `CAREER OBJECTIVE: ${sanitizedObjective}` : ''}

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
      // Log detailed error server-side only
      const errorText = await response.text();
      console.error(`AI gateway error for user ${userId}:`, response.status, errorText);
      
      // Return generic errors to client
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service temporarily busy. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service unavailable. Please try again later." }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Unable to generate resume. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    // Log error details server-side only
    console.error("Resume generation error:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
