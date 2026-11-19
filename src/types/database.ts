// Tipos das tabelas usadas pela aplicação (espelham supabase/migrations).
// Conforme o projeto crescer, podem ser gerados com: npx supabase gen types typescript

export type Profile = {
  id: string;
  slug: string;
  display_name: string;
  avatar_path: string | null;
  cover_path: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  birth_date: string | null;
  sports: string[];
  practicing_since: number | null;
  instagram_url: string | null;
  strava_url: string | null;
  website_url: string | null;
  other_links: { label: string; url: string }[];
  is_public: boolean;
  onboarding_done: boolean;
  created_at: string;
  updated_at: string;
};
