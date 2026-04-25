import { supabase } from "@/lib/supabase";

export type PublicLoyaltyInput = {
  name: string;
  email?: string;
  phone?: string;
  optedInEmail: boolean;
};

export type PublicLoyaltyResult = {
  id: string;
  status: "created" | "updated";
};

export async function createPublicLoyaltySignup(
  slug: string,
  input: PublicLoyaltyInput
): Promise<PublicLoyaltyResult> {
  if (!supabase) throw new Error("Supabase non configuré.");
  const { data, error } = await supabase.rpc("create_public_loyalty_signup", {
    p_slug: slug,
    p_name: input.name,
    p_email: input.email ?? "",
    p_phone: input.phone ?? "",
    p_opted_in_email: input.optedInEmail,
  });
  if (error) throw error;
  return data as PublicLoyaltyResult;
}
