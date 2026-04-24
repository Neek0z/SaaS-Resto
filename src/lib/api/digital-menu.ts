import { supabase } from "@/lib/supabase";
import { DIGITAL_MENU, type DigitalMenuConfig } from "@/lib/mock-data";

// Supabase schema (expected):
// create table digital_menu_config (
//   id uuid primary key default gen_random_uuid(),
//   url text not null,
//   published boolean not null default false,
//   scans_today int not null default 0,
//   scans_week int not null default 0,
//   scans_delta numeric not null default 0,
//   avg_time text,
//   conversion numeric not null default 0,
//   languages text[] not null default '{}',
//   theme text not null default 'dark',
//   categories jsonb not null default '[]'
// );

export async function getDigitalMenu(): Promise<DigitalMenuConfig> {
  if (!supabase) return DIGITAL_MENU;
  const { data, error } = await supabase.from("digital_menu_config").select("*").single();
  if (error || !data) return DIGITAL_MENU;
  return {
    url: data.url as string,
    published: data.published as boolean,
    scansToday: data.scans_today as number,
    scansWeek: data.scans_week as number,
    scansDelta: data.scans_delta as number,
    avgTime: data.avg_time as string,
    conversion: data.conversion as number,
    languages: data.languages as string[],
    theme: data.theme as "dark" | "light",
    categories: data.categories as DigitalMenuConfig["categories"],
  };
}
