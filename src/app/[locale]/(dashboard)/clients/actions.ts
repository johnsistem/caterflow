"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getClients(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Client")
    .select(`
      *,
      events:Event(
        id,
        name,
        date,
        guests,
        status,
        totalPrice
      )
    `)
    .eq("organizationId", orgId)
    .order("name");

  if (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
  return data;
}

export async function upsertClient(formData: FormData, orgId: string) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const type = formData.get("type") as string;
  const address = formData.get("address") as string;

  const payload = {
    organizationId: orgId,
    name,
    email,
    phone,
    type,
    address
  };

  let error;
  if (id) {
    const { error: updateError } = await supabase
      .from("Client")
      .update(payload)
      .eq("id", id);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("Client")
      .insert(payload);
    error = insertError;
  }

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/(dashboard)/clients");
  return { success: true };
}
