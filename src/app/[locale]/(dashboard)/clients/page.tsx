"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Phone, Mail, ChevronLeft, ChevronRight, X, Edit2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

const clients = [
  {
    id: 1,
    name: "Acme Corporation",
    type: "corporate",
    typeColor: "bg-blue-100 text-blue-700",
    avatar: "AC",
    avatarBg: "bg-blue-500",
    email: "billing@acmecorp.com",
    phone: "(555) 123-4567",
    spent: "$45,200.00",
    events: [
      { name: "Annual Holiday Gala", guests: 400, status: "Paid", amount: "$15k", statusColor: "bg-emerald-100 text-emerald-700" },
      { name: "Executive Quarterly Lunch", guests: 50, status: "Paid", amount: "$2.5k", statusColor: "bg-emerald-100 text-emerald-700" },
      { name: "Product Launch Mixer", guests: 200, status: "Due", amount: "$1.2k", statusColor: "bg-rose-100 text-rose-700" }
    ],
    notes: "Client prefers gluten-free options for at least 20% of the menu. Key contact (Sarah) is out on Fridays.",
    outstanding: "$1,200"
  },
  {
    id: 2,
    name: "Jane Doe",
    type: "private",
    typeColor: "bg-purple-100 text-purple-700",
    avatar: "JD",
    avatarBg: "bg-purple-500",
    email: "jane.doe@gmail.com",
    phone: "(555) 987-6543",
    spent: "$12,500.00"
  },
  {
    id: 3,
    name: "City Hospital",
    type: "vip",
    typeColor: "bg-amber-100 text-amber-700",
    avatar: "CH",
    avatarBg: "bg-amber-500",
    email: "events@cityhospital.org",
    phone: "(555) 234-5678",
    spent: "$150,000.00"
  },
  {
    id: 4,
    name: "Tech Startups Inc",
    type: "corporate",
    typeColor: "bg-blue-100 text-blue-700",
    avatar: "TS",
    avatarBg: "bg-blue-500",
    email: "admin@techstartup.io",
    phone: "(555) 505-0199",
    spent: "$8,500.00"
  },
  {
    id: 5,
    name: "Local University",
    type: "institutional",
    typeColor: "bg-slate-100 text-slate-700",
    avatar: "LU",
    avatarBg: "bg-slate-500",
    email: "events@uni.edu",
    phone: "(555) 345-8789",
    spent: "$75,000.00"
  }
];

export default function ClientsPage() {
  const t = useTranslations("Clients");
  const [selectedClient, setSelectedClient] = useState(clients[0]);
  const [searchQuery, setSearchQuery] = useState("");

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
        <Button className="bg-emerald-500 hover:bg-emerald-600">
          <Plus className="w-4 h-4 mr-2" />
          {t("add_button")}
        </Button>
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
              <div className="flex flex-wrap gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1 min-w-[60px] bg-emerald-50 text-emerald-700 border-emerald-200">
                  {t("filters.all")}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 min-w-[60px]">
                  {t("filters.vip")}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 min-w-[80px]">
                  {t("filters.corporate")}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 min-w-[100px]">
                  {t("filters.institutional")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {clients.map((client) => (
                  <div 
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedClient.id === client.id 
                        ? 'bg-emerald-50 dark:bg-emerald-950 border-l-4 border-emerald-500' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className={`${client.avatarBg} text-white`}>
                        <AvatarFallback className="bg-transparent">{client.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {client.name}
                          </h3>
                          <Badge variant="outline" className={`${client.typeColor} border-0 text-xs`}>
                            {t(`types.${client.type}`)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{client.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="w-3 h-3" />
                          <span>{client.phone}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">{t("table_header.spent")}</span>
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">{client.spent}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-500">{t("pagination", { start: 1, end: 5, total: 24 })}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Detail - 2/3 width */}
        <div className="lg:col-span-2">
          {selectedClient.events ? (
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 dark:bg-slate-700 flex items-center justify-center">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedClient.name}</h2>
                      <p className="text-sm text-slate-500 mt-1">{selectedClient.type} • {selectedClient.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <X className="w-4 h-4" />
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
                    <p className="text-sm text-slate-900 dark:text-white">{selectedClient.email}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("details.call")}</span>
                    </div>
                    <p className="text-sm text-slate-900 dark:text-white">{selectedClient.phone}</p>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">{t("details.ltv")}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedClient.spent}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950">
                    <p className="text-xs font-medium text-rose-600 uppercase mb-1">{t("details.outstanding")}</p>
                    <p className="text-2xl font-bold text-rose-600">{selectedClient.outstanding}</p>
                  </div>
                </div>

                {/* Recent Events */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase">{t("details.recent_events")}</h3>
                    <Button variant="link" className="text-emerald-600 hover:text-emerald-700 p-0 h-auto">
                      {t("details.view_all")}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {selectedClient.events.map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${
                              event.status === 'Paid' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}></span>
                            <h4 className="font-medium text-sm text-slate-900 dark:text-white">{event.name}</h4>
                          </div>
                          <p className="text-xs text-slate-500">{t("details.guests", { count: event.guests })}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">{event.amount}</span>
                          <Badge variant="outline" className={`${event.statusColor} border-0`}>
                            {event.status} {event.status === 'Paid' ? '$1.5k' : '$1.3k'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase mb-2">{t("details.notes")}</h3>
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedClient.notes}</p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-6">
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    {t("details.create_quote")}
                  </Button>
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
