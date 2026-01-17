"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function login(formData: FormData, locale: string) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/dashboard`);
}

export async function signup(formData: any, locale: string) {
  const { email, password, fullName, businessName, currency, language } = formData;
  const supabase = await createClient();

  // 1. Create Supabase Auth User
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  const authUser = authData.user;
  if (!authUser) {
    return { error: "Could not create user" };
  }

  try {
    // 2. Create Organization using Supabase client (skip Prisma nonsense)
    const { data: organization, error: orgError } = await supabase
      .from("Organization")
      .insert({
        name: businessName,
        currency: currency || "USD",
        language: language || locale || "es",
      })
      .select()
      .single();

    if (orgError || !organization) {
      console.error("Organization creation error:", orgError);
      return { error: "Error creating organization. Please try again." };
    }

    // 3. Create User record
    const { error: userError } = await supabase
      .from("User")
      .insert({
        id: authUser.id, // Use Supabase Auth ID
        email: authUser.email!,
        role: "ADMIN",
        organizationId: organization.id,
      });

    if (userError) {
      console.error("User creation error:", userError);
      return { error: "Error creating user record. Please try again." };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Signup error:", error);
    return { error: "Error saving business data. Please contact support." };
  }
}

export async function signOut(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(`/${locale}/login`);
}
