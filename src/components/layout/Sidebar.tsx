"use client";

import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Package,
  ChefHat,
  CalendarDays,
  Users,
  BarChart3,
  Settings,
  Utensils,
  Languages,
} from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { signOut } from "@/app/[locale]/(auth)/actions";
import { LogOut } from "lucide-react";

const routes = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "inventory", href: "/inventory", icon: Package },
  { key: "recipes", href: "/recipes", icon: ChefHat },
  { key: "events", href: "/events", icon: CalendarDays },
  { key: "clients", href: "/clients", icon: Users },
  { key: "financials", href: "/financials", icon: BarChart3 },
];

export function Sidebar() {
  const t = useTranslations("Sidebar");
  const common = useTranslations("Common");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const toggleLanguage = () => {
    const nextLocale = locale === "en" ? "es" : "en";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <aside className="w-64 flex flex-col h-screen fixed left-0 top-0 bg-[#1e293b] border-r border-[#334155] z-50">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#10b981] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#10b981] tracking-tight leading-none mb-1">
              CaterFlow
            </h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 flex flex-col gap-1 px-3 mt-4">
        {routes.map((route) => {
          const isActive = pathname === route.href || pathname?.startsWith(`${route.href}/`);
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium group",
                isActive
                  ? "bg-[#10b981]/10 text-[#10b981]"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
            >
              <route.icon className={cn("w-5 h-5", isActive ? "text-[#10b981]" : "text-slate-500 group-hover:text-white")} />
              {t(route.key)}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#334155] space-y-2">
        <button 
          onClick={toggleLanguage}
          className="flex items-center justify-between px-4 py-3 w-full rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all text-sm font-medium group"
        >
          <div className="flex items-center gap-3">
            <Languages className="w-5 h-5 text-slate-500 group-hover:text-white" />
            <span>{common("language")}</span>
          </div>
          <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 uppercase">
            {locale}
          </span>
        </button>
        <Link href="/settings">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all text-sm font-medium group">
            <Settings className="w-5 h-5 text-slate-500 group-hover:text-white" />
            {t("settings")}
          </button>
        </Link>
        <button 
          onClick={() => signOut(locale)}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm font-medium group"
        >
          <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-400" />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}
