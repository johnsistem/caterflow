import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Phone, Mail, ChevronLeft, ChevronRight, X, Edit2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ClientsClient from "./clients-client";
import { getClients } from "./actions";

const clients = [
  {
    id: 1,
    name: "Acme Corporation",
    type: "corporate",
    typeColor: "bg-blue-100 text-blue-700",
    avatar: "AC",
    avatarBg: "bg-blue-500",
    email: "billing@acmecorp.com",
    phone: "(555) 123-4567",
    spent: "$45,200.00",
    events: [
      { name: "Annual Holiday Gala", guests: 400, status: "Paid", amount: "$15k", statusColor: "bg-emerald-100 text-emerald-700" },
      { name: "Executive Quarterly Lunch", guests: 50, status: "Paid", amount: "$2.5k", statusColor: "bg-emerald-100 text-emerald-700" },
      { name: "Product Launch Mixer", guests: 200, status: "Due", amount: "$1.2k", statusColor: "bg-rose-100 text-rose-700" }
    ],
    notes: "Client prefers gluten-free options for at least 20% of the menu. Key contact (Sarah) is out on Fridays.",
    outstanding: "$1,200"
  },
  {
    id: 2,
    name: "Jane Doe",
    type: "private",
    typeColor: "bg-purple-100 text-purple-700",
    avatar: "JD",
    avatarBg: "bg-purple-500",
    email: "jane.doe@gmail.com",
    phone: "(555) 987-6543",
    spent: "$12,500.00"
  },
  {
    id: 3,
    name: "City Hospital",
    type: "vip",
    typeColor: "bg-amber-100 text-amber-700",
    avatar: "CH",
    avatarBg: "bg-amber-500",
    email: "events@cityhospital.org",
    phone: "(555) 234-5678",
    spent: "$150,000.00"
  },
  {
    id: 4,
    name: "Tech Startups Inc",
    type: "corporate",
    typeColor: "bg-blue-100 text-blue-700",
    avatar: "TS",
    avatarBg: "bg-blue-500",
    email: "admin@techstartup.io",
    phone: "(555) 505-0199",
    spent: "$8,500.00"
  },
  {
    id: 5,
    name: "Local University",
    type: "institutional",
    typeColor: "bg-slate-100 text-slate-700",
    avatar: "LU",
    avatarBg: "bg-slate-500",
    email: "events@uni.edu",
    phone: "(555) 345-8789",
    spent: "$75,000.00"
  }
];

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/en/login");

  const { data: userData } = await supabase
    .from("User")
    .select("organizationId")
    .eq("id", user.id)
    .single();

  if (!userData?.organizationId) return <div>No Org Found</div>;

  const clients = await getClients(userData.organizationId);

  return (
    <ClientsClient 
      initialClients={clients || []} 
      orgId={userData.organizationId} 
    />
  );
}
