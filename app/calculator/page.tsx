import { redirect } from "next/navigation";
import Calculator from "../components/Calculator";
import UserBar from "../components/UserBar";
import { getCurrentUser } from "../lib/auth";
export const dynamic="force-dynamic";
export default async function CalculatorPage(){const user=await getCurrentUser();if(!user)redirect("/");if(user.mustChangePassword)redirect("/change-password");if(!user.scopes.includes("loan:read"))redirect("/forbidden");return <><UserBar name={user.displayName} role={user.role}/><Calculator canExport={user.scopes.includes("loan:export")}/></>}
