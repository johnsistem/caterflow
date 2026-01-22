"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Trash2, 
  ChevronRight,
  Save,
  Loader2,
  Edit,
  ArrowLeft,
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
import { saveRecipe, getRecipeDetails } from "./actions";
import { roundTo } from "@/lib/utils";

// Types
type Ingredient = {
  id: string;
  name: string;
  unit: string;
  cost: number;
};

type RecipeIngredient = Ingredient & {
  quantity: number;
  uid: string;
};

type RecipeSummary = {
  id: string;
  name: string;
  category: string;
  totalCost: number;
  margin: number;
  price: number;
  description: string;
  yield: number;
};

interface RecipesClientProps {
  ingredientLibrary: Ingredient[];
  initialRecipes: RecipeSummary[];
  orgId: string;
  orgCurrency: string;
}

export default function RecipesClient({ ingredientLibrary, initialRecipes, orgId, orgCurrency }: RecipesClientProps) {
  const t = useTranslations("Recipes");

  // Info Tooltip State
  const [showInfo, setShowInfo] = useState(false);

  // View Mode State
  const [viewMode, setViewMode] = useState<'list' | 'builder'>('list');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  
  // Recipe Builder State
  const [recipeName, setRecipeName] = useState("New Recipe");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("main");
  const [yieldPortions, setYieldPortions] = useState(1);
  const [selectedIngredients, setSelectedIngredients] = useState<RecipeIngredient[]>([]);
  const [marginPercent, setMarginPercent] = useState(30);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Financial Calculations
  // Financial Calculations
  const totalCost = roundTo(
    selectedIngredients.reduce((sum, item) => sum + roundTo(item.quantity * item.cost, 2), 0),
    2
  );
  
  const costPerPortion = yieldPortions > 0 ? totalCost / yieldPortions : 0;
  
  // Calculate price based on TOTAL cost to ensure margin integrity on the batch
  const totalTargetPrice = marginPercent < 100 ? totalCost / (1 - marginPercent / 100) : 0;
  const sellPrice = yieldPortions > 0 ? roundTo(totalTargetPrice / yieldPortions, 2) : 0;

  const handleCreateNew = () => {
    // Reset state
    setRecipeName("New Recipe");
    setDescription("");
    setCategory("main");
    setYieldPortions(1);
    setSelectedIngredients([]);
    setMarginPercent(30);
    
    setIsEditing(false);
    setEditingId(null);
    setViewMode('builder');
  };

  const handleEdit = async (recipe: RecipeSummary) => {
    setLoadingRecipe(true);
    try {
      const details = await getRecipeDetails(recipe.id);
      if (details.error) {
        alert("Error loading recipe: " + details.error);
        return;
      }

      setRecipeName(details.name);
      setDescription(details.description || "");
      setCategory(details.category || "main");
      setMarginPercent(details.margin);
      setYieldPortions(details.yield || 1); 
      setSelectedIngredients(details.ingredients || []);
      
      setEditingId(recipe.id);
      setIsEditing(true);
      setViewMode('builder');
    } catch (e) {
      console.error(e);
      alert("Failed to load recipe details");
    } finally {
      setLoadingRecipe(false);
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setEditingId(null);
    setIsEditing(false);
  };

  const handleAddIngredient = (ing: Ingredient) => {
    const exists = selectedIngredients.find(i => i.id === ing.id);
    if (!exists) {
      setSelectedIngredients([
        ...selectedIngredients, 
        { ...ing, quantity: 1, uid: Math.random().toString() }
      ]);
    }
  };

  const handleRemoveIngredient = (id: string) => {
    setSelectedIngredients(selectedIngredients.filter(i => i.id !== id));
  };

  const handleQuantityChange = (id: string, newQty: number) => {
    setSelectedIngredients(selectedIngredients.map(i => 
      i.id === id ? { ...i, quantity: newQty } : i
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      id: editingId || undefined, // Send ID if editing
      orgId,
      name: recipeName,
      description: description || `A delicious ${category}`,
      category: category,
      servings: yieldPortions,
      totalCost: totalCost,
      price: sellPrice,
      margin: marginPercent,
      ingredients: selectedIngredients.map(i => ({ id: i.id, quantity: i.quantity }))
    };

    const res = await saveRecipe(payload);
    setIsSaving(false);

    if (res.error) {
      alert("Error saving: " + res.error);
    } else {
      // Return to list on success
      handleBackToList();
    }
  };

  const filteredLibrary = ingredientLibrary.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- RENDER: LIST VIEW ---
  if (viewMode === 'list') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 -m-8 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your recipes and costs
            </p>
          </div>
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={handleCreateNew}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("breadcrumb.new")}
          </Button>
        </div>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Recipe Name</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Category</th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Total Cost</th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Margin</th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {initialRecipes.map((recipe) => (
                    <tr key={recipe.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-900 dark:text-white">{recipe.name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{recipe.description}</div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="capitalize">
                          {recipe.category || 'Main'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-slate-500">
                        {formatCurrency(recipe.totalCost || 0, orgCurrency)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Badge 
                          variant="secondary"
                          className={`${
                            recipe.margin < 25 ? 'bg-rose-100 text-rose-700' : 
                            recipe.margin > 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {(recipe.margin || 0).toFixed(0)}%
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(recipe)}
                          disabled={loadingRecipe}
                        >
                          {loadingRecipe && editingId === recipe.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                          ) : (
                            <Edit className="w-4 h-4 text-emerald-600" />
                          )}
                          <span className="sr-only">Edit</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {initialRecipes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No recipes found. Create your first one!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- RENDER: BUILDER VIEW ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 -m-8 p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Button 
          variant="link" 
          className="p-0 h-auto text-slate-500 hover:text-slate-900"
          onClick={handleBackToList}
        >
          {t("breadcrumb.recipes")}
        </Button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-emerald-600 font-medium">
          {isEditing ? `Edit: ${recipeName}` : t("breadcrumb.new")}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            {isEditing ? "Update Recipe" : t("title")}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEditing ? "Modify existing recipe details and ingredients" : t("description")}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-300" onClick={handleBackToList}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("cancel")}
          </Button>
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isEditing ? "Update Recipe" : t("save")}
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredLibrary.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-start justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                        {item.name}
                      </h4>
                      <p className="text-xs text-emerald-600 font-medium mt-1">
                        {formatCurrency(item.cost, orgCurrency)} / {item.unit}
                      </p>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      className="h-8 w-8 flex-shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      onClick={() => handleAddIngredient(item)}
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
                 <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</Label>
                  <Input 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of the dish"
                    className="mt-1.5"
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
                        <SelectItem value="main">{t("categories.main")}</SelectItem>
                        <SelectItem value="appetizer">{t("categories.appetizer")}</SelectItem>
                        <SelectItem value="dessert">{t("categories.dessert")}</SelectItem>
                        <SelectItem value="beverage">{t("categories.beverage")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("form.yield")} (Portions)</Label>
                    <Input 
                      type="number"
                      value={yieldPortions}
                      onChange={(e) => setYieldPortions(Math.max(1, parseInt(e.target.value) || 1))}
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
                <Button 
                  variant="link" 
                  className="text-emerald-600 hover:text-emerald-700 p-0 h-auto text-sm"
                  onClick={() => setSelectedIngredients([])}
                >
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
                    {selectedIngredients.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-3 px-2">
                          <span className="font-medium text-sm text-slate-900 dark:text-white">
                            {item.name}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <Input 
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                            className="h-9 w-20 text-center mx-auto"
                          />
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-slate-600 dark:text-slate-400">
                          {item.unit}
                        </td>
                        <td className="py-3 px-2 text-right text-sm text-slate-600 dark:text-slate-400">
                          {formatCurrency(item.cost, orgCurrency)}
                        </td>
                        <td className="py-3 px-2 text-right font-semibold text-sm text-slate-900 dark:text-white">
                          {formatCurrency(roundTo(item.quantity * item.cost, 2), orgCurrency)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleRemoveIngredient(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {selectedIngredients.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-8 text-slate-400">Add ingredients from the library</td></tr>
                    )}
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
                    {formatCurrency(totalCost, orgCurrency)}
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="text-xs text-slate-500">{t("financials.cost_portion")}</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {formatCurrency(costPerPortion, orgCurrency)}
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
                      value={sellPrice.toFixed(2)}
                      readOnly // Calculated field
                      className="text-3xl font-bold h-14 w-40 bg-slate-50"
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="relative flex items-center gap-1.5 mb-1">
                        <div className="text-xs text-slate-500">Target Margin %</div>
                        <button
                          type="button"
                          className="text-slate-400 hover:text-emerald-500 transition-colors focus:outline-none"
                          onMouseEnter={() => setShowInfo(true)}
                          onMouseLeave={() => setShowInfo(false)}
                          onClick={() => setShowInfo(!showInfo)}
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        {showInfo && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-900 text-white text-xs p-4 rounded-xl shadow-xl z-50 border border-slate-700">
                             <h4 className="font-bold mb-2 text-emerald-400 text-sm flex items-center gap-2">
                               <Info className="w-4 h-4" />
                               {t('financials.margin_info.title')}
                             </h4>
                             <p className="mb-3 text-slate-300 leading-relaxed">{t('financials.margin_info.body')}</p>
                             <div className="space-y-2 mb-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                <p><strong className="text-rose-300">Markup:</strong> {t('financials.margin_info.markup').split(':')[1]}</p>
                                <p><strong className="text-emerald-300">Margin:</strong> {t('financials.margin_info.margin').split(':')[1]}</p>
                             </div>
                             <p className="italic text-slate-400 border-t border-slate-800 pt-2 mt-2">{t('financials.margin_info.why')}</p>
                             <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-slate-700"></div>
                          </div>
                        )}
                      </div>
                      <Input 
                        type="number" 
                        value={marginPercent} 
                        onChange={e => setMarginPercent(parseFloat(e.target.value) || 0)}
                        className="font-semibold text-slate-900 dark:text-white w-20"
                      />
                    </div>
                  </div>
                </div>

                {/* Margin Badge */}
                <div className="flex flex-col items-center">
                  <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center transition-colors ${
                    marginPercent < 25 ? 'border-rose-500 bg-rose-50' : 
                    marginPercent > 50 ? 'border-emerald-500 bg-emerald-50' : 'border-blue-500 bg-blue-50'
                  }`}>
                    <div className={`text-3xl font-bold ${
                       marginPercent < 25 ? 'text-rose-600' : 
                       marginPercent > 50 ? 'text-emerald-600' : 'text-blue-600'
                    }`}>
                      {marginPercent}%
                    </div>
                    <div className="text-xs text-slate-500 uppercase font-medium">
                      Margin
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
