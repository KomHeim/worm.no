import {identity,ensureProfile,me,json} from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(){try{const id=await identity();if(!id)return json({authenticated:false});await ensureProfile(id);return json(await me(id));}catch{return json({error:'Player records are temporarily unavailable.'},503);}}
