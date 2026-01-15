import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import EventsClient from "./events-client";
import { fetchEventData } from "./actions";

export default async function EventsPage() {
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
    return <div>No Organization Found</div>;
  }

  // 3. Fetch Data
  const data = await fetchEventData(userData.organizationId);

  return (
    <EventsClient 
      initialData={data} 
      orgId={userData.organizationId} 
    />
  );
}
