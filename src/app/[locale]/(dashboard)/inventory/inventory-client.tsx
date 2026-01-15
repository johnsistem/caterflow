"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Download, ChevronLeft, ChevronRight, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { upsertIngredient } from "./actions";


interface InventoryClientProps {
  initialIngredients: any[];
  orgId: string;
}

export default function InventoryClient({ initialIngredients, orgId }: InventoryClientProps) {
  const t = useTranslations("Inventory");
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    unit: "kg",
    cost: "",
    stock: ""
  });

  const handleEdit = (item: any) => {
    setFormData({
      id: item.id,
      name: item.name,
      unit: item.unit,
      cost: item.cost.toString(),
      stock: item.stock.toString()
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setFormData({
      id: "",
      name: "",
      unit: "kg",
      cost: "",
      stock: ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const data = new FormData();
    if (formData.id) data.append("id", formData.id);
    data.append("name", formData.name);
    data.append("unit", formData.unit);
    data.append("cost", formData.cost);
    data.append("stock", formData.stock);

    const result = await upsertIngredient(data, orgId);
    
    if (result?.error) {
      alert("Error: " + result.error);
    } else {
      setIsDialogOpen(false);
      // Refresh logic would ideally rely on router.refresh() from server action revalidate 
      // but we might want to manually update local state or just let the page reload do it 
      // since the server action calls revalidatePath.
      // Next.js should auto-update the props if we were using router.refresh(), 
      // but since this is passed as initial prop, we might need a full reload or just trust Next.js cache invalidation.
      window.location.reload(); 
    }
    setIsLoading(false);
  };

  // Filter Logic
  const filteredIngredients = ingredients.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                {t("add_button")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{formData.id ? "Edit Ingredient" : "Add New Ingredient"}</DialogTitle>
                <DialogDescription>
                  Enter the details for the inventory item here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="unit" className="text-right">Unit</Label>
                    <Select value={formData.unit} onValueChange={val => setFormData({...formData, unit: val})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="l">l</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                        <SelectItem value="unit">unit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cost" className="text-right">Cost</Label>
                    <Input id="cost" type="number" step="0.01" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="stock" className="text-right">Stock</Label>
                    <Input id="stock" type="number" step="0.01" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="col-span-3" required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save changes"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
                  {/* Categories could be dynamic too, but keeping static for now */}
                  <SelectItem value="meat">{t("categories.meat")}</SelectItem>
                  <SelectItem value="dairy">{t("categories.dairy")}</SelectItem>
                </SelectContent>
              </Select>
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
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">{t("table.ingredient")}</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">{t("table.unit")}</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">{t("table.price")}</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Stock</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">{t("table.trend")}</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">{t("table.updated")}</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">{t("table.action")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
                          📦
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-xs text-slate-400">ID: {item.id.substring(0,6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                      {item.unit}
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">${item.cost}</p>
                    </td>
                     <td className="py-4 px-6">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{item.stock}</p>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="outline" className={`
                        ${item.trend === 'up' ? 'text-rose-600 bg-rose-50 border-rose-200' : ''}
                        ${item.trend === 'down' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : ''}
                        ${item.trend === 'flat' ? 'text-slate-500 bg-slate-50' : ''}
                      `}>
                         {item.trend === 'up' ? '↑ ' : item.trend === 'down' ? '↓ ' : '• '} 
                         {item.changePercent !== '0.0%' ? item.changePercent : 'Flat'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500">
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleEdit(item)}>
                        {t("table.edit")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
