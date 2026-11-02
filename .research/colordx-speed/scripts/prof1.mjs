const W=new URL('../../../packages/color-map', import.meta.url).pathname
const cm = await import(`${W}/esm/color/index.js`)
let seed=7; const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32}
const which=process.argv[2]
const rgb=Array.from({length:64},()=>[rand(),rand(),rand()])
const A=rgb.map(v=>({colorSpace:'srgb',components:v})), B=[...A.slice(1),A[0]]
const S=rgb.map(([r,g,b])=>`rgb(${Math.round(r*255)} ${Math.round(g*255)} ${Math.round(b*255)} / 0.5)`)
const O=rgb.map(([l,c,h])=>({colorSpace:'oklch',components:[0.2+l*0.7,c*0.35,h*360]}))
let s=0; const end=performance.now()+4000
while(performance.now()<end){ for(let i=0;i<64*50;i++){const j=i&63
 if(which==='mix') s+=cm.mix(A[j],B[j],0.5).components.length
 else if(which==='parse') s+=cm.parse(S[j]).components.length
 else s+=cm.toGamut(O[j]).components.length } }
console.log(s)
