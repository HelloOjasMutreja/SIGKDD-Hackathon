import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function getCurrentUserOrRedirect() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { profile: true },
  });

  if (!user) {
    redirect("/");
  }

  return user;
}
