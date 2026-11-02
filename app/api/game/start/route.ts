import {database,body,checkOrigin,json} from '@/lib/server';
import {isMode} from '@/lib/game';

export async function POST(request:Request){
  try{
    checkOrigin(request);
    const data=await body(request);
    if(!isMode(data.mode))return json({error:'Invalid mode'},400);
    if(typeof data.nickname!=='string'||!/^[-\p{L}\p{N}_ ]{2,20}$/u.test(data.nickname.trim()))
      return json({error:'Use a nickname with 2–20 letters, numbers, spaces, underscores or hyphens.'},400);
    const nickname=data.nickname.trim();
    const db=database(),now=Date.now();
    const seed=crypto.getRandomValues(new Uint32Array(1))[0]||1, session=crypto.randomUUID();
    await db.batch([
      db.prepare('DELETE FROM anonymous_sessions WHERE id IN (SELECT id FROM anonymous_sessions WHERE started<? LIMIT 100)').bind(now-86400000),
      db.prepare('INSERT INTO anonymous_sessions (id,nickname,mode,seed,started,consumed) VALUES (?,?,?,?,?,0)')
        .bind(session,nickname,data.mode,seed,now)
    ]);
    return json({session,seed});
  }catch(e){
    return json({error:e instanceof Error&&/Origin denied|JSON required|Invalid|Request too large/i.test(e.message)?e.message:'Could not start a ranked game. Try offline play.'},
      e instanceof Error&&/Origin denied|JSON required|Invalid|Request too large/i.test(e.message)?400:503);
  }
}
