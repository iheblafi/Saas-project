import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Zod schema for the request body
const analyzeContentSchema = z.object({
  id: z.string().uuid({ message: "Invalid Content ID format" }),
  text: z.string().min(10, { message: "Text must be at least 10 characters long" }), // Add a minimum length check
});

// Define the structure for the analysis results (can be refined)
interface AnalysisResults {
  seo: { score: number; suggestions: string[]; keywords?: string[] };
  readability: { score: number; suggestions: string[]; gradeLevel?: string };
  engagement: { score: number; suggestions: string[]; tone?: string };
}

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // 1. Check Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Validate Request Body
  let validatedData: z.infer<typeof analyzeContentSchema>;
  try {
    const body = await req.json();
    validatedData = analyzeContentSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to parse request body" }, { status: 400 });
  }

  const { id, text: textToAnalyze } = validatedData;

  // 3. Verify Content Ownership (or permissions if teams are implemented)
  const { data: contentData, error: contentError } = await supabase
    .from("content")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (contentError || !contentData) {
    console.error("Content fetch error or permission denied:", contentError);
    // Distinguish between not found and other errors
    if (contentError?.code === "PGRST116") {
        return NextResponse.json({ error: "Content not found or access denied" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to verify content access" }, { status: 500 });
  }

  // 4. Call OpenAI API for Analysis
  try {
    // Check if OPENAI_API_KEY is configured
    if (!process.env.OPENAI_API_KEY) {
        console.error("OpenAI API Key not configured.");
        return NextResponse.json({ error: "AI analysis service is not configured." }, { status: 503 }); // 503 Service Unavailable
    }

    const analysisPrompt = `
      Analyze the following text for SEO, Readability, and Engagement. Provide a score from 0 to 100 for each category and actionable suggestions for improvement. Format the output as a JSON object with keys "seo", "readability", and "engagement". Each key should have an object with "score" (0-100) and "suggestions" (an array of strings). Include relevant keywords for SEO, estimated grade level for readability, and detected tone for engagement if possible.

      Text to analyze:
      --- START TEXT ---
      ${textToAnalyze}
      --- END TEXT ---

      JSON Output:
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: analysisPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const analysisResultString = completion.choices[0]?.message?.content;
    if (!analysisResultString) {
      throw new Error("OpenAI response was empty or invalid.");
    }

    // Basic validation of the parsed JSON structure (can be more robust)
    let analysisResults: AnalysisResults;
    try {
        analysisResults = JSON.parse(analysisResultString);
        // Add checks for expected keys/types if needed
        if (!analysisResults.seo || !analysisResults.readability || !analysisResults.engagement) {
            throw new Error("OpenAI response missing required analysis keys.");
        }
    } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError);
        throw new Error("Failed to parse analysis results from AI.");
    }

    // 5. Update Supabase Record
    const { error: updateError } = await supabase
      .from("content")
      .update({
        seo_analysis: analysisResults.seo,
        readability_analysis: analysisResults.readability,
        engagement_analysis: analysisResults.engagement,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
      // Note: No user_id check needed here as ownership was verified before calling AI

    if (updateError) {
      console.error("Error updating content analysis in Supabase:", updateError);
      // Don't expose detailed DB errors to the client
      throw new Error("Failed to save analysis results.");
    }

    // 6. Return Success Response
    return NextResponse.json({ success: true, analysis: analysisResults });

  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    const errorMessage = error.message || "Failed to analyze content";
    // Avoid exposing sensitive details from OpenAI errors
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 