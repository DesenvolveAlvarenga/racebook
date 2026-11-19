import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 " +
  "disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98] select-none";

const variants: Record<Variant, string> = {
  primary: "bg-accent-500 text-white shadow-sm shadow-accent-500/25 hover:bg-accent-600",
  secondary: "bg-navy-900 text-white hover:bg-navy-800",
  outline: "border border-navy-200 bg-white text-navy-900 hover:border-navy-300 hover:bg-navy-50",
  ghost: "text-navy-700 hover:bg-navy-50 hover:text-navy-950",
  light: "bg-white text-navy-950 hover:bg-navy-50",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-13 px-7 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
