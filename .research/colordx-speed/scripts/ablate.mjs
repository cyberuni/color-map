// Ablations: (1) parse per input kind, (2) gamut-map algorithm ported in two styles, (3) mix ported. Run: node ablate.mjs
const W=new URL('../../../packages/color-map', import.meta.url).pathname
const cm = await import(`${W}/esm/color/index.js`)
const k = await import(`${W}/node_modules/@colordx/core/dist/index.mjs`)
for (const p of ['lab','p3','mix','a11y']) k.extend([(await import(`${W}/node_modules/@colordx/core/dist/plugins/${p}.mjs`)).default])
const c = k.colordx
function bench(fn, xs, ys){ let sink=0; const n=xs.length
  const run=it=>{for(let i=0;i<it;i++){const j=i%n; const r=ys?fn(xs[j],ys[j]):fn(xs[j]); sink+= r===undefined?0:1}}
  let batch=1; for(;;){const t=performance.now(); run(batch); if(performance.now()-t>10)break; batch*=2}
  let u=performance.now()+300; while(performance.now()<u) run(batch)
  const rates=[]; for(let s=0;s<5;s++){let cnt=0;const st=performance.now();let now=st;while(now-st<250){run(batch);cnt+=batch;now=performance.now()}rates.push(cnt*1000/(now-st))}
  rates.sort((a,b)=>a-b); globalThis.sink=sink; return rates[2] }
const M=x=>(x/1e6).toFixed(2)+'M'
let seed=42; const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32}
const N=64, hx=n=>Math.round(n*255).toString(16).padStart(2,'0')
const rgb=Array.from({length:N},()=>[rand(),rand(),rand()])
const okl=Array.from({length:N},()=>[0.15+rand()*0.8,rand()*0.35,rand()*360])
const kinds={
 hex: rgb.map(([r,g,b])=>`#${hx(r)}${hx(g)}${hx(b)}`),
 'rgb()': rgb.map(([r,g,b])=>`rgb(${Math.round(r*255)} ${Math.round(g*255)} ${Math.round(b*255)} / 0.5)`),
 'oklch()': okl.map(([l,cc,h])=>`oklch(${l.toFixed(3)} ${cc.toFixed(3)} ${h.toFixed(1)})`),
 'hsl()': rgb.map((_,i)=>`hsl(${i*5} ${40+i%30}% ${30+i%40}%)`),
}
console.log('## parse by kind (ops/s)  color-map | colordx | ratio')
for(const [kind,xs] of Object.entries(kinds)){ const a=bench(s=>cm.parse(s),xs), b=bench(s=>c(s),xs); console.log(kind.padEnd(9),M(a),M(b),(b/a).toFixed(1)+'x') }
// hex alone, colordx constructor vs just parse path is same. Skip.

console.log('## gamut')
const oklchObj=okl.map(([l,cc,h])=>({colorSpace:'oklch',components:[l,cc,h]}))
const cdxObj=okl.map(([l,cc,h])=>({l,c:cc,h}))
const base=bench(x=>cm.toGamut(x),oklchObj)
const cdx=bench(x=>c(x).mapSrgb(),cdxObj)
console.log('color-map toGamut',M(base),' colordx mapSrgb',M(cdx),(cdx/base).toFixed(1)+'x')
// port of color-map's algorithm (same JND/epsilon/branches) on linear sRGB, no generic hub, no allocations except result
const M2I=[0.3963377773761749,0.2158037573099136,-0.1055613458156586,-0.0638541728258133,-0.0894841775298119,-1.2914855480194092]
const toLin=(l,a,b,o)=>{const l_=l+M2I[0]*a+M2I[1]*b,m_=l+M2I[2]*a+M2I[3]*b,s_=l+M2I[4]*a+M2I[5]*b;const L=l_*l_*l_,Mm=m_*m_*m_,S=s_*s_*s_
 o[0]=4.076741636075957*L-3.307711539258061*Mm+0.23096990318210464*S; o[1]=-1.2684379732850313*L+2.609757349287688*Mm-0.3413193760026571*S; o[2]=-0.004196076138675536*L-0.7034186179359361*Mm+1.7076146940746113*S}
const toOk=(r,g,b,o)=>{const L=Math.cbrt(0.41222146947076305*r+0.5363325372617348*g+0.05144599326750221*b),Mm=Math.cbrt(0.21190349581782522*r+0.6806995506452344*g+0.10739695353694056*b),S=Math.cbrt(0.08830245919005643*r+0.2817188391361215*g+0.6299787016738222*b)
 o[0]=0.210454268309314*L+0.7936177747023054*Mm-0.0040720430116193*S;o[1]=1.9779985324311684*L-2.42859224204858*Mm+0.450593709617411*S;o[2]=0.0259040424655478*L+0.7827717124575296*Mm-0.8086757549230774*S}
const enc=v=>{const a=Math.abs(v);const e=a<=0.0031308?12.92*a:1.055*a**(1/2.4)-0.055;return v<0?-e:e}
const cl=v=>v<0?0:v>1?1:v
const lin=new Float64Array(3), ok=new Float64Array(3)
let iters=0,calls=0,pows=0
function fastGamut(l,C,hDeg,count){ // returns oklch Color in original space like color-map
  const h=hDeg*Math.PI/180, a=C*Math.cos(h), b=C*Math.sin(h)
  toLin(l,a,b,lin); const inG=v=>v>=-1e-6&&v<=1+1e-6
  if(inG(lin[0])&&inG(lin[1])&&inG(lin[2])) return {colorSpace:'oklch',components:[l,C,hDeg]}
  const JND=0.02,EPS=1e-4
  let r=cl(lin[0]),g=cl(lin[1]),bb=cl(lin[2])
  toOk(r,g,bb,ok); if(Math.hypot(ok[0]-l,ok[1]-a,ok[2]-b)<JND) return out(r,g,bb)
  let lo=0,hi=C,minIn=true
  while(hi-lo>EPS){ if(count)iters++
    const mid=(lo+hi)/2, ma=mid*Math.cos(h), mb=mid*Math.sin(h)
    toLin(l,ma,mb,lin)
    if(minIn&&lin[0]>=-1e-6&&lin[0]<=1+1e-6&&lin[1]>=-1e-6&&lin[1]<=1+1e-6&&lin[2]>=-1e-6&&lin[2]<=1+1e-6){lo=mid;continue}
    r=cl(lin[0]);g=cl(lin[1]);bb=cl(lin[2]); toOk(r,g,bb,ok)
    const e=Math.hypot(ok[0]-l,ok[1]-ma,ok[2]-mb)
    if(e<JND){ if(JND-e<EPS) return out(r,g,bb); minIn=false; lo=mid } else hi=mid }
  return out(r,g,bb)
  function out(r,g,b){ // back to oklch, as color-map's toGamut returns the original space
    toOk(r,g,b,ok); return {colorSpace:'oklch',components:[ok[0],Math.hypot(ok[1],ok[2]),((Math.atan2(ok[2],ok[1])*180/Math.PI)%360+360)%360]} } }
for(const x of oklchObj){calls++; fastGamut(...x.components,true)}
console.log('avg bisection iterations per call (all 64 inputs):',(iters/calls).toFixed(2))
const fast=bench(x=>fastGamut(...x.components,false),oklchObj)
console.log('scratch port of color-map algorithm, specialised linear-sRGB, preallocated scratch, oklch output:',M(fast),(fast/base).toFixed(1)+'x of color-map', ' colordx is',(cdx/fast).toFixed(2)+'x of port')
// equivalence of port vs color-map
let md=0; for(const x of oklchObj){const a=cm.toGamut(x).components, b=fastGamut(...x.components,false).components; md=Math.max(md,Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(((a[2]-b[2]+540)%360)-180))}
console.log('port vs color-map toGamut max component diff',md.toExponential(2))

console.log('## mix oklab')
const sA=rgb.map(v=>({colorSpace:'srgb',components:v})), sB=[...sA.slice(1),sA[0]]
const dA=rgb.map(v=>({r:v[0]*255,g:v[1]*255,b:v[2]*255})), dB=[...dA.slice(1),dA[0]]
const mcm=bench((x,y)=>cm.mix(x,y,0.5),sA,sB), mcd=bench((x,y)=>c(x).mixOklab(y,0.5),dA,dB)
console.log('color-map mix',M(mcm),'colordx mixOklab',M(mcd),(mcd/mcm).toFixed(1)+'x')
// colordx mixOklab inputs are already sRGB bytes (no parse). color-map also gets sRGB objects. Ablate: color-map with oklab inputs (skips 2 conversions)
const oA=sA.map(x=>cm.convert(x,'oklab')), oB=[...oA.slice(1),oA[0]]
console.log('color-map mix with inputs already in oklab (no conversion)',M(bench((x,y)=>cm.mix(x,y,0.5),oA,oB)))
// conversions alone
console.log('color-map convert srgb->oklab',M(bench(x=>cm.convert(x,'oklab'),sA)),' oklab->srgb',M(bench(x=>cm.convert(x,'srgb'),oA)))
console.log('colordx  toOklab (incl. constructor)',M(bench(x=>c(x).toOklab(),dA)))
