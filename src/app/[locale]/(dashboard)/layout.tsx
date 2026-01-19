import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">
      <Sidebar />
      <main className="pl-64 min-h-screen transition-all duration-300 print:pl-0">
        <div className="p-8 max-w-7xl mx-auto print:p-0 print:max-w-none">
          {children}
        </div>
      </main>
    </div>
  );
}
