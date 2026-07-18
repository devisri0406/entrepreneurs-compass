import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(3).max(200),
  category: z.enum(["general", "support", "feedback", "partnership", "press"]),
  message: z.string().trim().min(10).max(5000),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ContactSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const url = process.env.SUPABASE_URL!;
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { error } = await supabase.from("contact_messages").insert(data);
    if (error) throw new Error("Could not submit message. Please try again.");
    return { ok: true };
  });
