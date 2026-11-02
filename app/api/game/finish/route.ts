import {database,body,checkOrigin,json} from '@/lib/server';
import {replay,isMode,Turn} from '@/lib/game';

type Session={id:string;nickname:string;mode:string;seed:number;started:number;consumed:number};
export async function POST(request:Request){
  try{
    checkOrigin(request);
    const data=await body(request);
    if(typeof data.session!=='string'||data.session.length>100)return json({error:'Invalid session'},400);
    const db=database();
    const session=await db.prepare('SELECT * FROM anonymous_sessions WHERE id=?').bind(data.session).first<Session>();
    if(!session||!isMode(session.mode))return json({error:'Game session not found'},404);
    if(session.consumed){
      const prior=await db.prepare('SELECT id,score FROM runs WHERE id=?').bind(session.id).first<{id:string;score:number}>();
      return prior?json({ok:true,alreadySaved:true,id:prior.id,score:prior.score}):json({error:'Game session already used'},409);
    }
    const now=Date.now();
    if(now-session.started>86400000)return json({error:'Game session expired'},400);
    const result=replay(session.seed,session.mode,data.turns as Turn[],data.ticks as number);
    if(now-session.started+250<result.duration)return json({error:'Replay ran faster than allowed'},400);
    if(!result.game.dead)return json({error:'Only completed games can be ranked'},400);
    await db.batch([
      db.prepare('INSERT INTO runs (id,nickname,mode,score,finished_at) SELECT id,nickname,mode,?,? FROM anonymous_sessions WHERE id=? AND consumed=0 ON CONFLICT(id) DO NOTHING')
        .bind(result.game.score,now,session.id),
      db.prepare('UPDATE anonymous_sessions SET consumed=1 WHERE id=? AND consumed=0').bind(session.id)
    ]);
    const saved=await db.prepare('SELECT id,score FROM runs WHERE id=?').bind(session.id).first<{id:string;score:number}>();
    return saved?json({ok:true,id:saved.id,score:saved.score}):json({error:'Score was not saved. Please retry.'},503);
  }catch(e){
    return json({error:e instanceof Error&&/Invalid replay|Invalid turn|Impossible turn|collision|Origin denied|JSON required|Request too large/i.test(e.message)?e.message:'Could not save this game. Please retry.'},400);
  }
}
