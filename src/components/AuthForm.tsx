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
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Nyatet</h1>
        <p className="mt-1 text-sm text-stone-500">
          {isSignup ? "Create an account to start writing." : "Sign in to your notes."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {isSignup && (
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={60}
                autoComplete="name"
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium text-stone-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={isSignup ? 8 : 1}
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {pending ? "Working..." : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-stone-500">
          {isSignup ? "Already have an account? " : "No account yet? "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-medium text-teal-700 hover:underline"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </div>
    </main>
  );
}
