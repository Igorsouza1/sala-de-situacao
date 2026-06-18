"use server";

import { encodedRedirect } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link.",
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  const user = data.user;

  if (user?.app_metadata?.is_superadmin === true) {
    return redirect("/admin");
  }

  const regionRow = await db.execute<{ region_id: number }>(sql`
    SELECT region_id FROM monitoramento.roles
    WHERE user_id = ${user.id}::uuid AND region_id IS NOT NULL
    ORDER BY id ASC LIMIT 1
  `);
  const regionId = regionRow.rows[0]?.region_id;

  return redirect(regionId ? `/protected?regiao_id=${regionId}` : "/protected");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/reset-password`,
  });



  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Senha e confirmação são obrigatórias",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "As senhas não coincidem",
    );
  }

  if (password.length < 6) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "A senha deve ter pelo menos 6 caracteres",
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return encodedRedirect(
      "error",
      "/reset-password",
      error.message,
    );
  }

  return encodedRedirect("success", "/reset-password", "Senha atualizada com sucesso");
};

export const completeInviteAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const name = formData.get("full_name") as string;

  if (!password || !confirmPassword || !name) {
    return encodedRedirect(
      "error",
      "/invite",
      "Nome, senha e confirmação são obrigatórios",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/invite",
      "As senhas não coincidem",
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return encodedRedirect(
      "error",
      "/invite",
      "Sessão de autenticação ausente. Use o link de convite novamente",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password,
    data: { full_name: name }
  },
  );

  if (error) {
    console.error("completeInviteAction", error);
    return encodedRedirect(
      "error",
      "/invite",
      error.message || "Não foi possível ativar a conta",
    );
  }

  return encodedRedirect(
    "success",
    "/sign-in",
    "Conta ativada com sucesso",
  );
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
