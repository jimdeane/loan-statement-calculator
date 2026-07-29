import { NextResponse } from "next/server";
import { audit,clearSession,getCurrentUser,hashPassword,isSameOrigin,validatePassword,verifyPassword } from "../../../lib/auth";
import { database } from "../../../lib/db";
export async function POST(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Invalid request origin."},{status:403});const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Sign in required."},{status:401});
 const body=await request.json() as {currentPassword?:string;newPassword?:string},passwordError=validatePassword(body.newPassword??"");if(passwordError)return NextResponse.json({error:passwordError},{status:400});
 const db=database(),stored=await db.prepare("SELECT password_hash hash,password_salt salt,password_iterations iterations FROM users WHERE id=?").bind(user.id).first<Record<string,string|number>>();
 if(!stored||!await verifyPassword(body.currentPassword??"",String(stored.hash),String(stored.salt),Number(stored.iterations)))return NextResponse.json({error:"Current password is incorrect."},{status:401});
 const c=await hashPassword(body.newPassword??"");await db.batch([db.prepare("UPDATE users SET password_hash=?,password_salt=?,password_iterations=?,must_change_password=0,updated_at=? WHERE id=?").bind(c.hash,c.salt,c.iterations,Date.now(),user.id),db.prepare("UPDATE sessions SET revoked_at=? WHERE user_id=?").bind(Date.now(),user.id)]);
 await audit("password.changed",user.id,user.id);await clearSession();return NextResponse.json({ok:true});
}
