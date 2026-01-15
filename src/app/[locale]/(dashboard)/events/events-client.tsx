"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Minus,
  Calendar,
  Clock,
  Users,
  Edit3,
  Download,
  Printer,
  Utensils,
  Send,
  Save,
  Loader2,
  Trash2
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertEvent, updateEventStatus } from "./actions";

interface EventsClientProps {
  initialData: {
    events: any[];
    clients: any[];
    recipes: any[];
  };
  orgId: string;
}

export default function EventsClient({ initialData, orgId }: EventsClientProps) {
  const t = useTranslations("Events");
  const { events: initialEvents, clients, recipes } = initialData;

  const [events, setEvents] = useState(initialEvents);
  // Default to first event or clean state if empty
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEvents.length > 0 ? initialEvents[0].id : null);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Current Form State
  const [formData, setFormData] = useState({
    id: "",
    name: "New Event",
    clientId: "",
    date: new Date().toISOString().split('T')[0],
    guests: 50,
    status: "DRAFT",
    selectedRecipes: [] as { recipeId: string; quantity: number; details?: any }[]
  });

  // Load selected event into form
  useEffect(() => {
    if (selectedEventId) {
      const evt = events.find(e => e.id === selectedEventId);
      if (evt) {
        setFormData({
          id: evt.id,
          name: evt.name,
          clientId: evt.clientId,
          date: new Date(evt.date).toISOString().split('T')[0],
          guests: evt.guests,
          status: evt.status,
          selectedRecipes: evt.eventRecipes?.map((er: any) => ({
            recipeId: er.recipe.id,
            quantity: er.quantity,
            details: er.recipe
          })) || []
        });
        setIsEditing(false); // View mode initially
      }
    } else {
      // New Event Mode
      setFormData({
        id: "",
        name: "New Wedding",
        clientId: clients.length > 0 ? clients[0].id : "",
        date: new Date().toISOString().split('T')[0],
        guests: 100,
        status: "DRAFT",
        selectedRecipes: []
      });
      setIsEditing(true);
    }
  }, [selectedEventId, events]);

  const handleCreateNew = () => {
    setSelectedEventId(null);
    setIsEditing(true);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    formData.selectedRecipes.forEach(item => {
      const price = item.details?.price || 0;
      subtotal += price * item.quantity;
    });
    const serviceFee = subtotal * 0.18;
    const tax = subtotal * 0.085;
    const grandTotal = subtotal + serviceFee + tax;
    return { subtotal, serviceFee, tax, grandTotal };
  };

  const { subtotal, serviceFee, tax, grandTotal } = calculateTotals();

  const handleAddRecipe = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    // Check if already exists
    const exists = formData.selectedRecipes.find(r => r.recipeId === recipeId);
    if (!exists) {
      setFormData(prev => ({
        ...prev,
        selectedRecipes: [...prev.selectedRecipes, {
          recipeId,
          quantity: prev.guests, // Default to guest count!
          details: recipe
        }]
      }));
    }
  };

  const updateRecipeQuantity = (recipeId: string, delta: number) => {
    setFormData(prev => ({
      ...prev,
      selectedRecipes: prev.selectedRecipes.map(r => 
        r.recipeId === recipeId ? { ...r, quantity: Math.max(0, r.quantity + delta) } : r
      )
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    const payload = {
      id: formData.id || undefined,
      orgId,
      clientId: formData.clientId,
      name: formData.name,
      date: formData.date,
      guests: formData.guests,
      status: formData.status,
      recipes: formData.selectedRecipes.map(r => ({ recipeId: r.recipeId, quantity: r.quantity }))
    };

    const res = await upsertEvent(payload);
    setIsLoading(false);

    if (res.error) {
      alert("Error: " + res.error);
    } else {
      alert("Saved!");
      window.location.reload();
    }
  };

  const toggleStatus = async (newStatus: string) => {
    if (!formData.id) {
       setFormData(prev => ({ ...prev, status: newStatus }));
       return;
    }
    // Optimistic update
    setFormData(prev => ({ ...prev, status: newStatus }));
    await updateEventStatus(formData.id, newStatus);
    // Refresh handled by router usually, but simple state update here works for UI
  };

  const clientName = clients.find(c => c.id === formData.clientId)?.name || "Select Client";

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
          <div className="flex items-center gap-4">
            <Button onClick={handleCreateNew} className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <span className="hover:text-slate-900 cursor-pointer">{t("navigation.events")}</span>
          <span>/</span>
          <span className="text-slate-900 font-medium">{formData.name}</span>
        </div>

        {/* Title Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {isEditing ? (
               <Input 
                 value={formData.name} 
                 onChange={e => setFormData({...formData, name: e.target.value})} 
                 className="text-4xl font-bold h-12 w-1/2"
               />
            ) : (
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                {formData.name}
                </h1>
            )}
            
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
              {['DRAFT', 'SENT', 'CONFIRMED'].map(st => (
                <button 
                  key={st}
                  onClick={() => toggleStatus(st)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm transition-all ${
                     formData.status === st 
                     ? 'bg-white dark:bg-slate-900 text-emerald-600' 
                     : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              {isEditing ? (
                 <Input 
                   type="date"
                   value={formData.date}
                   onChange={e => setFormData({...formData, date: e.target.value})}
                   className="h-8 w-40"
                 />
              ) : (
                 <span>{new Date(formData.date).toLocaleDateString()}</span>
              )}
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
                    {isEditing ? (
                       <Select 
                         value={formData.clientId} 
                         onValueChange={val => setFormData({...formData, clientId: val})}
                       >
                         <SelectTrigger className="w-[200px] h-8">
                           <SelectValue placeholder="Select Client" />
                         </SelectTrigger>
                         <SelectContent>
                           {clients.map(c => (
                             <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    ) : (
                       <div className="font-semibold text-base text-slate-900">{clientName}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-0.5">{t("guest_count")}</div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Users className="w-4 h-4 text-slate-600" />
                      {isEditing ? (
                        <Input 
                          type="number" 
                          value={formData.guests} 
                          onChange={e => setFormData({...formData, guests: parseInt(e.target.value) || 0})}
                          className="w-20 h-8 text-right"
                        />
                      ) : (
                        <span className="text-lg font-bold text-slate-900">{formData.guests || 0}</span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                        setIsEditing(!isEditing); 
                        // If toggling off, maybe reset form? For now just toggle UI state.
                    }} 
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Menu Selection */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">{t("services")}</h2>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                      <Plus className="w-5 h-5" />
                      <span>{t("add_item")}</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Select Recipes</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2 py-4">
                       <Input placeholder="Search recipes..." className="mb-2" />
                       {recipes.map(recipe => (
                         <div key={recipe.id} className="flex justify-between items-center p-2 hover:bg-slate-50 border rounded cursor-pointer" onClick={() => handleAddRecipe(recipe.id)}>
                            <div>
                              <div className="font-medium">{recipe.name}</div>
                              <div className="text-xs text-slate-500">${recipe.price}</div>
                            </div>
                            <Button size="sm" variant="ghost"><Plus className="w-4 h-4"/></Button>
                         </div>
                       ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Menu Items Table */}
              <div className="space-y-4">
                {formData.selectedRecipes.map((item, idx) => (
                  <div key={idx} className="bg-white flex items-center gap-4 p-4 border border-slate-100 rounded-xl shadow-sm">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center text-2xl">
                      🍽️
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-slate-900 mb-0.5">
                        {item.details?.name}
                      </h4>
                      <p className="text-sm text-slate-500 mb-2">{item.details?.description}</p>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="font-bold text-lg text-slate-900">
                        ${item.details?.price?.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-full p-1">
                        <button 
                          onClick={() => updateRecipeQuantity(item.recipeId, -1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white hover:shadow-sm transition-all"
                        >
                          <Minus className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <span className="w-8 text-center font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateRecipeQuantity(item.recipeId, 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white hover:shadow-sm transition-all"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            
                {formData.selectedRecipes.length === 0 && (
                   <p className="text-center text-slate-400 py-8">No specific recipes added yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Quote Preview */}
          <div className="sticky top-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex-1 overflow-y-auto pr-2 pb-6">
            <Card className="border-slate-200 flex-shrink-0 mb-6">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{t("preview")}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-full">
                       <Download className="w-4 h-4 text-slate-500" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-full">
                       <Printer className="w-4 h-4 text-slate-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Invoice Header */}
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-[#10b981] rounded flex items-center justify-center">
                           <Utensils className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-bold text-slate-900">CaterFlow</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        123 Culinary Ave, Suite 100<br />
                        New York, NY 10012
                      </p>
                    </div>
                    <div className="text-right">
                       <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">{t("quote_header")}</h4>
                       <p className="text-xs font-bold text-slate-900 mt-1">#Q-2024-892</p>
                       <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">{t("actions.issued")}: Oct 02, 2024</p>
                    </div>
                  </div>

                  {/* Prepared For Grid */}
                  <div className="grid grid-cols-2 lg:gap-8 gap-4 mb-6">
                    <div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t("bill_to")}</div>
                       <div className="font-bold text-sm text-slate-900">{clientName}</div>
                       <div className="text-xs text-slate-500">{formData.name}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t("event_date")}</div>
                       <div className="font-bold text-sm text-slate-900">{new Date(formData.date).toLocaleDateString()}</div>
                       <div className="text-xs text-slate-500">{formData.guests} {t("guest_count")}</div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />

                  {/* Itemized List Header */}
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                     <span>{t("table.description")}</span>
                     <div className="flex gap-4">
                        <span className="w-8 text-center">{t("table.qty")}</span>
                        <span className="w-12 text-right">{t("table.price")}</span>
                        <span className="w-16 text-right">{t("table.amount")}</span>
                     </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-3 mb-6 min-h-[100px]">
                     {formData.selectedRecipes.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm px-1">
                           <div className="max-w-[140px]">
                              <div className="font-bold text-slate-900 truncate">{item.details?.name}</div>
                              <div className="text-xs text-slate-500 truncate">{item.details?.category || 'Item'}</div>
                           </div>
                           <div className="flex gap-4">
                              <span className="w-8 text-center text-slate-600">{item.quantity}</span>
                              <span className="w-12 text-right text-slate-600">${item.details?.price}</span>
                              <span className="w-16 text-right font-bold text-slate-900">
                                ${(item.quantity * (item.details?.price || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                              </span>
                           </div>
                        </div>
                     ))}
                     {formData.selectedRecipes.length === 0 && (
                        <div className="text-center py-4 text-xs text-slate-400 italic">{t("no_items")}</div>
                     )}
                  </div>

                  <Separator className="my-4 border-dashed" />
                
                  {/* Totals */}
                  <div className="space-y-2 text-sm pl-8">
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-xs font-medium">{t("financials.subtotal")}</span>
                      <span className="font-bold text-slate-900">
                        ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-xs font-medium">{t("financials.service_fee")} (18%)</span>
                      <span className="font-bold text-slate-900">
                        ${serviceFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-xs font-medium">{t("financials.tax")} (8.5%)</span>
                      <span className="font-bold text-slate-900">
                        ${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                    <span className="text-sm font-bold text-slate-900">{t("financials.total")}</span>
                    <span className="text-2xl font-extrabold text-[#10b981]">
                      ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Main Action Button */}
                  <Button 
                    disabled={isLoading} 
                    onClick={handleSave} 
                    className="w-full mt-6 bg-[#10b981] hover:bg-emerald-600 text-white font-bold h-11 shadow-sm"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : (
                      <>
                        {t("actions.send")}
                        <Send className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">{t("actions.last_saved")}</p>
                </div>
              </CardContent>
            </Card>

            {/* Event Selector List - Quick Navigation */}
            <div className="mt-6 border-t pt-4">
               <h4 className="text-sm font-semibold text-slate-500 uppercase mb-4">Current Events</h4>
               <div className="space-y-2">
                 {events.map(e => (
                   <div 
                     key={e.id} 
                     onClick={() => setSelectedEventId(e.id)}
                     className={`p-2 rounded cursor-pointer hover:bg-slate-100 flex justify-between ${selectedEventId === e.id ? 'bg-slate-100 font-semibold' : ''}`}
                   >
                     <span className="text-sm truncate">{e.name}</span>
                     <span className="text-xs text-slate-400">{new Date(e.date).toLocaleDateString()}</span>
                   </div>
                 ))}
               </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
