/* MathEngine: parser matemático ligero, sin dependencias externas. */
(function(global){
  const FUNCTIONS={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,sqrt:Math.sqrt,abs:Math.abs,exp:Math.exp,log:Math.log10,ln:Math.log,floor:Math.floor,ceil:Math.ceil,round:Math.round,sign:Math.sign};
  const CONSTANTS={pi:Math.PI,e:Math.E,tau:Math.PI*2};
  function normalize(s){return String(s).replace(/[−–—]/g,'-').replace(/²/g,'^2').replace(/³/g,'^3').replace(/⁴/g,'^4').replace(/√/g,'sqrt').replace(/π/g,'pi').replace(/θ/g,'theta').replace(/Θ/g,'theta').replace(/\[/g,'(').replace(/\]/g,')').replace(/\s+/g,'').toLowerCase();}
  function tokenize(expr){
    const src=normalize(expr),tokens=[]; let i=0;
    while(i<src.length){const c=src[i];
      if(/[0-9.]/.test(c)){let j=i,dots=0;while(j<src.length&&/[0-9.]/.test(src[j])){if(src[j]==='.')dots++;j++;}const raw=src.slice(i,j);if(dots>1||raw==='.'){throw new Error('Número inválido: '+raw)}tokens.push({type:'num',value:parseFloat(raw)});i=j;continue;}
      if(/[a-z]/.test(c)){let j=i;while(j<src.length&&/[a-z]/.test(src[j]))j++;const w=src.slice(i,j);if(FUNCTIONS[w])tokens.push({type:'func',value:w});else if(CONSTANTS[w]!==undefined)tokens.push({type:'num',value:CONSTANTS[w]});else if(w==='x'||w==='t'||w==='theta')tokens.push({type:'var',value:w});else throw new Error('Símbolo no reconocido: '+w);i=j;continue;}
      if('+-*/^%(),'.includes(c)){tokens.push({type:c==='('? 'lparen':c===')'?'rparen':c===','?'comma':'op',value:c});i++;continue;}
      throw new Error('Carácter inválido: '+c);
    }
    const out=[];for(let k=0;k<tokens.length;k++){const t=tokens[k],p=tokens[k-1];if(p){const left=p.type==='num'||p.type==='var'||p.type==='rparen';const right=t.type==='num'||t.type==='var'||t.type==='func'||t.type==='lparen';if(left&&right)out.push({type:'op',value:'*'});}out.push(t);}return out;
  }
  const PREC={'+':2,'-':2,'*':3,'/':3,'%':3,'u-':5,'^':6};const RIGHT={u:true,'^':true};
  function toRPN(tokens){const out=[],stack=[];let prev=null;for(const t of tokens){
    if(t.type==='num'||t.type==='var')out.push(t);
    else if(t.type==='func')stack.push(t);
    else if(t.type==='comma'){while(stack.length&&stack.at(-1).type!=='lparen')out.push(stack.pop());}
    else if(t.type==='op'){let op=t.value;if(op==='-'&&(prev===null||prev==='op'||prev==='lparen'||prev==='comma'))op='u-';if(op!=='u-'){while(stack.length){const top=stack.at(-1);if(top.type==='op'&&((RIGHT[op]?PREC[top.value]>PREC[op]:PREC[top.value]>=PREC[op])))out.push(stack.pop());else break;}}stack.push({type:'op',value:op});}
    else if(t.type==='lparen')stack.push(t);
    else if(t.type==='rparen'){while(stack.length&&stack.at(-1).type!=='lparen')out.push(stack.pop());if(!stack.length)throw new Error('Paréntesis desbalanceados');stack.pop();if(stack.length&&stack.at(-1).type==='func')out.push(stack.pop());}
    prev=t.type;
  }while(stack.length){const z=stack.pop();if(z.type==='lparen')throw new Error('Paréntesis desbalanceados');out.push(z);}return out;}
  function evalRPN(rpn,x){const st=[];for(const t of rpn){if(t.type==='num')st.push(t.value);else if(t.type==='var')st.push(x);else if(t.type==='func'){const a=st.pop();st.push(FUNCTIONS[t.value](a));}else{if(t.value==='u-'){st.push(-st.pop());continue;}const b=st.pop(),a=st.pop();if(!Number.isFinite(a)||!Number.isFinite(b))return NaN;switch(t.value){case'+':st.push(a+b);break;case'-':st.push(a-b);break;case'*':st.push(a*b);break;case'/':st.push(a/b);break;case'%':st.push(a%b);break;case'^':st.push(Math.pow(a,b));break;}}}return st.length===1?st[0]:NaN;}
  class CompiledExpr{constructor(source){this.source=source;this.rpn=toRPN(tokenize(source));}at(x){try{const v=evalRPN(this.rpn,x);return Number.isFinite(v)?v:NaN}catch{return NaN;}}}
  function compile(s){return new CompiledExpr(s);}
  function findRoots(fn,min,max,steps=4000){const roots=[],dx=(max-min)/steps;let px=min,py=fn.at(px);for(let i=1;i<=steps;i++){const x=min+i*dx,y=fn.at(x);if(Number.isFinite(py)&&Number.isFinite(y)){if(Math.abs(y)<1e-8)roots.push(x);else if(py*y<0){let a=px,b=x,fa=py;for(let k=0;k<55;k++){const m=(a+b)/2,fm=fn.at(m);if(!Number.isFinite(fm))break;if(fa*fm<=0)b=m;else{a=m;fa=fm;}}roots.push((a+b)/2);}}px=x;py=y;}roots.sort((a,b)=>a-b);return roots.filter((r,i)=>i===0||Math.abs(r-roots[i-1])>1e-4).map(r=>Math.round(r*1e6)/1e6);}
  global.MathEngine={compile,findRoots,FUNCTIONS,CONSTANTS,normalize};
})(window);
