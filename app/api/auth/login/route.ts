import { NextResponse } from "next/server";
import { audit,createSession,isSameOrigin,normaliseUsername,requestFingerprint,verifyPassword } from "../../../lib/auth";
import { database } from "../../../lib/db";
export async function POST(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Invalid request origin."},{status:403});
 const body=await request.json() as {username?:string;password?:string},username=normaliseUsername(body.username??""),fp=await requestFingerprint(),db=database(),since=Date.now()-15*60*1000;
 const failures=await db.prepare("SELECT COUNT(*) count FROM login_attempts WHERE username=? AND ip_hash=? AND succeeded=0 AND attempted_at>?").bind(username,fp.ipHash,since).first<{count:number}>();
 if(Number(failures?.count??0)>=8){await audit("login.throttled",null,null,{username});return NextResponse.json({error:"Too many unsuccessful attempts. Try again later."},{status:429})}
 const user=await db.prepare("SELECT id,password_hash passwordHash,password_salt passwordSalt,password_iterations passwordIterations,is_active isActive FROM users WHERE username=?").bind(username).first<Record<string,string|number>>();
 const valid=user&&Boolean(user.isActive)&&await verifyPassword(body.password??"",String(user.passwordHash),String(user.passwordSalt),Number(user.passwordIterations));
 await db.prepare("INSERT INTO login_attempts (username,ip_hash,attempted_at,succeeded) VALUES (?,?,?,?)").bind(username,fp.ipHash,Date.now(),valid?1:0).run();
 if(!valid){await audit("login.failed",user?String(user.id):null,user?String(user.id):null,{username});return NextResponse.json({error:"Incorrect username or password."},{status:401})}
 await db.prepare("UPDATE users SET last_login_at=?,updated_at=? WHERE id=?").bind(Date.now(),Date.now(),user.id).run();await createSession(String(user.id));await audit("login.succeeded",String(user.id),String(user.id));return NextResponse.json({ok:true});
}
