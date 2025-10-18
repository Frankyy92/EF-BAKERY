async function jget(url){ const r = await fetch(url); return r.json(); }
async function jpost(url, body){ const r = await fetch(url,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)}); return r.json(); }
