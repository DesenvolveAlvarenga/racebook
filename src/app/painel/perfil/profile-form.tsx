"use client";

import { Globe, Lock } from "lucide-react";
import { useActionState, useRef } from "react";
import { updateProfileAction, type ProfileFormState, type ProfileFormValues } from "@/lib/actions/profile";
import { SlugField } from "@/components/profile/slug-field";
import { SportPicker } from "@/components/profile/sport-picker";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BIO_MAX, BRAZIL_STATES, CITY_MAX, NAME_MAX } from "@/lib/constants/profile";

type Props = {
  initial: ProfileFormValues;
  currentSlug: string;
  host: string;
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-navy-100 bg-white p-5 sm:p-6">
      <h2 className="font-display text-2xl font-extrabold uppercase italic leading-none text-navy-950">{title}</h2>
      {description ? <p className="mt-1.5 text-sm text-navy-500">{description}</p> : null}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function ProfileForm({ initial, currentSlug, host }: Props) {
  const [state, formAction] = useActionState<ProfileFormState, FormData>(updateProfileAction, {});
  const nameRef = useRef<HTMLInputElement>(null);

  const values = state.values ?? initial;
  const errors = state.fieldErrors ?? {};
  // Recria os campos não controlados após cada envio para refletir os valores salvos.
  const formKey = state.savedAt ?? 0;
  const savedSlug = state.savedAt ? values.slug : currentSlug;

  return (
    <form action={formAction} className="space-y-6" noValidate key={formKey}>
      <div aria-live="polite">
        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      </div>

      <Section title="Informações" description="Como você se apresenta para quem visita seu perfil.">
        <Input
          ref={nameRef}
          label="Nome completo ou nome esportivo"
          name="displayName"
          autoComplete="name"
          defaultValue={values.displayName}
          error={errors.displayName}
          maxLength={NAME_MAX}
          required
        />
        <Textarea
          label="Biografia"
          name="bio"
          rows={5}
          placeholder="Conte sua história no esporte: quando começou, principais provas, objetivos…"
          defaultValue={values.bio}
          error={errors.bio}
          maxLength={BIO_MAX}
        />
        <div className="grid gap-5 sm:grid-cols-[1fr_14rem]">
          <Input
            label="Cidade"
            name="city"
            autoComplete="address-level2"
            placeholder="Ex.: Florianópolis"
            defaultValue={values.city}
            error={errors.city}
            maxLength={CITY_MAX}
          />
          <Select
            label="Estado"
            name="state"
            autoComplete="address-level1"
            placeholder="Selecione"
            options={BRAZIL_STATES.map((s) => ({ value: s.value, label: `${s.value} — ${s.label}` }))}
            defaultValue={values.state}
            error={errors.state}
          />
        </div>
      </Section>

      <Section title="Modalidades">
        <SportPicker defaultValue={values.sports} error={errors.sports} />
      </Section>

      <Section title="Endereço e privacidade">
        <SlugField
          currentSlug={savedSlug}
          defaultValue={values.slug}
          host={host}
          error={errors.slug}
          getSuggestionSource={() => nameRef.current?.value ?? ""}
        />
        <Switch
          name="isPublic"
          defaultChecked={values.isPublic}
          label={
            <span className="inline-flex items-center gap-2">
              <Globe className="size-4 text-accent-500" aria-hidden="true" /> Perfil público
            </span>
          }
          description={
            <>
              Ligado: qualquer pessoa com o link vê seu perfil.{" "}
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                <Lock className="size-3.5" aria-hidden="true" /> Desligado:
              </span>{" "}
              somente você, logado, consegue ver.
            </>
          }
        />
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-navy-100 bg-white/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <SubmitButton size="lg" className="w-full sm:w-auto" pendingLabel="Salvando…">
          Salvar perfil
        </SubmitButton>
      </div>
    </form>
  );
}
