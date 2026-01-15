"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function useAuthActions() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const login = async (formData: FormData) => {
    // This will be replaced by a proper Server Action if needed, 
    // but for now let's use the layout as requested with Server Actions.
  };

  return { login, isPending };
}
