"use client";
import Link from "next/link";
export default function UserBar({name,role}:{name:string;role:string}){
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});window.location.assign("/")}
  return <nav className="user-bar"><span><b>{name}</b> · {role}</span><div>{role==="owner"&&<Link href="/admin">User administration</Link>}<Link href="/change-password">Change password</Link><button onClick={logout}>Sign out</button></div></nav>;
}
