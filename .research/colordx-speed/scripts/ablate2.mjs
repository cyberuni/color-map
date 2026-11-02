const W=new URL('../../../packages/color-map', import.meta.url).pathname
const cm = await import(`${W}/esm/color/index.js`)
const k = await import(`${W}/node_modules/@colordx/core/dist/index.mjs`)
const c=k.colordx
function bench(fn, xs, ys){ let sink=0; const n=xs.length
  const run=it=>{for(let i=0;i<it;i++){const j=i%n; const r=ys?fn(xs[j],ys[j]):fn(xs[j]); sink+= r===undefined?0:1}}
  let batch=1; for(;;){const t=performance.now(); run(batch); if(performance.now()-t>10)break; batch*=2}
  let u=performance.now()+300; while(performance.now()<u) run(batch)
  const rates=[]; for(let s=0;s<5;s++){let cnt=0;const st=performance.now();let now=st;while(now-st<250){run(batch);cnt+=batch;now=performance.now()}rates.push(cnt*1000/(now-st))}
  rates.sort((a,b)=>a-b); globalThis.sink=sink; return rates[2] }
const M=x=>(x/1e6).toFixed(2)+'M'
let seed=42; const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32}
const rgb=Array.from({length:64},()=>[rand(),rand(),rand()])
const hx=n=>Math.round(n*255).toString(16).padStart(2,'0')
// --- hex fast path (charCode, no regex/arrays of strings)
const hd=ch=>{const d=ch-48; if(d>=0&&d<=9)return d; const l=(ch|32)-87; return l>=10&&l<=15?l:-1}
function hexFast(s){ const n=s.length; if(n!==7) return cm.parse(s)
  const a=hd(s.charCodeAt(1)),b=hd(s.charCodeAt(2)),c3=hd(s.charCodeAt(3)),d=hd(s.charCodeAt(4)),e=hd(s.charCodeAt(5)),f=hd(s.charCodeAt(6))
  if((a|b|c3|d|e|f)<0) return cm.parse(s)
  return {colorSpace:'srgb',components:[(a*16+b)/255,(c3*16+d)/255,(e*16+f)/255]} }
const H=rgb.map(([r,g,b])=>`#${hx(r)}${hx(g)}${hx(b)}`)
console.log('hex  color-map',M(bench(cm.parse,H)),' charCode port',M(bench(hexFast,H)),' colordx',M(bench(s=>c(s),H)))
let md=0; for(const s of H){const a=cm.parse(s).components,b=hexFast(s).components;for(let i=0;i<3;i++)md=Math.max(md,Math.abs(a[i]-b[i]))} console.log('  hex port equal? max diff',md)
// --- mix without none machinery: same math, color-map's own convert
const A=rgb.map(v=>({colorSpace:'srgb',components:v})), B=[...A.slice(1),A[0]]
function mixNoNone(a,b,t){ const x=cm.convert(a,'oklab').components, y=cm.convert(b,'oklab').components
  const p1=a.alpha??1,p2=b.alpha??1, al=p1*(1-t)+p2*t
  const f=i=>{const pm=x[i]*p1*(1-t)+y[i]*p2*t; return al===0?pm:pm/al}
  const r={colorSpace:'oklab',components:[f(0),f(1),f(2)]}; if(al!==1) r.alpha=al; return r }
console.log('mix  color-map',M(bench((x,y)=>cm.mix(x,y,.5),A,B)),' port(convert x2 + math, no none/powerless)',M(bench((x,y)=>mixNoNone(x,y,.5),A,B)))
let m2=0; for(let i=0;i<64;i++){const a=cm.mix(A[i],B[i],.5).components,b=mixNoNone(A[i],B[i],.5).components;for(let j=0;j<3;j++)m2=Math.max(m2,Math.abs(a[j]-b[j]))} console.log('  mix port equal? max diff',m2)
