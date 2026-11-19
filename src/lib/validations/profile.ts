import { z } from "zod";
import {
  BIO_MAX,
  CITY_MAX,
  NAME_MAX,
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_IMAGE_TYPES,
  SPORT_VALUES,
  STATE_VALUES,
} from "@/lib/constants/profile";
import { slugFormatError } from "@/lib/slug";

/** Texto opcional: string vazia vira null. */
const optionalText = (max: number, min = 1, label = "Este campo") =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, " "))
    .pipe(
      z.union([
        z.literal("").transform(() => null),
        z
          .string()
          .min(min, `${label} precisa ter pelo menos ${min} caracteres.`)
          .max(max, `${label} pode ter no máximo ${max} caracteres.`),
      ]),
    );

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .superRefine((value, ctx) => {
    const message = slugFormatError(value);
    if (message) ctx.addIssue({ code: "custom", message });
  });

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .min(2, "Informe seu nome (mínimo de 2 letras).")
        .max(NAME_MAX, `O nome pode ter no máximo ${NAME_MAX} caracteres.`),
    ),
  bio: z
    .string()
    .trim()
    // Mantém quebras de linha, mas no máximo uma linha em branco seguida.
    .transform((v) => v.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n"))
    .pipe(
      z.union([
        z.literal("").transform(() => null),
        z.string().max(BIO_MAX, `A biografia pode ter no máximo ${BIO_MAX} caracteres.`),
      ]),
    ),
  city: optionalText(CITY_MAX, 2, "A cidade"),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || STATE_VALUES.includes(v), "Selecione um estado válido.")
    .transform((v) => (v === "" ? null : v)),
  sports: z
    .array(z.enum(SPORT_VALUES, { error: "Modalidade inválida." }))
    .max(SPORT_VALUES.length)
    .transform((list) => Array.from(new Set(list))),
  slug: slugSchema,
  isPublic: z.boolean(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const imageKindSchema = z.enum(["avatar", "cover"]);

export const prepareImageSchema = z.object({
  kind: imageKindSchema,
  contentType: z.enum(Object.keys(PROFILE_IMAGE_TYPES) as [string, ...string[]], {
    error: "Formato não suportado. Use JPG, PNG ou WEBP.",
  }),
  size: z
    .number()
    .int()
    .positive("Arquivo vazio.")
    .max(PROFILE_IMAGE_MAX_BYTES, "A imagem precisa ter no máximo 5 MB."),
});
