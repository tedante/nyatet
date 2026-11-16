"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isSignup ? { name, email, password } : { email, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setPending(false);
      return;
    }

    router.replace("/home");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-[420px] border-[3px] border-ink bg-paper-3 p-6 sm:p-8">
        <p className="font-display text-lg font-bold uppercase tracking-[-0.005em] text-ink">
          Nyatet
        </p>

        <h1 className="mt-6 border-t-2 border-ink pt-4 text-2xl">
          {isSignup ? "Create an account" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {isSignup ? "One minute, then you are writing." : "Your notes are where you left them."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignup && (
            <label className="block">
              <span className="text-xs font-semibold text-muted">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={60}
                autoComplete="name"
                className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 text-md text-ink"
              />
            </label>
          )}

          <label className="block">
            <span className="text-xs font-semibold text-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 text-md text-ink"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-muted">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={isSignup ? 8 : 1}
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 text-md text-ink"
            />
          </label>

          {error && <p className="text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full border-2 border-ink bg-ink px-4 py-2.5 text-sm font-semibold uppercase text-paper hover:bg-paper hover:text-ink disabled:opacity-60"
          >
            {pending ? "Working..." : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          {isSignup ? "Already have an account? " : "No account yet? "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-[3px]"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </div>
    </main>
  );
}
