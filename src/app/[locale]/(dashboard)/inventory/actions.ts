"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { recalculateAllRecipesWithIngredient } from "../events/actions";

export async function getIngredients(orgId: string) {
  const supabase = await createClient();

  // Fetch ingredients with their latest price change
  const { data, error } = await supabase
    .from("Ingredient")
    .select(`
      *,
      PriceHistory (
        oldCost,
        newCost,
        createdAt
      )
    `)
    .eq("organizationId", orgId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching ingredients:", error);
    return [];
  }

  // Process data to add trend info
  return data.map((item) => {
    // Sort history by date descending to find the latest change
    const sortedHistory = (item.PriceHistory || []).sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const latestChange = sortedHistory[0];
    let trend = "flat";
    let changePercent = 0;
    
    if (latestChange) {
      const oldPrice = latestChange.oldCost || 0;
      const newPrice = latestChange.newCost || 0;
      if (oldPrice > 0) {
        changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
        if (changePercent > 0) trend = "up";
        if (changePercent < 0) trend = "down";
      }
    }

    return {
      ...item,
      trend,
      changePercent: changePercent.toFixed(1) + "%",
      lastUpdated: latestChange?.createdAt || item.updatedAt || item.createdAt
    };
  });
}

export async function upsertIngredient(formData: FormData, orgId: string) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const unit = formData.get("unit") as string;
  const cost = parseFloat(formData.get("cost") as string);
  const stock = parseFloat(formData.get("stock") as string);

  if (id) {
    // UPDATE
    // First, get current data to check for price change
    const { data: currentItem } = await supabase
      .from("Ingredient")
      .select("cost")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("Ingredient")
      .update({ name, unit, cost, stock, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .eq("organizationId", orgId);

    if (error) return { error: error.message };

    if (currentItem && currentItem.cost !== cost) {
      // Price changed! Add to history
      await supabase.from("PriceHistory").insert({
        ingredientId: id,
        oldCost: currentItem.cost,
        newCost: cost,
        createdAt: new Date().toISOString()
      });

      // TRIGGER CASCADE RECALCULATION
      // Now that the DB has the new cost, we can safely recalculate
      console.log(`Triggering recalculation for ingredient ${id} with new cost ${cost}`);
      try {
        await recalculateAllRecipesWithIngredient(id);
      } catch (err) {
        console.error("Failed to recalculate recipes:", err);
      }
    }

  } else {
    // CREATE
    const { error } = await supabase
      .from("Ingredient")
      .insert({
        name,
        unit,
        cost,
        stock,
        organizationId: orgId
      });

    if (error) return { error: error.message };
  }

  revalidatePath("/(dashboard)/inventory");
  return { success: true };
}
