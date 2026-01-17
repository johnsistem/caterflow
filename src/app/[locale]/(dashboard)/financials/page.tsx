"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { DollarSign, TrendingUp, Percent, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFinancialData, FinancialPeriod } from "./actions";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  profit: {
    label: "Profit",
    color: "hsl(var(--chart-2))",
  },
};

export default function FinancialsPage() {
  const t = useTranslations("Financials");
  const [period, setPeriod] = useState<FinancialPeriod>("this_month");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    kpi: { revenue: number; profit: number; margin: number };
    chartData: any[];
    topRecipes: any[];
    periodLabel: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getFinancialData(period);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch financial data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1 }).format(value / 100);
  };

  if (loading && !data) {
    return <div className="p-8 text-white">Loading financials...</div>; // Simple loading state
  }

  return (
    <div className="space-y-6 bg-[#0f1419] min-h-screen p-8 -m-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {t("title")}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t("description")}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
           <Select value={period} onValueChange={(val) => setPeriod(val as FinancialPeriod)}>
            <SelectTrigger className="w-[180px] border-slate-700 bg-[#1a2029] text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2029] border-slate-700 text-white">
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_quarter">Last Quarter</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 pointer-events-none">
            <Calendar className="w-4 h-4 mr-2" />
            {data?.periodLabel}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#1a2029] border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase">{t("revenue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-white">{data ? formatCurrency(data.kpi.revenue) : "$0.00"}</div>
                {/* Trend logic would require previous period comparison, skipping for simplify unless requested specifically */}
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2029] border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase">{t("profit")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-white">{data ? formatCurrency(data.kpi.profit) : "$0.00"}</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2029] border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase">{t("margin")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-white">{data ? data.kpi.margin.toFixed(1) : "0.0"}%</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Percent className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Profit Chart */}
      <Card className="bg-[#1a2029] border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-xl">{t("revenue_vs_profit.title")}</CardTitle>
              <CardDescription className="text-slate-400">{t("revenue_vs_profit.description")}</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                <span className="text-sm text-slate-400">{t("revenue")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-slate-400">{t("profit")}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={data?.chartData || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value / 1000}k`}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#64748b" 
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Profitable Recipes */}
        <Card className="bg-[#1a2029] border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">{t("top_recipes.title")}</CardTitle>
            </div>
            <CardDescription className="text-slate-400">{t("top_recipes.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.topRecipes.map((recipe, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{recipe.name}</span>
                    <span className="font-semibold text-emerald-400">{recipe.margin.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                      style={{ width: `${Math.min(recipe.value, 100)}%` }} // Cap at 100% just in case
                    />
                  </div>
                </div>
              ))}
              {(!data?.topRecipes || data.topRecipes.length === 0) && (
                <div className="text-slate-500 text-center py-4">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Event Volume - Placeholder or could be real data too, but user asked for specific Profit/Revenue focus. Leaving placeholder visuals but maybe just remove or update? Keeping visual consistency. */}
         {/* Let's make it static or remove if no logic supplied. I'll keep it static for layout stability unless requested. */}
        <Card className="bg-[#1a2029] border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">{t("event_volume.title")}</CardTitle>
            <CardDescription className="text-slate-400">{t("event_volume.description")}</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="text-slate-500 flex h-[240px] items-center justify-center">
                Feature coming soon
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
