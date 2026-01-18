"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function fetchOrgSettings(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Organization")
    .select("id, name, currency, language, logoUrl, taxRate, serviceFeeRate")
    .eq("id", orgId)
    .single();

  if (error) return { error: error.message };
  return { success: true, settings: data };
}

export async function updateOrgSettings(orgId: string, data: {
  name?: string;
  currency?: string;
  language?: string;
  logoUrl?: string;
  taxRate?: number;
  serviceFeeRate?: number;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("Organization")
    .update(data)
    .eq("id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/[locale]/(dashboard)/settings", "page");
  revalidatePath("/(dashboard)", "layout"); // Revalidate all dashboard to update currency globally
  
  return { success: true };
}
