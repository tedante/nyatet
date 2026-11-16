import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export function Header({ name }: { name: string }) {
  return (
    <header className="border-b-[3px] border-ink">
      <div className="mx-auto flex w-full max-w-[720px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/home"
          className="font-display text-lg font-bold uppercase tracking-[-0.005em] text-ink"
        >
          Nyatet
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">{name}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
