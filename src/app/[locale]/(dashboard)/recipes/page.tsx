import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import RecipesClient from "./recipes-client";
import { fetchIngredients, getRecipes } from "./actions";

export default async function RecipesPage() {
  const supabase = await createClient();
  
  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/en/login");
  }

  // 2. Get Organization
  const { data: userData } = await supabase
    .from("User")
    .select("organizationId")
    .eq("id", user.id)
    .single();

  if (!userData?.organizationId) {
    return <div>No Organization Found for User</div>;
  }

  // 3. Fetch Data
  const [ingredients, recipes] = await Promise.all([
    fetchIngredients(userData.organizationId),
    getRecipes(userData.organizationId)
  ]);

  return (
    <RecipesClient 
      ingredientLibrary={ingredients || []} 
      initialRecipes={recipes || []}
      orgId={userData.organizationId} 
    />
  );
}
