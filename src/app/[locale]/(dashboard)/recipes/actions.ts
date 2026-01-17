"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
    .select("id, name, category, totalCost, margin, price, description")
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

  // If ID exists, it's an UPDATE. Otherwise, INSERT.
  if (data.id) {
    // 1. Update Recipe fields
    const { error: updateError } = await supabase
      .from("Recipe")
      .update({
        name: data.name,
        description: data.description,
        category: data.category || "Main",
        margin: data.margin,
        totalCost: data.totalCost,
        price: data.price
      })
      .eq("id", data.id);

    if (updateError) return { error: updateError.message };

    // 2. Sync Ingredients: Simplest way is Delete All + Re-insert
    // (Or be smart and diff, but re-insert is safer/easier for this scale)
    const { error: deleteError } = await supabase
      .from("RecipeIngredient")
      .delete()
      .eq("recipeId", data.id);

    if (deleteError) return { error: deleteError.message };

    // 3. Insert new set
    if (data.ingredients.length > 0) {
      const ingredientsToInsert = data.ingredients.map(ing => ({
        recipeId: data.id,
        ingredientId: ing.id,
        quantity: ing.quantity
      }));

      const { error: insertIngError } = await supabase
        .from("RecipeIngredient")
        .insert(ingredientsToInsert);

      if (insertIngError) return { error: insertIngError.message };
    }

    revalidatePath("/(dashboard)/recipes");
    return { success: true, recipeId: data.id };

  } else {
    // CREATE NEW
    const { data: recipeData, error: recipeError } = await supabase
      .from("Recipe")
      .insert({
        organizationId: data.orgId,
        name: data.name,
        description: data.description,
        category: data.category || "Main",
        margin: data.margin,
        totalCost: data.totalCost,
        price: data.price
      })
      .select("id")
      .single();

    if (recipeError) return { error: recipeError.message };

    if (data.ingredients.length > 0) {
      const ingredientsToInsert = data.ingredients.map(ing => ({
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

