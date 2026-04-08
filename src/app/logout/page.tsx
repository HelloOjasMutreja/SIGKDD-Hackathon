import { redirect } from "next/navigation";
import { clearSessions } from "@/lib/auth";

export default async function LogoutPage() {
  await clearSessions();
  redirect("/");
}
