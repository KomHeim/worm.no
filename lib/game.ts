export const WIDTH = 20;
export const HEIGHT = 15;
export const MODES = ['classic', 'fast', 'expert'] as const;
export type Mode = typeof MODES[number];
export type Direction = 0 | 1 | 2 | 3; // up, right, down, left
export type Turn = { tick: number; direction: Direction };
export type Game = { snake: number[]; food: number; direction: Direction; seed: number; score: number; tick: number; dead: boolean; won: boolean };
export const isMode = (value: unknown): value is Mode => MODES.includes(value as Mode);
export function interval(mode: Mode, score: number) {
  return Math.max(mode === 'expert' ? 48 : 60, ({classic:160,fast:110,expert:78}[mode]) - Math.floor(score / 30) * 5);
}
function random(g: Game) {
  let x = g.seed | 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  g.seed = x >>> 0;
  return g.seed / 4294967296;
}
function addFood(g: Game) {
  const occupied = new Set(g.snake);
  const available: number[] = [];
  for (let i = 0; i < WIDTH * HEIGHT; i++) if (!occupied.has(i)) available.push(i);
  g.food = available.length ? available[Math.floor(random(g) * available.length)] : -1;
}
export function createGame(seed: number): Game {
  const row = Math.floor(HEIGHT / 2);
  const g: Game = { snake:[row * WIDTH + 7,row * WIDTH + 6,row * WIDTH + 5,row * WIDTH + 4], food:0, direction:1, seed:(seed >>> 0) || 1, score:0, tick:0, dead:false, won:false };
  addFood(g);
  return g;
}
export function step(g: Game, direction?: Direction) {
  if (g.dead) return;
  if (direction !== undefined && (direction + 2) % 4 !== g.direction) g.direction = direction;
  const head=g.snake[0], x=head % WIDTH, y=Math.floor(head / WIDTH);
  const nx=x+[0,1,0,-1][g.direction], ny=y+[-1,0,1,0][g.direction];
  const next=ny*WIDTH+nx, eating=next===g.food;
  g.tick++;
  if (nx<0 || nx>=WIDTH || ny<0 || ny>=HEIGHT || g.snake.slice(0,eating?undefined:-1).includes(next)) {g.dead=true;return;}
  g.snake.unshift(next);
  if (eating) {g.score+=10;addFood(g);if(g.food===-1){g.won=true;g.dead=true;}}
  else g.snake.pop();
}
export function replay(seed: number, mode: Mode, turns: Turn[], ticks: number) {
  if (!Number.isInteger(ticks)||ticks<1||ticks>50000||!Array.isArray(turns)||turns.length>ticks) throw new Error('Invalid replay');
  let previous=0;
  for (const t of turns) {
    if (!t||!Number.isInteger(t.tick)||t.tick<=previous||t.tick>ticks||!Number.isInteger(t.direction)||t.direction<0||t.direction>3) throw new Error('Invalid turn');
    previous=t.tick;
  }
  const g=createGame(seed);let index=0,duration=0;
  for(let tick=1;tick<=ticks;tick++){
    if(g.dead)throw new Error('Replay continues after collision');
    duration+=interval(mode,g.score);
    const t=turns[index];
    if(t?.tick===tick){
      if((t.direction+2)%4===g.direction)throw new Error('Impossible turn');
      step(g,t.direction);index++;
    }else step(g);
  }
  return {game:g,duration};
}
