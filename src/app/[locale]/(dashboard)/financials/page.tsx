"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { DollarSign, TrendingUp, Percent, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

const revenueData = [
  { date: "Oct 1", revenue: 85000, profit: 28000 },
  { date: "Oct 5", revenue: 92000, profit: 32000 },
  { date: "Oct 10", revenue: 88000, profit: 30000 },
  { date: "Oct 15", revenue: 95000, profit: 35000 },
  { date: "Oct 20", revenue: 105000, profit: 42000 },
  { date: "Oct 25", revenue: 112000, profit: 45000 },
  { date: "Oct 31", revenue: 124500, profit: 52000 }
];

const topRecipes = [
  { name: "Truffle Risotto", margin: 42, value: 42 },
  { name: "Seared Salmon", margin: 38, value: 38 },
  { name: "Beef Wellington", margin: 35, value: 35 },
  { name: "Lobster Thermidor", margin: 31, value: 31 },
  { name: "Duck Confit", margin: 28, value: 28 }
];

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

  return (
    <div className="space-y-6 bg-[#0f1419] min-h-screen p-8 -m-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {t("title")}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t("description")}
          </p>
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
          <Calendar className="w-4 h-4 mr-2" />
          Oct 1 - Oct 31, 2023
        </Button>
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
                <div className="text-3xl font-bold text-white">$124,500</div>
                <p className="text-xs text-emerald-400 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +24.5% {t("vs_last_month")}
                </p>
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
                <div className="text-3xl font-bold text-white">$42,150</div>
                <p className="text-xs text-emerald-400 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +18.2% {t("vs_last_month")}
                </p>
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
                <div className="text-3xl font-bold text-white">33.8%</div>
                <p className="text-xs text-emerald-400 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5.2% {t("vs_last_month")}
                </p>
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
              <AreaChart data={revenueData}>
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
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                •••
              </Button>
            </div>
            <CardDescription className="text-slate-400">{t("top_recipes.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topRecipes.map((recipe, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{recipe.name}</span>
                    <span className="font-semibold text-emerald-400">{recipe.margin}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                      style={{ width: `${recipe.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Event Volume */}
        <Card className="bg-[#1a2029] border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">{t("event_volume.title")}</CardTitle>
            <CardDescription className="text-slate-400">{t("event_volume.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] flex items-end justify-center">
              <div className="w-full grid grid-cols-7 gap-2 h-full items-end">
                {[65, 72, 58, 81, 69, 75, 0].map((height, index) => (
                  <div key={index} className="flex flex-col items-center justify-end h-full">
                    <div 
                      className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all hover:opacity-80"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
