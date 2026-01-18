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
  Trash2,
  ArrowLeft,
  ChevronRight,
  Filter,
  MoreHorizontal,
  CheckCircle,
  Lock,
  TrendingUp
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

import { upsertEvent, updateEventStatus, deleteEvent, duplicateEvent, generateShoppingList, generateKitchenSheet } from "./actions";
import { useRouter } from "next/navigation";
import { Copy, ShoppingCart, ChefHat, FileText } from "lucide-react";

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
  const router = useRouter();

  const [events, setEvents] = useState(initialEvents);
  
  // Sync state with props when router refreshes
  useEffect(() => {
    setEvents(initialData.events);
  }, [initialData.events]);
  
  // View State
  const [viewMode, setViewMode] = useState<'list' | 'builder'>('list');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Builder State
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
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
    selectedRecipes: [] as { recipeId: string; quantity: number; priceSnapshot?: number; details?: any }[]
  });

  // Search State for List
  const [searchTerm, setSearchTerm] = useState("");

  // Profitability UI State
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [shoppingListData, setShoppingListData] = useState<any>(null);
  const [showKitchenSheet, setShowKitchenSheet] = useState(false);
  const [kitchenSheetData, setKitchenSheetData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load selected event into form
  useEffect(() => {
    if (viewMode === 'builder') {
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
              priceSnapshot: er.price, // Loaded from EventRecipe snapshot
              details: er.recipe
            })) || []
          });
          setIsEditing(false); // Start in "View/Preview" mode within builder
        }
      } else {
        // New Event Mode
        setFormData({
          id: "",
          name: "New Event",
          clientId: clients.length > 0 ? clients[0].id : "",
          date: new Date().toISOString().split('T')[0],
          guests: 100,
          status: "DRAFT",
          selectedRecipes: []
        });
        setIsEditing(true); // Start in Edit mode for new events
      }
    }
  }, [selectedEventId, viewMode, events, clients]);

  const handleCreateNew = () => {
    setSelectedEventId(null);
    setViewMode('builder');
  };

  const handleEditEvent = (evt: any) => {
    setSelectedEventId(evt.id);
    setViewMode('builder');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedEventId(null);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let marketSubtotal = 0;
    let marketCostTotal = 0;

    formData.selectedRecipes.forEach(item => {
      // Logic: Use snapshot if not DRAFT, otherwise current recipe price
      const lockedPrice = (formData.status !== 'DRAFT' && item.priceSnapshot !== undefined && item.priceSnapshot !== null) 
        ? item.priceSnapshot 
        : (item.details?.price || 0);
      
      const marketPrice = item.details?.price || 0;
      const marketCost = item.details?.totalCost || 0;

      subtotal += lockedPrice * item.quantity;
      marketSubtotal += marketPrice * item.quantity;
      marketCostTotal += marketCost * item.quantity;
    });

    const serviceFee = subtotal * 0.18;
    const tax = subtotal * 0.085;
    const grandTotal = subtotal + serviceFee + tax;

    const marketGrandTotal = marketSubtotal + (marketSubtotal * 0.18) + (marketSubtotal * 0.085);
    const lostRevenue = marketGrandTotal - grandTotal;
    const currentMargin = grandTotal > 0 ? (grandTotal - marketCostTotal) / grandTotal : 0;
    const originalMargin = marketGrandTotal > 0 ? (marketGrandTotal - marketCostTotal) / marketGrandTotal : 0;

    return { 
      subtotal, serviceFee, tax, grandTotal, 
      marketGrandTotal, lostRevenue, 
      currentMargin, originalMargin,
      isSqueezed: lostRevenue > 0.01 && formData.status !== 'DRAFT'
    };
  };

  const { subtotal, serviceFee, tax, grandTotal, marketGrandTotal, lostRevenue, currentMargin, originalMargin, isSqueezed } = calculateTotals();

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
          quantity: prev.guests,
          priceSnapshot: recipe.price, // Snapshot at the moment of adding
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

  const handleSave = async (targetStatus?: string) => {
    setIsLoading(true);
    const finalStatus = targetStatus || formData.status;
    
    const payload = {
      id: formData.id || undefined,
      orgId,
      clientId: formData.clientId,
      name: formData.name,
      date: formData.date,
      guests: formData.guests,
      status: finalStatus,
      recipes: formData.selectedRecipes.map(r => ({ recipeId: r.recipeId, quantity: r.quantity }))
    };

    const res = await upsertEvent(payload);
    setIsLoading(false);

    if (res.error) {
      alert("Error: " + res.error);
    } else {
      // If we just sent a quote, give feedback
      if (finalStatus === 'SENT' && formData.status !== 'SENT') {
        alert("Quote sent successfully! Event status updated to SENT.");
      }
      window.location.reload();
    }
  };

  const handleDelete = async () => {
    if (!formData.id) return;
    if (!confirm("Are you sure you want to permanently delete this draft? This action cannot be undone.")) return;
    
    setIsLoading(true);
    const res = await deleteEvent(formData.id);
    if (res?.error) {
      setIsLoading(false);
      alert("Error deleting: " + res.error);
    } else {
       window.location.reload();
    }
  };

  const handleRemoveRecipe = (recipeId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedRecipes: prev.selectedRecipes.filter(r => r.recipeId !== recipeId)
    }));
  };

  const handleStatusClick = async (targetStatus: string) => {
    // Logic enforcement
    const current = formData.status;
    
    // Prevent clicking current status
    if (current === targetStatus) return;

    // Logic: DRAFT -> SENT -> CONFIRMED
    
    if (targetStatus === 'CONFIRMED') {
       // Allow confirming if Draft OR Sent, but warn if Draft.
       if (current === 'DRAFT') {
         const proceed = confirm("Wait! This event is still a DRAFT. Usually you should SEND the quote first. Do you really want to jump straight to CONFIRMED?");
         if (!proceed) return;
       }
       
       const confirmMsg = "Are you sure you want to CONFIRM this event? This will lock key financial details.";
       if (!confirm(confirmMsg)) return;

       // Proceed to update
       await toggleStatus(targetStatus);
       return;
    }

    // Default behavior for other transitions
    await toggleStatus(targetStatus);
  };

  const toggleStatus = async (newStatus: string) => {
    // Optimistic update
    setFormData(prev => ({ ...prev, status: newStatus }));
    
    if (formData.id) {
      await updateEventStatus(formData.id, newStatus);
    }
  };

  const handleDuplicate = async () => {
    if (!formData.id) return;
    if (!confirm(t("duplicate_confirm") || "Are you sure you want to duplicate this event? prices will be recalculated based on current inventory costs.")) return;

    setIsLoading(true);
    const res = await duplicateEvent(formData.id, orgId);
    
    if (res.error) {
       setIsLoading(false);
       alert("Error duplicating: " + res.error);
    } else {
       // Success!
       // 1. Locally add the new event to list (optional, but good for instant feedback)
       if (res.newEvent) {
          setEvents(prev => [...prev, res.newEvent]);
       }
       
       // 2. Refresh router to ensure server sync
       router.refresh();

       // 3. Switch to the new event
       setSelectedEventId(res.newEventId);
       setIsLoading(false);
       
       // Note: useEffect dependency on selectedEventId will trigger form update
    }
  };

  const handleShoppingList = async () => {
    if (!formData.id) return;
    setIsGenerating(true);
    const res = await generateShoppingList(formData.id);
    setIsGenerating(false);

    if (res.error) {
      alert("Error: " + res.error);
    } else {
      setShoppingListData(res.data);
      setShowShoppingList(true);
    }
  };

  const handleKitchenSheet = async () => {
    if (!formData.id) return;
    setIsGenerating(true);
    const res = await generateKitchenSheet(formData.id);
    setIsGenerating(false);

    if (res.error) {
      alert("Error: " + res.error);
    } else {
      setKitchenSheetData(res.data);
      setShowKitchenSheet(true);
    }
  };

  const clientName = clients.find(c => c.id === formData.clientId)?.name || "Select Client";

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-[#10b981]/10 text-[#10b981]'; // Emerald
      case 'SENT': return 'bg-blue-100 text-blue-700'; // Blue
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const eventDate = new Date(e.date);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Normalize event date to remove time part for accurate comparison
    const eventDateOnly = new Date(eventDate);
    eventDateOnly.setHours(0,0,0,0);

    let matchesTab = true;
    if (activeTab === 'upcoming') {
      matchesTab = eventDateOnly >= today;
    } else {
      matchesTab = eventDateOnly < today;
    }

    return matchesSearch && matchesTab;
  });

  // Helper for price formatting consistency
  const fmtPrice = (amount: number) => {
    // Ensure strict 2 decimals
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // --- VIEW: LIST ---
  if (viewMode === 'list') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 -m-8 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">{t("list_title")}</h1>
            <p className="text-slate-500 mt-1">{t("list_description")}</p>
          </div>
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={handleCreateNew}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("new_event")}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'upcoming' 
                ? 'bg-white dark:bg-slate-800 text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t("tabs.upcoming")}
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'past' 
                ? 'bg-white dark:bg-slate-800 text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t("tabs.past")}
          </button>
        </div>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder={t("search_placeholder")}
                  className="pl-9 bg-slate-50 dark:bg-slate-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4 text-slate-500" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="text-left py-4 px-6 rounded-tl-lg">{t("table.event_name")}</th>
                    <th className="text-left py-4 px-6">{t("table.client")}</th>
                    <th className="text-left py-4 px-6">{t("table.date")}</th>
                    <th className="text-center py-4 px-6">{t("table.guests")}</th>
                    <th className="text-center py-4 px-6">{t("table.status")}</th>
                    <th className="text-right py-4 px-6">{t("table.total_value")}</th>
                    <th className="text-right py-4 px-6 rounded-tr-lg">{t("table.action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEvents.map((evt) => (
                    <tr 
                      key={evt.id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
                      onClick={() => handleEditEvent(evt)}
                    >
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-900 dark:text-white">{evt.name}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                        {evt.client?.name || "Unknown"}
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(evt.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-slate-600 dark:text-slate-400">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-xs font-medium">
                          <Users className="w-3 h-3" />
                          {evt.guests}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge className={`${getStatusColor(evt.status)} border-0`}>
                          {t("status." + evt.status.toLowerCase())}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-emerald-600">
                        ${evt.totalPrice ? fmtPrice(evt.totalPrice) : '0.00'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(evt);
                          }}
                        >
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        {t("no_items")}
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

  // --- VIEW: BUILDER ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 -m-8">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 dark:border-slate-800 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-slate-500" onClick={handleBackToList}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("back")}
            </Button>
          </div>
          <div className="flex items-center gap-4">
            {/* Conditional Trash Icon: Only for DRAFT */}
            {formData.status === 'DRAFT' && formData.id && (
              <Button 
                variant="ghost" 
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleDelete}
                title="Delete Draft"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            
            <Button 
              onClick={() => handleSave(undefined)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isLoading}
            >
               {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
               Save
            </Button>

            {/* Actions Menu */}
            {formData.id && (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-2">
                 <Button
                    variant="outline"
                    size="icon"
                    title="Duplicate Event"
                    onClick={handleDuplicate}
                    disabled={isLoading}
                 >
                    <Copy className="w-4 h-4 text-slate-600" />
                 </Button>
                 
                 <Dialog>
                    <DialogTrigger asChild>
                       <Button variant="outline" className="gap-2">
                          <FileText className="w-4 h-4" />
                          Reports
                       </Button>
                    </DialogTrigger>
                    <DialogContent>
                       <DialogHeader>
                          <DialogTitle>Event Reports</DialogTitle>
                       </DialogHeader>
                       <div className="grid gap-4 py-4">
                          <Button 
                            variant="outline" 
                            className="justify-start h-auto py-4 px-4 gap-4"
                            onClick={handleShoppingList}
                            disabled={isGenerating}
                          >
                             <div className="bg-blue-100 p-2 rounded-full">
                                <ShoppingCart className="w-5 h-5 text-blue-600" />
                             </div>
                             <div className="text-left">
                                <div className="font-semibold text-slate-900">Shopping List</div>
                                <div className="text-xs text-slate-500">Calculate ingredients to buy based on stock</div>
                             </div>
                          </Button>

                          <Button 
                            variant="outline" 
                            className="justify-start h-auto py-4 px-4 gap-4"
                            onClick={handleKitchenSheet}
                            disabled={isGenerating}
                          >
                             <div className="bg-orange-100 p-2 rounded-full">
                                <ChefHat className="w-5 h-5 text-orange-600" />
                             </div>
                             <div className="text-left">
                                <div className="font-semibold text-slate-900">Kitchen Sheet</div>
                                <div className="text-xs text-slate-500">Quantities for preparation (no prices)</div>
                             </div>
                          </Button>
                       </div>
                    </DialogContent>
                 </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <span className="hover:text-slate-900 cursor-pointer" onClick={handleBackToList}>{t("breadcrumb.events")}</span>
          <ChevronRight className="w-4 h-4" />
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
                <div className="flex items-center gap-2">
                  <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                  {formData.name}
                  </h1>
                </div>
            )}
            
            {/* Interactive Status Indicators */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
              {['DRAFT', 'SENT', 'CONFIRMED'].map(st => (
                <button 
                  key={st}
                  onClick={() => handleStatusClick(st)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm transition-all ${
                     formData.status === st 
                     ? 'bg-white dark:bg-slate-900 text-emerald-600' 
                     : 'text-slate-400 hover:text-slate-600'
                  } ${formData.status === st ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {st === 'CONFIRMED' && formData.status === 'SENT' ? '✓ ' : ''}
                  {t("status." + st.toLowerCase())}
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
          <div className="space-y-6 min-w-0 overflow-hidden">
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

            {/* Rentability Alert (Margin Squeeze) */}
            {isSqueezed && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 animate-in slide-in-from-top duration-500">
                <div className="flex gap-3">
                  <div className="bg-amber-100 p-2 rounded-full h-fit">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-amber-900 text-sm">Atención: Margen Reducido</h4>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      El aumento en los costos de insumos ha reducido el margen de este presupuesto. 
                      El precio para el cliente es de <span className="font-bold">${fmtPrice(grandTotal)}</span>, 
                      pero si se cotizara hoy sería de <span className="font-bold">${fmtPrice(marketGrandTotal)}</span>.
                    </p>
                    <div className="flex gap-4 mt-2">
                      <div className="text-[10px] uppercase font-bold text-amber-500">
                        Margen Actual: <span className="text-red-600">{(currentMargin * 100).toFixed(1)}%</span>
                      </div>
                      <div className="text-[10px] uppercase font-bold text-amber-500">
                        Perdiendo: <span className="text-red-600">${fmtPrice(lostRevenue)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                  <div key={idx} className="bg-white flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group w-full overflow-hidden">
                    {/* Left Section: Icon + Text */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Icon */}
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden flex-shrink-0 bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <Utensils className="w-5 h-5" />
                      </div>

                      {/* Name & Description */}
                      <div className="flex-1 min-w-0">
                        <h4 
                          className="font-bold text-sm sm:text-base text-slate-900 leading-snug truncate group-hover:text-emerald-600 transition-colors"
                          title={item.details?.name}
                        >
                          {item.details?.name}
                        </h4>
                        {item.details?.description && (
                          <p 
                            className="hidden sm:block text-[10px] sm:text-[11px] text-slate-500 truncate font-medium italic opacity-60"
                            title={item.details.description}
                          >
                            {item.details.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Section: Price + Counter + Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto pt-2 sm:pt-0">
                      {/* Price Block */}
                      <div className="flex flex-col items-end justify-center min-w-[75px] sm:min-w-[95px]">
                        <div className="flex items-center gap-1 mb-0.5">
                          {formData.status !== 'DRAFT' && (
                            <Lock className="w-3 h-3 text-slate-400" />
                          )}
                          <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                            ${fmtPrice((formData.status !== 'DRAFT' && item.priceSnapshot !== undefined && item.priceSnapshot !== null) ? item.priceSnapshot : (item.details?.price || 0))}
                          </span>
                        </div>
                        
                        {formData.status !== 'DRAFT' && item.priceSnapshot !== undefined && item.priceSnapshot !== null && Math.abs(item.priceSnapshot - (item.details?.price || 0)) > 0.01 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-bold uppercase tracking-tight">
                            <TrendingUp className="w-2.5 h-2.5" />
                            <span>Market: ${fmtPrice(item.details?.price || 0)}</span>
                          </div>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 rounded-xl p-0.5 sm:p-1">
                        <button 
                          onClick={() => updateRecipeQuantity(item.recipeId, -1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:bg-white hover:text-red-500 hover:shadow-sm transition-all text-slate-400"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 sm:w-8 text-center font-bold text-slate-900 text-sm sm:text-base">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateRecipeQuantity(item.recipeId, 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:bg-white hover:text-emerald-600 hover:shadow-sm transition-all text-slate-400"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Remove Action */}
                      <button 
                        onClick={() => handleRemoveRecipe(item.recipeId)}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 h-5" />
                      </button>
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
          <div>
            <div className="pb-6">
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
                     {formData.selectedRecipes.map((item, i) => {
                        const price = (formData.status !== 'DRAFT' && item.priceSnapshot !== undefined && item.priceSnapshot !== null)
                          ? item.priceSnapshot
                          : (item.details?.price || 0);

                        return (
                          <div key={i} className="flex justify-between text-sm px-1">
                             <div className="max-w-[140px]">
                                <div className="font-bold text-slate-900 truncate">{item.details?.name}</div>
                                <div className="text-xs text-slate-500 truncate">{item.details?.category || 'Item'}</div>
                             </div>
                             <div className="flex gap-4">
                                <span className="w-8 text-center text-slate-600">{item.quantity}</span>
                                <span className="w-12 text-right text-slate-600">
                                  ${fmtPrice(price)}
                                </span>
                                <span className="w-16 text-right font-bold text-slate-900">
                                  ${fmtPrice(item.quantity * price)}
                                </span>
                             </div>
                          </div>
                        );
                     })}
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
                        ${fmtPrice(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-xs font-medium">{t("financials.service_fee")} (18%)</span>
                      <span className="font-bold text-slate-900">
                        ${fmtPrice(serviceFee)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-xs font-medium">{t("financials.tax")} (8.5%)</span>
                      <span className="font-bold text-slate-900">
                        ${fmtPrice(tax)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                    <span className="text-sm font-bold text-slate-900">{t("financials.total")}</span>
                    <span className="text-2xl font-extrabold text-[#10b981]">
                      ${fmtPrice(grandTotal)}
                    </span>
                  </div>

                  {/* Main Action Button */}
                  <Button 
                    disabled={isLoading} 
                    onClick={() => handleSave('SENT')} 
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

            </div>
          </div>
        </div>
      </div>
      {/* Shopping List Modal */}
      <Dialog open={showShoppingList} onOpenChange={setShowShoppingList}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Shopping List
            </DialogTitle>
          </DialogHeader>
          
          {shoppingListData && (
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg">
                  <div>
                    <h3 className="font-bold text-lg">{shoppingListData.eventName}</h3>
                    <div className="text-sm text-slate-500">{new Date(shoppingListData.eventDate).toLocaleDateString()} • {shoppingListData.guestCount} Guests</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase font-bold">Total Est. Cost</div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: shoppingListData.currency || 'USD' }).format(shoppingListData.totalEstimatedCost)}
                    </div>
                  </div>
               </div>

               <div className="border rounded-lg overflow-hidden">
                 <table className="w-full text-sm">
                   <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                     <tr>
                       <th className="text-left p-3">Ingredient</th>
                       <th className="text-right p-3">Needed</th>
                       <th className="text-right p-3">In Stock</th>
                       <th className="text-right p-3 bg-blue-50 text-blue-700">To Buy</th>
                       <th className="text-right p-3">Est. Cost</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y">
                     {shoppingListData.items.map((item: any, i: number) => (
                       <tr key={i} className="hover:bg-slate-50">
                         <td className="p-3 font-medium text-slate-900">{item.name}</td>
                         <td className="p-3 text-right">{item.totalNeeded} {item.unit}</td>
                         <td className="p-3 text-right text-slate-500">{item.currentStock} {item.unit}</td>
                         <td className={`p-3 text-right font-bold ${item.toBuy > 0 ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
                           {item.toBuy > 0 ? item.toBuy : '✓ Stock'} {item.toBuy > 0 && item.unit}
                         </td>
                         <td className="p-3 text-right text-slate-600">
                           {item.estimatedCost > 0 
                             ? new Intl.NumberFormat('en-US', { style: 'currency', currency: shoppingListData.currency || 'USD' }).format(item.estimatedCost)
                             : '-'
                           }
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               
               <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => window.print()}>
                     <Printer className="w-4 h-4 mr-2" />
                     Print
                  </Button>
                  <Button onClick={() => setShowShoppingList(false)}>Close</Button>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Kitchen Sheet Modal */}
      <Dialog open={showKitchenSheet} onOpenChange={setShowKitchenSheet}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-600" />
              Kitchen Prep Sheet
            </DialogTitle>
          </DialogHeader>
          
          {kitchenSheetData && (
            <div className="space-y-6">
               <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <h3 className="font-bold text-xl text-orange-900">{kitchenSheetData.eventName}</h3>
                  <div className="text-sm text-orange-700 mt-1">
                    Date: {new Date(kitchenSheetData.eventDate).toLocaleDateString()}
                    <span className="mx-2">•</span>
                    Prep for: <span className="font-bold">{kitchenSheetData.guestCount} Guests</span>
                  </div>
               </div>

               <div className="border rounded-lg overflow-hidden">
                 <table className="w-full text-sm">
                   <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                     <tr>
                       <th className="text-left p-3">Ingredient</th>
                       <th className="text-right p-3">Total Quantity</th>
                       <th className="text-left p-3 w-20">Unit</th>
                       <th className="text-center p-3 w-20">Check</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y">
                     {kitchenSheetData.items.map((item: any, i: number) => (
                       <tr key={i} className="hover:bg-slate-50">
                         <td className="p-3 font-medium text-slate-900 text-base">{item.name}</td>
                         <td className="p-3 text-right font-bold font-mono text-lg">{item.totalNeeded}</td>
                         <td className="p-3 text-slate-500">{item.unit}</td>
                         <td className="p-3 text-center">
                           <div className="w-6 h-6 border-2 border-slate-300 rounded mx-auto"></div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>

               <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => window.print()}>
                     <Printer className="w-4 h-4 mr-2" />
                     Print
                  </Button>
                  <Button onClick={() => setShowKitchenSheet(false)}>Close</Button>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

