
(() => {
'use strict';
const $=id=>document.getElementById(id), qs=(s,r=document)=>r.querySelector(s), qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function showToast(message){const t=$('toast');if(!t)return;t.textContent=message;t.style.display='block';clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.style.display='none',2600)}
function go(id){if(!id)return;qsa('section').forEach(s=>s.classList.toggle('active',s.id===id));qsa('nav button').forEach(b=>b.classList.toggle('active',b.dataset.go===id));if($('contentMenu'))$('contentMenu').value=id;$('sidebar')?.classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});if(id==='registro')renderHistory()}
function compile(expr){const text=String(expr||'').trim();if(!text)return null;if(typeof math==='undefined')throw Error('La biblioteca matemática todavía no está disponible.');if(/[;{}\[\]<>]|\b(import|function|process|window|document)\b/i.test(text))throw Error('Expresión no permitida.');return math.compile(text)}
function evalC(c,x){try{const v=c.evaluate({x});return typeof v==='number'&&Number.isFinite(v)?v:null}catch(_){return null}}
function values(expr,xs){const c=compile(expr);return xs.map(x=>evalC(c,x))}
function derivative(expr,x){const d=math.derivative(expr,'x');const v=d.evaluate({x});if(!Number.isFinite(v))throw Error('La derivada no está definida en ese punto.');return v}
function numericDerivative(expr,x,h=.0001){const c=compile(expr),a=evalC(c,x+h),b=evalC(c,x-h);return a===null||b===null?null:(a-b)/(2*h)}
function fmt(v){if(v===null||v===undefined||!Number.isFinite(Number(v)))return'—';return Number(v).toFixed(5).replace(/\.?0+$/,'')}
let lastData=[];
function renderTable(expr,xs){const box=$('table');if(!box)return;const ys=values(expr,xs);box.innerHTML='<table><thead><tr><th>x</th><th>f(x)</th><th>f′(x) aprox.</th></tr></thead><tbody>'+xs.map((x,i)=>`<tr><td>${fmt(x)}</td><td>${fmt(ys[i])}</td><td>${fmt(ys[i]===null?null:numericDerivative(expr,x))}</td></tr>`).join('')+'</tbody></table>'}
function roots(expr,a,b,n=700){const c=compile(expr),out=[];let px=a,py=evalC(c,px);for(let i=1;i<=n;i++){const x=a+(b-a)*i/n,y=evalC(c,x);if(y!==null&&Math.abs(y)<1e-7)out.push(x);if(py!==null&&y!==null&&py*y<0){let lo=px,hi=x,flo=py;for(let k=0;k<45;k++){const mid=(lo+hi)/2,f=evalC(c,mid);if(f===null)break;if(flo*f<=0)hi=mid;else{lo=mid;flo=f}}out.push((lo+hi)/2)}px=x;py=y}return [...new Set(out.filter(Number.isFinite).map(v=>Number(fmt(v))))].slice(0,10).map(fmt)}
function graph(){try{if(typeof Plotly==='undefined'||typeof math==='undefined')throw Error('Espera a que carguen las herramientas matemáticas.');const exprs=['f1','f2','f3'].map(id=>$(id)?.value.trim()).filter(Boolean);if(!exprs.length)throw Error('Escribe al menos una función.');const xmin=Number($('xmin').value),xmax=Number($('xmax').value),samples=Math.min(1000,Math.max(50,Math.floor(Number($('samples').value))));if(!(xmin<xmax))throw Error('El intervalo no es válido.');exprs.forEach(compile);const xs=Array.from({length:samples},(_,i)=>xmin+(xmax-xmin)*i/(samples-1));const traces=[],all=[];exprs.forEach((expr,i)=>{const y=values(expr,xs);all.push(y);traces.push({x:xs,y,name:`f${i+1}(x)`,mode:'lines',connectgaps:false});traces.push({x:xs,y:xs.map(x=>numericDerivative(expr,x)),name:`f′${i+1}(x)`,mode:'lines',line:{dash:'dot'},connectgaps:false})});const idx=Math.max(0,Math.min(exprs.length-1,Number($('tangentFn').value)-1)),e=exprs[idx],x0=Number($('x0').value),y0=math.evaluate(e,{x:x0}),s=derivative(e,x0),b=y0-s*x0;const tx=Array.from({length:180},(_,i)=>xmin+(xmax-xmin)*i/179);traces.push({x:tx,y:tx.map(x=>s*x+b),name:'Tangente',mode:'lines',line:{dash:'dash',width:3}});Plotly.newPlot($('plot'),traces,{paper_bgcolor:'transparent',plot_bgcolor:'transparent',font:{color:'#f7fbff'},hovermode:'x unified',margin:{t:30,r:20,b:50,l:55},xaxis:{gridcolor:'#31527d',zerolinecolor:'#8ba'},yaxis:{gridcolor:'#31527d',zerolinecolor:'#8ba'},legend:{orientation:'h'}},{responsive:true,displaylogo:false,modeBarButtonsToRemove:['lasso2d','select2d']});$('metrics').innerHTML=exprs.map((e,i)=>{let d=null;try{d=derivative(e,x0)}catch(_){}return`<div class="metric"><b>f${i+1}</b><span>f(${fmt(x0)}) = ${fmt(math.evaluate(e,{x:x0}))}</span><span>f′(${fmt(x0)}) = ${fmt(d)}</span></div>`}).join('');$('roots').innerHTML=exprs.map((e,i)=>`f${i+1}: ${roots(e,xmin,xmax).join(', ')||'sin raíces aproximadas'}`).join('<br>');$('range').innerHTML=exprs.map((e,i)=>{const a=all[i].filter(v=>v!==null);return`f${i+1}: [${fmt(Math.min(...a))}, ${fmt(Math.max(...a))}]`}).join('<br>');const txs=xs.slice(0,Math.min(40,xs.length));lastData=txs.map((x,i)=>({x,f1:all[0][i]}));renderTable(exprs[0],txs);showToast('Gráfica actualizada')}catch(err){showToast(err.message||'No se pudo graficar.')}}
function rule(uId,vId,outId,quot){try{const u=$(uId).value.trim(),v=$(vId).value.trim();compile(u);compile(v);const du=math.derivative(u,'x').toString(),dv=math.derivative(v,'x').toString();$(outId).textContent=quot?`u′ = ${du}, v′ = ${dv}\n(u/v)′ = [(${du})(${v}) − (${u})(${dv})] / (${v})²`:`u′ = ${du}, v′ = ${dv}\n(u·v)′ = (${du})(${v}) + (${u})(${dv})`}catch(e){$(outId).textContent=e.message}}
function tangentModule(){try{const e=$('tanF').value.trim(),x0=Number($('tanX').value),h=Math.abs(Number($('h').value));compile(e);const y0=math.evaluate(e,{x:x0}),s=numericDerivative(e,x0,h),x=Array.from({length:180},(_,i)=>x0-5+10*i/179);Plotly.newPlot($('tanPlot'),[{x,y:values(e,x),name:'f(x)',mode:'lines'},{x,y:x.map(z=>y0+s*(z-x0)),name:'Tangente',mode:'lines',line:{dash:'dash',width:3}},{x:[x0],y:[y0],name:'x₀',mode:'markers'}],{paper_bgcolor:'transparent',plot_bgcolor:'transparent',font:{color:'#fff'},margin:{t:30,r:20,b:50,l:55},xaxis:{gridcolor:'#31527d'},yaxis:{gridcolor:'#31527d'}},{responsive:true,displaylogo:false});$('tanInfo').textContent=`f(${fmt(x0)}) = ${fmt(y0)}\nf′(${fmt(x0)}) ≈ ${fmt(s)}\ny − ${fmt(y0)} = ${fmt(s)}(x − ${fmt(x0)})`}catch(e){showToast(e.message)}}
function lessonData(){return{title:$('lessonTitle')?.value.trim()||'',level:$('lessonLevel')?.value.trim()||'',time:$('lessonTime')?.value.trim()||'',obj:$('lessonObj')?.value.trim()||'',q:$('lessonQ')?.value.trim()||'',e:$('lessonE')?.value.trim()||''}}
function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function renderLesson(d){$('lessonOutput').innerHTML=`<h3>${esc(d.title)}</h3><p><b>Nivel:</b> ${esc(d.level||'Grado décimo')} · <b>Duración:</b> ${esc(d.time||'Por definir')}</p><div class="step"><strong>1. Observar.</strong> Analiza gráficas de f(x) y f′(x).</div><div class="step"><strong>2. Calcular.</strong> ${esc(d.obj)}</div><div class="step"><strong>3. Explicar.</strong> Responde y argumenta: ${esc(d.q)}</div><div class="step"><strong>4. Transferir.</strong> Presenta como evidencia: ${esc(d.e)}</div><hr><h3>Rúbrica · 100 puntos</h3><div class="rubric"><div><span>Exactitud matemática</span><b>35</b></div><div><span>Argumentación</span><b>30</b></div><div><span>Diseño</span><b>20</b></div><div><span>Inclusión</span><b>15</b></div></div>`}
function generateLesson(){const d=lessonData();if(!d.title||!d.obj||!d.q||!d.e){$('lessonStatus').textContent='Completa título, objetivo, pregunta y evidencia.';return}renderLesson(d);$('lessonStatus').textContent='Secuencia generada correctamente.'}
function saveLesson(){localStorage.setItem('eduquestLesson',JSON.stringify(lessonData()));$('lessonStatus').textContent='Proyecto guardado en este dispositivo.';showToast('Proyecto guardado')}
async function copyLesson(){if(!$('lessonOutput').innerText.trim()||$('lessonOutput').innerText.includes('Aquí aparecerá'))generateLesson();try{await navigator.clipboard.writeText($('lessonOutput').innerText);showToast('Guion copiado')}catch(_){showToast('No fue posible copiar automáticamente.')}}
function exportLesson(){const blob=new Blob([JSON.stringify({app:'Eduquest',type:'secuencia-didactica',version:2,exportedAt:new Date().toISOString(),data:lessonData()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='eduquest-secuencia-didactica.json';a.click();URL.revokeObjectURL(url)}
function importLesson(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result).data||JSON.parse(r.result);Object.entries({lessonTitle:'title',lessonLevel:'level',lessonTime:'time',lessonObj:'obj',lessonQ:'q',lessonE:'e'}).forEach(([id,k])=>$(id).value=d[k]||'');generateLesson()}catch(_){$('lessonStatus').textContent='El JSON no es válido.'}e.target.value=''};r.readAsText(f)}
const RULES={
constant:{name:'Regla de la constante',formula:'(c)′ = 0'},
identity:{name:'Regla de la identidad',formula:'(x)′ = 1'},
power:{name:'Regla de la potencia',formula:'(xⁿ)′ = n·xⁿ⁻¹'},
multiple:{name:'Múltiplo constante',formula:'(c·f)′ = c·f′'},
sum:{name:'Suma y resta',formula:'(f ± g)′ = f′ ± g′'},
product:{name:'Regla del producto',formula:'(uv)′ = u′v + uv′'},
quotient:{name:'Regla del cociente',formula:'(u/v)′ = (u′v − uv′)/v²'},
exponential:{name:'Regla exponencial',formula:'(eᵘ)′ = eᵘ·u′'},
logarithm:{name:'Regla del logaritmo',formula:'(ln u)′ = u′/u'},
trig:{name:'Regla trigonométrica',formula:'(sin u)′=cos(u)u′; (cos u)′=−sin(u)u′; (tan u)′=sec²(u)u′'},
chain:{name:'Regla de la cadena',formula:'(f(g(x)))′ = f′(g(x))·g′(x)'}
};
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[rnd(0,a.length-1)];
const shuffle=a=>a.map(v=>({v,r:Math.random()})).sort((x,y)=>x.r-y.r).map(x=>x.v);
const exerciseFrom=(q,correct,rule,steps,level=1)=>{
  const distractors=shuffle([
    correct,
    pick(['0','1','x','2x','x²','−x','2','3x','x+1','sin(x)','cos(x)','−sin(x)','sec²(x)']),
    pick(['x²+1','2x+1','x−1','3x²','4x','−2x','5x²','x³'])
  ]).filter((v,i,a)=>a.indexOf(v)===i);
  while(distractors.length<4){
    const extra=pick(['0','1','x','2x','3x','−x','x²','4x²','6x','−sin(x)','cos(x)','2']);
    if(!distractors.includes(extra))distractors.push(extra);
  }
  const opts=distractors.slice(0,4),a=opts.indexOf(correct);
  return {q,o:opts,a,e:{rule,steps,correct},level};
};
function generateRandomExercise(){
  const n=rnd(2,6), c=rnd(2,7), k=rnd(1,9), m=rnd(2,5), p=rnd(2,6);
  const type=rnd(0,11);
  if(type===0)return exerciseFrom('Deriva f(x) = '+c+' (constante).','0',RULES.constant.name,'1. La función es una constante. 2. Las constantes no cambian con x. 3. Por tanto, f′(x)=0.',1);
  if(type===1)return exerciseFrom('Deriva f(x) = x.','1',RULES.identity.name,'1. La función es la identidad. 2. La pendiente de y=x es 1. 3. Por tanto, f′(x)=1.',1);
  if(type===2){const correct=n+'x^'+(n-1);return exerciseFrom('Deriva f(x) = x^'+n+'.',correct,RULES.power.name,'1. Aplica n·x^(n−1). 2. Sustituye n='+n+'. 3. Resultado: '+correct+'.',1)}
  if(type===3){const correct=c+'*'+m+'x^'+(m-1);return exerciseFrom('Deriva f(x) = '+c+'x^'+m+'.',correct,RULES.multiple.name,'1. Conserva el múltiplo '+c+'. 2. Deriva x^'+m+' como '+m+'x^'+(m-1)+'. 3. Multiplica: '+c+'·'+m+'x^'+(m-1)+' = '+correct+'.',1)}
  if(type===4){const correct=n+'x^'+(n-1)+' + '+c;return exerciseFrom('Deriva f(x) = x^'+n+' + '+c+'x.',correct,RULES.sum.name,'1. Deriva cada término. 2. (x^'+n+')′='+n+'x^'+(n-1)+'. 3. ('+c+'x)′='+c+'. 4. Suma los resultados.',2)}
  if(type===5){const correct=m+'x^'+(m-1)+'(x^'+n+') + x^'+m+'('+n+'x^'+(n-1)+')';return exerciseFrom('Usa la regla del producto en f(x)=x^'+m+'·x^'+n+'.',correct,RULES.product.name,'1. u=x^'+m+', v=x^'+n+'. 2. u′='+m+'x^'+(m-1)+' y v′='+n+'x^'+(n-1)+'. 3. Aplica u′v+uv′. 4. Puedes simplificar después.',2)}
  if(type===6){const correct='(2x·(x^'+m+' + '+k+') − (x²+1)·'+m+'x^'+(m-1)+')/(x^'+m+' + '+k+')²';return exerciseFrom('Deriva f(x)=(x²+1)/(x^'+m+' + '+k+').',correct,RULES.quotient.name,'1. u=x²+1, v=x^'+m+'+'+k+'. 2. u′=2x y v′='+m+'x^'+(m-1)+'. 3. Sustituye en (u′v−uv′)/v².',3)}
  if(type===7){const correct='e^('+c+'x)·'+c;return exerciseFrom('Deriva f(x)=e^('+c+'x).',correct,RULES.exponential.name,'1. Identifica u='+c+'x. 2. (e^u)′=e^u·u′. 3. u′='+c+'. 4. Resultado: '+correct+'.',2)}
  if(type===8){const correct=c+'/x';return exerciseFrom('Deriva f(x)=ln('+c+'x).',correct,RULES.logarithm.name,'1. Identifica u='+c+'x. 2. (ln u)′=u′/u. 3. u′='+c+'. 4. c/('+c+'x)=1/x. Para evitar confusión, la respuesta equivalente es '+correct+'.',2)}
  if(type===9){const trig=pick(['sin','cos','tan']);const inner=c+'x';let correct,steps;if(trig==='sin'){correct='cos('+inner+')·'+c;steps='1. Exterior: sin(u) → cos(u). 2. Interior u='+inner+' tiene derivada '+c+'. 3. Multiplica: cos('+inner+')·'+c+'.'}else if(trig==='cos'){correct='−sin('+inner+')·'+c;steps='1. Exterior: cos(u) → −sin(u). 2. Interior u='+inner+' tiene derivada '+c+'. 3. Multiplica.'}else{correct='sec²('+inner+')·'+c;steps='1. Exterior: tan(u) → sec²(u). 2. Interior u='+inner+' tiene derivada '+c+'. 3. Multiplica.'}return exerciseFrom('Deriva f(x)='+trig+'('+inner+').',correct,RULES.trig.name,steps,2)}
  const correct=(n*c)+'x^'+(n-1);return exerciseFrom('Deriva f(x)=('+c+'x²+'+k+')^'+n+'.',correct,RULES.chain.name,'1. Función exterior: u^'+n+'. 2. Derivada exterior: '+n+'u^'+(n-1)+'. 3. Interior u='+c+'x²+'+k+' tiene derivada '+(2*c)+'x. 4. Multiplica: '+n+'·('+c+'x²+'+k+')^'+(n-1)+'·'+(2*c)+'x = '+correct+'.',3);
}
let exercises=[];
let exIndex=0,score=0,attempts=0,selected=null,roundAnswered=false;
function newExerciseRound(){
  exercises=Array.from({length:12},()=>generateRandomExercise());
  exIndex=0;score=0;attempts=0;selected=null;roundAnswered=false;
  if($('scoreValue'))$('scoreValue').textContent='0';
  if($('attemptValue'))$('attemptValue').textContent='0';
  renderExercise();
}
function renderExercise(){
  const e=exercises[exIndex];
  $('exerciseQuestion').textContent=e.q;
  $('exerciseCounter').textContent='Ejercicio '+(exIndex+1)+' de '+exercises.length;
  $('exerciseLevel').textContent='NIVEL '+e.level;
  $('exerciseOptions').innerHTML=shuffle(e.o.map((x,i)=>({text:x,index:i}))).map(x=>'<button class="option" data-option="'+x.index+'">'+x.text+'</button>').join('');
  $('exerciseFeedback').innerHTML='Selecciona una opción y pulsa <b>Comprobar</b>.';
  selected=null;roundAnswered=false;
  $('progressValue').textContent=Math.round((exIndex/exercises.length)*100)+'%';
}
function checkExercise(){
  if(roundAnswered)return showToast('Ya comprobaste este ejercicio. Pulsa “Siguiente”.');
  if(selected===null)return showToast('Selecciona una respuesta.');
  const e=exercises[exIndex];attempts++;$('attemptValue').textContent=attempts;
  qsa('.option').forEach(b=>{const i=Number(b.dataset.option);if(i===e.a)b.classList.add('correct');if(i===selected&&i!==e.a)b.classList.add('wrong');b.disabled=true});
  if(selected===e.a){
    score++;$('scoreValue').textContent=score;
    $('exerciseFeedback').innerHTML='<b>✅ ¡Correcto!</b><br>'+e.e.steps+'<br><br><b>Regla:</b> '+e.e.rule+'<br><b>Respuesta:</b> '+e.e.correct;
  }else{
    $('exerciseFeedback').innerHTML='<b>❌ No es correcto.</b><br><b>Respuesta correcta:</b> '+e.e.correct+'<br><b>Regla:</b> '+e.e.rule+'<br><b>Procedimiento:</b> '+e.e.steps;
  }
  roundAnswered=true;
  $('progressValue').textContent=Math.round(((exIndex+1)/exercises.length)*100)+'%';
}
function nextExercise(){
  if(exIndex<exercises.length-1){exIndex++;renderExercise();}
  else{
    const pct=Math.round((score/exercises.length)*100);
    $('exerciseFeedback').innerHTML='<b>🎉 Ronda terminada.</b><br>Obtuviste '+score+' de '+exercises.length+' ('+pct+'%).<br><br><b>Diagnóstico:</b> '+(pct>=90?'Dominio excelente.':pct>=70?'Buen desempeño; refuerza las reglas donde fallaste.':'Conviene repasar las reglas y practicar nuevamente.')+'<br><br>Pulsa “Siguiente” para generar una nueva ronda aleatoria.';
    $('nextExercise').textContent='Nueva ronda aleatoria';
    $('nextExercise').onclick=()=>{$('nextExercise').textContent='Siguiente';newExerciseRound()};
  }
}
function getHistory(){try{return JSON.parse(localStorage.getItem('eduquestVisits')||'[]')}catch(_){return[]}}
function recordLogin(){const name=$('userName').value.trim();if(!name){$('loginStatus').textContent='Escribe tu nombre para ingresar.';return false}const role=$('userRole').value,grade=$('userGrade').value.trim()||'No indicado',now=new Date(),entry={name,role,grade,date:now.toLocaleDateString('es-CO'),time:now.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})};const h=getHistory();h.unshift(entry);localStorage.setItem('eduquestVisits',JSON.stringify(h.slice(0,100)));sessionStorage.setItem('eduquestCurrent',JSON.stringify(entry));updateUser(entry);renderHistory();return true}
function updateUser(e){if(!e)return;$('currentUser').textContent=`${e.name} · ${e.role}`;$('welcomeUser').textContent=`· ${e.name}`;$('dashboardName').textContent=e.name.split(' ')[0]}
function renderHistory(){const h=getHistory(),box=$('loginHistory');$('totalVisits').textContent=h.length;$('lastVisit').textContent=h[0]?`${h[0].date} ${h[0].time}`:'—';const cur=JSON.parse(sessionStorage.getItem('eduquestCurrent')||'null');$('activeProfile').textContent=cur?cur.role:'—';box.innerHTML=h.length?h.map(x=>`<div class="history-item"><div><b>${esc(x.name)}</b><br><small>${esc(x.role)} · ${esc(x.grade)}</small></div><small>${x.date} · ${x.time}</small></div>`).join(''):'<p class="muted">Todavía no hay registros.</p>'}
function setupWelcome(){const overlay=$('welcomeOverlay'),login=$('loginOverlay'),img=$('welcomeImage');document.documentElement.style.setProperty('--welcome-bg',`url("${img.src.replace(/"/g,'\\"')}")`);$('startLab').addEventListener('click',()=>{overlay.classList.add('is-hidden');setTimeout(()=>{login.classList.add('open');login.setAttribute('aria-hidden','false');$('userName').focus()},350)})}
function bind(){document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)go(b.dataset.go);const opt=e.target.closest('[data-option]');if(opt){selected=Number(opt.dataset.option);qsa('.option').forEach(x=>x.classList.remove('selected'));opt.classList.add('selected')}});$('loginBtn').addEventListener('click',()=>{if(recordLogin()){$('loginOverlay').classList.remove('open');$('loginOverlay').setAttribute('aria-hidden','true');go('inicio')}});$('contentMenu').addEventListener('change',e=>go(e.target.value));$('hamb').addEventListener('click',()=>$('sidebar').classList.toggle('open'));$('contrast').addEventListener('click',()=>document.body.classList.toggle('hiContrast'));$('graphBtn').addEventListener('click',graph);$('prodBtn').addEventListener('click',()=>rule('prodU','prodV','prodOut',false));$('quotBtn').addEventListener('click',()=>rule('quotU','quotV','quotOut',true));$('tanBtn').addEventListener('click',tangentModule);$('genLesson').addEventListener('click',generateLesson);$('saveLesson').addEventListener('click',saveLesson);$('copyLesson').addEventListener('click',copyLesson);$('exportLesson').addEventListener('click',exportLesson);$('importLesson').addEventListener('change',importLesson);$('checkExercise').addEventListener('click',checkExercise);$('nextExercise').addEventListener('click',nextExercise);$('clearHistory').addEventListener('click',()=>{if(confirm('¿Limpiar el historial de ingresos?')){localStorage.removeItem('eduquestVisits');renderHistory()}});$('pngBtn').addEventListener('click',()=>{if($('plot')?.data)Plotly.downloadImage($('plot'),{format:'png',filename:'eduquest-derivadas',width:1400,height:800});else showToast('Primero genera una gráfica.')});$('csvBtn').addEventListener('click',()=>{if(!lastData.length)return showToast('Primero genera una gráfica.');const rows=[['x','f1'],...lastData.map(r=>[r.x,r.f1??''])],url=URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\\n')],{type:'text/csv'})),a=document.createElement('a');a.href=url;a.download='eduquest-valores.csv';a.click();URL.revokeObjectURL(url)});$('speakBtn').addEventListener('click',()=>{if(!('speechSynthesis'in window))return showToast('La síntesis de voz no está disponible.');const t=($('metrics').innerText+' '+$('roots').innerText).trim();if(!t)return showToast('Primero genera una gráfica.');speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(t))})}
async function init(){setupWelcome();bind();renderExercise();renderHistory();const saved=localStorage.getItem('eduquestLesson');if(saved)try{const d=JSON.parse(saved);Object.entries({lessonTitle:'title',lessonLevel:'level',lessonTime:'time',lessonObj:'obj',lessonQ:'q',lessonE:'e'}).forEach(([id,k])=>$(id).value=d[k]||'');if(d.title&&d.obj&&d.q&&d.e)renderLesson(d)}catch(_){}const cur=JSON.parse(sessionStorage.getItem('eduquestCurrent')||'null');if(cur)updateUser(cur);for(let i=0;i<30&&typeof math==='undefined';i++)await wait(100);if(typeof math!=='undefined'&&typeof Plotly!=='undefined')graph()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
