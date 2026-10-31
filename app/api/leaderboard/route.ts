import {database,identity,json} from '@/lib/server';
import {isMode} from '@/lib/game';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const mode=new URL(request.url).searchParams.get('mode')||'classic';if(!isMode(mode))return json({error:'Invalid mode'},400);const id=await identity();const rows=await database().prepare(`SELECT p.username,s.best,s.record_at,CASE WHEN s.user_id=? THEN 1 ELSE 0 END AS is_me FROM stats s JOIN profiles p ON p.id=s.user_id WHERE s.mode=? ORDER BY s.best DESC,s.record_at ASC,s.user_id ASC LIMIT 100`).bind(id||'',mode).all();return json({mode,entries:rows.results.map((r,i)=>({...r,rank:i+1}))});}catch{return json({error:'The leaderboard is temporarily unavailable. Please try again.'},503);}}
