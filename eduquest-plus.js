(() => {
'use strict';
const $=id=>document.getElementById(id);
const safeEval=(expr,x)=>{try{const v=math.evaluate(expr,{x});return Number.isFinite(v)?v:null}catch(_){return null}};
const fmt=v=>Number.isFinite(v)?Number(v).toFixed(3).replace(/\\.?0+$/,''):'—';
function updateConcept(){
 const expr=$('arFunction').value,x0=Number($('arX').value),h=Number($('arH').value);
 const y0=safeEval(expr,x0),yh=safeEval(expr,x0+h);
 let slope=(y0===null||yh===null)?null:(yh-y0)/h;
 let exact=null;try{exact=math.derivative(expr,'x').evaluate({x:x0})}catch(_){}
 $('arXOut').textContent=fmt(x0);$('arHOut').textContent=fmt(h);
 $('arSlope').textContent='Secante: '+fmt(slope)+' · Derivada: '+fmt(exact);
 $('arExplanation').textContent=h<.12?'¡Muy cerca! La pendiente de la secante se aproxima a la derivada en x₀.':'Al disminuir h, el segundo punto se acerca al primero y la secante se aproxima a la tangente.';
 const xs=Array.from({length:161},(_,i)=>-3+i*6/160),ys=xs.map(x=>safeEval(expr,x));
 const tangent=xs.map(x=>exact===null||y0===null?null:y0+exact*(x-x0));
 const sec=xs.map(x=>slope===null||y0===null?null:y0+slope*(x-x0));
 Plotly.react('arPlot',[
 {x:xs,y:ys,name:'Función f(x)',mode:'lines',line:{width:3}},
 {x:xs,y:tangent,name:'Tangente',mode:'lines',line:{dash:'dash',width:3}},
 {x:xs,y:sec,name:'Secante',mode:'lines',line:{dash:'dot'}},
 {x:[x0,x0+h],y:[y0,yh],name:'Puntos',mode:'markers',marker:{size:10}}
 ],{paper_bgcolor:'transparent',plot_bgcolor:'transparent',font:{color:'#f8fbff'},margin:{t:20,r:15,b:45,l:45},xaxis:{gridcolor:'#31527d'},yaxis:{gridcolor:'#31527d'},legend:{orientation:'h'}},{responsive:true,displaylogo:false});
 updateARLabel(expr,x0,exact);
}
function updateARLabel(expr,x,slope){
 const label=$('arFormulaLabel');if(label)label.setAttribute('value','f(x) = '+expr+' | x₀ = '+fmt(x)+' | f′(x₀) = '+fmt(slope));
}
let arStarted=false;
function startAR(){
 if(arStarted)return;
 const stage=$('arStage');
 stage.innerHTML='<a-scene embedded vr-mode-ui="enabled: false" renderer="logarithmicDepthBuffer: true; antialias: true" arjs="sourceType: webcam; debugUIEnabled: false;"><a-assets></a-assets><a-marker preset="hiro"><a-entity id="arAxes"><a-cylinder position="0 0.01 0" radius="0.012" height="1.8" rotation="0 0 90" color="#28d4c1"></a-cylinder><a-cylinder position="0 0.01 0" radius="0.012" height="1.8" color="#ffd45a"></a-cylinder><a-sphere id="arPoint" position="0.35 0.35 0" radius="0.07" color="#ff9d45"></a-sphere><a-cylinder id="arTangent" position="0.35 0.35 0" radius="0.018" height="1.1" rotation="0 0 45" color="#4aa8ff"></a-cylinder><a-text id="arFormulaLabel" value="f(x) = x²" position="-0.8 1.05 0" color="#ffffff" width="3"></a-text><a-text value="Punto y recta tangente" position="-0.8 -0.18 0" color="#ffd45a" width="2.5"></a-text></a-entity></a-marker><a-entity camera></a-entity></a-scene>';
 const scene=stage.querySelector('a-scene');
 $('arStatus').textContent='Cargando experiencia… acepta el permiso de cámara si el navegador lo solicita.';
 const load=(src)=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
 Promise.resolve().then(async()=>{if(!window.AFRAME)await load('https://aframe.io/releases/1.5.0/aframe.min.js');if(!window.THREEx)await load('https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.7/aframe/build/aframe-ar.js');if(!window.THREEx)throw Error('No fue posible cargar AR.js.');await new Promise(resolve=>scene.addEventListener('loaded',resolve,{once:true}));arStarted=true;$('arStatus').textContent='AR activa. Enfoca el marcador Hiro con la cámara.'}).catch(err=>{$('arStatus').textContent='No se pudo iniciar AR: '+err.message+'. Comprueba HTTPS, permisos y conexión.';});
}
function stopAR(){
 const scene=$('arStage').querySelector('a-scene');
 if(scene){const video=scene.querySelector('video');if(video?.srcObject)video.srcObject.getTracks().forEach(t=>t.stop());scene.remove();}
 arStarted=false;$('arStage').innerHTML='<div class="ar-placeholder"><b>🧊 Modelo matemático aumentado</b><span>Activa la cámara para visualizar el modelo sobre el marcador.</span></div>';$('arStatus').textContent='Cámara cerrada.';
}
const missions=[
 {id:'secante',icon:'📐',title:'De secante a tangente',desc:'Explora cómo cambia la pendiente al acercar dos puntos.',xp:30},
 {id:'slope',icon:'📈',title:'Interpreta la pendiente',desc:'Relaciona el signo de la derivada con el crecimiento.',xp:30},
 {id:'chain',icon:'⛓️',title:'Domina la cadena',desc:'Reconoce la derivada de una función compuesta.',xp:40},
 {id:'trig',icon:'🌊',title:'Derivadas trigonométricas',desc:'Identifica derivadas de seno y coseno.',xp:40}
];
const challenges=[
 {q:'Si f(x)=x², ¿cuál es la pendiente de la tangente en x=2?',o:['2','4','8'],a:1,why:'f′(x)=2x; por tanto f′(2)=4.'},
 {q:'Si f′(x) es negativa en un intervalo, la función es…',o:['Decreciente','Creciente','Constante'],a:0,why:'Una derivada negativa indica pendiente negativa.'},
 {q:'La derivada de (3x+1)² es…',o:['2(3x+1)','6(3x+1)','3(3x+1)'],a:1,why:'Regla de la cadena: 2(3x+1)·3.'},
 {q:'La derivada de sen(x) es…',o:['−cos(x)','cos(x)','−sen(x)'],a:1,why:'La derivada del seno es coseno.'}
];
let challengeIndex=0,chosen=null,earned=new Set(JSON.parse(localStorage.getItem('eduquestMissions')||'[]'));
function renderMissions(){
 const xp=missions.filter(m=>earned.has(m.id)).reduce((s,m)=>s+m.xp,0);
 $('xpTotal').textContent=xp+' XP';$('missionDone').textContent=earned.size+'/4';
 $('missionLevel').textContent=xp>=100?'Experto':xp>=60?'Investigador':xp>=30?'Explorador avanzado':'Explorador';
 $('missionList').innerHTML=missions.map(m=>'<div class="mission-item '+(earned.has(m.id)?'done':'')+'"><span class="mission-icon">'+m.icon+'</span><div><strong>'+m.title+'</strong><p>'+m.desc+'</p></div><b>'+(earned.has(m.id)?'✓ Completada':m.xp+' XP')+'</b></div>').join('');
 const badges=['🔎 Primeros pasos'];if(earned.size>=1)badges.push('📐 Explorador de tangentes');if(earned.size>=2)badges.push('📈 Lector de pendientes');if(earned.size>=4)badges.push('🏆 Maestro de derivadas');
 $('badgeShelf').innerHTML=badges.map(b=>'<span class="badge">'+b+'</span>').join('');
}
function renderChallenge(){const c=challenges[challengeIndex];$('missionQuestion').textContent=c.q;$('missionOptions').innerHTML=c.o.map((o,i)=>'<button class="option" data-mission-option="'+i+'">'+o+'</button>').join('');$('missionFeedback').textContent='Selecciona una respuesta.';chosen=null;}
function bindPlus(){
 ['arFunction','arX','arH'].forEach(id=>$(id)?.addEventListener('input',updateConcept));
 $('startAR')?.addEventListener('click',startAR);$('stopAR')?.addEventListener('click',stopAR);
 $('missionOptions')?.addEventListener('click',e=>{const b=e.target.closest('[data-mission-option]');if(!b)return;chosen=Number(b.dataset.missionOption);[...$('missionOptions').children].forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
 $('missionCheck')?.addEventListener('click',()=>{if(chosen===null){$('missionFeedback').textContent='Selecciona una respuesta.';return}const c=challenges[challengeIndex],m=missions[challengeIndex];if(chosen===c.a){earned.add(m.id);localStorage.setItem('eduquestMissions',JSON.stringify([...earned]));$('missionFeedback').textContent='¡Correcto! '+c.why+' Has ganado '+m.xp+' XP.';renderMissions()}else $('missionFeedback').textContent='Inténtalo de nuevo. Pista: '+c.why});
 $('missionNext')?.addEventListener('click',()=>{challengeIndex=(challengeIndex+1)%challenges.length;renderChallenge()});
 document.querySelectorAll('button[data-go]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.go==='laboratorioAR')setTimeout(()=>{if(window.Plotly)updateConcept()},100)}));
 updateConcept();renderMissions();renderChallenge();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindPlus,{once:true});else bindPlus();
window.addEventListener('beforeunload',stopAR);
})();