"use client";
import { useState } from "react";
export default function LoginForm() {
  const [error,setError]=useState(""),[busy,setBusy]=useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const data=new FormData(e.currentTarget);
    const response=await fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username:data.get("username"),password:data.get("password")})});
    const body=await response.json(); if(!response.ok){setError(body.error);setBusy(false);return} window.location.assign("/");
  }
  return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">PRIVATE LOAN STATEMENT</p><h1>Sign in</h1><p>Use the account issued by the loan owner.</p><form onSubmit={submit}><label>Username<input name="username" autoComplete="username" required autoFocus /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label>{error&&<p className="form-error">{error}</p>}<button disabled={busy}>{busy?"Signing in…":"Sign in"}</button></form></section></main>;
}
