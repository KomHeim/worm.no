import assert from 'node:assert/strict';
import {createGame,step,interval,SIZE} from '../lib/game.ts';
import type {Direction,Turn} from '../lib/game.ts';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {readFileSync,realpathSync,globSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {Miniflare}=await import(require.resolve('miniflare',{paths:[realpathSync('node_modules/wrangler')]}));
const runtime=new Miniflare({modules:[resolve('dist/server/index.js'),...globSync('dist/server/**/*.js').filter(p=>p!=='dist/server/index.js').map(p=>resolve(p))].map(path=>({type:'ESModule',path})),modulesRoot:resolve('dist/server'),modulesRules:[{type:'ESModule',include:['**/*.js'],fallthrough:true}],compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'worm-test'},cf:false});
const db=await runtime.getD1Database('DB');
for(const stmt of readFileSync('drizzle/0000_dusty_marvel_boy.sql','utf8').split('--> statement-breakpoint'))await db.prepare(stmt).run();
const origin='https://worm.test';
async function api(path:string,user:string|null=null,method='GET',data?:unknown,extra={}){const r=await runtime.dispatchFetch(origin+'/api/'+path,{method,headers:{...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'}:{}),...(method!=='GET'?{'Content-Type':'application/json','Origin':origin}:{}),...extra},...(data?{body:JSON.stringify(data)}:{})});return {status:r.status,data:await r.json() as any};}
function solve(seed:number,foods:number){const g=createGame(seed),turns:Turn[]=[];let duration=0;while(!g.dead&&g.tick<1000){let direction=g.direction;if(g.score<foods*10){const head=g.snake[0],targets=[g.food],queue=[head],visited=new Map<number,{parent:number;dir:Direction}>();visited.set(head,{parent:-1,dir:g.direction});let dest=-1;for(let i=0;i<queue.length;i++){const cell=queue[i];if(targets.includes(cell)){dest=cell;break;}const x=cell%SIZE,y=Math.floor(cell/SIZE);for(let d=0;d<4;d++){if(i===0&&(d+2)%4===g.direction)continue;const nx=x+[0,1,0,-1][d],ny=y+[-1,0,1,0][d],next=ny*SIZE+nx;if(nx<0||ny<0||nx>=SIZE||ny>=SIZE||visited.has(next)||g.snake.slice(1).includes(next))continue;visited.set(next,{parent:cell,dir:d as Direction});queue.push(next);}}if(dest<0)throw Error('Could not solve fixture');while(visited.get(dest)!.parent!==head)dest=visited.get(dest)!.parent;direction=visited.get(dest)!.dir;}
if(direction!==g.direction)turns.push({tick:g.tick+1,direction});duration+=interval('classic',g.score);step(g,direction);}assert(g.dead);return {turns,ticks:g.tick,duration,score:g.score};}
const user='worm-test-a',other='worm-test-b';
assert.equal((await api('game/start',null,'POST',{mode:'classic'})).status,401);
assert.equal((await api('profile',user,'PATCH',{username:'CSRF'}, {Origin:'https://evil.test'})).status,400);
assert.equal((await api('me',user)).data.authenticated,true);
assert.equal((await api('profile',user,'PATCH',{username:'Test Player A'})).status,200);
const started=await api('game/start',user,'POST',{mode:'classic'});assert.equal(started.status,200);const run=solve(started.data.seed,1);assert(run.score>=10);
const payload={session:started.data.session,turns:run.turns,ticks:run.ticks,score:999999};
assert.equal((await api('game/finish',other,'POST',payload)).status,404,'another player cannot use session');
assert.equal((await api('game/finish',user,'POST',payload)).status,400,'accelerated replay rejected');
console.log('Waiting for real-time game duration:',run.duration,'ms');await new Promise(r=>setTimeout(r,run.duration));
const finished=await api('game/finish',user,'POST',payload);assert.equal(finished.status,200,JSON.stringify(finished));assert.equal(finished.data.score,run.score,'server ignores arbitrary client score');
const duplicate=await api('game/finish',user,'POST',payload);assert.equal(duplicate.data.alreadySaved,true);assert.equal(duplicate.data.stats[0].games,1,'duplicate not counted');
const low=await api('game/start',user,'POST',{mode:'classic'});const lowRun=solve(low.data.seed,0);await new Promise(r=>setTimeout(r,lowRun.duration));const lower=await api('game/finish',user,'POST',{session:low.data.session,turns:[],ticks:lowRun.ticks});assert.equal(lower.status,200);assert.equal(lower.data.stats[0].best,run.score,'best never decreases');assert.equal(lower.data.stats[0].games,2);assert.equal(lower.data.stats[0].total,run.score);
const anonymous=(await api('leaderboard?mode=classic')).data.entries;const signed=(await api('leaderboard?mode=classic',other)).data.entries;assert.deepEqual(anonymous,signed,'global board shared across users');assert.equal(anonymous[0].best,run.score);assert(!JSON.stringify(anonymous).includes('example.test'),'no emails on board');assert.equal((await api('leaderboard?mode=fast')).data.entries.length,0,'modes separate');
const returned=(await api('me',user)).data;assert.equal(returned.stats[0].best,run.score,'fresh request retrieves durable record');assert.equal(returned.stats[0].rank,1);
assert.equal((await api('profile',user,'DELETE',{})).status,200);assert.equal((await api('leaderboard?mode=classic')).data.entries.length,0,'profile deletion removes public records');await api('profile',other,'DELETE',{});
console.log('PASS: authentication, CSRF, ownership, timing, verified score, duplicate protection, monotonic best, counters, shared leaderboard, per-mode isolation, privacy, persistence and deletion.');

await runtime.dispose();
