"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Phone, Mail, ChevronLeft, ChevronRight, X, Edit2, Loader2, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { upsertClient } from "./actions";

interface ClientsClientProps {
  initialClients: any[];
  orgId: string; // explicitly passed if needed for other logic, though actions handle it server side mainly
}

export default function ClientsClient({ initialClients, orgId }: ClientsClientProps) {
  const t = useTranslations("Clients");
  const [clients, setClients] = useState(initialClients);
  const [selectedClient, setSelectedClient] = useState<any>(initialClients.length > 0 ? initialClients[0] : null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    type: "private",
    address: ""
  });

  const handleEdit = (client: any) => {
    setFormData({
      id: client.id,
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      type: client.type || "private",
      address: client.address || ""
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setFormData({
      id: "",
      name: "",
      email: "",
      phone: "",
      type: "private",
      address: ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const data = new FormData();
    if (formData.id) data.append("id", formData.id);
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("type", formData.type);
    data.append("address", formData.address);

    const result = await upsertClient(data, orgId);

    if (result?.error) {
      alert("Error: " + result.error);
    } else {
      setIsDialogOpen(false);
      window.location.reload(); 
    }
    setIsLoading(false);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate total spent based on events
  const calculateSpent = (events: any[]) => {
    if (!events) return 0;
    return events.reduce((sum, e) => sum + (e.totalPrice || 0), 0);
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              {t("add_button")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{formData.id ? "Edit Client" : "Add New Client"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Phone</Label>
                  <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Type</Label>
                  <Select value={formData.type} onValueChange={val => setFormData({...formData, type: val})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="institutional">Institutional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">Address</Label>
                  <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List - 1/3 width */}
        <div className="lg:col-span-1">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder={t("search_placeholder")} 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
                {filteredClients.map((client) => (
                  <div 
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedClient?.id === client.id 
                        ? 'bg-emerald-50 dark:bg-emerald-950 border-l-4 border-emerald-500' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>{client.name.substring(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {client.name}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {client.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{client.email}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">{t("table_header.spent")}</span>
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">
                              ${calculateSpent(client.events).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Detail - 2/3 width */}
        <div className="lg:col-span-2">
          {selectedClient ? (
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16 rounded-2xl">
                      <AvatarFallback className="text-xl bg-slate-800 text-white">
                        {selectedClient.name.substring(0,2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedClient.name}</h2>
                      <p className="text-sm text-slate-500 mt-1">{selectedClient.type} • {selectedClient.email}</p>
                      <p className="text-xs text-slate-400 mt-1">{selectedClient.address}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(selectedClient)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("details.email")}</span>
                    </div>
                    <p className="text-sm text-slate-900 dark:text-white">{selectedClient.email || "N/A"}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("details.call")}</span>
                    </div>
                    <p className="text-sm text-slate-900 dark:text-white">{selectedClient.phone || "N/A"}</p>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">{t("details.ltv")}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                       ${calculateSpent(selectedClient.events).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950">
                    <p className="text-xs font-medium text-rose-600 uppercase mb-1">{t("details.outstanding")}</p>
                    <p className="text-2xl font-bold text-rose-600">$0.00</p>
                  </div>
                </div>

                {/* Recent Events */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase">{t("details.recent_events")}</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedClient.events && selectedClient.events.length > 0 ? (
                      selectedClient.events.map((event: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-2 h-2 rounded-full ${
                                event.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}></span>
                              <h4 className="font-medium text-sm text-slate-900 dark:text-white">{event.name}</h4>
                              <span className="text-xs text-slate-400 px-2">{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-slate-500">{t("details.guests", { count: event.guests })}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">
                              ${event.totalPrice?.toLocaleString()}
                            </span>
                            <Badge variant="outline">
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No events found.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 dark:border-slate-800 flex items-center justify-center h-full">
              <CardContent className="text-center py-12">
                <p className="text-slate-400">{t("details.empty_selection")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
