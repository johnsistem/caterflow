"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Download, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

export default function InventoryPage() {
  const t = useTranslations("Inventory");
  
  const ingredientsData = [
    {
      id: "IF-0001",
      name: t("items.angus"),
      categoryKey: "meat",
      categoryColor: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
      icon: "🥩",
      sku: "SKU-1843",
      unit: "lb",
      price: "$8.50",
      change: "−18%",
      trend: "down",
      trendData: [20, 25, 22, 28, 26, 22, 20],
      updated: t("items.times.hrs", { count: 2 })
    },
    {
      id: "IF-0002",
      name: t("items.milk"),
      categoryKey: "dairy",
      categoryColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
      icon: "🥛",
      sku: "SK Whole 10ct",
      unit: "gal",
      price: "$3.20",
      change: "−0%",
      trend: "flat",
      trendData: [15, 15, 16, 15, 15, 15, 15],
      updated: t("items.times.day")
    },
    {
      id: "IF-0003",
      name: t("items.lettuce"),
      categoryKey: "veggie",
      categoryColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
      icon: "🥬",
      sku: "ID-SKU-3490",
      unit: "head",
      price: "$1.10",
      change: "−9%",
      trend: "down-mild",
      trendData: [12, 13, 12, 11, 10, 9, 8],
      updated: t("items.times.days", { count: 3 })
    },
    {
      id: "IF-0004",
      name: t("items.chicken"),
      categoryKey: "meat",
      categoryColor: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
      icon: "🍗",
      sku: "SKU-8934",
      unit: "lb",
      price: "$5.40",
      change: "+14%",
      trend: "up",
      trendData: [8, 10, 12, 14, 15, 16, 18],
      updated: t("items.times.hrs", { count: 5 })
    },
    {
      id: "IF-0005",
      name: t("items.cheese"),
      categoryKey: "dairy",
      categoryColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
      icon: "🧀",
      sku: "ID-SKU-2210",
      unit: "lb",
      price: "$6.75",
      change: "−8%",
      trend: "flat",
      trendData: [18, 18, 17, 17, 18, 17, 17],
      updated: t("items.times.days", { count: 2 })
    },
    {
      id: "IF-0006",
      name: t("items.saffron"),
      categoryKey: "spice",
      categoryColor: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
      icon: "🌺",
      sku: "ID-SKU-9601",
      unit: "oz",
      price: "$45.00",
      change: "−22%",
      trend: "down",
      trendData: [60, 58, 55, 52, 48, 46, 45],
      updated: t("items.times.days", { count: 1 })
    }
  ];
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const renderTrendChart = (data: number[], trend: string) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return (
      <div className="flex items-end gap-0.5 h-8 w-20">
        {data.map((value, index) => {
          const normalizedHeight = ((value - min) / range) * 100;
          const color = 
            trend === "up" ? "bg-rose-400" :
            trend === "down" || trend === "down-mild" ? "bg-emerald-400" :
            "bg-slate-300";
          
          return (
            <div 
              key={index} 
              className={`flex-1 ${color} rounded-sm`}
              style={{ height: `${Math.max(normalizedHeight, 10)}%` }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {t("description")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            {t("import")}
          </Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="w-4 h-4 mr-2" />
            {t("add_button")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder={t("search_placeholder")} 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t("filter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all_categories")}</SelectItem>
                  <SelectItem value="meat">{t("categories.meat")}</SelectItem>
                  <SelectItem value="dairy">{t("categories.dairy")}</SelectItem>
                  <SelectItem value="veggie">{t("categories.veggie")}</SelectItem>
                  <SelectItem value="spice">{t("categories.spice")}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">+ {t("more")}</Button>
              <Button variant="outline">⚡ {t("bulk_update")}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase w-8">
                    <input type="checkbox" className="rounded border-slate-300" />
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">{t("table.ingredient")}</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">{t("table.category")}</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">{t("table.unit")}</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">{t("table.price")}</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">{t("table.trend")}</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">{t("table.updated")}</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">{t("table.action")}</th>
                </tr>
              </thead>
              <tbody>
                {ingredientsData.map((ingredient, index) => (
                  <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-4 px-6">
                      <input type="checkbox" className="rounded border-slate-300" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
                          {ingredient.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">{ingredient.name}</p>
                          <p className="text-xs text-slate-400">{ingredient.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="outline" className={`${ingredient.categoryColor} border-0`}>
                        {t(`categories.${ingredient.categoryKey}`)}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                      {ingredient.unit}
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{ingredient.price}</p>
                        <p className={`text-xs font-medium ${
                          ingredient.change.startsWith('−') ? 'text-emerald-600' :
                          ingredient.change === '−0%' ? 'text-slate-400' :
                          'text-rose-600'
                        }`}>
                          {ingredient.change}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {renderTrendChart(ingredient.trendData, ingredient.trend)}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500">
                      {ingredient.updated}
                    </td>
                    <td className="py-4 px-6">
                      <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                        {t("table.edit")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between py-4 px-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500">{t("pagination", { start: 1, end: 6, total: 42 })}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                1
              </Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <span className="text-slate-400">...</span>
              <Button variant="outline" size="sm">8</Button>
              <Button variant="outline" size="sm">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
