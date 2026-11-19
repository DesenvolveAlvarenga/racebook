import { Logo } from "@/components/brand/logo";
import { ProfileUnavailable } from "@/components/profile/profile-unavailable";

export default function AthleteNotFound() {
  return (
    <div className="min-h-dvh bg-navy-50/40">
      <header className="border-b border-navy-100 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4 sm:px-6">
          <Logo />
        </div>
      </header>
      <ProfileUnavailable />
    </div>
  );
}
