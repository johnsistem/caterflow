import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import InventoryClient from "./inventory-client";
import { getIngredients } from "./actions";

export default async function InventoryPage() {
  const supabase = await createClient();

  // 1. Get Authenticated User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/en/login");
  }

  // 2. Get Organization ID
  const { data: userData } = await supabase
    .from("User")
    .select("organizationId")
    .eq("id", user.id)
    .single();

  if (!userData?.organizationId) {
    return <div>Error: No organization found.</div>;
  }

  const orgId = userData.organizationId;

  // 3. Fetch Data using the Server Action helper
  const [ingredients, orgSettings] = await Promise.all([
    getIngredients(orgId),
    supabase.from("Organization").select("currency").eq("id", orgId).single().then(r => r.data)
  ]);

  return (
    <InventoryClient 
      initialIngredients={ingredients} 
      orgId={orgId} 
      orgCurrency={orgSettings?.currency || "USD"}
    />
  );
}
