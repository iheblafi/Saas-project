import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET comments for a specific content item
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const contentId = params.id;
  const supabase = createClient();

  // 1. Check Authentication (optional, depends if comments are public or restricted)
  // For now, assume anyone who can view the content can view comments.
  // A stricter check would verify user has access to the contentId first.
  const { data: { user } } = await supabase.auth.getUser();
  // if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if user can access the parent content (example policy)
  // This requires joining or a separate check depending on RLS policies
  const { data: contentAccess, error: contentAccessError } = await supabase
    .from("content")
    .select("id")
    .eq("id", contentId)
    // Apply RLS check implicitly or add explicit user_id check if needed
    // .eq("user_id", user?.id) // Uncomment if only owner can see comments initially
    .maybeSingle();

  if (contentAccessError || !contentAccess) {
      // If content doesn't exist or user doesn't have access based on RLS
      console.error("Error fetching parent content or access denied:", contentAccessError);
      return NextResponse.json({ error: "Cannot fetch comments for this content" }, { status: 403 });
  }

  // 2. Fetch Comments
  const { data, error } = await supabase
    .from("comments")
    .select(`
      id, 
      created_at, 
      comment_text, 
      parent_comment_id,
      profiles ( id, full_name, avatar_url )
    `)
    .eq("content_id", contentId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }

  // TODO: Structure comments into threads if needed before sending response

  return NextResponse.json(data);
}

// POST a new comment for a specific content item
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const contentId = params.id;
  const supabase = createClient();

  // 1. Check Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse Request Body
  let comment_text: string;
  let parent_comment_id: string | null = null;
  try {
    const body = await req.json();
    comment_text = body.comment_text;
    parent_comment_id = body.parent_comment_id || null;
    if (!comment_text) {
      throw new Error("Missing comment_text");
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // 3. Verify user has permission to comment (e.g., can access the content)
  // RLS policy on comments table should handle this check during INSERT

  // 4. Insert Comment
  const { data, error } = await supabase
    .from("comments")
    .insert({
      content_id: contentId,
      user_id: user.id,
      comment_text: comment_text,
      parent_comment_id: parent_comment_id,
    })
    .select(`
      id, 
      created_at, 
      comment_text, 
      parent_comment_id,
      profiles ( id, full_name, avatar_url )
    `)
    .single();

  if (error) {
    console.error("Error creating comment:", error);
    // Check RLS violation error
    if (error.message.includes("violates row-level security policy")) {
        return NextResponse.json({ error: "Permission denied to comment on this content" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
} 