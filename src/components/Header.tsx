import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export function Header({ name }: { name: string }) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/home" className="text-lg font-semibold tracking-tight">
          Nyatet
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-stone-500">{name}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
