"use client";
import { useState } from "react";
export default function SetupForm() {
  const [error,setError]=useState(""),[busy,setBusy]=useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(""); const d=new FormData(e.currentTarget);
    const response=await fetch("/api/auth/bootstrap",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username:d.get("username"),displayName:d.get("displayName"),password:d.get("password")})});
    const body=await response.json(); if(!response.ok){setError(body.error);setBusy(false);return} window.location.assign("/calculator");
  }
  return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">OWNER-ONLY SETUP</p><h1>Create administrator</h1><p>This one-time page creates the owner account. Store the password in your password manager.</p><form onSubmit={submit}><label>Display name<input name="displayName" autoComplete="name" required defaultValue="Jim Deane"/></label><label>Username<input name="username" autoComplete="username" required /></label><label>Password<input name="password" type="password" autoComplete="new-password" minLength={14} required /></label><small>At least 14 characters, with upper-case, lower-case and a number.</small>{error&&<p className="form-error">{error}</p>}<button disabled={busy}>{busy?"Creating…":"Create secure owner account"}</button></form></section></main>;
}
