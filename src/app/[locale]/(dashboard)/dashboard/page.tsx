"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowDown,
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
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  
  const quotes = [
    {
      id: "ID-607-0049",
      client: "Acme Corp Gala",
      date: "Dec 12, 2023",
      headcount: 250,
      total: "$18,500",
      margin: "28%",
      status: "Pend"
    },
    {
      id: "ID-607-0048",
      client: "Smith Wedding",
      date: "Nov 05, 2023",
      headcount: 120,
      total: "$8,240",
      margin: "15%",
      status: "Draft"
    },
    {
      id: "ID-608-0047",
      client: "TechSavvy Lunch",
      date: "Oct 28, 2023",
      headcount: 450,
      total: "$12,400",
      margin: "22%",
      status: "Appr"
    },
    {
      id: "ID-607-0045",
      client: "Annual Charity Ball",
      date: "Dec 01, 2023",
      headcount: 300,
      total: "$32,000",
      margin: "31%",
      status: "Appr"
    },
    {
      id: "ID-607-0044",
      client: "Rivera Family Birthday",
      date: "Nov 15, 2023",
      headcount: 60,
      total: "$4,500",
      margin: "9%",
      status: "Pend"
    }
  ];

  const marketAlerts = [
    {
      type: "cost",
      title: t("market.alerts.beef.title"),
      subtitle: t("market.alerts.beef.subtitle"),
      description: t("market.alerts.beef.description"),
      icon: ArrowUp,
      iconColor: "text-rose-500"
    },
    {
      type: "warning",
      title: t("market.alerts.eggs.title"),
      subtitle: t("market.alerts.eggs.subtitle"),
      description: t("market.alerts.eggs.description"),
      icon: AlertTriangle,
      iconColor: "text-amber-500"
    },
    {
      type: "info",
      title: t("market.alerts.seafood.title"),
      subtitle: "",
      description: t("market.alerts.seafood.description"),
      icon: Info,
      iconColor: "text-blue-500"
    }
  ];

  const ingredientsWatchlist = [
    { name: t("market.ingredients.cream"), change: "-2%" },
    { name: t("market.ingredients.chicken"), change: "0%" },
    { name: t("market.ingredients.truffle"), change: "+12%" }
  ];

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
            <div className="text-3xl font-bold text-slate-900 dark:text-white">$124,500</div>
            <p className="text-xs text-emerald-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +10%
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
            <div className="text-3xl font-bold text-slate-900 dark:text-white">24.8%</div>
            <p className="text-xs text-emerald-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +3.4%
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-500">{t("kpis.pending_quotes")}</CardTitle>
              <FileText className="w-4 h-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">12</div>
            <p className="text-xs text-slate-400 mt-1">4 {t("kpis.due_today")}</p>
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
              <div className="flex gap-3 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder={t("quotes.search_placeholder")} 
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Calendar className="h-4 w-4" />
                </Button>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[120px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t("quotes.status_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("quotes.statuses.all")}</SelectItem>
                    <SelectItem value="pend">{t("quotes.statuses.pending")}</SelectItem>
                    <SelectItem value="appr">{t("quotes.statuses.approved")}</SelectItem>
                    <SelectItem value="draft">{t("quotes.statuses.draft")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t("quotes.table.client")}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t("quotes.table.date")}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t("quotes.table.headcount")}</th>
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
                            <p className="text-xs text-slate-400">{quote.id}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{quote.date}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{quote.headcount}</td>
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
                              ${quote.status === 'Appr' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : ''}
                              ${quote.status === 'Pend' ? 'border-amber-200 text-amber-700 bg-amber-50' : ''}
                              ${quote.status === 'Draft' ? 'border-slate-200 text-slate-600 bg-slate-50' : ''}
                            `}
                          >
                            • {quote.status === 'Appr' ? t("quotes.statuses.approved") : 
                               quote.status === 'Pend' ? t("quotes.statuses.pending") : 
                               t("quotes.statuses.draft")}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-500">{t("quotes.pagination", { start: 1, end: 5, total: 48 })}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">{t("quotes.prev")}</Button>
                  <Button variant="outline" size="sm">{t("quotes.next")}</Button>
                </div>
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
                  {t("market.updated")}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cost Alerts */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">{t("market.alerts_title")}</h3>
                <div className="space-y-3">
                  {marketAlerts.map((alert, index) => (
                    <div key={index} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full ${
                          alert.iconColor === 'text-rose-500' ? 'bg-rose-100 dark:bg-rose-950' :
                          alert.iconColor === 'text-amber-500' ? 'bg-amber-100 dark:bg-amber-950' :
                          'bg-blue-100 dark:bg-blue-950'
                        } flex items-center justify-center flex-shrink-0`}>
                          <alert.icon className={`w-4 h-4 ${alert.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{alert.title}</h4>
                          {alert.subtitle && (
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">{alert.subtitle}</p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">{alert.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingredient Watchlist */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">{t("market.watchlist_title")}</h3>
                <div className="space-y-2">
                  {ingredientsWatchlist.map((ingredient, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{ingredient.name}</span>
                      <span className={`text-sm font-medium ${
                        ingredient.change.startsWith('+') ? 'text-rose-600' :
                        ingredient.change === '0%' ? 'text-slate-400' :
                        'text-emerald-600'
                      }`}>
                        {ingredient.change}
                      </span>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="text-emerald-600 hover:text-emerald-700 mt-4 p-0 uppercase">
                  {t("market.view_report")} →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
