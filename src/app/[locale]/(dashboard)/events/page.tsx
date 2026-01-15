"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Plus, 
  Minus,
  Calendar,
  Clock,
  Users,
  Edit3,
  Download,
  Send,
  ChevronRight,
  FileText,
  Printer,
  Utensils
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  {
    id: 1,
    name: "Mini Crab Cakes with Remoulade",
    description: "Lump crab meat, herbs, cajun spice blend",
    category: "Appetizer",
    categoryDetail: "Per Piece",
    price: 4.50,
    quantity: 300,
    image: "🦀"
  },
  {
    id: 2,
    name: "Braised Short Ribs",
    description: "Red wine reduction, rosemary, garlic",
    category: "Main",
    categoryDetail: "Per Person",
    price: 28.00,
    quantity: 150,
    image: "🥩"
  },
  {
    id: 3,
    name: "Wild Mushroom Risotto",
    description: "Porcini, parmesan reggiano, truffle oil",
    category: "Main",
    categoryDetail: "Per Person",
    price: 24.00,
    quantity: 150,
    image: "🍄"
  },
  {
    id: 4,
    name: "Premium Beverage Package",
    description: "Soft drinks, juices, mineral water",
    category: "Bev",
    categoryDetail: "Per Person",
    price: 18.00,
    quantity: 0,
    image: "🥤"
  }
];

export default function EventsPage() {
  const t = useTranslations("Events");
  const [items, setItems] = useState(menuItems);
  
  const updateQuantity = (id: number, delta: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceFee = subtotal * 0.18;
  const tax = subtotal * 0.085;
  const grandTotal = subtotal + serviceFee + tax;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 -m-8">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 dark:border-slate-800 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#10b981] rounded-xl flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">CaterFlow</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search events..." 
                className="pl-9 w-64 bg-slate-50 border-slate-200"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-sm font-medium text-slate-700 hover:text-slate-900">{t("navigation.dashboard")}</button>
            <button className="text-sm font-medium text-slate-700 hover:text-slate-900">{t("navigation.events")}</button>
            <button className="text-sm font-medium text-slate-700 hover:text-slate-900">{t("navigation.calendar")}</button>
            <button className="text-sm font-medium text-slate-700 hover:text-slate-900">{t("navigation.clients")}</button>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-orange-400 text-white text-xs font-semibold">JM</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <span className="hover:text-slate-900 cursor-pointer">{t("navigation.events")}</span>
          <span>/</span>
          <span className="hover:text-slate-900 cursor-pointer">{t("demo.upcoming")}</span>
          <span>/</span>
          <span className="text-slate-900 font-medium">#Q-2024-892</span>
        </div>

        {/* Title Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              {t("demo.wedding")}
            </h1>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
              <button className="bg-white dark:bg-slate-900 text-emerald-600 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                {t("kpis.draft")}
              </button>
              <button className="text-slate-500 px-4 py-1.5 rounded-full text-sm font-medium hover:text-slate-700">
                {t("kpis.sent")}
              </button>
              <button className="text-slate-500 px-4 py-1.5 rounded-full text-sm font-medium hover:text-slate-700">
                {t("kpis.confirmed")}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Oct 12, 2024</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
              <Clock className="w-4 h-4 text-slate-400" />
              <span>5:00 PM - 11:00 PM</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Left Side */}
          <div className="space-y-6">
            {/* Client Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-slate-200">
                      <Users className="w-6 h-6 text-slate-400" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">{t("client_label")}</div>
                    <div className="font-semibold text-base text-slate-900">{t("demo.sarah_john")}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-0.5">{t("guest_count")}</div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Users className="w-4 h-4 text-slate-600" />
                      <span className="text-lg font-bold text-slate-900">150</span>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Menu Selection */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">{t("services")}</h2>
                <button className="flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                  <Plus className="w-5 h-5" />
                  <span>{t("add_item")}</span>
                </button>
              </div>

              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-8">
                <Button size="sm" className="bg-[#10b981] hover:bg-emerald-600 text-white rounded-lg px-6 py-5">
                  {t("tabs.all")}
                </Button>
                <Button size="sm" variant="ghost" className="bg-slate-100 text-slate-600 rounded-lg px-6 py-5 hover:bg-slate-200">
                  {t("tabs.apps")}
                </Button>
                <Button size="sm" variant="ghost" className="bg-slate-100 text-slate-600 rounded-lg px-6 py-5 hover:bg-slate-200">
                  {t("tabs.mains")}
                </Button>
                <Button size="sm" variant="ghost" className="bg-slate-100 text-slate-600 rounded-lg px-6 py-5 hover:bg-slate-200">
                  {t("tabs.sides")}
                </Button>
                <Button size="sm" variant="ghost" className="bg-slate-100 text-slate-600 rounded-lg px-6 py-5 hover:bg-slate-200">
                  {t("tabs.beverages")}
                </Button>
              </div>

              {/* Menu Items */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-white flex items-center gap-4 p-4 border border-slate-100 rounded-xl shadow-sm">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-slate-100">
                      {/* Placeholder circle representing the image in the mockup */}
                      <div className="w-full h-full bg-slate-300 flex items-center justify-center text-3xl">
                        {item.image}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-slate-900 mb-0.5">
                        {item.name}
                      </h4>
                      <p className="text-sm text-slate-500 mb-2">{item.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">
                          {item.category}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">• {item.categoryDetail}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="font-bold text-lg text-slate-900">
                        ${item.price.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-full p-1">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white hover:shadow-sm transition-all"
                        >
                          <Minus className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <span className="w-8 text-center font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white hover:shadow-sm transition-all"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Browse More */}
              <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mt-6 mx-auto">
                <Search className="w-4 h-4" />
                <span className="text-sm">{t("actions.browse_catalog")}</span>
              </button>
            </div>
          </div>

          {/* Right Side - Quote Preview */}
          <div>
            <Card className="border-slate-200 sticky top-6">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <h3 className="text-lg font-bold text-slate-900">{t("preview")}</h3>
                  </div>
                  <div className="flex gap-3">
                    <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Quote Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#10b981] rounded-xl flex items-center justify-center">
                      <Utensils className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">CaterFlow</h3>
                  </div>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        123 Culinary Ave, Suite 100<br />
                        New York, NY 10012
                      </p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-3xl font-extrabold text-slate-900 tracking-tighter">{t("quote_header")}</h3>
                      <p className="text-sm font-bold text-slate-900">#Q-2024-892</p>
                      <p className="text-xs font-medium text-slate-400">{t("actions.issued")}: Oct 02, 2024</p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 uppercase mb-1">{t("bill_to")}</div>
                      <div className="font-semibold text-sm text-slate-900">{t("demo.sarah_john")}</div>
                      <div className="text-xs text-slate-500">{t("demo.wedding")}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 uppercase mb-1">{t("event_date")}</div>
                      <div className="font-semibold text-sm text-slate-900">Oct 12, 2024</div>
                      <div className="text-xs text-slate-500">150 {t("guest_count")}</div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-4">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 pb-2 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                    <div>{t("table.description")}</div>
                    <div className="text-center">{t("table.qty")}</div>
                    <div className="text-right">{t("table.price")}</div>
                    <div className="text-right">{t("table.amount")}</div>
                  </div>
                  <div className="space-y-3 mt-3">
                    {items.filter(item => item.quantity > 0).map((item) => (
                      <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 text-sm">
                        <div>
                          <div className="font-medium text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.category}</div>
                        </div>
                        <div className="text-center text-slate-600">{item.quantity}</div>
                        <div className="text-right text-slate-600">${item.price.toFixed(2)}</div>
                        <div className="text-right font-semibold text-slate-900">
                          ${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t("financials.subtotal")}</span>
                    <span className="font-medium text-slate-900">
                      ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t("financials.service_fee")}</span>
                    <span className="font-medium text-slate-900">
                      ${serviceFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t("financials.tax")}</span>
                    <span className="font-medium text-slate-900">
                      ${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-bold text-slate-900">{t("financials.total")}</span>
                  <span className="text-3xl font-bold text-emerald-600">
                    ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Action Button */}
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                  {t("actions.send")}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-center text-slate-400 mt-2">
                  {t("actions.last_saved")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
