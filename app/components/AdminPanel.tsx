"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
type User={id:string;username:string;displayName:string;role:string;mustChangePassword:number;isActive:number;scopes:string;lastLoginAt:number|null};
export default function AdminPanel(){
 const [users,setUsers]=useState<User[]>([]),[error,setError]=useState("");
 async function load(){const r=await fetch("/api/admin/users");const b=await r.json();if(r.ok)setUsers(b.users);else setError(b.error)}
 useEffect(()=>{load()},[]);
 async function create(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setError("");const d=new FormData(e.currentTarget);
  try {
   const r=await fetch("/api/admin/users",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username:d.get("username"),displayName:d.get("displayName"),role:d.get("role"),temporaryPassword:d.get("temporaryPassword"),scopes:["loan:read","loan:export"]})});
   const b=await r.json().catch(()=>({error:"The server could not create the account."}));if(!r.ok){setError(b.error);return}(e.currentTarget).reset();await load()
  } catch { setError("The account could not be created. Please try again.") }
 }
 async function action(userId:string,action:string){let temporaryPassword;if(action==="reset_password"){temporaryPassword=window.prompt("New temporary password (14+ characters):");if(!temporaryPassword)return}
  const r=await fetch("/api/admin/users",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({userId,action,temporaryPassword})});const b=await r.json();if(!r.ok)setError(b.error);else await load()
 }
 return <main className="admin-shell"><div className="admin-head"><div><p className="eyebrow">OWNER CONTROL</p><h1>User administration</h1></div><Link href="/calculator">← Calculator</Link></div>
 <section className="admin-card"><h2>Create accountant account</h2><form className="admin-form" onSubmit={create}><label>Display name<input name="displayName" required/></label><label>Username<input name="username" autoComplete="off" required/></label><label>Temporary password<input name="temporaryPassword" type="password" autoComplete="new-password" minLength={14} required/></label><label>Role<select name="role"><option value="accountant">Accountant</option><option value="viewer">Viewer</option></select></label><button>Create account</button></form>{error&&<p className="form-error">{error}</p>}</section>
 <section className="admin-card"><h2>Accounts</h2><div className="account-list">{users.map(u=><article key={u.id}><div><b>{u.displayName}</b><span>{u.username} · {u.role} · {u.isActive?"active":"disabled"}{u.mustChangePassword?" · password change required":""}</span></div>{u.role!=="owner"&&<div className="account-actions"><button onClick={()=>action(u.id,"revoke_sessions")}>Sign out everywhere</button><button onClick={()=>action(u.id,"reset_password")}>Reset password</button><button onClick={()=>action(u.id,u.isActive?"deactivate":"activate")}>{u.isActive?"Disable":"Enable"}</button></div>}</article>)}</div></section></main>
}
