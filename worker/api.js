const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const uuid=/^[a-zA-Z0-9-]{1,150}$/;
export default {async fetch(request,env){
 const url=new URL(request.url);const p=url.pathname;
 if(!p.startsWith('/api/'))return new Response(HTML,{headers:{'Content-Type':'text/html;charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'",'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'}});
 const owner=request.headers.get('oai-authenticated-user-id');if(!owner)return json({error:'Sign in to access your grounds records.'},401);
 if(request.method!=='GET' && request.headers.get('Origin') && request.headers.get('Origin')!==url.origin)return json({error:'Invalid request origin.'},403);
 try{
 if(p==='/api/records'&&request.method==='GET'){const data=await env.DB.prepare('SELECT id,kind,payload FROM records WHERE owner=?').bind(owner).all();return json(data.results.map(r=>({...JSON.parse(r.payload),id:JSON.parse(r.payload).clientId,kind:r.kind})));}
 if(p==='/api/records'&&request.method==='POST'){
 if(Number(request.headers.get('Content-Length')||0)>15000)return json({error:'Record is too large.'},413);
 let d=await request.json();if(!uuid.test(d.id)||!['work','rain','event','photo','check'].includes(d.kind)||!['Baseball','Softball'].includes(d.field)||!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||isNaN(Date.parse(d.date)))return json({error:'Check the date and field.'},400);
 let record={date:d.date,field:d.field};
 if(['work','event','photo'].includes(d.kind)){if(typeof d.title!=='string'||!d.title.trim()||d.title.length>160)return json({error:'Enter a title (up to 160 characters).'},400);record.title=d.title.trim()}
 if(d.notes!==undefined){if(typeof d.notes!=='string'||d.notes.length>2000)return json({error:'Notes must be under 2,000 characters.'},400);record.notes=d.notes}
 if(d.kind==='rain'){if(!Number.isFinite(d.amount)||d.amount<0||d.amount>100)return json({error:'Enter rainfall between 0 and 100 inches.'},400);record.amount=d.amount}
 if(d.kind==='work'){if(!Number.isInteger(d.minutes)||d.minutes<1||d.minutes>1440)return json({error:'Enter time between 1 and 1,440 minutes.'},400);record.minutes=d.minutes;record.worker=String(d.worker||'').slice(0,80)}
 if(d.kind==='event')record.done=!!d.done;
 if(d.kind==='check'){if(!Number.isInteger(d.task)||d.task<0||d.task>5||d.id!==`check-${d.date}-${d.field}-${d.task}`)return json({error:'Invalid checklist task.'},400);record.task=d.task;record.done=!!d.done}
 if(d.kind==='photo'){for(let k of ['before','after']){if(!uuid.test(d[k]))return json({error:'Both photos are required.'},400);let f=await env.BUCKET.head(owner+'/'+d[k]);if(!f)return json({error:'A photo is missing. Please upload again.'},400);record[k]=d[k]}}
 // Composite ownership key keeps daily checklist IDs independent for each user.
 await env.DB.prepare('INSERT INTO records (id,owner,kind,payload) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,payload=excluded.payload WHERE records.owner=excluded.owner').bind(owner+':'+d.id,owner,d.kind,JSON.stringify({...record,clientId:d.id})).run();
 return json({...record,id:d.id,kind:d.kind});}
 if(p.startsWith('/api/records/')&&request.method==='DELETE'){let id=decodeURIComponent(p.slice(13));if(!uuid.test(id))return json({error:'Invalid record.'},400);let r=await env.DB.prepare('SELECT kind,payload FROM records WHERE id=? AND owner=?').bind(owner+':'+id,owner).first();if(r?.kind==='photo'){let data=JSON.parse(r.payload);await Promise.all(['before','after'].map(k=>env.BUCKET.delete(owner+'/'+data[k])))}await env.DB.prepare('DELETE FROM records WHERE id=? AND owner=?').bind(owner+':'+id,owner).run();return json({ok:true})}
 if(p==='/api/photos'&&request.method==='POST'){if(request.headers.get('Content-Type')!=='image/jpeg')return json({error:'JPEG images required.'},400);let bytes=await request.arrayBuffer();if(bytes.byteLength>8*1024*1024)return json({error:'Photo exceeds 8 MB.'},413);let id=crypto.randomUUID();await env.BUCKET.put(owner+'/'+id,bytes,{httpMetadata:{contentType:'image/jpeg'}});return json({id})}
 if(p.startsWith('/api/photos/')&&request.method==='GET'){let id=p.slice(12);if(!uuid.test(id))return json({error:'Invalid photo.'},400);let obj=await env.BUCKET.get(owner+'/'+id);if(!obj)return json({error:'Photo not found.'},404);return new Response(obj.body,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private,max-age=3600','X-Content-Type-Options':'nosniff'}})}
 return json({error:'Not found.'},404)
 }catch(e){console.error('Arena request failed:',e.message);return json({error:'Unable to access your records. Please try again.'},500)}
}};
