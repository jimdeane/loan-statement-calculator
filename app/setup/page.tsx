import { redirect } from "next/navigation";
import SetupForm from "../components/SetupForm";
import { userCount } from "../lib/auth";
export const dynamic="force-dynamic";
export default async function SetupPage(){if(await userCount()>0)redirect("/");return <SetupForm/>}
