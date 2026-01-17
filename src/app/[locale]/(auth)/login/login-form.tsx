"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Utensils } from "lucide-react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { login } from "../actions";

export function LoginForm() {
  const t = useTranslations("Auth.login");
  const { locale } = useParams();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await login(formData, locale as string);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-none shadow-xl bg-white">
      <CardHeader className="space-y-4 items-center pb-2">
        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <Utensils size={24} />
        </div>
        <div className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold text-slate-900">{t("title")}</CardTitle>
          <CardDescription className="text-slate-500 max-w-[300px] mx-auto">
            {t("description")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder={t("email_placeholder")}
              className="pl-3 py-6 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("password")}</Label>
            <Link
              href={`/${locale}/forgot-password`}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              {t("forgot_password")}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder={t("password_placeholder")}
              className="pr-10 py-6 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <Button 
          type="submit"
          disabled={isPending}
          className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-lg transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          {isPending ? "..." : t("submit")}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-100"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-medium">OR</span>
          </div>
        </div>

        <Button variant="outline" className="w-full py-6 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-base transition-all flex items-center justify-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t("google")}
        </Button>

        <div className="text-center pt-4">
          <p className="text-sm text-slate-500">
            {t("no_account")}{" "}
            <Link href={`/${locale}/signup`} className="text-emerald-600 font-semibold hover:underline">
              {t("contact_admin")}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
    </form>
  );
}
