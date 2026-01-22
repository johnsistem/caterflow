"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { roundTo } from "@/lib/utils";

// ... existing fetchIngredients ...

export async function fetchIngredients(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Ingredient")
    .select("id, name, unit, cost, stock")
    .eq("organizationId", orgId)
    .order("name");
  
  if (error) {
    console.error("Error fetching ingredients:", error);
    return [];
  }
  return data;
}

export async function getRecipes(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Recipe")
    .select("id, name, category, totalCost, margin, price, description, yield")
    .eq("organizationId", orgId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching recipes:", error);
    return [];
  }
  return data;
}

export async function getRecipeDetails(recipeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Recipe")
    .select(`
      *,
      ingredients:RecipeIngredient(
        quantity,
        ingredient:Ingredient(id, name, unit, cost)
      )
    `)
    .eq("id", recipeId)
    .single();

  if (error) {
    return { error: error.message };
  }

  // Transform structure to match frontend expectations
  const formattedIngredients = data.ingredients.map((ri: any) => ({
    id: ri.ingredient.id,
    name: ri.ingredient.name,
    unit: ri.ingredient.unit,
    cost: ri.ingredient.cost,
    quantity: ri.quantity,
    uid: Math.random().toString() // Generate a temp UI ID
  }));

  return { 
    ...data,
    ingredients: formattedIngredients
  };
}

export async function saveRecipe(data: {
  id?: string; // Optional ID for updates
  orgId: string;
  name: string;
  description: string;
  category?: string;
  servings: number;
  totalCost: number;
  price: number;
  margin: number;
  ingredients: { id: string; quantity: number }[];
}) {
  const supabase = await createClient();

  // Enforce mathematical precision
  const safeData = {
    ...data,
    totalCost: roundTo(data.totalCost, 2),
    price: roundTo(data.price, 2),
    margin: roundTo(data.margin, 4)
  };

  // If ID exists, it's an UPDATE. Otherwise, INSERT.
  if (safeData.id) {
    // 1. Update Recipe fields
    const { error: updateError } = await supabase
      .from("Recipe")
      .update({
        name: safeData.name,
        description: safeData.description,
        category: safeData.category || "Main",
        yield: safeData.servings || 1,
        margin: safeData.margin,
        totalCost: safeData.totalCost,
        price: safeData.price
      })
      .eq("id", safeData.id);

    if (updateError) return { error: updateError.message };

    // 2. Sync Ingredients: Simplest way is Delete All + Re-insert
    const { error: deleteError } = await supabase
      .from("RecipeIngredient")
      .delete()
      .eq("recipeId", safeData.id);

    if (deleteError) return { error: deleteError.message };

    // 3. Insert new set
    if (safeData.ingredients.length > 0) {
      const ingredientsToInsert = safeData.ingredients.map(ing => ({
        recipeId: safeData.id,
        ingredientId: ing.id,
        quantity: ing.quantity
      }));

      const { error: insertIngError } = await supabase
        .from("RecipeIngredient")
        .insert(ingredientsToInsert);

      if (insertIngError) return { error: insertIngError.message };
    }

    revalidatePath("/(dashboard)/recipes");
    return { success: true, recipeId: safeData.id };

  } else {
    // CREATE NEW
    const { data: recipeData, error: recipeError } = await supabase
      .from("Recipe")
      .insert({
        organizationId: safeData.orgId,
        name: safeData.name,
        description: safeData.description,
        category: safeData.category || "Main",
        yield: safeData.servings || 1,
        margin: safeData.margin,
        totalCost: safeData.totalCost,
        price: safeData.price
      })
      .select("id")
      .single();

    if (recipeError) return { error: recipeError.message };

    if (safeData.ingredients.length > 0) {
      const ingredientsToInsert = safeData.ingredients.map(ing => ({
        recipeId: recipeData.id,
        ingredientId: ing.id,
        quantity: ing.quantity
      }));

      const { error: ingredientsError } = await supabase
        .from("RecipeIngredient")
        .insert(ingredientsToInsert);

      if (ingredientsError) return { error: ingredientsError.message };
    }

    revalidatePath("/(dashboard)/recipes");
    return { success: true, recipeId: recipeData.id };
  }
}

