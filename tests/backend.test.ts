import assert from 'node:assert/strict';
import {createGame,step,interval,WIDTH,HEIGHT} from '../lib/game.ts';
import type {Direction,Turn} from '../lib/game.ts';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {readFileSync,realpathSync,globSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {Miniflare}=await import(require.resolve('miniflare',{paths:[realpathSync('node_modules/wrangler')]}));
const runtime=new Miniflare({modules:[resolve('dist/server/index.js'),...globSync('dist/server/**/*.js').filter(p=>p!=='dist/server/index.js').map(p=>resolve(p))].map(path=>({type:'ESModule',path})),modulesRoot:resolve('dist/server'),modulesRules:[{type:'ESModule',include:['**/*.js'],fallthrough:true}],compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'worm-test'},cf:false});
const db=await runtime.getD1Database('DB');
for(const migration of ['drizzle/0000_dusty_marvel_boy.sql','drizzle/0001_anonymous_scores.sql']) for(const stmt of readFileSync(migration,'utf8').split('--> statement-breakpoint')) if(stmt.trim()) await db.prepare(stmt).run();
const origin='https://worm.test';
async function api(path:string,method='GET',data?:unknown,extra:Record<string,string>={}){
 const response=await runtime.dispatchFetch(origin+'/api/'+path,{method,headers:{...(method!=='GET'?{'Content-Type':'application/json','Origin':origin}:{}),...extra},...(data!==undefined?{body:JSON.stringify(data)}:{})});
 return {status:response.status,data:await response.json() as any};
}
function solve(seed:number,foods:number){
 const g=createGame(seed),turns:Turn[]=[];let duration=0;
 while(!g.dead&&g.tick<1000){
  let direction=g.direction;
  if(g.score<foods*10){
   const head=g.snake[0],queue=[head],visited=new Map<number,{parent:number;dir:Direction}>();
   visited.set(head,{parent:-1,dir:g.direction});let dest=-1;
   for(let i=0;i<queue.length;i++){
    const cell=queue[i];if(cell===g.food){dest=cell;break;}
    const x=cell%WIDTH,y=Math.floor(cell/WIDTH);
    for(let d=0;d<4;d++){
     if(i===0&&(d+2)%4===g.direction)continue;
     const nx=x+[0,1,0,-1][d],ny=y+[-1,0,1,0][d],next=ny*WIDTH+nx;
     if(nx<0||ny<0||nx>=WIDTH||ny>=HEIGHT||visited.has(next)||g.snake.slice(1).includes(next))continue;
     visited.set(next,{parent:cell,dir:d as Direction});queue.push(next);
    }
   }
   if(dest<0)throw Error('Could not solve fixture');
   while(visited.get(dest)!.parent!==head)dest=visited.get(dest)!.parent;
   direction=visited.get(dest)!.dir;
  }
  if(direction!==g.direction)turns.push({tick:g.tick+1,direction});
  duration+=interval('classic',g.score);step(g,direction);
 }
 assert(g.dead);return {turns,ticks:g.tick,duration,score:g.score};
}
assert.equal((await api('game/start','POST',{mode:'classic',nickname:'A'})).status,400);
assert.equal((await api('game/start','POST',{mode:'bogus',nickname:'Player A'})).status,400);
assert.equal((await api('game/start','POST',{mode:'classic',nickname:'Player A'},{Origin:'https://other.test'})).status,400);
const first=await api('game/start','POST',{mode:'classic',nickname:'Åsa'});
assert.equal(first.status,200,JSON.stringify(first.data));
const solution=solve(first.data.seed,1);assert(solution.score>=10);
const payload={session:first.data.session,turns:solution.turns,ticks:solution.ticks,score:999999,mode:'classic'};
assert.equal((await api('game/finish','POST',{...payload,session:crypto.randomUUID()})).status,404);
assert.equal((await api('game/finish','POST',payload)).status,400);
console.log('Waiting for replay duration:',solution.duration,'ms');
await new Promise(resolve=>setTimeout(resolve,solution.duration+100));
const finished=await api('game/finish','POST',payload);
assert.equal(finished.status,200,JSON.stringify(finished.data));
assert.equal(finished.data.id,first.data.session);
assert.equal(finished.data.score,solution.score);
const duplicate=await api('game/finish','POST',payload);
assert.equal(duplicate.data.alreadySaved,true);
const second=await api('game/start','POST',{mode:'classic',nickname:'Second Player'});
assert.equal(second.status,200);assert.notEqual(second.data.session,first.data.session);
const low=solve(second.data.seed,0);
await new Promise(resolve=>setTimeout(resolve,low.duration+100));
assert.equal((await api('game/finish','POST',{session:second.data.session,turns:[],ticks:low.ticks})).status,200);
const leaderboard=(await api('leaderboard?mode=classic')).data.entries;
assert.equal(leaderboard.length,2);
assert(leaderboard.some((run:any)=>run.username==='Åsa'&&run.id===first.data.session));
assert(leaderboard.some((run:any)=>run.username==='Second Player'&&run.id===second.data.session));
assert.equal(leaderboard[0].best,solution.score);
assert.equal((await api('leaderboard?mode=expert')).data.entries.length,0);
assert(!JSON.stringify(leaderboard).includes('@example.test'));
console.log('PASS: anonymous sessions, input validation, unique IDs, replay, verified scores, idempotency and global leaderboard.');
await runtime.dispose();
