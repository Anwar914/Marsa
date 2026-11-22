import sys
p='src/course/Lernseite.html'
h=open(p).read()
if 'const LEVELS=' in h: print('already patched'); sys.exit()
extra=open('src/course/grammar-extra.js').read()
def rep(old,new):
    global h
    assert old in h, old[:90]; h=h.replace(old,new,1)
rep("DATA.groups.push(...B1.map(t=>({id:t.id,title:t.title,b1:true,questions:t.items.map(i=>({q:i.q,a:i.a,ex:i.ex,opts:i.opts}))})));",
    extra+"""
B1.forEach(t=>{if(B1_EXTRA[t.id])t.items.push(...B1_EXTRA[t.id])});B1.push(...B1_NEW);
const toQ=i=>({q:i.q,a:i.a,ex:i.ex||'',opts:i.opts,t:i.t});
DATA.groups.push(...B1.map(t=>({id:t.id,title:t.title,b1:true,level:'b1',questions:t.items.map(toQ)})));
DATA.groups.push(...B2.map(t=>({id:t.id,title:t.title,b1:true,level:'b2',questions:t.items.map(toQ)})));
const LEVELS={b1:{name:'B1',topics:B1,prefix:'G'},b2:{name:'B2',topics:B2,prefix:'H'}};""")
rep("function answerField(gid,i,q,id,fresh){if(q.opts){",
    """const orderSel={},orderShuf={};
function orderWords(q){const w=q.a[0].replace(/[.?!]$/,'').split(' ');if(w[0]!=='I'&&!/^[A-Z]{2}/.test(w[0]))w[0]=w[0][0].toLowerCase()+w[0].slice(1);return w}
function orderView(gid,i,id){const q=groupBy(gid).questions[i],w=orderWords(q);orderShuf[id]||=shuffled(w.map((_,k)=>k));const sel=orderSel[id]||(orderSel[id]=[]);return `<div class="orderline" aria-live="polite">${sel.length?sel.map(k=>`<span class="chip on">${esc(w[k])}</span>`).join(' '):'<span class="muted">Click the words in the right order …</span>'}</div><div class="chips">${orderShuf[id].map(k=>`<button type="button" class="chip" ${sel.includes(k)?'disabled':''} onclick="orderPick('${gid}',${i},${k})">${esc(w[k])}</button>`).join('')}</div><div class="toolbar"><button type="button" class="secondary" onclick="orderUndo('${gid}',${i})" ${sel.length?'':'disabled'}>↶ Undo</button><button type="button" class="secondary" onclick="orderReset('${gid}',${i})">Reset</button><button type="button" onclick="check('${gid}',${i})" ${sel.length===w.length?'':'disabled'}>Check sentence</button><button type="button" class="secondary" onclick="hint('${gid}',${i})">💡 Hint</button></div>`}
function orderSync(gid,i){const id=gid+'-'+i,q=groupBy(gid).questions[i],w=orderWords(q);$('#q-'+id).value=(orderSel[id]||[]).map(k=>w[k]).join(' ');$('#ow-'+id).innerHTML=orderView(gid,i,id)}
function orderPick(gid,i,k){const id=gid+'-'+i;(orderSel[id]||(orderSel[id]=[])).push(k);orderSync(gid,i)}
function orderUndo(gid,i){orderSel[gid+'-'+i]?.pop();orderSync(gid,i)}
function orderReset(gid,i){orderSel[gid+'-'+i]=[];orderSync(gid,i)}
function answerField(gid,i,q,id,fresh){if(q.t==='order'){orderSel[id]=[];return `<input type="hidden" id="q-${id}" value=""><div id="ow-${id}">${orderView(gid,i,id)}</div>${hintLine(gid,i)}`}if(q.opts){""")
rep("function hintLine(gid,i){const id=gid+'-'+i,n=state.hint[id]||0;if(!n)return `<p class=\"hintline\" id=\"h-${id}\"></p>`;const a=groupBy(gid).questions[i].a[0];",
    "function hintLine(gid,i){const id=gid+'-'+i,n=state.hint[id]||0;if(!n)return `<p class=\"hintline\" id=\"h-${id}\"></p>`;const q0=groupBy(gid).questions[i],a=q0.a[0];if(q0.t==='order'){const w=a.split(' ');return `<p class=\"hintline\" id=\"h-${id}\">${esc(w.slice(0,n).join(' '))}${n<w.length?' …':''}</p>`}")
rep("function hint(gid,i){const id=gid+'-'+i,a=groupBy(gid).questions[i].a[0];state.hint[id]=Math.min((state.hint[id]||0)+1,a.length);",
    "function hint(gid,i){const id=gid+'-'+i,q0=groupBy(gid).questions[i],a=q0.a[0];state.hint[id]=Math.min((state.hint[id]||0)+1,q0.t==='order'?a.split(' ').length:a.length);")
rep("${q.opts?'':`<button onclick=\"check('${g.id}',${i})\">Check answer</button><button class=\"secondary\" onclick=\"hint('${g.id}',${i})\">💡 Hint</button>`}",
    "${q.opts||q.t==='order'?'':`<button onclick=\"check('${g.id}',${i})\">Check answer</button><button class=\"secondary\" onclick=\"hint('${g.id}',${i})\">💡 Hint</button>`}")
rep("${q.opts?'':`<button onclick=\"check('${gid}',${i})\">Check answer</button><button class=\"secondary\" onclick=\"hint('${gid}',${i})\">💡 Hint</button>`}",
    "${q.opts||q.t==='order'?'':`<button onclick=\"check('${gid}',${i})\">Check answer</button><button class=\"secondary\" onclick=\"hint('${gid}',${i})\">💡 Hint</button>`}")
rep("""return `<div class="question"><label for="q-${id}" lang="${g.id==='A1'||g.id==='A2'?'de':'en'}">${i+1}. ${esc(q.q)}</label>""",
    """return `<div class="question"><label for="q-${id}" lang="${g.id==='A1'||g.id==='A2'?'de':'en'}">${i+1}. ${q.t==='order'?'<span class="tag">word order</span> ':q.t==='fix'?'<span class="tag">error correction</span> ':''}${esc(q.q)}</label>""")
rep("function b1Stats(){const gs=groupStats(true).filter(g=>/^G/.test(g.id));",
    "function levelStats(lv){const p=LEVELS[lv].prefix;const gs=groupStats(true).filter(g=>g.id[0]===p);return {groups:gs,c:gs.reduce((a,g)=>a+g.c,0),t:gs.reduce((a,g)=>a+g.t,0),n:gs.reduce((a,g)=>a+g.n,0)}}\nfunction b1Stats(){const gs=groupStats(true).filter(g=>/^G/.test(g.id));")
start=h.index("function b1Page(arg){"); end=h.index("function mistakes(){")
h=h[:start]+open('tools/unit_pages.js').read()+h[end:]
rep("['grammar','Grammar'],['b1','B1 grammar'],","['grammar','Grammar'],['b1','B1 grammar'],['b2','B2 grammar'],")
rep("b1:()=>b1Page(arg),","b1:()=>b1Page(arg),b2:()=>b2Page(arg),test:()=>testPage(arg),")
rep("b1:(()=>{const b=b1Stats();return {c:b.c,t:b.t,n:b.n,groups:b.groups.map(g=>({id:g.id,title:g.title,c:g.c,t:g.t,n:g.n}))}})(),",
    "b1:(()=>{const b=levelStats('b1');return {c:b.c,t:b.t,n:b.n,groups:b.groups.map(g=>({id:g.id,title:g.title,c:g.c,t:g.t,n:g.n}))}})(),b2:(()=>{const b=levelStats('b2');return {c:b.c,t:b.t,n:b.n,groups:b.groups.map(g=>({id:g.id,title:g.title,c:g.c,t:g.t,n:g.n}))}})(),tests:Object.fromEntries(['b1','b2'].map(lv=>{const hst=(state.ltestHistory||{})[lv]||[];return [lv,{n:hst.length,best:hst.reduce((m,r)=>Math.max(m,Math.round(r.score/r.total*100)),0),last:hst.length?Math.round(hst[hst.length-1].score/hst[hst.length-1].total*100):null}]})),")
rep('More grammar: <a href="#b1">B1 grammar unit – 16 topics with explanations →</a>','More grammar: <a href="#b1">B1 unit (20 topics)</a> · <a href="#b2">B2 unit (16 topics)</a> · <a href="#test/b1">final tests</a>')
rep("</style>",".chips{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.chip{background:#e9f0ed;color:var(--ink);padding:7px 12px;border-radius:8px;font-weight:600}.chip:disabled{opacity:.25}.chip.on{display:inline-block;background:var(--teal);color:#fff;margin:2px}.orderline{min-height:46px;border:1px dashed #a8bcb5;border-radius:9px;padding:8px;margin-top:8px}[data-theme=dark] .chip{background:#1d3135}[data-theme=dark] .chip.on{background:var(--teal);color:#062a22}.tag{font-size:11px;background:#fff3dc;color:#7a4b0b;padding:2px 8px;border-radius:99px;font-weight:700;letter-spacing:.5px;text-transform:uppercase}[data-theme=dark] .tag{background:#3a2c12;color:#ffd99a}</style>")
open(p,'w').write(h)
print('ok')
