import { redirect } from "next/navigation";
import ChangePasswordForm from "../components/ChangePasswordForm";
import { getCurrentUser } from "../lib/auth";
export const dynamic="force-dynamic";
export default async function ChangePasswordPage(){const user=await getCurrentUser();if(!user)redirect("/");return <ChangePasswordForm required={user.mustChangePassword}/>}
