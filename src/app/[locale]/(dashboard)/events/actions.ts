"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { roundTo } from "@/lib/utils";

export async function fetchEventData(orgId: string) {
  const supabase = await createClient();

  console.log("Fetching events for Org:", orgId);

  // 1. Fetch Events with Client
  const query = supabase
    .from("Event")
    .select(`
      *,
      client:Client(id, name),
      eventRecipes:EventRecipe(
        quantity,
        price,
        recipe:Recipe(id, name, price, totalCost, category)
      )
    `)
    .eq("organizationId", orgId)
    .order("date", { ascending: true });
    
  const { data: events, error: eventsError } = await query;

  if (eventsError) {
    console.error("Error fetching events:", eventsError);
    // Fallback: try fetching without joins to see if that's the issue
    const { data: rawEvents, error: rawError } = await supabase
      .from("Event")
      .select("*")
      .eq("organizationId", orgId);
      
    if (rawEvents) {
      console.log("Found raw events without joins:", rawEvents.length);
    } else {
      console.error("Error fetching raw events:", rawError);
    }
  } else {
    console.log("Events fetched successfully:", events?.length);
  }

  // 2. Fetch Clients for dropdown
  const { data: clients, error: clientsError } = await supabase
    .from("Client")
    .select("id, name")
    .eq("organizationId", orgId)
    .order("name");

  if (clientsError) console.error("Error fetching clients:", clientsError);

  // 3. Fetch Recipes for selector
  const { data: recipes, error: recipesError } = await supabase
    .from("Recipe")
    .select("id, name, price, description") 
    .order("name");

  if (recipesError) console.error("Error fetching recipes:", recipesError);

  return {
    events: events || [],
    clients: clients || [],
    recipes: recipes || []
  };
}

export async function upsertEvent(data: {
  id?: string;
  orgId: string;
  clientId: string;
  name: string;
  date: string;
  guests: number;
  status: string;
  recipes: { recipeId: string; quantity: number }[]; // logic: quantity of recipe usually 1 per guest? Or simpler: list of recipes included. 
  // Wait, if it's a menu, usually "Recipe X" is served to "N guests". 
  // Let's assume standard event catering: 1 recipe unit usually = 1 portion.
  // So if guests = 150, we likely need 150 portions of Main Course.
  // The UI should probably default quantity to guests count?
}) {
  const supabase = await createClient();

  // Calculate Total Price
  // We need prices of recipes. It's better to fetch them or trust client?
  // Let's fetch to be safe or just sum up what we have if we passed prices?
  // To keep it simple in server action:
  // We need to iterate recipes to sum up (price * quantity).
  
  // 1. Fetch recipe prices
  const recipeIds = data.recipes.map(r => r.recipeId);
  const { data: recipePrices } = await supabase
    .from("Recipe")
    .select("id, price")
    .in("id", recipeIds);
  
  const priceMap = new Map(recipePrices?.map(r => [r.id, r.price]) || []);
  
  let totalPrice = 0;
  data.recipes.forEach(r => {
    const price = priceMap.get(r.recipeId) || 0;
    totalPrice += price * r.quantity;
  });

  // Apply Service Fee (18%) and Tax (8.5%) to match frontend logic
  // TODO: Move these constants to Organization settings
  const serviceFee = totalPrice * 0.18;
  const tax = totalPrice * 0.085;
  totalPrice = totalPrice + serviceFee + tax;
  
  // Round to 2 decimals
  totalPrice = Math.round(totalPrice * 100) / 100;

  const payload = {
    organizationId: data.orgId,
    clientId: data.clientId,
    name: data.name,
    date: new Date(data.date).toISOString(),
    guests: data.guests,
    status: data.status,
    totalPrice
  };

  let eventId = data.id;

  if (eventId) {
    // Update
    const { error } = await supabase.from("Event").update(payload).eq("id", eventId);
    if (error) return { error: error.message };
    
    // Clear existing recipes to rewrite (simple approach)
    await supabase.from("EventRecipe").delete().eq("eventId", eventId);
  } else {
    // Insert
    const { data: newEvent, error } = await supabase.from("Event").insert(payload).select("id").single();
    if (error) return { error: error.message };
    eventId = newEvent.id;
  }

  // Insert Relation with Price Snapshot
  if (data.recipes.length > 0 && eventId) {
    const relations = data.recipes.map(r => ({
      eventId: eventId,
      recipeId: r.recipeId,
      quantity: r.quantity,
      price: priceMap.get(r.recipeId) || 0 // Snapshot the price!
    }));
    
    const { error: relError } = await supabase.from("EventRecipe").insert(relations);
    if (relError) return { error: relError.message };
  }

  revalidatePath("/(dashboard)/events");
  revalidatePath("/(dashboard)/dashboard"); // For stats
  revalidatePath("/(dashboard)/clients"); // For client history

  return { success: true };
}

export async function updateEventStatus(eventId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("Event")
    .update({ status })
    .eq("id", eventId);

  if (error) return { error: error.message };
  
  revalidatePath("/(dashboard)/events");
  revalidatePath("/(dashboard)/dashboard");
  return { success: true };
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient();
  
  // Hard delete (Physical delete)
  // Cascading deletes usually handled by DB, but here EventRecipe has FK to Event.
  // We'll delete recipes first to be safe, then the event.
  
  // 1. Delete EventRecipes
  const { error: recipesError } = await supabase
    .from("EventRecipe")
    .delete()
    .eq("eventId", eventId);
    
  if (recipesError) return { error: recipesError.message };

  // 2. Delete Event
  const { error } = await supabase
    .from("Event")
    .delete()
    .eq("id", eventId);

  if (error) return { error: error.message };
  
  revalidatePath("/(dashboard)/events");
  revalidatePath("/(dashboard)/dashboard");
  return { success: true };
}

// ============================================
// PROFITABILITY CORE - Cascade Recalculation
// ============================================

const roundTo2 = (num: number) => Math.round(num * 100) / 100;

export async function recalculateRecipeCost(recipeId: string) {
  const supabase = await createClient();

  // 1. Get all ingredients of this recipe
  const { data: recipeIngredients, error: riError } = await supabase
    .from("RecipeIngredient")
    .select(`
      quantity,
      ingredient:Ingredient(id, cost)
    `)
    .eq("recipeId", recipeId);

  if (riError) return { error: riError.message };

  // 2. Calculate totalCost
  let totalCost = 0;
  recipeIngredients?.forEach((ri: any) => {
    const ingredientCost = ri.ingredient?.cost || 0;
    totalCost += ingredientCost * ri.quantity;
  });
  totalCost = roundTo(totalCost, 2);

  // 3. Get recipe margin to calculate price
  const { data: recipe, error: recipeError } = await supabase
    .from("Recipe")
    .select("margin")
    .eq("id", recipeId)
    .single();

  if (recipeError) return { error: recipeError.message };

  let margin = recipe?.margin || 30; // Default to 30% if missing, but careful with units
  
  // Heuristic: If margin > 1, assume it's a percentage (e.g. 30) and convert to decimal (0.30)
  // Determine if margin is 0-1 or 0-100. 
  // Safety cap: If it's something like 0.5 (50%), it stays 0.5. If it's 50, it becomes 0.5.
  if (margin > 1) {
    margin = margin / 100;
  }

  // Formula: Price = Cost / (1 - Margin)
  // Ensure we don't divide by zero or negative
  const safeMargin = Math.min(Math.max(margin, 0), 0.99);
  const price = roundTo(totalCost / (1 - safeMargin), 2);

  // 4. Update recipe
  const { error: updateError } = await supabase
    .from("Recipe")
    .update({ totalCost, price })
    .eq("id", recipeId);

  if (updateError) {
    console.error("Error updating recipe:", updateError);
    return { error: updateError.message };
  }

  console.log(`[Recalc] Recipe ${recipeId}: Cost=${totalCost}, Margin=${margin} (safe=${safeMargin}), NewPrice=${price}`);
  return { success: true, totalCost, price };
}

export async function recalculateAllRecipesWithIngredient(ingredientId: string) {
  const supabase = await createClient();

  // 1. Find all recipes using this ingredient
  const { data: recipeIngredients, error } = await supabase
    .from("RecipeIngredient")
    .select("recipeId")
    .eq("ingredientId", ingredientId);

  if (error) return { error: error.message };

  const uniqueRecipeIds = [...new Set(recipeIngredients?.map(ri => ri.recipeId) || [])];

  // 2. Recalculate each recipe
  let updated = 0;
  for (const recipeId of uniqueRecipeIds) {
    const result = await recalculateRecipeCost(recipeId);
    if (result.success) updated++;
  }

// 3. Recalculate events that use these recipes (ALL events, filtered by logic inside)
  await recalculateRelatedEventsWithRecipes(uniqueRecipeIds);

  revalidatePath("/(dashboard)/recipes");
  revalidatePath("/(dashboard)/events");
  revalidatePath("/(dashboard)/dashboard");

  return { success: true, recipesUpdated: updated };
}

async function recalculateRelatedEventsWithRecipes(recipeIds: string[]) {
  const supabase = await createClient();

  // Get all events using any of these recipes (Removed DRAFT filter)
  const { data: eventRecipes, error } = await supabase
    .from("EventRecipe")
    .select("eventId")
    .in("recipeId", recipeIds);

  if (error) return;

  // Get unique Event IDs
  const uniqueEventIds = [...new Set(eventRecipes?.map((er: any) => er.eventId) || [])];

  // Recalculate each event
  for (const eventId of uniqueEventIds) {
    await recalculateEventMargins(eventId);
  }
}

export async function recalculateEventMargins(eventId: string) {
  const supabase = await createClient();

  // 1. Get Event Details (Status & Guests) and Recipes
  const { data: eventData, error: eventError } = await supabase
    .from("Event")
    .select(`
      status,
      totalPrice,
      guests,
      eventRecipes:EventRecipe(
        quantity,
        recipe:Recipe(id, price, totalCost, margin)
      )
    `)
    .eq("id", eventId)
    .single();

  if (eventError) return { error: eventError.message };

  const { status, eventRecipes, totalPrice: currentLockedPrice } = eventData;

  // 2. Calculate Market Values (Real-time Cost & Price)
  let marketCost = 0;
  let marketPrice = 0;

  eventRecipes?.forEach((er: any) => {
    const qty = er.quantity;
    const rPrice = er.recipe?.price || 0;
    const rCost = er.recipe?.totalCost || 0;
    
    // Strict rounding
    marketPrice += roundTo(rPrice * qty, 2);
    marketCost += roundTo(rCost * qty, 2);
  });
  
  marketPrice = roundTo(marketPrice, 2);
  marketCost = roundTo(marketCost, 2);

  // 3. Decision Logic based on Status
  if (status === "DRAFT") {
    // DRAFT: Always update price to match market
    if (marketPrice !== currentLockedPrice) {
      const { error: updateError } = await supabase
        .from("Event")
        .update({ totalPrice: marketPrice })
        .eq("id", eventId);

      if (updateError) return { error: updateError.message };
      console.log(`[Price Update] Event ${eventId} (DRAFT): ${currentLockedPrice} -> ${marketPrice}`);
    }
  } else {
    // SENT / CONFIRMED: Protect the Price (Price Protection Insurance)
    // We DO NOT update totalPrice.
    
    // Check for Margin Squeeze (Alert Logic)
    // Current Effective Margin = (LockedPrice - MarketCost) / LockedPrice
    // Target Margin (Weighted Average or Minimum?) -> Let's simplisticly check if Price < MarketPrice
    
    const marginSqueeze = marketPrice > currentLockedPrice;
    
    if (marginSqueeze) {
      const lostRevenue = roundTo(marketPrice - currentLockedPrice, 2);
      const effectiveMargin = currentLockedPrice > 0 
        ? roundTo((currentLockedPrice - marketCost) / currentLockedPrice, 2) 
        : 0;

      console.warn(`[MARGIN ALERT] Event ${eventId} (${status}): Costs increased!`);
      console.warn(` - Locked Price: $${currentLockedPrice}`);
      console.warn(` - Market Price: $${marketPrice} (Loss: $${lostRevenue})`);
      console.warn(` - New Effective Margin: ${(effectiveMargin * 100).toFixed(1)}%`);
      
      // OPTIONAL: If we had an 'alerts' column, we would save it here.
      // Since we don't, this relies on the Frontend calculating "Market Price" vs "Total Price" to show the badge.
    } else {
      console.log(`[Price Protected] Event ${eventId} (${status}): Costs stable or improved.`);
    }
  }

  return { 
    success: true, 
    totalPrice: status === "DRAFT" ? marketPrice : currentLockedPrice,
    marketPrice,
    marketCost,
    marginSqueeze: marketPrice > currentLockedPrice
  };
}

// ============================================
// PROFITABILITY CORE - Event Duplication
// ============================================

export async function duplicateEvent(eventId: string, orgId: string) {
  const supabase = await createClient();

  // 1. Get original event with all relationships
  const { data: originalEvent, error: fetchError } = await supabase
    .from("Event")
    .select(`
      *,
      eventRecipes:EventRecipe(
        recipeId,
        quantity,
        servings
      )
    `)
    .eq("id", eventId)
    .single();

  if (fetchError) return { error: fetchError.message };

  // 2. Create new event
  const newEventPayload = {
    organizationId: orgId,
    clientId: originalEvent.clientId,
    name: `[COPIA] ${originalEvent.name}`,
    date: new Date().toISOString(),
    guests: originalEvent.guests,
    status: "DRAFT",
    totalPrice: 0, // Will be recalculated
  };

  const { data: newEvent, error: createError } = await supabase
    .from("Event")
    .insert(newEventPayload)
    .select("id")
    .single();

  if (createError) return { error: createError.message };

  const newEventId = newEvent.id;

  // 3. Clone EventRecipe relations
  if (originalEvent.eventRecipes && originalEvent.eventRecipes.length > 0) {
    const newEventRecipes = originalEvent.eventRecipes.map((er: any) => ({
      eventId: newEventId,
      recipeId: er.recipeId,
      quantity: er.quantity,
      servings: er.servings,
    }));

    const { error: relError } = await supabase
      .from("EventRecipe")
      .insert(newEventRecipes);

    if (relError) return { error: relError.message };
  }

  // 4. FORCE recalculation with current prices
  await recalculateEventMargins(newEventId);

  // 5. Fetch the complete new event to return it (for immediate UI redirect)
  const { data: fullNewEvent, error: fetchNewError } = await supabase
    .from("Event")
    .select(`
      *,
      client:Client(id, name),
      eventRecipes:EventRecipe(
        quantity,
        recipe:Recipe(id, name, price, category)
      )
    `)
    .eq("id", newEventId)
    .single();

  revalidatePath("/(dashboard)/events");
  revalidatePath("/(dashboard)/dashboard");

  if (fetchNewError) return { error: "Created but failed to fetch: " + fetchNewError.message };

  return { success: true, newEventId, newEvent: fullNewEvent };
}

// ============================================
// PROFITABILITY CORE - Shopping List & Kitchen Sheet
// ============================================

interface ShoppingListItem {
  ingredientId: string;
  name: string;
  unit: string;
  totalNeeded: number;
  currentStock: number;
  toBuy: number;
  costPerUnit: number;
  estimatedCost: number;
}

export async function generateShoppingList(eventId: string) {
  const supabase = await createClient();

  // 1. Get event with guestCount and organization currency
  const { data: event, error: eventError } = await supabase
    .from("Event")
    .select(`
      name,
      guests,
      date,
      organization:Organization(currency)
    `)
    .eq("id", eventId)
    .single();

  if (eventError) return { error: eventError.message };

  // 2. Get all recipes of the event
  const { data: eventRecipes, error: erError } = await supabase
    .from("EventRecipe")
    .select(`
      quantity,
      recipe:Recipe(
        id,
        ingredients:RecipeIngredient(
          quantity,
          ingredient:Ingredient(id, name, unit, cost, stock)
        )
      )
    `)
    .eq("eventId", eventId);

  if (erError) return { error: erError.message };

  // 3. Consolidate ingredients
  const ingredientMap = new Map<string, ShoppingListItem>();

  eventRecipes?.forEach((er: any) => {
    const recipeMultiplier = er.quantity; // How many times this recipe is in the event
    
    er.recipe?.ingredients?.forEach((ri: any) => {
      const ingredient = ri.ingredient;
      if (!ingredient) return;

      const quantityNeededPerRecipe = ri.quantity;
      const totalNeededForThisRecipe = quantityNeededPerRecipe * recipeMultiplier;

      if (ingredientMap.has(ingredient.id)) {
        const existing = ingredientMap.get(ingredient.id)!;
        existing.totalNeeded += totalNeededForThisRecipe;
      } else {
        ingredientMap.set(ingredient.id, {
          ingredientId: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          totalNeeded: totalNeededForThisRecipe,
          currentStock: ingredient.stock || 0,
          toBuy: 0, // Will calculate next
          costPerUnit: ingredient.cost || 0,
          estimatedCost: 0, // Will calculate next
        });
      }
    });
  });

  // 4. Calculate toBuy and estimatedCost
  const items: ShoppingListItem[] = Array.from(ingredientMap.values()).map(item => {
    const toBuy = Math.max(0, item.totalNeeded - item.currentStock);
    const estimatedCost = roundTo2(toBuy * item.costPerUnit);
    return {
      ...item,
      totalNeeded: roundTo2(item.totalNeeded),
      toBuy: roundTo2(toBuy),
      estimatedCost,
    };
  });

  const totalEstimatedCost = roundTo2(
    items.reduce((sum, item) => sum + item.estimatedCost, 0)
  );

  return {
    success: true,
    data: {
      eventName: event.name,
      guestCount: event.guests,
      eventDate: event.date,
      currency: (event.organization as any)?.currency || "USD",
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
      totalEstimatedCost,
    },
  };
}

interface KitchenSheetItem {
  name: string;
  totalNeeded: number;
  unit: string;
}

export async function generateKitchenSheet(eventId: string) {
  const supabase = await createClient();

  // 1. Get event info
  const { data: event, error: eventError } = await supabase
    .from("Event")
    .select("name, guests, date")
    .eq("id", eventId)
    .single();

  if (eventError) return { error: eventError.message };

  // 2. Get all recipes of the event
  const { data: eventRecipes, error: erError } = await supabase
    .from("EventRecipe")
    .select(`
      quantity,
      recipe:Recipe(
        id,
        ingredients:RecipeIngredient(
          quantity,
          ingredient:Ingredient(id, name, unit)
        )
      )
    `)
    .eq("eventId", eventId);

  if (erError) return { error: erError.message };

  // 3. Consolidate ingredients (without prices)
  const ingredientMap = new Map<string, KitchenSheetItem>();

  eventRecipes?.forEach((er: any) => {
    const recipeMultiplier = er.quantity;
    
    er.recipe?.ingredients?.forEach((ri: any) => {
      const ingredient = ri.ingredient;
      if (!ingredient) return;

      const quantityNeededPerRecipe = ri.quantity;
      const totalNeededForThisRecipe = quantityNeededPerRecipe * recipeMultiplier;

      if (ingredientMap.has(ingredient.id)) {
        const existing = ingredientMap.get(ingredient.id)!;
        existing.totalNeeded += totalNeededForThisRecipe;
      } else {
        ingredientMap.set(ingredient.id, {
          name: ingredient.name,
          unit: ingredient.unit,
          totalNeeded: totalNeededForThisRecipe,
        });
      }
    });
  });

  const items = Array.from(ingredientMap.values()).map(item => ({
    ...item,
    totalNeeded: roundTo2(item.totalNeeded),
  }));

  return {
    success: true,
    data: {
      eventName: event.name,
      guestCount: event.guests,
      eventDate: event.date,
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
    },
  };
}
