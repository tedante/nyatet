"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="border-2 border-ink px-3 py-1.5 text-xs font-semibold uppercase text-ink hover:bg-ink hover:text-paper"
    >
      Sign out
    </button>
  );
}
