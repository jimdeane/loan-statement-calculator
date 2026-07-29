"use client";
import { useState } from "react";
export default function ChangePasswordForm({required}:{required:boolean}) {
  const [error,setError]=useState(""),[busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");const d=new FormData(e.currentTarget);
    const r=await fetch("/api/auth/change-password",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({currentPassword:d.get("currentPassword"),newPassword:d.get("newPassword")})});
    const b=await r.json();if(!r.ok){setError(b.error);setBusy(false);return}window.location.assign("/");
  }
  return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">{required?"PASSWORD CHANGE REQUIRED":"ACCOUNT SECURITY"}</p><h1>Change password</h1><form onSubmit={submit}><label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required/></label><label>New password<input name="newPassword" type="password" autoComplete="new-password" minLength={14} required/></label>{error&&<p className="form-error">{error}</p>}<button disabled={busy}>{busy?"Changing…":"Change password and sign out"}</button></form></section></main>;
}
