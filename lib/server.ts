import {env} from 'cloudflare:workers';
export const database=()=>{if(!env.DB)throw new Error('Database unavailable');return env.DB;};
export const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function checkOrigin(request:Request){
  const origin=request.headers.get('Origin');
  if(!origin||origin!==new URL(request.url).origin)throw new Error('Origin denied');
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new Error('JSON required');
}
export async function body(request:Request){
  if(Number(request.headers.get('Content-Length')||0)>1500000)throw new Error('Request too large');
  const raw=await request.text();
  if(raw.length>1500000)throw new Error('Request too large');
  return JSON.parse(raw) as Record<string,unknown>;
}
