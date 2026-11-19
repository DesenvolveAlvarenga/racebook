import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileViewButtons } from "@/components/profile/profile-view-buttons";
import { ImageUploader } from "@/components/profile/image-uploader";
import { requireUser } from "@/lib/auth";
import { getSiteUrl } from "@/lib/env";
import { getOwnProfileWithImages } from "@/lib/profile";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Editar perfil" };

export default async function EditProfilePage() {
  const user = await requireUser("/painel/perfil");
  const data = await getOwnProfileWithImages(user.id);
  if (!data) notFound();
  const { profile, avatarUrl, coverUrl } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-accent-600">Perfil esportivo</p>
          <h1 className="mt-1 font-display text-4xl font-extrabold uppercase italic leading-none text-navy-950 sm:text-5xl">
            Editar perfil
          </h1>
        </div>
        <ProfileViewButtons slug={profile.slug} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="order-2 lg:order-1">
          <ProfileForm
            currentSlug={profile.slug}
            host={getSiteUrl().replace(/^https?:\/\//, "")}
            initial={{
              displayName: profile.display_name,
              bio: profile.bio ?? "",
              city: profile.city ?? "",
              state: profile.state ?? "",
              sports: profile.sports,
              slug: profile.slug,
              isPublic: profile.is_public,
            }}
          />
        </div>

        <aside className="order-1 space-y-6 rounded-2xl border border-navy-100 bg-white p-5 sm:p-6 lg:sticky lg:top-24 lg:order-2">
          <h2 className="font-display text-2xl font-extrabold uppercase italic leading-none text-navy-950">Fotos</h2>
          <ImageUploader kind="avatar" initialUrl={avatarUrl} name={profile.display_name} />
          <ImageUploader kind="cover" initialUrl={coverUrl} name={profile.display_name} />
          <p className="text-xs text-navy-400">
            As imagens são salvas na hora, sem precisar clicar em “Salvar perfil”. Com o perfil privado, ninguém além de
            você consegue abri-las.
          </p>
        </aside>
      </div>
    </div>
  );
}
