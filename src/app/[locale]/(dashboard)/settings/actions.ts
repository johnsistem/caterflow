"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function fetchOrgSettings(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Organization")
    .select("id, name, currency, language, logoUrl, slogan, taxRate, serviceFeeRate")
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
  slogan?: string;
  taxRate?: number;
  serviceFeeRate?: number;
  conversionRate?: number;
}) {
  const supabase = await createClient();

  // If conversion rate is provided and valid, update all inventory prices
  if (data.conversionRate && data.conversionRate !== 1) {
    const rate = data.conversionRate;
    
    // 1. Update Ingredients
    const { data: ingredients, error: ingError } = await supabase
      .from("Ingredient")
      .select("id, cost")
      .eq("organizationId", orgId);
    
    if (!ingError && ingredients) {
      for (const ing of ingredients) {
         await supabase.from("Ingredient").update({ cost: ing.cost * rate }).eq("id", ing.id);
      }
    }

    // 2. Update Recipes
    const { data: recipes, error: recError } = await supabase
      .from("Recipe")
      .select("id, totalCost, price")
      .eq("organizationId", orgId);
    
    if (!recError && recipes) {
      for (const rec of recipes) {
         await supabase.from("Recipe").update({ 
           totalCost: rec.totalCost * rate,
           price: rec.price * rate
         }).eq("id", rec.id);
      }
    }
  }

  // Final update of organization settings (remove conversionRate from what goes into Organization table)
  const { conversionRate, ...orgData } = data;
  
  const { error } = await supabase
    .from("Organization")
    .update(orgData)
    .eq("id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/[locale]/(dashboard)/settings", "page");
  revalidatePath("/(dashboard)", "layout"); 
  
  return { success: true };
}
