import {database,json} from '@/lib/server';
import {isMode} from '@/lib/game';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  try{
    const mode=new URL(request.url).searchParams.get('mode')||'classic';
    if(!isMode(mode))return json({error:'Invalid mode'},400);
    const rows=await database().prepare(
      'SELECT id,nickname AS username,score AS best,finished_at AS record_at FROM runs WHERE mode=? ORDER BY score DESC,finished_at ASC,id ASC LIMIT 100'
    ).bind(mode).all<{id:string;username:string;best:number;record_at:number}>();
    return json({mode,entries:rows.results.map((r,i)=>({...r,is_me:0,rank:i+1}))});
  }catch{return json({error:'The leaderboard is temporarily unavailable. Please try again.'},503);}
}
