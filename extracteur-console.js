/* ByKevin — extracteur de base locale.
   À coller dans la console (F12) de chaque ancien projet, sur son origine web.
   Produit un JSON compatible avec migration.html. */
(async function extractByKevinSource(){
"use strict";
const CFG={secrets:false,maxStr:2000000,known:["bykevin-v2","bykevin-v1","diagauto-single-v5","diagauto","aide-technique","appli-aide-technique","aide_technique","kevfusion2026","autodiag","autodiag-formation-auto","auto-legal","auto-legal-by-kevin","db","database","local"]};
const SECRET=/pass|passwd|password|pin|token|secret|private|key|code|owner|jwt|auth/i;
const iso=()=>new Date().toISOString();
const stamp=()=>iso().replace(/[:.]/g,"-");
function b64(buf){const u=buf instanceof Uint8Array?buf:new Uint8Array(buf);let s="";for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);}
function serKey(k){try{if(k instanceof ArrayBuffer)return"__bin:"+b64(new Uint8Array(k));if(ArrayBuffer.isView(k))return"__bin:"+b64(new Uint8Array(k.buffer,k.byteOffset,k.byteLength));if(Array.isArray(k))return k.map(serKey);return String(k);}catch{return"__key?";}}
function red(v,h){h=h||"";if(CFG.secrets)return v;
if(typeof h==="string"&&SECRET.test(h))return"[masqué]";
if(typeof v==="string")return v.length>CFG.maxStr?v.slice(0,CFG.maxStr)+"…[tronqué]":v;
if(v instanceof ArrayBuffer||ArrayBuffer.isView(v))return"[binaire]";
if(typeof Blob!=="undefined"&&v instanceof Blob)return"[blob:"+(v.type||"?")+":"+v.size+"]";
if(Array.isArray(v))return v.map(x=>red(x,""));
if(v&&typeof v==="object"){const o={};for(const[k,x]of Object.entries(v))o[k]=red(x,k);return o;}
return v;}
function clone(v,h){try{return JSON.parse(JSON.stringify(red(v,h)));}catch(e){return{__nonSerializable:true,err:String(e&&e.message||e),preview:String(v).slice(0,800)};}}
function readStore(db,name){return new Promise((res,rej)=>{try{
const tx=db.transaction(name,"readonly"),st=tx.objectStore(name),items=[],req=st.openCursor();
req.onsuccess=e=>{const c=e.target.result;if(c){items.push({key:serKey(c.key),value:clone(c.value,String(c.key))});c.continue();}else res(items);};
req.onerror=()=>rej(req.error);}catch(e){rej(e);}});}
function openDb(name){return new Promise((res,rej)=>{let created=false;const req=indexedDB.open(name);
req.onupgradeneeded=()=>{created=true;try{req.transaction.abort();}catch{}res(null);};
req.onsuccess=async()=>{const db=req.result;try{
if(created){db.close();res(null);return;}
const names=Array.from(db.objectStoreNames||[]),stores=[];
for(const s of names){try{stores.push({name:s,entries:await readStore(db,s)});}catch(e){stores.push({name:s,error:String(e&&e.message||e)});}}
db.close();res({name,stores});}catch(e){try{db.close();}catch{}rej(e);}};
req.onerror=()=>rej(req.error);});}
async function listNames(){if(typeof indexedDB.databases==="function"){try{const d=await indexedDB.databases();const n=(d||[]).map(x=>x.name).filter(Boolean);if(n.length)return uniq(n.concat(CFG.known));}catch(e){console.warn("databases():",e);}}return CFG.known;}
const uniq=a=>Array.from(new Set(a.filter(Boolean)));
function lsDump(){const o={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k)o[k]=clone(localStorage.getItem(k),k);}}catch(e){o.__error=String(e&&e.message||e);}return o;}
function download(payload){const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
const u=URL.createObjectURL(blob),a=document.createElement("a");
a.href=u;a.download="source-"+location.hostname.replace(/\W+/g,"-")+"-"+stamp()+".json";
document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);return a.download;}
console.log("%c🧳 ByKevin — extraction de "+location.origin,"color:#FFB020;font-weight:bold");
const warnings=[],names=await listNames(),databases=[];
for(const n of names){try{const db=await openDb(n);
if(db){databases.push(db);console.log("✓ "+n+" → "+db.stores.map(s=>s.name+"("+(s.entries?.length||0)+")").join(", "));}
else warnings.push("base absente ou non lisible : "+n);}
catch(e){warnings.push("erreur "+n+" : "+String(e&&e.message||e));}}
const payload={format:"diagauto-migration-dump",version:1,generated_at:iso(),origin:location.origin,href:location.href,userAgent:navigator.userAgent,secretsIncluded:CFG.secrets,indexedDB:databases,localStorage:lsDump(),warnings};
const file=download(payload);
let copied=false;try{await navigator.clipboard.writeText(JSON.stringify(payload));copied=true;}catch{}
const total=databases.reduce((s,d)=>s+d.stores.reduce((t,x)=>t+(x.entries?.length||0),0),0);
console.log("%c✓ Export terminé","color:#3DDC84;font-weight:bold",{fichier:file,enregistrements:total,pressePapiers:copied,avertissements:warnings});
alert("Export terminé.\n\nFichier : "+file+"\nEnregistrements : "+total+"\n\nOuvrez ByKevin → Admin → Fusion des 4 projets → Ouvrir l'utilitaire de migration, puis importez ce JSON.");
return payload;
})();
