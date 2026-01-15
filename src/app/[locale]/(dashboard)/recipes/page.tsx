"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Trash2, 
  Filter,
  ChevronRight,
  Save,
  ArrowRight
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

const ingredientLibrary = [
  { id: 1, name: "Chicken Breast, Boneless", supplier: "Sysco", price: 4.50, unit: "lb" },
  { id: 2, name: "Olive Oil, Extra Virgin", supplier: "Kirkland", price: 0.35, unit: "oz" },
  { id: 3, name: "Garlic, Fresh Peeled", supplier: "Local", price: 6.00, unit: "lb" },
  { id: 4, name: "Fresh Thyme", supplier: "Local", price: 12.00, unit: "lb" },
  { id: 5, name: "Kosher Salt", supplier: "Morton", price: 0.05, unit: "oz" },
  { id: 6, name: "Black Pepper, Ground", supplier: "SpiceWorld", price: 0.80, unit: "oz" },
  { id: 7, name: "Heavy Cream", supplier: "DairyLand", price: 5.50, unit: "qt" }
];

export default function RecipesPage() {
  const t = useTranslations("Recipes");
  const [recipeName, setRecipeName] = useState("Herb Roasted Chicken & Potatoes");
  const [category, setCategory] = useState("main-course");
  const [yield_portions, setYieldPortions] = useState(50);
  const [targetPrice, setTargetPrice] = useState(245.00);
  const [ingredients, setIngredients] = useState([
    { id: 1, name: "Chicken Breast, Boneless", quantity: 20, unit: "lbs", unitCost: 4.50 },
    { id: 2, name: "Olive Oil, Extra Virgin", quantity: 16, unit: "oz", unitCost: 0.35 },
    { id: 3, name: "Garlic, Fresh Peeled", quantity: 1.5, unit: "lbs", unitCost: 6.00 },
    { id: 4, name: "Fresh Thyme", quantity: 0.25, unit: "lbs", unitCost: 12.00 }
  ]);

  const addIngredient = (item: typeof ingredientLibrary[0]) => {
    const exists = ingredients.find(i => i.name === item.name);
    if (!exists) {
      setIngredients([...ingredients, {
        id: ingredients.length + 1,
        name: item.name,
        quantity: 1,
        unit: item.unit + "s",
        unitCost: item.price
      }]);
    }
  };

  const removeIngredient = (id: number) => {
    setIngredients(ingredients.filter(i => i.id !== id));
  };

  const updateQuantity = (id: number, value: number) => {
    setIngredients(ingredients.map(i => 
      i.id === id ? { ...i, quantity: value } : i
    ));
  };

  const totalCost = ingredients.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  const costPerPortion = totalCost / yield_portions;
  const suggestedPrice = costPerPortion * 3;
  const pricePerPortion = targetPrice / yield_portions;
  const margin = ((pricePerPortion - costPerPortion) / pricePerPortion) * 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 -m-8 p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <span>{t("breadcrumb.home")}</span>
        <ChevronRight className="w-4 h-4" />
        <span>{t("breadcrumb.recipes")}</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-emerald-600 font-medium">{t("breadcrumb.new")}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="text-slate-500 mt-1">
            {t("description")}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-300">
            {t("cancel")}
          </Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Save className="w-4 h-4 mr-2" />
            {t("save")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Ingredient Library */}
        <div className="lg:col-span-1">
          <Card className="border-slate-200 dark:border-slate-800 sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg font-bold">{t("library")}</CardTitle>
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder={t("search")} 
                    className="pl-9 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Filter className="w-3 h-3 mr-1" />
                    {t("form.category")}
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Filter className="w-3 h-3 mr-1" />
                    {t("form.supplier")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {ingredientLibrary.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-start justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{item.supplier}</p>
                      <p className="text-xs text-emerald-600 font-medium mt-1">
                        ${item.price.toFixed(2)} / {item.unit}
                      </p>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      className="h-8 w-8 flex-shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      onClick={() => addIngredient(item)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Recipe Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recipe Info */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("form.name")}</Label>
                  <Input 
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="mt-1.5 text-lg font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("form.category")}</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main-course">{t("categories.main")}</SelectItem>
                        <SelectItem value="appetizer">{t("categories.appetizer")}</SelectItem>
                        <SelectItem value="dessert">{t("categories.dessert")}</SelectItem>
                        <SelectItem value="beverage">{t("categories.beverage")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("form.yield")}</Label>
                    <Input 
                      type="number"
                      value={yield_portions}
                      onChange={(e) => setYieldPortions(parseInt(e.target.value) || 0)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipe Ingredients Table */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">{t("composition")}</CardTitle>
                <Button variant="link" className="text-emerald-600 hover:text-emerald-700 p-0 h-auto text-sm">
                  {t("form.clear")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">{t("table.ingredient")}</th>
                      <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase">{t("table.quantity")}</th>
                      <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase">{t("table.unit")}</th>
                      <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase">{t("table.cost_unit")}</th>
                      <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase">{t("table.total")}</th>
                      <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase">{t("table.action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-3 px-2">
                          <span className="font-medium text-sm text-slate-900 dark:text-white">
                            {item.name}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <Input 
                            type="number"
                            step="0.25"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                            className="h-9 w-20 text-center mx-auto"
                          />
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-slate-600 dark:text-slate-400">
                          {item.unit}
                        </td>
                        <td className="py-3 px-2 text-right text-sm text-slate-600 dark:text-slate-400">
                          ${item.unitCost.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right font-semibold text-sm text-slate-900 dark:text-white">
                          ${(item.quantity * item.unitCost).toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => removeIngredient(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Costing Summary */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="pt-6">
              <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-8 items-center">
                {/* Total Production Cost */}
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">{t("financials.total_cost")}</h3>
                  <div className="text-4xl font-bold text-slate-900 dark:text-white">
                    ${totalCost.toFixed(2)}
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="text-xs text-slate-500">{t("financials.cost_portion")}</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      ${costPerPortion.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-32 w-px bg-slate-200 dark:bg-slate-800"></div>

                {/* Target Selling Price */}
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">{t("financials.suggested_price")}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-semibold text-slate-900 dark:text-white">$</span>
                    <Input 
                      type="number"
                      step="0.01"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                      className="text-3xl font-bold h-14 w-40"
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">{t("financials.suggested_price_3x")}</div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        ${suggestedPrice.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">{t("financials.price_portion")}</div>
                      <div className="font-semibold text-emerald-600">
                        ${pricePerPortion.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Margin Badge */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border-4 border-emerald-500 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-emerald-600">
                      {margin.toFixed(0)}%
                    </div>
                    <div className="text-xs text-emerald-600 uppercase font-medium">
                      {t("financials.margin")}
                    </div>
                  </div>
                  <Button variant="link" className="text-slate-600 hover:text-slate-900 mt-4 text-sm">
                    {t("financials.view_sheet")}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
