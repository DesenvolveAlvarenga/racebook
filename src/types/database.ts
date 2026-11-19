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

/** Linha da view public.profile_stats (respeita a RLS de quem consulta). */
export type ProfileStats = {
  athlete_id: string;
  competitions_count: number;
  podiums_count: number;
  wins_count: number;
  sports_count: number;
};

/** Campos do perfil que podem aparecer na página pública (nunca inclui birth_date). */
export const PUBLIC_PROFILE_COLUMNS =
  "id, slug, display_name, avatar_path, cover_path, city, state, bio, sports, is_public, created_at" as const;

export type PublicProfile = Pick<
  Profile,
  | "id"
  | "slug"
  | "display_name"
  | "avatar_path"
  | "cover_path"
  | "city"
  | "state"
  | "bio"
  | "sports"
  | "is_public"
  | "created_at"
>;

/** Campos usados pela edição do perfil. */
export const EDITABLE_PROFILE_COLUMNS =
  "id, slug, display_name, avatar_path, cover_path, city, state, bio, sports, is_public, onboarding_done" as const;

export type EditableProfile = Pick<
  Profile,
  | "id"
  | "slug"
  | "display_name"
  | "avatar_path"
  | "cover_path"
  | "city"
  | "state"
  | "bio"
  | "sports"
  | "is_public"
  | "onboarding_done"
>;
