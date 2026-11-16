import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Timeline } from "@/components/Timeline";
import { getSession } from "@/lib/auth";
import { listNotes } from "@/lib/notes";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const notes = await listNotes(user.id);

  return (
    <>
      <Header name={user.name} />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-6 sm:px-6">
        <Timeline initialNotes={notes} />
      </main>
    </>
  );
}
