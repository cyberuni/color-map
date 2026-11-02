// Output equivalence + validity checks. Run: node equiv.mjs  (reads repo build, writes nothing)
const W=new URL('../../../packages/color-map', import.meta.url).pathname
const cm = await import(`${W}/esm/color/index.js`)
const k = await import(`${W}/node_modules/@colordx/core/dist/index.mjs`)
for (const p of ['lab','p3','mix','a11y']) k.extend([(await import(`${W}/node_modules/@colordx/core/dist/plugins/${p}.mjs`)).default])
const c = k.colordx
let seed=42; const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32}
const N=64
const srgbIn=Array.from({length:N},()=>[rand(),rand(),rand()])
const oklchIn=Array.from({length:N},()=>[0.15+rand()*0.8,rand()*0.35,rand()*360])
const hex=n=>Math.round(n*255).toString(16).padStart(2,'0')
const STR=[
 ...srgbIn.slice(0,16).map(([r,g,b])=>`#${hex(r)}${hex(g)}${hex(b)}`),
 ...srgbIn.slice(16,32).map(([r,g,b])=>`rgb(${Math.round(r*255)} ${Math.round(g*255)} ${Math.round(b*255)} / 0.5)`),
 ...oklchIn.slice(0,16).map(([l,cc,h])=>`oklch(${l.toFixed(3)} ${cc.toFixed(3)} ${h.toFixed(1)})`),
 ...srgbIn.slice(32,40).map((_,i)=>`hsl(${i*45} ${40+i*5}% ${30+i*5}%)`),
 ...['rebeccapurple','tomato','cornflowerblue','darkolivegreen'],
 ...srgbIn.slice(0,4).map(([r,g,b])=>`color(display-p3 ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)})`)]
// P1 validity of parse inputs
const invalid=STR.filter(s=>!c(s).isValid())
console.log('colordx rejects', invalid.length,'of',STR.length, invalid.slice(0,8))
// parse value diff for strings both accept -> compare in srgb bytes
let maxd=0
for(const s of STR){ const x=c(s); if(!x.isValid()) continue; const a=cm.convert(cm.parse(s),'srgb').components.map(v=>v*255); const b=x._rawRgb(); maxd=Math.max(maxd,Math.abs(a[0]-b.r),Math.abs(a[1]-b.g),Math.abs(a[2]-b.b)) }
console.log('parse: max |diff| in sRGB 0-255 over accepted strings', maxd)
// gamut
const mk=([l,cc,h])=>({colorSpace:'oklch',components:[l,cc,h]})
let nOut=0,maxdG=0,sumdG=0,maxdE=0, cnt=0
const toOk=rgb=>{const o=cm.convert({colorSpace:'srgb',components:rgb.map(v=>v/255)},'oklab').components;return o}
for(const x of oklchIn){
  const a=cm.toGamut(mk(x)); const inG=cm.inGamut(mk(x)); if(inG) continue; nOut++
  const aS=cm.convert(a,'srgb').components.map(v=>Math.min(1,Math.max(0,v))*255)
  const m=c({l:x[0],c:x[1],h:x[2]}).mapSrgb()._rawRgb()
  const d=Math.max(...[0,1,2].map(i=>Math.abs(aS[i]-[m.r,m.g,m.b][i])))
  maxdG=Math.max(maxdG,d); sumdG+=d; cnt++
  const oa=toOk(aS), ob=toOk([m.r,m.g,m.b]); maxdE=Math.max(maxdE,Math.hypot(oa[0]-ob[0],oa[1]-ob[1],oa[2]-ob[2]))
}
console.log(`gamut: ${nOut} out-of-sRGB of ${N}; max |dRGB| (0-255)=${maxdG.toFixed(3)} mean=${(sumdG/cnt).toFixed(3)}; max dEOK=${maxdE.toExponential(2)}`)
// mix oklab
let maxm=0
for(let i=0;i<N;i++){ const A=srgbIn[i],B=srgbIn[(i+1)%N]
  const a=cm.mix({colorSpace:'srgb',components:A},{colorSpace:'srgb',components:B},0.5)
  const aS=cm.convert(a,'srgb').components
  const m=c({r:A[0]*255,g:A[1]*255,b:A[2]*255}).mixOklab({r:B[0]*255,g:B[1]*255,b:B[2]*255},0.5)._rawRgb()
  maxm=Math.max(maxm,Math.abs(aS[0]*255-m.r),Math.abs(aS[1]*255-m.g),Math.abs(aS[2]*255-m.b)) }
console.log('mix oklab: max |dRGB| 0-255 =',maxm.toExponential(2))
// what does each return for mix / gamut (shape)
console.log('shape cm.mix:',JSON.stringify(cm.mix('#3b82f6','#f63b82')),' colordx mixOklab:',JSON.stringify(c('#3b82f6').mixOklab('#f63b82',0.5)._rawRgb()))
// edge: precision. color-map gamut for a known case vs colordx
const t=mk([0.7,0.3,150]); console.log('gamut sample cm',JSON.stringify(cm.convert(cm.toGamut(t),'srgb').components.map(v=>+(v*255).toFixed(3))),'colordx',JSON.stringify(c({l:.7,c:.3,h:150}).mapSrgb()._rawRgb()))
// colordx snapping: rb<0.5 -> 0 ; 254.5..255 -> 255
