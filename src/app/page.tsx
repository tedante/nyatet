import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSession();
  redirect(user ? "/home" : "/login");
}
