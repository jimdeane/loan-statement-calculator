import { NextResponse } from "next/server";
import { audit,createSession,hashPassword,isSameOrigin,normaliseUsername,requestFingerprint,userCount,validatePassword } from "../../../lib/auth";
import { database } from "../../../lib/db";
export async function POST(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Invalid request origin."},{status:403});
 if(await userCount())return NextResponse.json({error:"Setup is already complete."},{status:409});
 const fp=await requestFingerprint();if(!fp.chatgptEmail)return NextResponse.json({error:"Owner authentication is required."},{status:403});
 const body=await request.json() as {username?:string;displayName?:string;password?:string},username=normaliseUsername(body.username??""),password=body.password??"",passwordError=validatePassword(password);
 if(!/^[a-z0-9._@-]{3,100}$/.test(username))return NextResponse.json({error:"Enter a valid username."},{status:400});
 if(passwordError)return NextResponse.json({error:passwordError},{status:400});
 const id=crypto.randomUUID(),credential=await hashPassword(password),now=Date.now();
 try{await database().prepare(`INSERT INTO users (id,username,display_name,role,password_hash,password_salt,password_iterations,must_change_password,is_active,scopes,created_at,updated_at) VALUES (?,?,?,'owner',?,?,?,0,1,?,?,?)`)
   .bind(id,username,(body.displayName??"Owner").trim().slice(0,120),credential.hash,credential.salt,credential.iterations,JSON.stringify(["loan:read","loan:export","users:manage","audit:read","bank:manage"]),now,now).run()}
 catch{return NextResponse.json({error:"Setup is already complete."},{status:409})}
 await audit("owner.bootstrap",id,id);await createSession(id);return NextResponse.json({ok:true});
}
