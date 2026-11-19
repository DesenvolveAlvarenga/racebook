"use client";

import { Camera, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  commitProfileImageAction,
  prepareProfileImageAction,
  removeProfileImageAction,
} from "@/lib/actions/profile";
import { PROFILE_IMAGE_SIZES, type ProfileImageKind } from "@/lib/constants/profile";
import { resizeImage } from "@/lib/image-resize";
import { createClient } from "@/lib/supabase/client";
import { AthleteAvatar } from "@/components/profile/athlete-avatar";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  kind: ProfileImageKind;
  initialUrl: string | null;
  /** Nome do atleta (iniciais quando não há foto). */
  name: string;
};

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;

const COPY: Record<ProfileImageKind, { title: string; help: string }> = {
  avatar: { title: "Foto de perfil", help: "Quadrada, recortada no centro. JPG, PNG ou WEBP." },
  cover: { title: "Imagem de capa", help: "Horizontal (ideal 3:1). JPG, PNG ou WEBP." },
};

/**
 * Envio de foto de perfil ou capa:
 * comprime no navegador → pede ao servidor um link de upload → envia direto
 * ao Supabase Storage → servidor confere o arquivo e grava no perfil.
 */
export function ImageUploader({ kind, initialUrl, name }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [status, setStatus] = useState<"idle" | "uploading" | "removing">("idle");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const busy = status !== "idle";
  const copy = COPY[kind];

  async function handleFile(file: File) {
    setError(null);
    setSuccess(null);
    setConfirmRemove(false);

    if (!ACCEPT.split(",").includes(file.type)) {
      setError("Formato não suportado. Use uma imagem JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > MAX_ORIGINAL_BYTES) {
      setError("Arquivo muito grande. Escolha uma imagem de até 25 MB.");
      return;
    }

    setStatus("uploading");
    try {
      const blob = await resizeImage(file, PROFILE_IMAGE_SIZES[kind]);

      const prepared = await prepareProfileImageAction({ kind, contentType: blob.type, size: blob.size });
      if (!prepared.ok || !prepared.path || !prepared.token) {
        throw new Error(prepared.ok ? "Não foi possível iniciar o envio." : prepared.error);
      }

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("media")
        .uploadToSignedUrl(prepared.path, prepared.token, blob, { contentType: blob.type, cacheControl: "3600" });
      if (uploadError) throw new Error("Falha no envio da imagem. Verifique sua conexão e tente novamente.");

      const committed = await commitProfileImageAction({ kind, path: prepared.path });
      if (!committed.ok) throw new Error(committed.error);

      setUrl(committed.url ?? null);
      setSuccess(kind === "avatar" ? "Foto de perfil atualizada." : "Capa atualizada.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a imagem.");
    } finally {
      setStatus("idle");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!confirmRemove) {
      setConfirmRemove(true);
      return;
    }
    setError(null);
    setSuccess(null);
    setStatus("removing");
    const result = await removeProfileImageAction({ kind });
    setStatus("idle");
    setConfirmRemove(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setUrl(null);
    setSuccess(kind === "avatar" ? "Foto de perfil removida." : "Capa removida.");
    router.refresh();
  }

  const overlay = busy ? (
    <span className="absolute inset-0 flex items-center justify-center bg-navy-950/55 text-white">
      <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
      <span className="sr-only">{status === "uploading" ? "Enviando…" : "Removendo…"}</span>
    </span>
  ) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-navy-900">{copy.title}</h3>
        <p className="text-xs text-navy-400">{copy.help}</p>
      </div>

      {kind === "cover" ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn(
            "group relative block aspect-[3/1] w-full overflow-hidden rounded-2xl border border-dashed border-navy-200 bg-navy-950",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500",
          )}
          aria-label={url ? "Trocar imagem de capa" : "Enviar imagem de capa"}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <span className="bg-speed-stripes absolute inset-0 flex flex-col items-center justify-center gap-2 text-navy-200">
              <ImagePlus className="size-7" aria-hidden="true" />
              <span className="text-sm font-semibold">Adicionar capa</span>
            </span>
          )}
          {url && !busy ? (
            <span className="absolute inset-0 flex items-center justify-center bg-navy-950/0 text-sm font-semibold text-white opacity-0 transition group-hover:bg-navy-950/45 group-hover:opacity-100">
              <Camera className="mr-2 size-4" aria-hidden="true" /> Trocar capa
            </span>
          ) : null}
          {overlay}
        </button>
      ) : (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="group relative rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
            aria-label={url ? "Trocar foto de perfil" : "Enviar foto de perfil"}
          >
            <AthleteAvatar name={name} src={url} size="lg" />
            <span className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full border-2 border-white bg-accent-500 text-white">
              <Camera className="size-4" aria-hidden="true" />
            </span>
            {busy ? <span className="absolute inset-0 overflow-hidden rounded-full">{overlay}</span> : null}
          </button>
          <p className="text-sm text-navy-500">
            Use uma foto nítida do rosto ou em ação. Ela aparece no seu perfil e nas suas publicações.
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          {status === "uploading" ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="size-4" aria-hidden="true" />
          )}
          {status === "uploading" ? "Enviando…" : url ? "Trocar" : "Enviar imagem"}
        </Button>
        {url ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            onBlur={() => setConfirmRemove(false)}
            disabled={busy}
            className={confirmRemove ? "text-red-700 hover:bg-red-50 hover:text-red-800" : undefined}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {status === "removing" ? "Removendo…" : confirmRemove ? "Confirmar remoção" : "Remover"}
          </Button>
        ) : null}
      </div>

      <div aria-live="polite">
        {error ? <Alert tone="error">{error}</Alert> : null}
        {success ? <Alert tone="success">{success}</Alert> : null}
      </div>
    </div>
  );
}
