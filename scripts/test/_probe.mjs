import { readFileSync } from "node:fs"
function loadEnv(path){const out={};try{for(const line of readFileSync(path,"utf8").split("\n")){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);out[m[1]]=v}}catch{}return out}
const env={...loadEnv(".env"),...loadEnv(".env.local")}
const token=env.SUPABASE_PERSONAL_ACCESS_KEY
const url=env.NEXT_PUBLIC_SUPABASE_URL
const ref=new URL(url).hostname.split(".")[0]
async function q(sql){const res=await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({query:sql})});const t=await res.text();return {status:res.status,body:t}}
const sql=process.argv[2]
const r=await q(sql)
console.log("HTTP",r.status)
console.log(r.body)
