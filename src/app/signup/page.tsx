import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (await getSession()) redirect("/home");
  return <AuthForm mode="signup" />;
}
