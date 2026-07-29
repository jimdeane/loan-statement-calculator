import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { database } from "../../../lib/db";
export async function GET(){const user=await getCurrentUser();if(user?.role!=="owner"||!user.scopes.includes("audit:read"))return NextResponse.json({error:"Owner access required."},{status:403});const events=await database().prepare("SELECT id,event_type eventType,actor_user_id actorUserId,target_user_id targetUserId,metadata,created_at createdAt FROM audit_events ORDER BY created_at DESC LIMIT 200").all();return NextResponse.json({events:events.results})}
