"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp, Percent, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFinancialData, FinancialPeriod } from "./actions";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#6366f1",
  },
  profit: {
    label: "Profit",
    color: "#22c55e",
  },
};

export default function FinancialsPage() {
  const t = useTranslations("Financials");
  const [period, setPeriod] = useState<FinancialPeriod>("this_year");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

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
    const currency = data?.currency || "USD";
    return new Intl.NumberFormat(currency === "NIO" ? "es-NI" : "en-US", { 
      style: "currency", 
      currency,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1 }).format(value / 100);
  };

  if (loading && !data) {
    return <div className="p-8 text-white">Loading financials...</div>;
  }

  if (data && (data as any).error) {
    return (
      <div className="p-8 text-white bg-red-900/20 border border-red-900 rounded-lg m-8">
        <h2 className="text-xl font-bold mb-2">Error loading data</h2>
        <p className="text-slate-300">{(data as any).error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#0f1419] min-h-screen p-8 -m-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
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
              <CardTitle className="text-white text-xl font-semibold tracking-tight">{t("revenue_vs_profit.title")}</CardTitle>
              <CardDescription className="text-slate-500 text-sm">{t("revenue_vs_profit.description")}</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-[12px] text-slate-400 font-medium tracking-tight whitespace-nowrap">{t("revenue")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[12px] text-slate-400 font-medium tracking-tight whitespace-nowrap">{t("profit")}</span>
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
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#475569', fontSize: 11 }}
                  tickMargin={12}
                />
                <YAxis 
                   tickLine={false} 
                   axisLine={false} 
                   tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                   tick={{ fill: '#475569', fontSize: 11 }}
                   width={40}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: "#6366f1" }}
                  connectNulls={false}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  fill="url(#colorProfit)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: "#22c55e" }}
                  connectNulls={false}
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
              {data?.topRecipes.map((recipe: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{recipe.name}</span>
                    <span className="font-semibold text-emerald-400">{recipe.margin.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-[#1a2029] rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                      style={{ width: `${Math.min(Math.max(recipe.margin, 2), 100)}%` }}
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
            <CardTitle className="text-white text-xl font-semibold tracking-tight">{t("event_volume.title")}</CardTitle>
            <CardDescription className="text-slate-500 text-sm">{t("event_volume.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ChartContainer config={{ eventCount: { label: "Events", color: "#3b82f6" } }} className="h-full w-full">
                <BarChart data={data?.chartData || []}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#475569', fontSize: 11 }}
                    tickMargin={8}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#475569', fontSize: 11 }}
                    width={30}
                    allowDecimals={false}
                    domain={[0, 'dataMax']}
                  />
                  <ChartTooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    content={<ChartTooltipContent />} 
                  />
                  <Bar 
                    dataKey="eventCount" 
                    fill="#6366f1" 
                    radius={[6, 6, 0, 0]}
                    barSize={48}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
