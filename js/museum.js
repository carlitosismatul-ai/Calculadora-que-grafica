(function(global){
 const T=Math.PI*2,figures=[];const add=(name,eq,cat,fnx,fny,min=0,max=T,close=true)=>figures.push({name,eq,category:cat,fnx,fny,tMin:min,tMax:max,close});
 add('Círculo','r = 5','Polar',t=>5*Math.cos(t),t=>5*Math.sin(t));
 add('Elipse','x = 7cos(t), y = 4sin(t)','Paramétrica',t=>7*Math.cos(t),t=>4*Math.sin(t));
 add('Cardioide','r = 2(1 + cos(θ))','Polar',t=>2*(1+Math.cos(t))*Math.cos(t),t=>2*(1+Math.cos(t))*Math.sin(t));
 add('Lemniscata de Bernoulli','r² = 8cos(2θ)','Polar',t=>{const q=8*Math.cos(2*t);return q>=0?Math.sqrt(q)*Math.cos(t):NaN},t=>{const q=8*Math.cos(2*t);return q>=0?Math.sqrt(q)*Math.sin(t):NaN});
 add('Corazón','x=16sin³(t), y=13cos(t)−5cos(2t)−2cos(3t)−cos(4t)','Paramétrica',t=>16*Math.sin(t)**3/8,t=>(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/8);
 add('Astroide','x=4cos³(t), y=4sin³(t)','Paramétrica',t=>4*Math.cos(t)**3,t=>4*Math.sin(t)**3);
 add('Lemniscata de Gerono','x=4cos(t), y=4sin(t)cos(t)','Paramétrica',t=>4*Math.cos(t),t=>4*Math.sin(t)*Math.cos(t));
 add('Espiral de Arquímedes','r = 0.4θ','Polar',t=>.4*t*Math.cos(t),t=>.4*t*Math.sin(t),0,T*3,false);
 add('Espiral logarítmica','r = 0.3e^(0.15θ)','Polar',t=>.3*Math.exp(.15*t)*Math.cos(t),t=>.3*Math.exp(.15*t)*Math.sin(t),0,T*2.2,false);
 for(let k=2;k<=18;k++)add(`Rosa polar k=${k}`,`r = 5cos(${k}θ)`,'Polar',t=>5*Math.cos(k*t)*Math.cos(t),t=>5*Math.cos(k*t)*Math.sin(t),0,k%2?Math.PI:T);
 for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)if(a!==b)add(`Lissajous ${a}:${b}`,`x=5sin(${a}t+π/2), y=5sin(${b}t)`,'Paramétrica',t=>5*Math.sin(a*t+Math.PI/2),t=>5*Math.sin(b*t),0,T*2);
 const stars=[[5,2],[6,2],[7,2],[7,3],[8,3],[9,2],[9,4],[10,3],[11,4],[12,5]];for(const[n,q]of stars){add(`Estrella ${n}/${q}`,`Polígono estrellado {${n}/${q}}`,'Geométrica',t=>{const s=Math.floor(t)%n,f=t-Math.floor(t),a=s*q*T/n,b=(s+1)*q*T/n;return 5*Math.cos(a)+(5*Math.cos(b)-5*Math.cos(a))*f},t=>{const s=Math.floor(t)%n,f=t-Math.floor(t),a=s*q*T/n,b=(s+1)*q*T/n;return 5*Math.sin(a)+(5*Math.sin(b)-5*Math.sin(a))*f},0,n)}
 global.Museum={figures};
})(window);
