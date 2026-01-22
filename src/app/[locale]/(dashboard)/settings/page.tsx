import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./settings-client";
import { fetchOrgSettings } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  
  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 2. Get Organization
  const { data: userData } = await supabase
    .from("User")
    .select("organizationId")
    .eq("id", user.id)
    .single();

  if (!userData?.organizationId) {
    return <div>No Organization Found</div>;
  }

  // 3. Fetch Settings
  const res = await fetchOrgSettings(userData.organizationId);
  if (res.error || !res.settings) {
    return <div>Error loading settings: {res.error}</div>;
  }

  return (
    <SettingsClient 
      initialSettings={res.settings}
      orgId={userData.organizationId}
    />
  );
}
