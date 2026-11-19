"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = { url: string; title: string; variant?: "outline" | "light" | "secondary" };

/** Compartilha o link do perfil (menu nativo no celular; copia o link no computador). */
export function ShareProfileButton({ url, title, variant = "outline" }: Props) {
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      if (typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Compartilhamento cancelado pelo usuário: nada a fazer.
    }
  }

  return (
    <Button variant={variant} size="sm" onClick={share} aria-live="polite">
      {copied ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
      {copied ? "Link copiado" : "Compartilhar"}
    </Button>
  );
}
