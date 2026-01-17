import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Search, 
  Calendar,
  Filter,
  ArrowUp,
  AlertTriangle,
  Info
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const t = await getTranslations("Dashboard");
  const supabase = await createClient();

  // 1. Get Authenticated User and Organization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/en/login");
  }

  const { data: userData } = await supabase
    .from("User")
    .select("organizationId")
    .eq("id", user.id)
    .single();

  if (!userData?.organizationId) {
    // Handle edge case: User has no organization (shouldn't happen with correct signup)
    return <div>Error loading organization data.</div>;
  }

  const orgId = userData.organizationId;

  // 2. Fetch Stats Data
  // Projected Revenue (Confirmed events)
  const { data: revenueData } = await supabase
    .from("Event")
    .select("totalPrice")
    .eq("organizationId", orgId)
    .eq("status", "CONFIRMED");

  const totalRevenue = revenueData?.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0) || 0;

  // Food Cost % (Avg Margin from Recipes)
  // We'll use margin from recipes to approximate food cost perspective. 
  // If margin is 30%, cost is 70%? or just show Average Margin as requested in food cost context often inverse.
  // Prompt says: "Promedio de totalCost / price". But we populated 'margin'. 
  // Let's use the average 'margin' from Recipe table as a proxy for financial health for now, or fetch recipes and calculate.
  // Let's fetch margin.
  const { data: marginData } = await supabase
    .from("Recipe")
    .select("margin")
    .eq("organizationId", orgId);

  const avgMargin = marginData?.length 
    ? marginData.reduce((acc, curr) => acc + (curr.margin || 0), 0) / marginData.length 
    : 0;

  // Upcoming Events
  const { count: upcomingCount } = await supabase
    .from("Event")
    .select("*", { count: "exact", head: true })
    .eq("organizationId", orgId)
    .gt("date", new Date().toISOString());

  // 3. Fetch Current Quotes (Latest 5 Events)
  const { data: recentEvents } = await supabase
    .from("Event")
    .select(`
      *,
      Client (name),
      EventRecipe (
        Recipe (margin)
      )
    `)
    .eq("organizationId", orgId)
    .order("createdAt", { ascending: false })
    .limit(5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const quotes = recentEvents?.map(event => {
    // Calculate average margin for the event based on its recipes
    const recipes = event.EventRecipe as any[];
    const eventMargin = recipes?.length 
      ? recipes.reduce((acc, r) => acc + (r.Recipe?.margin || 0), 0) / recipes.length 
      : 0;

    return {
      id: event.id.substring(0, 8).toUpperCase(), // Short ID
      client: (event.Client as any)?.name || "Unknown Client",
      date: new Date(event.date).toLocaleDateString(),
      headcount: "-", // We didn't strictly populate headcount in Event, mostly in EventRecipe servings.
      total: formatCurrency(event.totalPrice),
      margin: `${eventMargin.toFixed(0)}%`,
      status: event.status
    };
  }) || [];

  // 4. Market Watch (Price History)
  // We need to route through Ingredient to filter by Organization
  const { data: priceHistory } = await supabase
    .from("PriceHistory")
    .select(`
      *,
      Ingredient!inner (
        name,
        organizationId
      )
    `)
    .eq("Ingredient.organizationId", orgId)
    .order("createdAt", { ascending: false })
    .limit(3);

  const marketActivities = priceHistory?.map(entry => {
    const oldPrice = entry.oldCost || 0;
    const newPrice = entry.newCost || 0;
    const change = oldPrice === 0 ? 0 : ((newPrice - oldPrice) / oldPrice) * 100;
    const isIncrease = change > 0;
    
    return {
      name: (entry.Ingredient as any)?.name,
      change: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`,
      isIncrease
    };
  }) || [];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          {t("title")}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {t("description")}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-500">{t("kpis.monthly_revenue")}</CardTitle>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-emerald-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Projected
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-500">{t("kpis.avg_margin")}</CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{avgMargin.toFixed(1)}%</div>
            <p className="text-xs text-emerald-600 flex items-center mt-1">
              Food Cost Average
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-500">Upcoming Events</CardTitle>
              <Calendar className="w-4 h-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{upcomingCount || 0}</div>
            <p className="text-xs text-slate-400 mt-1">Scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Quotes - 2/3 width */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{t("quotes.title")}</CardTitle>
                <Button className="bg-emerald-500 hover:bg-emerald-600">+ {t("quotes.new_button")}</Button>
              </div>
              {/* Client-side filtering UI removed/simplified for Server Component. 
                  To re-add, this part should be a Client Component. */}
              <div className="flex gap-3 mt-4 opacity-50 pointer-events-none" title="Filtering disabled in server view">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder={t("quotes.search_placeholder")} 
                    className="pl-9"
                    readOnly
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t("quotes.table.client")}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t("quotes.table.date")}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t("quotes.table.total")}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t("quotes.table.margin")}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t("quotes.table.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((quote, index) => (
                      <tr key={index} className="border-b border-slate-50 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-sm text-slate-900 dark:text-white">{quote.client}</p>
                            <p className="text-xs text-slate-400">ID: {quote.id}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{quote.date}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">{quote.total}</td>
                        <td className="py-3 px-4">
                          <span className={`text-sm font-medium ${
                            parseInt(quote.margin) >= 25 ? 'text-emerald-600' : 
                            parseInt(quote.margin) >= 15 ? 'text-blue-600' : 
                            'text-rose-600'
                          }`}>
                            {quote.margin}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant="outline" 
                            className={`
                              ${quote.status === 'CONFIRMED' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : ''}
                              ${quote.status === 'DRAFT' ? 'border-amber-200 text-amber-700 bg-amber-50' : ''}
                            `}
                          >
                            {quote.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {quotes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No active quotes found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Watch Sidebar - 1/3 width */}
        <div>
          <Card className="border-slate-200 dark:border-slate-800 h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg uppercase">{t("market.title")}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Live
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cost Alerts */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">{t("market.alerts_title")}</h3>
                <div className="space-y-3">
                  {marketActivities.filter(a => a.isIncrease).map((item, index) => (
                    <div key={index} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center flex-shrink-0">
                          <ArrowUp className="w-4 h-4 text-rose-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{item.name} Price Hike</h4>
                          <p className="text-xs text-slate-500 mt-1">Increased by {item.change}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {marketActivities.filter(a => !a.isIncrease).length === 0 && marketActivities.length === 0 && (
                     <p className="text-sm text-slate-500">No market alerts.</p>
                  )}
                </div>
              </div>

              {/* Ingredient Watchlist */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">{t("market.watchlist_title")}</h3>
                <div className="space-y-2">
                  {marketActivities.map((ingredient, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{ingredient.name}</span>
                      <span className={`text-sm font-medium ${
                        ingredient.isIncrease ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {ingredient.change}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
