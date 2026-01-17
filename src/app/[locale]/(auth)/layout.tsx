import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-[450px]">
        {children}
      </div>
      <footer className="mt-8 text-center text-xs text-slate-500">
        <p>© 2024 CaterFlow Inc. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
