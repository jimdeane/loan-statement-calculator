import { NextResponse } from "next/server";
import { audit,clearSession,getCurrentUser,isSameOrigin } from "../../../lib/auth";
export async function POST(request:Request){if(!isSameOrigin(request))return NextResponse.json({error:"Invalid request origin."},{status:403});const user=await getCurrentUser();await clearSession();if(user)await audit("logout",user.id,user.id);return NextResponse.json({ok:true})}
