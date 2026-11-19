// Valores de domínio do perfil. Devem espelhar o banco (public.valid_sports()).

export const SPORTS = [
  { value: "corrida", label: "Corrida de rua" },
  { value: "maratona", label: "Maratona" },
  { value: "trail_running", label: "Trail running" },
  { value: "triathlon", label: "Triathlon" },
  { value: "duathlon", label: "Duathlon" },
  { value: "natacao", label: "Natação" },
  { value: "maratona_aquatica", label: "Maratona aquática" },
  { value: "ciclismo", label: "Ciclismo" },
  { value: "mountain_bike", label: "Mountain bike" },
  { value: "outros", label: "Outros" },
] as const;

export type SportValue = (typeof SPORTS)[number]["value"];
export const SPORT_VALUES = SPORTS.map((s) => s.value) as [SportValue, ...SportValue[]];

const SPORT_LABELS = Object.fromEntries(SPORTS.map((s) => [s.value, s.label])) as Record<string, string>;
export const sportLabel = (value: string) => SPORT_LABELS[value] ?? value;

export const BRAZIL_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
] as const;

export const STATE_VALUES = BRAZIL_STATES.map((s) => s.value) as [string, ...string[]];

/** Endereços que não podem ser usados como slug (rotas e termos institucionais). */
export const RESERVED_SLUGS = new Set([
  "admin", "administrador", "api", "app", "atleta", "atletas", "auth", "cadastro", "config",
  "configuracoes", "contato", "editar", "entrar", "equipe", "explorar", "help", "ajuda", "login",
  "logout", "novo", "nova-senha", "painel", "perfil", "privacidade", "racebook", "recuperar-senha",
  "sair", "signup", "suporte", "termos", "www",
]);

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const BIO_MAX = 1000;
export const NAME_MAX = 80;
export const CITY_MAX = 80;

// -----------------------------------------------------------------------------
// Imagens do perfil
// -----------------------------------------------------------------------------
export type ProfileImageKind = "avatar" | "cover";

export const PROFILE_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ProfileImageMime = keyof typeof PROFILE_IMAGE_TYPES;

/** Tamanho máximo aceito pelo servidor (o navegador comprime antes de enviar). */
export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Dimensões finais após a compressão no navegador. */
export const PROFILE_IMAGE_SIZES: Record<ProfileImageKind, { width: number; height: number; crop: boolean }> = {
  avatar: { width: 640, height: 640, crop: true },
  cover: { width: 2000, height: 2000, crop: false },
};
