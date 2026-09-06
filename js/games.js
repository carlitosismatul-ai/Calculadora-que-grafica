/* Math Arcade 2.0 — retos variados, explicados y con XP */
(function(global){
 const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
 const nz=(a,b)=>{let n;do{n=rnd(a,b)}while(n===0);return n};
 const sign=n=>n>=0?`+ ${n}`:`− ${Math.abs(n)}`;
 const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1};
 const frac=(n,d)=>{let g=gcd(n,d);if(d<0){n=-n;d=-d}return[n/g,d/g]};
 const linear=(level)=>{
   const r=level===1?9:level===2?18:35,a=nz(-Math.floor(r/2),Math.floor(r/2)),x=nz(-r,r),b=rnd(-r,r),c=a*x+b;
   return {category:'Álgebra · ecuación lineal',prompt:`Resuelve: ${a}x ${sign(b)} = ${c}`,answer:x,tolerance:1e-6,
    steps:[`Partimos de ${a}x ${sign(b)} = ${c}.`,`Restamos ${b} en ambos lados: ${a}x = ${c-b}.`,`Dividimos entre ${a}: x = ${(c-b)}/${a}.`,`Resultado: x = ${x}.`],mode:'functions'};
 };
 const quad=(level)=>{
   const r=level===1?5:level===2?9:14,r1=nz(-r,r),r2=nz(-r,r),b=-(r1+r2),c=r1*r2,D=b*b-4*c,roots=[Math.min(r1,r2),Math.max(r1,r2)];
   return {category:'Álgebra · cuadrática',prompt:`Encuentra x: x² ${sign(b)}x ${sign(c)} = 0`,answer:roots,isPair:true,tolerance:1e-6,
    steps:[`Identificamos a=1, b=${b}, c=${c}.`,`Calculamos Δ=b²−4ac = ${D}.`,`√Δ = ${Math.sqrt(D)}.`,`Aplicamos x=(−b±√Δ)/(2a).`,`Raíces: x₁=${roots[0]}, x₂=${roots[1]}.`],mode:'functions'};
 };
 const mental=(level)=>{
   const a=rnd(2,level===1?9:level===2?20:50),b=rnd(2,level===1?9:level===2?20:50),op=['+','−','×'][rnd(0,2)];
   const ans=op==='+'?a+b:op==='−'?a-b:a*b;
   return {category:'Cálculo mental',prompt:`Calcula: ${a} ${op} ${b}`,answer:ans,tolerance:1e-9,steps:[`Identifica la operación ${op}.`,`Calcula ${a} ${op} ${b}.`,`Resultado: ${ans}.`],mode:'mental'};
 };
 const percent=(level)=>{
   const base=rnd(20,level===1?100:level===2?300:1000),p=rnd(5,level===1?25:level===2?50:80),ans=base*p/100;
   return {category:'Porcentajes',prompt:`¿Cuánto es el ${p}% de ${base}?`,answer:ans,tolerance:1e-6,steps:[`Convierte ${p}% a decimal: ${p}/100 = ${p/100}.`,`Multiplica ${base} × ${p/100}.`,`Resultado: ${ans}.`],mode:'percent'};
 };
 const slope=(level)=>{
   const r=level===1?7:level===2?15:30;let x1=rnd(-r,r),x2=rnd(-r,r);while(x1===x2)x2=rnd(-r,r);const y1=rnd(-r,r),y2=rnd(-r,r),[n,d]=frac(y2-y1,x2-x1),ans=n/d;
   return {category:'Geometría analítica · pendiente',prompt:`Pendiente entre (${x1}, ${y1}) y (${x2}, ${y2})`,answer:ans,tolerance:1e-4,steps:[`Usa m=(y₂−y₁)/(x₂−x₁).`,`m=(${y2}−${y1})/(${x2}−${x1}).`,`m=${y2-y1}/${x2-x1} = ${n}/${d}.`,`Resultado: m=${ans}.`],mode:'functions'};
 };
 const evaluate=(level)=>{
   const a=nz(-5,5),b=rnd(-8,8),x=rnd(-5,5),ans=a*x+b;
   return {category:'Funciones · evaluación',prompt:`Si f(x)=${a}x ${sign(b)}, calcula f(${x})`,answer:ans,tolerance:1e-6,steps:[`Sustituye x=${x}.`,`f(${x})=${a}(${x}) ${sign(b)}.`,`Calcula ${a*x} ${sign(b)}.`,`Resultado: ${ans}.`],mode:'functions'};
 };
 const sequence=(level)=>{
   const start=rnd(1,10),step=rnd(2,level===1?5:level===2?10:20),seq=[0,1,2,3,4].map(i=>start+i*step),ans=seq[4]+step;
   return {category:'Secuencias',prompt:`Completa la secuencia: ${seq.join(', ')}, ¿qué sigue?`,answer:ans,tolerance:1e-9,steps:[`Compara términos consecutivos: la diferencia es ${step}.`,`Mantén la misma diferencia: ${seq[4]} + ${step}.`,`Resultado: ${ans}.`],mode:'sequence'};
 };
 const logic=(level)=>{
   const a=rnd(2,level===1?9:level===2?20:40),b=a+rnd(2,9),c=b+rnd(2,9),ans=c+(b-a);
   return {category:'Lógica · patrón',prompt:`Si ${a} → ${b}, ${b} → ${c}, siguiendo el mismo incremento, ¿qué número sigue?`,answer:ans,tolerance:1e-9,steps:[`Calcula el primer incremento: ${b}−${a}=${b-a}.`,`Calcula el segundo: ${c}−${b}=${c-b}.`,`El patrón suma ${b-a}.`,`Resultado: ${c}+${b-a}=${ans}.`],mode:'logic'};
 };
 const trig=()=>{
   const items=[['sin(0°)',0,0],['cos(0°)',1,0],['sin(90°)',1,0],['cos(180°)',-1,0],['sin(30°)',.5,0],['cos(60°)',.5,0],['tan(45°)',1,0]];
   const q=items[rnd(0,items.length-1)];
   return {category:'Trigonometría',prompt:`Evalúa ${q[0]}`,answer:q[1],tolerance:.02,steps:[`Ubica el ángulo en el círculo unitario.`,`Recuerda el valor notable de ${q[0]}.`,`Resultado: ${q[1]}.`],mode:'trig'};
 };
 const ALL=[linear,quad,mental,percent,slope,evaluate,sequence,logic,trig];
 function randomProblem(level=1,mode='mixed'){
   let pool=ALL;if(mode!=='mixed')pool=ALL.filter(g=>g(1).mode===mode);if(!pool.length)pool=ALL;
   return pool[rnd(0,pool.length-1)](level);
 }
 function checkAnswer(p,input){
   if(p.isPair){const v=String(input).split(/[,\s]+/).filter(Boolean).map(Number);if(v.length!==2||v.some(Number.isNaN))return false;v.sort((a,b)=>a-b);const e=[...p.answer].sort((a,b)=>a-b);return Math.abs(v[0]-e[0])<=p.tolerance&&Math.abs(v[1]-e[1])<=p.tolerance}
   const n=parseFloat(String(input).replace(',','.'));return Number.isFinite(n)&&Math.abs(n-p.answer)<=p.tolerance;
 }
 global.Games={randomProblem,checkAnswer};
})(window);