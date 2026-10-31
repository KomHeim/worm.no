export const SIZE = 24;
export const MODES = ['classic', 'fast', 'expert'] as const;
export type Mode = typeof MODES[number];
export type Direction = 0 | 1 | 2 | 3; // up, right, down, left
export type Turn = { tick: number; direction: Direction };
export type Game = { snake: number[]; food: number; direction: Direction; seed: number; score: number; tick: number; dead: boolean; won: boolean };
export const isMode = (v: unknown): v is Mode => MODES.includes(v as Mode);
export function interval(mode: Mode, score: number) { return Math.max(mode === 'expert' ? 48 : 60, ({classic:160,fast:110,expert:78}[mode]) - Math.floor(score / 30) * 5); }
function random(g: Game) { let x=g.seed|0; x^=x<<13; x^=x>>>17; x^=x<<5; g.seed=x>>>0; return g.seed / 4294967296; }
function food(g: Game) { const available=[];const occupied=new Set(g.snake);for(let i=0;i<SIZE*SIZE;i++)if(!occupied.has(i))available.push(i);g.food=available.length ? available[Math.floor(random(g)*available.length)] : -1; }
export function createGame(seed: number): Game { const g:Game={snake:[12*SIZE+7,12*SIZE+6,12*SIZE+5,12*SIZE+4],food:0,direction:1,seed:(seed>>>0)||1,score:0,tick:0,dead:false,won:false};food(g);return g; }
export function step(g:Game, direction?:Direction) { if(g.dead)return; if(direction!==undefined && (direction+2)%4!==g.direction)g.direction=direction;
const head=g.snake[0],x=head%SIZE,y=Math.floor(head/SIZE);const nx=x+[0,1,0,-1][g.direction],ny=y+[-1,0,1,0][g.direction];const next=ny*SIZE+nx,eating=next===g.food;
g.tick++;if(nx<0||nx>=SIZE||ny<0||ny>=SIZE||g.snake.slice(0,eating?undefined:-1).includes(next)){g.dead=true;return;}
g.snake.unshift(next);if(eating){g.score+=10;food(g);if(g.food===-1){g.won=true;g.dead=true;}}else g.snake.pop(); }
export function replay(seed:number,mode:Mode,turns:Turn[],ticks:number) {
if(!Number.isInteger(ticks)||ticks<1||ticks>50000||!Array.isArray(turns)||turns.length>ticks)throw new Error('Invalid replay');
let previous=0;for(const t of turns){if(!t||!Number.isInteger(t.tick)||t.tick<=previous||t.tick>ticks||!Number.isInteger(t.direction)||t.direction<0||t.direction>3)throw new Error('Invalid turn');previous=t.tick;}
const g=createGame(seed);let index=0,duration=0;for(let tick=1;tick<=ticks;tick++){if(g.dead)throw new Error('Replay continues after collision');duration+=interval(mode,g.score);const t=turns[index];if(t?.tick===tick){if((t.direction+2)%4===g.direction)throw new Error('Impossible turn');step(g,t.direction);index++;}else step(g);}return {game:g,duration}; }
