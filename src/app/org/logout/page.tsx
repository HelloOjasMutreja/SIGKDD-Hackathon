import { redirect } from "next/navigation";
import { clearSessions } from "@/lib/auth";

export default async function OrgLogoutPage() {
  await clearSessions();
  redirect("/organizer/login");
}

