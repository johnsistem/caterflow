"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  CookingPot, 
  Eye, 
  EyeOff, 
  Globe, 
  Mail, 
  User,
  Wallet,
  Utensils
} from "lucide-react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { signup } from "../actions";

export function SignUpForm() {
  const t = useTranslations("Auth.signup");
  const { locale } = useParams();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    businessName: "",
    currency: "USD",
    language: locale as string
  });

  const nextStep = () => setStep(2);
  const prevStep = () => setStep(1);

  return (
    <Card className="border-none shadow-xl bg-white overflow-hidden">
      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-100 flex">
        <div 
          className="h-full bg-emerald-500 transition-all duration-500 ease-in-out" 
          style={{ width: step === 1 ? "50%" : "100%" }}
        />
      </div>

      <CardHeader className="space-y-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Utensils size={20} />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">CaterFlow</span>
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t("step_count", { current: step, total: 2 })}
          </span>
        </div>

        <div className="space-y-1 pt-4">
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              1
            </div>
            <h3 className={`text-sm font-semibold ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
              {t("step1_title")}
            </h3>
            <div className="h-px w-8 bg-slate-200" />
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              2
            </div>
            <h3 className={`text-sm font-semibold ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
              {t("step2_title")}
            </h3>
          </div>
          
          <CardTitle className="text-3xl font-extrabold text-slate-900 pt-6 leading-tight">
            {step === 1 ? t("title") : t("business_title")}
          </CardTitle>
          <CardDescription className="text-slate-500 text-base">
            {step === 1 ? t("description") : t("business_description")}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        {step === 1 ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-700 font-semibold">{t("full_name")}</Label>
              <div className="relative">
                <Input
                  id="fullName"
                  placeholder={t("full_name_placeholder")}
                  className="py-6 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all bg-slate-50/50"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold">{t("email")}</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="py-6 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all bg-slate-50/50"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-semibold">{t("password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pr-10 py-6 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all bg-slate-50/50"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 size={14} />
                {t("password_hint")}
              </div>
            </div>

            <Button 
              onClick={nextStep}
              className="w-full py-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-lg transition-all shadow-md hover:shadow-emerald-200/50 active:scale-[0.98] mt-4"
            >
              {t("continue")}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-slate-700 font-semibold">{t("business_name")}</Label>
              <div className="relative">
                <Input
                  id="businessName"
                  placeholder={t("business_name_placeholder")}
                  className="pl-10 py-6 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all bg-slate-50/50"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                />
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">{t("currency")}</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(val) => setFormData({...formData, currency: val})}
                >
                  <SelectTrigger className="py-6 border-slate-200 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <Wallet size={16} className="text-slate-400" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="NIO">NIO - Córdova</SelectItem>
                    <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-400">{t("currency_hint")}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">{t("language")}</Label>
                <div className="flex p-1 bg-slate-100 rounded-lg h-[50px]">
                  <button
                    onClick={() => setFormData({...formData, language: "en"})}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-md text-sm font-bold transition-all ${formData.language === "en" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {formData.language === "en" && <CheckCircle2 size={14} />}
                    English
                  </button>
                  <button
                    onClick={() => setFormData({...formData, language: "es"})}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-md text-sm font-bold transition-all ${formData.language === "es" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {formData.language === "es" && <CheckCircle2 size={14} />}
                    Español
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">{t("language_hint")}</p>
              </div>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex gap-3">
              <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5">
                <span className="text-[10px] font-bold">i</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed italic">
                {t("terms", { terms: t("terms_label") })}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}
              <Button 
                disabled={isPending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const result = await signup(formData, locale as string);
                    if (result?.error) {
                      setError(result.error);
                    } else if (result?.success) {
                      router.push(`/${locale}/dashboard`);
                    }
                  });
                }}
                className="w-full py-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-lg transition-all shadow-md hover:shadow-emerald-200/50 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isPending ? "..." : t("complete")}
                <ChevronRight size={20} />
              </Button>
              
              <button 
                onClick={prevStep}
                className="w-full py-2 text-slate-500 hover:text-slate-800 text-sm font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <ChevronLeft size={16} />
                {t("back")}
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <div className="text-center pt-2">
            <p className="text-sm text-slate-500 font-medium">
              {t("already_account")}{" "}
              <Link href={`/${locale}/login`} className="text-slate-900 font-bold hover:underline">
                {t("signin")}
              </Link>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
