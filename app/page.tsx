import { redirect } from "next/navigation";
import LoginForm from "./components/LoginForm";
import { getCurrentUser, userCount } from "./lib/auth";
export const dynamic = "force-dynamic";
export default async function Home() {
  if (await userCount() === 0) redirect("/setup");
  const user = await getCurrentUser();
  if (!user) return <LoginForm />;
  if (user.mustChangePassword) redirect("/change-password");
  redirect("/calculator");
}
