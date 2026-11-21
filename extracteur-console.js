(async function exportBase(){
  "use strict";
  const CONFIG={includeSecrets:false,maxStringValue:2000000,knownDatabases:["bykevin-v1","diagauto-single-v5","diagauto","aide-technique","appli-aide-technique","aide_technique","kevfusion2026","autodiag","autodiag-formation-auto","auto-legal","db","database"]};
  const SECRET_RE=/pass|passwd|password|pin|token|secret|private|key|code|owner|jwt|auth/i;
  const nowIso=()=>new Date().toISOString();
  const stamp=()=>nowIso().replace(/[:.]/g,"-");
  function bufToB64(buf){const b=buf instanceof Uint8Array?buf:new Uint8Array(buf);let s="";const c=0x8000;for(let i=0;i<b.length;i+=c)s+=String.fromCharCode.apply(null,b.subarray(i,i+c));return btoa(s);}
  function serKey(key){try{if(key instanceof ArrayBuffer)return"__binary:"+bufToB64(new Uint8Array(key));if(ArrayBuffer.isView(key))return"__binary:"+bufToB64(new Uint8Array(key.buffer,key.byteOffset,key.byteLength));if(Array.isArray(key))return key.map(serKey);return String(key);}catch{return"__unserializable-key";}}
  function redact(v,hint=""){if(CONFIG.includeSecrets)return v;if(typeof hint==="string"&&SECRET_RE.test(hint))return"[redacted]";if(typeof v==="string")return v.length>CONFIG.maxStringValue?v.slice(0,CONFIG.maxStringValue)+"...[truncated]":v;if(v instanceof ArrayBuffer||ArrayBuffer.isView(v))return"[binary]";if(v instanceof Blob)return"[blob:"+(v.type||"unknown")+":"+v.size+"]";if(v instanceof File)return"[file:"+v.name+":"+v.size+"]";if(Array.isArray(v))return v.map(x=>redact(x,""));if(v&&typeof v==="object"){const o={};for(const[k,val]of Object.entries(v))o[k]=redact(val,k);return o;}return v;}
  function clone(v,hint=""){try{return JSON.parse(JSON.stringify(redact(v,hint)));}catch(err){return{__unserializable:true,error:String(err&&err.message||err),preview:String(v).slice(0,1000)};}}
  function readStore(db,name){return new Promise((res,rej)=>{try{const tx=db.transaction(name,"readonly");const st=tx.objectStore(name);const items=[];const req=st.openCursor();req.onsuccess=e=>{const cur=e.target.result;if(cur){items.push({key:serKey(cur.key),value:clone(cur.value,String(cur.key))});cur.continue();}else res(items);};req.onerror=()=>rej(req.error);}catch(err){rej(err);}});}
  function openDb(name){return new Promise((res,rej)=>{let created=false;const req=indexedDB.open(name);req.onupgradeneeded=()=>{created=true;try{req.transaction.abort();}catch{}res(null);};req.onsuccess=async()=>{const db=req.result;try{if(created){db.close();res(null);return;}const names=Array.from(db.objectStoreNames||[]);const stores=[];for(const s of names){try{stores.push({name:s,entries:await readStore(db,s)});}catch(err){stores.push({name:s,error:String(err&&err.message||err)});}}db.close();res({name,stores});}catch(err){try{db.close();}catch{}rej(err);}};req.onerror=()=>rej(req.error);});}
  async function listNames(){if(typeof indexedDB.databases==="function"){try{const dbs=await indexedDB.databases();return(dbs||[]).map(d=>d.name).filter(Boolean);}catch(e){console.warn("databases() failed:",e);}}return CONFIG.knownDatabases;}
  function lsDump(){const o={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k)o[k]=clone(localStorage.getItem(k),k);}}catch(err){o.__error=String(err&&err.message||err);}return o;}
  function dl(payload){const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download="export-"+location.hostname.replace(/\W+/g,"-")+"-"+stamp()+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);return a.download;}
  console.log("🧳 Export base locale "+location.origin);
  const warnings=[];const names=await listNames();const databases=[];
  for(const name of names){try{const db=await openDb(name);if(db){databases.push(db);console.log("✅ IDB:",name,db.stores.map(s=>s.name+"("+(s.entries?.length||0)+")").join(", "));}else warnings.push("Base inexistante/non lue : "+name);}catch(err){warnings.push("Erreur IDB "+name+" : "+String(err&&err.message||err));}}
  const payload={format:"diagauto-migration-dump",version:1,generated_at:nowIso(),origin:location.origin,href:location.href,userAgent:navigator.userAgent,includeSecrets:CONFIG.includeSecrets,indexedDB:databases,localStorage:lsDump(),warnings};
  const filename=dl(payload);
  let copied=false;try{await navigator.clipboard.writeText(JSON.stringify(payload));copied=true;}catch{}
  console.log("✅ Export:",filename,"| presse-papiers:",copied?"OK":"non");
  alert("Export terminé.\nFichier : "+filename+"\n\nVa dans ByKevin → Admin → Migration → Ouvrir migration.html → Importer ce JSON.");
  return payload;
})();
