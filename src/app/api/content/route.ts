import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Zod schema for creating content
const createContentSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }).max(255),
  body: z.any().optional(), // TipTap JSON can be complex, basic validation for now
});

// GET all content for the authenticated user
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("content")
    .select("id, created_at, updated_at, title, status, scheduled_publish_at, published_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST new content with Zod validation
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validatedData: z.infer<typeof createContentSchema>;
  try {
    const jsonData = await req.json();
    validatedData = createContentSchema.parse(jsonData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to parse request body" }, { status: 400 });
  }

  const { title, body } = validatedData;

  const { data, error } = await supabase
    .from("content")
    .insert({
      user_id: user.id,
      title: title,
      body: body || { type: "doc", content: [] }, // Default empty TipTap document
      status: "draft",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating content:", error);
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
} 