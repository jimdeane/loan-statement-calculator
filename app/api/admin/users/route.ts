import { NextResponse } from "next/server";
import { audit,getCurrentUser,hashPassword,isSameOrigin,normaliseUsername,validatePassword } from "../../../lib/auth";
import { database } from "../../../lib/db";
async function owner(){const u=await getCurrentUser();return u?.role==="owner"&&u.scopes.includes("users:manage")?u:null}
export async function GET(){const actor=await owner();if(!actor)return NextResponse.json({error:"Owner access required."},{status:403});const result=await database().prepare("SELECT id,username,display_name displayName,role,must_change_password mustChangePassword,is_active isActive,scopes,created_at createdAt,last_login_at lastLoginAt FROM users ORDER BY created_at").all();return NextResponse.json({users:result.results})}
export async function POST(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Invalid request origin."},{status:403});const actor=await owner();if(!actor)return NextResponse.json({error:"Owner access required."},{status:403});
 const body=await request.json() as {username?:string;displayName?:string;role?:string;temporaryPassword?:string;scopes?:string[]},username=normaliseUsername(body.username??""),password=body.temporaryPassword??"";
 if(!/^[a-z0-9._@-]{3,100}$/.test(username))return NextResponse.json({error:"Enter a valid username."},{status:400});const passwordError=validatePassword(password);if(passwordError)return NextResponse.json({error:passwordError},{status:400});if(!["accountant","viewer"].includes(body.role??""))return NextResponse.json({error:"Invalid role."},{status:400});
 const allowed=["loan:read","loan:export","transactions:read"],scopes=(body.scopes??["loan:read","loan:export"]).filter(s=>allowed.includes(s)),c=await hashPassword(password),id=crypto.randomUUID(),now=Date.now();
 try{await database().prepare("INSERT INTO users (id,username,display_name,role,password_hash,password_salt,password_iterations,must_change_password,is_active,scopes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,1,1,?,?,?)").bind(id,username,(body.displayName??username).trim().slice(0,120),body.role,c.hash,c.salt,c.iterations,JSON.stringify(scopes),now,now).run()}catch{return NextResponse.json({error:"That username already exists."},{status:409})}
 await audit("user.created",actor.id,id,{username,role:body.role,scopes});return NextResponse.json({ok:true,id});
}
export async function PATCH(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Invalid request origin."},{status:403});const actor=await owner();if(!actor)return NextResponse.json({error:"Owner access required."},{status:403});const body=await request.json() as {userId?:string;action?:string;temporaryPassword?:string};
 if(!body.userId||body.userId===actor.id)return NextResponse.json({error:"Invalid account target."},{status:400});const db=database();
 if(body.action==="revoke_sessions")await db.prepare("UPDATE sessions SET revoked_at=? WHERE user_id=?").bind(Date.now(),body.userId).run();
 else if(body.action==="activate"||body.action==="deactivate"){await db.prepare("UPDATE users SET is_active=?,updated_at=? WHERE id=?").bind(body.action==="activate"?1:0,Date.now(),body.userId).run();if(body.action==="deactivate")await db.prepare("UPDATE sessions SET revoked_at=? WHERE user_id=?").bind(Date.now(),body.userId).run()}
 else if(body.action==="reset_password"){const error=validatePassword(body.temporaryPassword??"");if(error)return NextResponse.json({error},{status:400});const c=await hashPassword(body.temporaryPassword??"");await db.batch([db.prepare("UPDATE users SET password_hash=?,password_salt=?,password_iterations=?,must_change_password=1,updated_at=? WHERE id=?").bind(c.hash,c.salt,c.iterations,Date.now(),body.userId),db.prepare("UPDATE sessions SET revoked_at=? WHERE user_id=?").bind(Date.now(),body.userId)])}
 else return NextResponse.json({error:"Unknown action."},{status:400});await audit(`user.${body.action}`,actor.id,body.userId);return NextResponse.json({ok:true});
}
