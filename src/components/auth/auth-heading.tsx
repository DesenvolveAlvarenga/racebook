import type { ReactNode } from "react";

export function AuthHeading({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-4xl font-extrabold uppercase italic leading-none tracking-tight text-navy-950 sm:text-5xl">
        {title}
      </h1>
      {description ? <p className="mt-3 text-[15px] leading-relaxed text-navy-500">{description}</p> : null}
    </div>
  );
}
