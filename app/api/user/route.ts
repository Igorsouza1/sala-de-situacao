import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    full_name: profile?.full_name ?? null,
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: { full_name?: string; email?: string } = {};

  if (typeof body.full_name === "string" && body.full_name.trim() !== "") {
    updates.full_name = body.full_name.trim();
  }

  if (
    typeof body.email === "string" &&
    body.email.trim() !== "" &&
    body.email !== user.email
  ) {
    updates.email = body.email.trim();
  }

  if (updates.full_name) {
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: updates.full_name })
      .eq("id", user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await supabase.auth.updateUser({ data: { full_name: updates.full_name } });
  }

  if (updates.email) {
    const { error } = await supabase.auth.updateUser({ email: updates.email });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (!updates.full_name && !updates.email) {
    return NextResponse.json({ message: "Nothing to update" });
  }

  const {
    data: { user: updatedUser },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    id: updatedUser?.id ?? user.id,
    email: updatedUser?.email ?? user.email,
    created_at: updatedUser?.created_at ?? user.created_at,
    full_name: profile?.full_name ?? null,
  });
}