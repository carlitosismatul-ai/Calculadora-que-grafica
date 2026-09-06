(function(){
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 let toastTimer;function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),2200)}
 // cursor divertido contextual
 const cursor=$('#funCursor'),cursorEmoji=$('#cursorEmoji'); let mx=-80,my=-80,cx=-80,cy=-80;
 const cursorMap=[
   ['#view-calc','🧮'],['#view-graphing','📈'],['#view-solver','🧠'],['#view-lessons','📚'],
   ['#view-formulas','📐'],['#view-games','🎮'],['#view-museum','🔭'],['#view-interactive','🪄']
 ];
 function cursorAt(x,y){let emoji='✨';const el=document.elementFromPoint(x,y);
   if(el){ if(el.closest('input,textarea,select')) emoji='✏️'; else if(el.closest('button')) emoji='⚡'; else if(el.closest('a')) emoji='🎬'; else for(const [sel,e] of cursorMap){if(el.closest(sel)){emoji=e;break}}}
   cursorEmoji.textContent=emoji;cursor.classList.toggle('is-hover',!!el?.closest('button,input,textarea,select,a,.figure-card,.panel'));
 }
 window.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cursorAt(mx,my)});
 (function cursorLoop(){cx+=(mx-cx)*.22;cy+=(my-cy)*.22;cursor.style.left=cx+'px';cursor.style.top=cy+'px';requestAnimationFrame(cursorLoop)})();
 // micro interacción magnética
 function magnetic(){document.querySelectorAll('.magnetic').forEach(el=>{el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2);el.style.transform=`translate(${x*.035}px,${y*.035}px)`});el.addEventListener('mouseleave',()=>el.style.transform='')})}
 // tema
 let dark=localStorage.getItem('mathgraph-theme')!=='light';
 function applyTheme(){document.documentElement.dataset.theme=dark?'dark':'light';localStorage.setItem('mathgraph-theme',dark?'dark':'light');setTimeout(()=>window.dispatchEvent(new Event('resize')),80);cursorEmoji.textContent=dark?'🌙':'☀️'}
 applyTheme();$('#themeToggle').onclick=()=>{dark=!dark;applyTheme()};
 // navegación
 let museumRendered=false,lessonsRendered=false,formulasRendered=false;
 $$('.tab-btn').forEach(btn=>btn.onclick=()=>{
   $$('.tab-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
   $$('.view').forEach(v=>v.classList.remove('active'));
   $('#view-'+btn.dataset.view).classList.add('active');
   window.dispatchEvent(new Event('resize'));
   if(btn.dataset.view==='museum'&&!museumRendered)renderMuseum();
   if(btn.dataset.view==='lessons'&&!lessonsRendered)renderLessons();
   if(btn.dataset.view==='formulas'&&!formulasRendered)renderFormulas();
 });
 // calculadora
 const calcGraph=new Graph($('#calcCanvas'));let currentType='linear';$$('.type-chip').forEach(chip=>chip.onclick=()=>{$$('.type-chip').forEach(c=>c.classList.remove('active'));chip.classList.add('active');currentType=chip.dataset.type;$$('.type-panel').forEach(p=>p.classList.add('hidden'));$('#inputs-'+currentType).classList.remove('hidden');runCalculation()});
 $('#calcZoomIn').onclick=()=>{calcGraph.scale=Math.min(500,calcGraph.scale*1.25);calcGraph.draw()};$('#calcZoomOut').onclick=()=>{calcGraph.scale=Math.max(4,calcGraph.scale*.8);calcGraph.draw()};$('#calcReset').onclick=()=>calcGraph.reset();
 function showError(m){const e=$('#calcError');e.textContent=m?m:'';e.classList.toggle('show',!!m)}function showResults(items){$('#resultsList').innerHTML=items.map(x=>`<div class="result-row"><b>${x.label}</b><span class="val">${x.value}</span></div>`).join('')}
 function runCalculation(){showError('');calcGraph.clearCurves();calcGraph.clearPoints();calcGraph.asymptotes=[];try{let items=[],roots=[],fn=null;const ex=type=>MathEngine.compile($('#'+type).value);if(currentType==='linear'){fn=ex('lin-expr');const r=Calculator.analyzeLinear(fn);items=r.items;roots=r.roots}else if(currentType==='quadratic'){fn=ex('quad-expr');const r=Calculator.analyzeQuadratic(fn);items=r.items;roots=r.roots;if(r.vertex)calcGraph.addPoint(r.vertex.x,r.vertex.y,'#ffb020',6,'Vértice')}else if(currentType==='polynomial'){fn=ex('poly-expr');const r=Calculator.analyzePolynomial(fn);items=r.items;roots=r.roots}else if(currentType==='rational'){const p=ex('rat-num'),q=ex('rat-den');const r=Calculator.analyzeRational(p,q);fn={at:x=>{const d=q.at(x);return Math.abs(d)<1e-10?NaN:p.at(x)/d}};items=r.items;roots=r.roots;calcGraph.asymptotes=r.asymptotes}else{const kind=$('#trig-kind').value,A=+$('#trig-a').value||0,B=+$('#trig-b').value||1,C=+$('#trig-c').value||0,D=+$('#trig-d').value||0;const r=Calculator.analyzeTrig(kind,A,B,C,D);fn=r.fn;items=r.items;roots=r.roots}
   const xv=+$('#eval-x').value;if(Number.isFinite(xv)){const y=fn.at(xv);items=[{label:`f(${Calculator.fmt(xv)})`,value:Calculator.fmt(y)},...items];if(Number.isFinite(y))calcGraph.addPoint(xv,y,'#ff2fba',5,`(${Calculator.fmt(xv)}, ${Calculator.fmt(y)})`)}showResults(items);calcGraph.addCurve(x=>fn.at(x),'#45c8ff',3);roots.filter(Number.isFinite).forEach(r=>calcGraph.addPoint(r,0,'#22d3a7',5,`x=${Calculator.fmt(r)}`));calcGraph.draw();
  }catch(e){showError('No se pudo interpretar la expresión: '+e.message)}}
 $('#btnAnalyze').onclick=runCalculation;['lin-expr','quad-expr','poly-expr','rat-num','rat-den','trig-kind','trig-a','trig-b','trig-c','trig-d','eval-x'].forEach(id=>{const e=$('#'+id);if(e)e.addEventListener('keydown',ev=>{if(ev.key==='Enter')runCalculation()})});
 // Graficador universal
 const ug=new Graph($('#universalCanvas'),{scale:35});
 function evalBound(v){try{return MathEngine.compile(String(v)).at(0)}catch{return 0}}
 function detect(expr,mode){const n=MathEngine.normalize(expr);if(mode!=='auto')return mode;if(/r\^2\s*=/.test(n)||/^r\s*=/.test(n))return'polar';if(/x\s*=.*y\s*=/.test(n)||(/x\s*=/.test(n)&&/y\s*=/.test(n)))return'parametric';return'cartesian'}
 function parseUniversal(expr,mode){const m=detect(expr,mode),raw=MathEngine.normalize(expr);ug.clearCurves();ug.clearParametrics();ug.clearPoints();ug.asymptotes=[];let info='';if(m==='polar'){const rhs=raw.replace(/^r\^2\s*=|^r\s*=/,'');const squared=/^r\^2/.test(raw);const f=MathEngine.compile(rhs);const min=evalBound($('#graphMin').value),max=evalBound($('#graphMax').value);if(squared){ug.addParametric(t=>{const q=f.at(t);return q>=0?Math.sqrt(q)*Math.cos(t):NaN},t=>{const q=f.at(t);return q>=0?Math.sqrt(q)*Math.sin(t):NaN},min,max,'#ff3bc7',3,false);info=`Polar · ${expr} · se interpreta r = ±√(${rhs})` }else{ug.addParametric(t=>{const r=f.at(t);return Number.isFinite(r)?r*Math.cos(t):NaN},t=>{const r=f.at(t);return Number.isFinite(r)?r*Math.sin(t):NaN},min,max,'#55d9ff',3,false);info=`Polar · ${expr}`}}
   else if(m==='parametric'){const clean=raw.replace(/^\(/,'').replace(/\)$/,'');const parts=clean.split(/,\s*(?=y\s*=)/);const xm=parts[0].match(/^x\s*=\s*(.*)$/),ym=parts[1]?.match(/^y\s*=\s*(.*)$/);if(!xm||!ym)throw new Error('Para paramétrica usa x = ..., y = ...');const fx=MathEngine.compile(xm[1]),fy=MathEngine.compile(ym[1]);ug.addParametric(t=>fx.at(t),t=>fy.at(t),evalBound($('#graphMin').value),evalBound($('#graphMax').value),'#9d73ff',3,false);info=`Paramétrica · ${expr}`}
   else{let rhs=raw.replace(/^y\s*=\s*/,'');const f=MathEngine.compile(rhs);ug.addCurve(x=>f.at(x),'#55d9ff',3);info=`Cartesiana · y = ${rhs}`}
   $('#universalMode').textContent=m.toUpperCase();$('#universalInfo').textContent=info;ug.fitToContent();ug.draw();}
 $('#universalPlot').onclick=()=>{try{parseUniversal($('#universalExpr').value,$('#graphMode').value)}catch(e){$('#universalInfo').textContent='Error: '+e.message;toast('Revisa la notación de la ecuación')}};$('#universalClear').onclick=()=>{ug.clearCurves();ug.clearParametrics();ug.clearPoints();$('#universalInfo').textContent='Lienzo limpiado';ug.draw()};$('#univZoomIn').onclick=()=>{ug.scale=Math.min(500,ug.scale*1.25);ug.draw()};$('#univZoomOut').onclick=()=>{ug.scale=Math.max(4,ug.scale*.8);ug.draw()};$('#univReset').onclick=()=>ug.reset();$('#graphQuality').oninput=e=>$('#qualityValue').value=e.target.value;$$('.mini-chip').filter(x=>x.dataset.expr).forEach(b=>b.onclick=()=>{$('#universalExpr').value=b.dataset.expr;parseUniversal(b.dataset.expr,'auto')});
 ug.onPointer=(p)=>$('#graphReadout').textContent=`x: ${Calculator.fmt(p.x,3)} · y: ${Calculator.fmt(p.y,3)}`;
 // resolver paso a paso — motor mejorado de FunctionLab
 function renderSolution(sol){
   $('#solverTitle').textContent=sol.type||'Solución';
   $('#solverSteps').innerHTML=sol.steps.map((s,i)=>`<div class="step-item" style="animation-delay:${i*.07}s"><span class="step-num">${i+1}</span><div>${s}</div></div>`).join('');
   if(sol.roots?.length) $('#solverSteps').innerHTML+=`<div class="equation-banner">Soluciones encontradas · ${sol.roots.map(r=>Calculator.fmt(r)).join(' · ')}</div>`;
 }
 function runSolver(){
   const err=$('#solverError');err.classList.remove('show');
   try{const sol=Solver.solve($('#solverInput').value);renderSolution(sol)}
   catch(e){err.textContent=e.message;err.classList.add('show')}
 }
 $('#solverRun').onclick=runSolver;
 $$('.solver-examples .mini-chip').forEach(b=>b.onclick=()=>{$('#solverInput').value=b.dataset.solve;runSolver()});
 runSolver();

 // aprende
 function renderLessons(){
   const grid=$('#lessonsGrid');grid.innerHTML='';
   Lessons.lessons.forEach(l=>{const card=document.createElement('button');card.className='lesson-card glass magnetic';card.innerHTML=`<div class="ltag">${l.tag}</div><h3>${l.title}</h3><p>${l.summary}</p><span>Ver lección →</span>`;card.onclick=()=>showLesson(l);grid.appendChild(card)});
   lessonsRendered=true;
 }
 function showLesson(l){
   const exerciseBank={
 'lineal':{question:'Resuelve: 2x + 7 = 19',answer:'6',hint:'Resta 7 en ambos lados y después divide entre 2.'},
 'cuadratica':{question:'Resuelve: x² − 5x + 6 = 0. Escribe las dos raíces separadas por coma.',answer:'2,3',hint:'Busca dos números cuyo producto sea 6 y cuya suma sea 5.'},
 'factorizacion':{question:'Factoriza x² + 5x + 6. Escribe: (x+?)(x+?).',answer:'(x+2)(x+3)',hint:'Busca dos números que multipliquen 6 y sumen 5.'},
 'sistemas':{question:'En x+y=10 y x−y=2, ¿cuánto vale x?',answer:'6',hint:'Suma las dos ecuaciones para eliminar y.'},
 'dominio':{question:'¿Qué valor de x debes excluir en 1/(x−4)?',answer:'4',hint:'Haz que el denominador sea distinto de cero.'},
 'trig-notables':{question:'¿Cuánto vale sin(30°)?',answer:'0.5',hint:'Recuerda el círculo unitario y los ángulos notables.'},
 'racional-asintotas':{question:'En 2x/(x−4), ¿cuál es la asíntota vertical?',answer:'4',hint:'Iguala el denominador a cero.'},
 'pendiente':{question:'Calcula m entre (1,2) y (4,11).',answer:'3',hint:'m=(y₂−y₁)/(x₂−x₁).'}
}; const ex=exerciseBank[l.id]||{question:'Resuelve: 3x+4=19',answer:'5',hint:'Resta 4 y luego divide entre 3.'};
   $('#lessonDetail').innerHTML=`<div class="panel glass lesson-body">
     <div class="ltag">${l.tag}</div><h2>${l.title}</h2><p class="lesson-summary">${l.summary}</p>
     <div class="lesson-columns"><div><h3>🧭 Cómo hacerlo</h3><ol>${l.steps.map(s=>`<li>${s}</li>`).join('')}</ol></div>
     <div><h3>🧪 Ejemplo</h3><div class="work">${l.example.work.map(w=>`<span>${w}</span>`).join('')}</div></div></div>
     <div class="mini-exercise"><span class="eyebrow">MINI EJERCICIO</span><h3>${ex.question}</h3><div class="answer-row"><input class="input" id="lessonAnswer" placeholder="Tu respuesta"><button class="primary-btn magnetic" id="lessonCheck">Comprobar</button></div><p id="lessonFeedback"></p><details><summary>💡 Pista</summary><p>${ex.hint}</p></details></div>
   </div>`;
   $('#lessonCheck').onclick=()=>{const got=$('#lessonAnswer').value.trim().replace(',','.');const ok=got===String(ex.answer).replace(',','.');$('#lessonFeedback').textContent=ok?'✅ Correcto. Ahora intenta explicarte por qué.':'❌ Aún no. Revisa la pista y vuelve a seguir los pasos.';$('#lessonFeedback').className=ok?'good':'bad'};
   $('#lessonDetail').scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 function renderFormulas(){
   const grid=$('#formulaGrid'),search=$('#formulaSearch');function draw(){const q=search.value.toLowerCase(),cat=document.querySelector('.formula-filters .active')?.dataset.formulaCat||'all';grid.innerHTML=Formulas.formulas.filter(f=>(cat==='all'||f.cat===cat)&&(f.name+' '+f.formula+' '+f.note).toLowerCase().includes(q)).map(f=>`<article class="formula-card glass"><span class="formula-cat">${f.cat}</span><h3>${f.name}</h3><div class="formula">${f.formula}</div><p>${f.note}</p><button class="mini-chip magnetic" data-copy="${f.formula.replace(/"/g,'&quot;')}">Copiar fórmula</button></article>`).join('');grid.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>{navigator.clipboard?.writeText(b.dataset.copy);toast('Fórmula copiada ✨')})}search.oninput=draw;$$('.formula-filters .mini-chip').forEach(b=>b.onclick=()=>{$$('.formula-filters .mini-chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');draw()});draw();formulasRendered=true;
 }

 // juegos ampliados
 let problem=null,level=1,gameMode='mixed',score={correct:0,wrong:0,streak:0,xp:0};
 $$('.level-select .secondary-btn').forEach(b=>b.onclick=()=>{$$('.level-select .secondary-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');level=+b.dataset.level;newProblem()});
 $$('.game-modes .mini-chip').forEach(b=>b.onclick=()=>{$$('.game-modes .mini-chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');gameMode=b.dataset.gameMode;newProblem()});
 function updateScore(){$('#scoreCorrect').textContent=score.correct;$('#scoreWrong').textContent=score.wrong;$('#scoreStreak').textContent=score.streak;$('#scoreXP').textContent=score.xp}
 function renderGameSteps(title){$('#gameSteps').innerHTML=`<b>${title}</b><ol>${problem.steps.map((s,i)=>`<li style="animation-delay:${i*.08}s">${s}</li>`).join('')}</ol>`;$('#gameSteps').classList.add('show')}
 function newProblem(){problem=Games.randomProblem(level,gameMode);$('#gameCategory').textContent=problem.category;$('#gameProblem').textContent=problem.prompt;$('#gameAnswer').value='';$('#gameAnswer').disabled=false;$('#gameSubmit').disabled=false;$('#gameFeedback').className='feedback-banner';$('#gameSteps').classList.remove('show');}
 $('#gameNew').onclick=newProblem;
 $('#gameSubmit').onclick=()=>{if(!problem)return;const ok=Games.checkAnswer(problem,$('#gameAnswer').value.trim()),b=$('#gameFeedback');b.className='feedback-banner show '+(ok?'correct':'incorrect');b.textContent=ok?'🎉 ¡Correcto! +10 XP':'🧩 Casi. Puedes intentarlo otra vez o ver la solución.';if(ok){score.correct++;score.streak++;score.xp+=10+score.streak*2;renderGameSteps('Explicación paso a paso')}else{score.wrong++;score.streak=0}updateScore();if(ok){$('#gameAnswer').disabled=true;$('#gameSubmit').disabled=true}};
 $('#gameGiveUp').onclick=()=>{if(!problem)return;const ans=problem.isPair?problem.answer.join(', '):Calculator.fmt(problem.answer);const b=$('#gameFeedback');b.className='feedback-banner show incorrect';b.textContent=`💡 Respuesta: ${ans}`;score.wrong++;score.streak=0;renderGameSteps('Solución paso a paso');updateScore();$('#gameAnswer').disabled=true;$('#gameSubmit').disabled=true};
 $('#gameAnswer').onkeydown=e=>{if(e.key==='Enter')$('#gameSubmit').click()};newProblem();

 // museo
 let currentMuseum=null;function drawMini(canvas,f,color){const d=window.devicePixelRatio||1,r=canvas.getBoundingClientRect();canvas.width=r.width*d;canvas.height=r.height*d;const c=canvas.getContext('2d');c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,r.width,r.height);let max=1;for(let i=0;i<180;i++){const t=f.tMin+(f.tMax-f.tMin)*i/179,x=f.fnx(t),y=f.fny(t);if(Number.isFinite(x))max=Math.max(max,Math.abs(x));if(Number.isFinite(y))max=Math.max(max,Math.abs(y))}const s=Math.min(r.width,r.height)/(2*max*1.1);c.strokeStyle=color;c.shadowBlur=10;c.shadowColor=color;c.lineWidth=2;c.beginPath();let started=false;for(let i=0;i<600;i++){const t=f.tMin+(f.tMax-f.tMin)*i/599,x=f.fnx(t),y=f.fny(t);if(!Number.isFinite(x)||!Number.isFinite(y)){started=false;continue}const sx=r.width/2+x*s,sy=r.height/2-y*s;if(!started){c.moveTo(sx,sy);started=true}else c.lineTo(sx,sy)}c.stroke()}
 function renderMuseum(filter=''){const grid=$('#museumGrid'),q=filter.toLowerCase();grid.innerHTML='';const fs=Museum.figures.filter(f=>(f.name+' '+f.eq+' '+f.category).toLowerCase().includes(q));$('#museumCount').textContent=`${fs.length} curvas`;const colors=['#55d9ff','#9d73ff','#ff3bc7','#22d3a7','#ffb020'];fs.forEach((f,i)=>{const card=document.createElement('article');card.className='figure-card';card.innerHTML=`<canvas></canvas><div class="fname">${f.name}</div><div class="feq">${f.eq}</div><button class="use-eq">Abrir en graficador</button>`;grid.appendChild(card);drawMini(card.querySelector('canvas'),f,colors[i%colors.length]);card.addEventListener('click',e=>{if(e.target.classList.contains('use-eq')){$('#universalExpr').value=f.eq;parseUniversal(f.eq,'auto');document.querySelector('[data-view="graphing"]').click();return}openMuseum(f,colors[i%colors.length])})});museumRendered=true;bindHover();magnetic()}
 function openMuseum(f,color){currentMuseum=f;$('#museumModalName').textContent=f.name;$('#museumModalEq').textContent=f.eq;$('#museumModal').classList.add('show');requestAnimationFrame(()=>drawMini($('#museumModalCanvas'),f,color))}$('#museumModalClose').onclick=()=>$('#museumModal').classList.remove('show');$('#museumModal').onclick=e=>{if(e.target.id==='museumModal')$('#museumModal').classList.remove('show')};$('#museumUseGraph').onclick=()=>{if(!currentMuseum)return;$('#universalExpr').value=currentMuseum.eq;$('#museumModal').classList.remove('show');document.querySelector('[data-view="graphing"]').click();setTimeout(()=>parseUniversal(currentMuseum.eq,'auto'),100)};let mt;$('#museumSearch').oninput=e=>{clearTimeout(mt);mt=setTimeout(()=>renderMuseum(e.target.value),120)};
 // interactivo
 const ig=new Graph($('#interactiveCanvas'));let points=[];const presets={quad:x=>x*x/2,sin:x=>3*Math.sin(x),flat:x=>0,cubic:x=>x*x*x/8};function build(fn,n){return Array.from({length:n},(_,i)=>{const x=-8+16*i/(n-1);return{x,y:Math.round(fn(x)*100)/100}})}function updateInteractive(){const co=Interactive.lagrangeCoefficients(points);$('#interactiveEq').textContent='f(x) = '+Interactive.coeffsToString(co);ig.clearCurves();ig.clearPoints();ig.addCurve(x=>Interactive.lagrangeAt(points,x),'#9d73ff',3);points.forEach(p=>ig.addPoint(p.x,p.y,'#ff3bc7',7));ig.draw()}function resetInteractive(){points=build(presets[$('#interactivePreset').value]||presets.quad,+$('#interactivePoints').value);$('#pointsValue').textContent=points.length;updateInteractive()}$('#interactiveApply').onclick=resetInteractive;$('#interactiveReset').onclick=resetInteractive;$('#interactivePoints').oninput=e=>{$('#pointsValue').textContent=e.target.value};$('#interactivePoints').onchange=resetInteractive;let drag=-1;ig._onPointDrag=(e,phase)=>{const r=ig.canvas.getBoundingClientRect(),p=ig.screenToWorld(e.clientX-r.left,e.clientY-r.top);if(phase==='start'){let best=-1,d0=18;points.forEach((q,i)=>{const s=ig.worldToScreen(q.x,q.y),d=Math.hypot(s.x-(e.clientX-r.left),s.y-(e.clientY-r.top));if(d<d0){d0=d;best=i}});if(best>=0){drag=best;return true}}else if(phase==='move'&&drag>=0){points[drag].y=Math.round(p.y*100)/100;updateInteractive();return true}else if(phase==='end'){drag=-1;return true}return false};resetInteractive();
 // iniciar
 bindHover();magnetic();runCalculation();parseUniversal($('#universalExpr').value,'auto');window.addEventListener('load',()=>{calcGraph.resize();ug.resize();ig.resize()});
})();
