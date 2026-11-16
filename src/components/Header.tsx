import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export function Header({ name }: { name: string }) {
  return (
    <header className="border-b border-ink">
      <div className="mx-auto flex w-full max-w-[720px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/home" className="font-display text-md font-bold tracking-[-0.04em] text-ink">
          Nyatet
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted">{name}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
