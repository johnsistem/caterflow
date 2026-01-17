"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
        recipe:Recipe(id, name, price, category)
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

  // Insert Relation
  if (data.recipes.length > 0 && eventId) {
    const relations = data.recipes.map(r => ({
      eventId: eventId,
      recipeId: r.recipeId,
      quantity: r.quantity
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
