"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { BuildingIcon, GlobeIcon, PercentIcon, SaveIcon, WalletIcon, UploadIcon, ImageIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { updateOrgSettings } from "./actions";
import { createClient } from "@/utils/supabase/client";

interface SettingsClientProps {
  initialSettings: any;
  orgId: string;
}

const currencies = [
  { label: 'United States - USD', value: 'USD' },
  { label: 'Nicaragua - NIO', value: 'NIO' },
  { label: 'México - MXN', value: 'MXN' },
  { label: 'European Union - EUR', value: 'EUR' },
  { label: 'Colombia - COP', value: 'COP' },
  { label: 'Costa Rica - CRC', value: 'CRC' },
  { label: 'Guatemala - GTQ', value: 'GTQ' },
  { label: 'Honduras - HNL', value: 'HNL' },
  { label: 'Panamá - PAB', value: 'PAB' },
  { label: 'Perú - PEN', value: 'PEN' },
  { label: 'Chile - CLP', value: 'CLP' },
  { label: 'Argentina - ARS', value: 'ARS' },
  { label: 'Brasil - BRL', value: 'BRL' },
];

export default function SettingsClient({ initialSettings, orgId }: SettingsClientProps) {
  const t = useTranslations("Settings");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = params.locale as string;
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: initialSettings.name || "",
    currency: initialSettings.currency || "USD",
    language: initialSettings.language || currentLocale,
    taxRate: initialSettings.taxRate || 0,
    serviceFeeRate: initialSettings.serviceFeeRate || 0,
    logoUrl: initialSettings.logoUrl || "",
    slogan: initialSettings.slogan || "",
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orgId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logoUrl: publicUrl }));
    } catch (error: any) {
      alert("Error uploading logo: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await updateOrgSettings(orgId, {
        name: formData.name,
        currency: formData.currency,
        language: formData.language,
        taxRate: Number(formData.taxRate),
        serviceFeeRate: Number(formData.serviceFeeRate),
        logoUrl: formData.logoUrl,
        slogan: formData.slogan,
      });

      if (res.error) {
        alert("Error: " + res.error);
      } else {
        if (formData.language !== currentLocale) {
          router.replace(pathname, { locale: formData.language as any });
        } else {
          alert(t("success_message"));
          router.refresh();
        }
      }
    } catch (err) {
      alert("Unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 mb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t("title")}</h1>
        <p className="text-slate-500 mt-1">{t("description")}</p>
      </div>

      <div className="grid gap-8">
        {/* Section 1: Business Profile */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BuildingIcon className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-lg">{t("sections.profile.title")}</CardTitle>
            </div>
            <CardDescription>{t("sections.profile.logo_hint")}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">{t("sections.profile.org_name")}</Label>
                  <Input 
                    id="orgName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Gourmet Catering S.A."
                    className="border-slate-200 focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slogan">{t("sections.profile.slogan")}</Label>
                  <Input 
                    id="slogan"
                    value={formData.slogan}
                    onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                    placeholder="e.g. Powering Culinary Excellence"
                    className="border-slate-200 focus:border-emerald-500 transition-colors"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>{t("sections.profile.logo")}</Label>
                  <div className="flex items-center gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="gap-2 bg-white"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadIcon className="w-4 h-4" />}
                      Upload Image
                    </Button>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden" 
                    />
                    <p className="text-[10px] text-slate-400 max-w-[150px]">
                      JPG, PNG or SVG. Max 2MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl p-6 bg-slate-50/30">
                {formData.logoUrl ? (
                  <div className="relative group">
                    <img 
                      src={formData.logoUrl} 
                      alt="Logo Preview" 
                      className="max-h-32 w-auto object-contain rounded-lg shadow-sm"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                       <Button variant="ghost" size="sm" className="text-white hover:text-white" onClick={() => setFormData(prev => ({ ...prev, logoUrl: "" }))}>
                         Remove
                       </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2 text-slate-300">
                    <ImageIcon className="w-12 h-12 mx-auto opacity-20" />
                    <p className="text-xs font-medium">Logo Preview</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Localization */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <GlobeIcon className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-lg">{t("sections.localization.title")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("sections.localization.language")}</Label>
                <Select 
                  value={formData.language} 
                  onValueChange={(val) => setFormData({ ...formData, language: val })}
                >
                  <SelectTrigger className="border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("sections.localization.languages.en")}</SelectItem>
                    <SelectItem value="es">{t("sections.localization.languages.es")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("sections.localization.currency")}</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(val) => setFormData({ ...formData, currency: val })}
                >
                  <SelectTrigger className="border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Default Quotation Settings */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <WalletIcon className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-lg">{t("sections.defaults.title")}</CardTitle>
            </div>
            <CardDescription>{t("sections.defaults.hint")}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taxRate">{t("sections.defaults.tax")}</Label>
                <div className="relative">
                  <Input 
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    className="pl-9 border-slate-200 focus:border-emerald-500 transition-colors bg-white font-mono"
                  />
                  <PercentIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceFeeRate">{t("sections.defaults.service_fee")}</Label>
                <div className="relative">
                  <Input 
                    id="serviceFeeRate"
                    type="number"
                    step="0.01"
                    value={formData.serviceFeeRate}
                    onChange={(e) => setFormData({ ...formData, serviceFeeRate: parseFloat(e.target.value) || 0 })}
                    className="pl-9 border-slate-200 focus:border-emerald-500 transition-colors bg-white font-mono"
                  />
                  <PercentIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/30 border-t border-slate-100 p-6 flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isLoading || isUploading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px] shadow-sm font-bold h-11"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <SaveIcon className="w-4 h-4" />
                  {t("save_button")}
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
