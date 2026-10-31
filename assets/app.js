(function(){
const LS='olymp9-progress';
const T=localStorage.getItem('olymp9-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
document.documentElement.dataset.theme=T;
window.P={get(){try{return JSON.parse(localStorage.getItem(LS))||{s:{},m:[]}}catch(e){return{s:{},m:[]}}},
 save(p){localStorage.setItem(LS,JSON.stringify(p))},
 rec(sec,pct){const p=P.get();const r=p.s[sec]||{best:0,last:0,n:0};r.last=pct;r.best=Math.max(r.best,pct);r.n++;p.s[sec]=r;P.save(p)},
 mock(o){const p=P.get();p.m.push(o);p.m=p.m.slice(-10);P.save(p)}};
document.addEventListener('DOMContentLoaded',()=>{
 const tb=document.getElementById('themeBtn');
 const upd=()=>tb&&(tb.textContent=document.documentElement.dataset.theme==='dark'?'☀️':'🌙');upd();
 tb&&tb.addEventListener('click',()=>{const n=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.setItem('olymp9-theme',n);upd()});
 const mb=document.getElementById('menuBtn');mb&&mb.addEventListener('click',()=>document.querySelector('nav.menu').classList.toggle('open'));
 document.querySelectorAll('[data-quiz]').forEach(el=>Quiz(el,el.dataset.quiz));
 const mk=document.getElementById('mock');mk&&Mock(mk);
 const db=document.getElementById('dash');db&&Dash(db);
 const gs=document.getElementById('gsearch');gs&&gs.addEventListener('input',()=>{const v=gs.value.toLowerCase().trim();let c=0;document.querySelectorAll('.gl .it').forEach(d=>{const s=!v||d.textContent.toLowerCase().includes(v);d.style.display=s?'':'none';if(s)c++});document.getElementById('gcount').textContent=c});
});
const esc=s=>String(s);
function shuf(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const TAG={single:'один ответ',multi:'несколько ответов',tf:'верно / неверно',match:'соответствие',num:'задача',order:'последовательность'};
function norm(s){return String(s).toLowerCase().replace(/\s+/g,'').replace(/,/g,'.').replace(/%$/,'')}
// build question DOM; returns {el,check(show)->score 0..1}
function buildQ(q,i,instant){
 const d=document.createElement('div');d.className='q';
 const h=`<div class="qh"><span class="n">${i+1}.</span><span class="tag">${TAG[q.t]}</span>${q.sec&&window.SECN?`<span class="tag">${SECN[q.sec]}</span>`:''}</div><div>${q.q}</div>`;
 let body='',check;const nm='q'+Math.random().toString(36).slice(2);
 if(q.t==='single'||q.t==='multi'){
  const ord=shuf(q.o.map((_,k)=>k));const typ=q.t==='single'?'radio':'checkbox';
  body=ord.map(k=>`<label class="opt"><input type="${typ}" name="${nm}" value="${k}"><span>${q.o[k]}</span></label>`).join('');
  check=()=>{const sel=[...d.querySelectorAll('input:checked')].map(x=>+x.value);const ans=q.t==='single'?[q.a]:q.a;
   d.querySelectorAll('.opt').forEach(l=>{const v=+l.querySelector('input').value;l.classList.remove('good','wrong');if(ans.includes(v))l.classList.add('good');else if(sel.includes(v))l.classList.add('wrong')});
   const ok=sel.length===ans.length&&ans.every(a=>sel.includes(a));return {s:ok?1:0,answered:sel.length>0}};
 }else if(q.t==='tf'){
  body=`<label class="opt"><input type="radio" name="${nm}" value="1"><span>Верно</span></label><label class="opt"><input type="radio" name="${nm}" value="0"><span>Неверно</span></label>`;
  check=()=>{const s=d.querySelector('input:checked');d.querySelectorAll('.opt').forEach(l=>{const v=l.querySelector('input').value==='1';l.classList.remove('good','wrong');if(v===q.a)l.classList.add('good');else if(s&&l.contains(s))l.classList.add('wrong')});return{s:s&&(s.value==='1')===q.a?1:0,answered:!!s}};
 }else if(q.t==='match'||q.t==='order'){
  const R=q.t==='order'?q.l.map((_,k)=>String(k+1)):q.r;
  const lo=q.t==='order'?shuf(q.l.map((_,k)=>k)):q.l.map((_,k)=>k);
  body=(q.t==='match'?`<div class="small">Варианты: ${q.r.map((r,k)=>`<b>${k+1})</b> ${r}`).join('; ')}</div>`:'<div class="small">Поставьте номер позиции в правильной последовательности.</div>')+lo.map(k=>`<div class="mrow"><span>${q.t==='match'?String.fromCharCode(1040+k)+') ':''}${q.l[k]}</span><select data-k="${k}"><option value="">—</option>${R.map((r,j)=>`<option value="${j}">${j+1}</option>`).join('')}</select></div>`).join('');
  check=()=>{let c=0,an=false;d.querySelectorAll('select').forEach(s=>{const k=+s.dataset.k;const corr=q.t==='order'?q.a.indexOf(k):q.a[k];if(s.value!=='')an=true;const ok=s.value!==''&&+s.value===corr;s.classList.remove('good','wrong');s.classList.add(ok?'good':'wrong');if(ok)c++});return{s:c/q.l.length,answered:an}};
 }else if(q.t==='num'){
  body=`<div class="mrow"><input type="text" placeholder="${q.ph||'Ваш ответ'}" aria-label="ответ"></div>`;
  check=()=>{const inp=d.querySelector('input');const ok=[].concat(q.a).some(a=>norm(a)===norm(inp.value));inp.classList.remove('good','wrong');inp.classList.add(ok?'good':'wrong');return{s:ok?1:0,answered:inp.value.trim()!==''}};
 }
 const corrTxt=()=>{if(q.t==='single')return q.o[q.a];if(q.t==='multi')return q.a.map(k=>q.o[k]).join('; ');if(q.t==='tf')return q.a?'Верно':'Неверно';if(q.t==='match')return q.l.map((l,k)=>String.fromCharCode(1040+k)+'–'+(q.a[k]+1)).join(', ');if(q.t==='order')return q.a.map(k=>q.l[k]).join(' → ');return [].concat(q.a)[0]};
 d.innerHTML=h+body+(instant?`<div class="mrow"><button class="btn sm alt chk">Проверить</button><span class="rs"></span></div>`:'')+`<div class="exp"><b>Ответ:</b> ${corrTxt()}<br>${q.e||''}</div>`;
 const api={el:d,q,done:false,score:0,check(){const r=check();api.score=r.s;api.done=true;d.querySelectorAll('input,select').forEach(x=>x.disabled=true);d.querySelector('.exp').classList.add('show');const rs=d.querySelector('.rs');if(rs){rs.innerHTML=r.s===1?'<span class="res-ok">✔ Верно</span>':r.s>0?`<span class="res-bad">Частично (${Math.round(r.s*100)}%)</span>`:'<span class="res-bad">✘ Неверно</span>'};const b=d.querySelector('.chk');if(b)b.disabled=true;return r}};
 if(instant)d.querySelector('.chk').addEventListener('click',()=>{api.check();window.dispatchEvent(new Event('qchecked'))});
 return api;
}
window.Quiz=function(el,sec){
 function start(){
  const qs=shuf(QB[sec]);el.innerHTML='';const items=qs.map((q,i)=>buildQ(q,i,true));items.forEach(it=>el.appendChild(it.el));
  const bar=document.createElement('div');bar.className='qbar';bar.innerHTML=`<span class="prog">0 / ${items.length}</span><button class="btn or fin">Завершить тест</button><button class="btn alt re">↻ Заново (перемешать)</button><span class="score"></span>`;el.appendChild(bar);
  const upd=()=>{const dn=items.filter(i=>i.done);bar.querySelector('.prog').textContent=`Проверено ${dn.length} / ${items.length} · баллы ${dn.reduce((a,i)=>a+i.score,0).toFixed(1)}`};
  window.addEventListener('qchecked',upd);
  bar.querySelector('.re').onclick=()=>{window.removeEventListener('qchecked',upd);start();el.scrollIntoView()};
  bar.querySelector('.fin').onclick=()=>{items.forEach(i=>{if(!i.done)i.check()});const s=items.reduce((a,i)=>a+i.score,0);const pct=Math.round(100*s/items.length);P.rec(sec,pct);
   bar.querySelector('.score').innerHTML=`${s.toFixed(1)} / ${items.length} = ${pct}% ${pct>=85?'🏆 Отлично!':pct>=65?'👍 Хорошо, повторите ошибки':'📚 Перечитайте теорию'}`;upd();bar.querySelector('.fin').disabled=true};
 }
 start();
};
window.Mock=function(el){
 const N=parseInt(el.dataset.n||55),MIN=parseInt(el.dataset.min||90);
 el.querySelector('.go').onclick=()=>{
  const secs=Object.keys(QB);let pool=[];const per=Math.ceil(N/secs.length);
  secs.forEach(s=>pool=pool.concat(shuf(QB[s]).slice(0,per).map(q=>Object.assign({sec:s},q))));
  pool=shuf(pool).slice(0,N);
  const box=document.createElement('div');el.innerHTML='';el.appendChild(box);
  const items=pool.map((q,i)=>buildQ(q,i,false));items.forEach(it=>box.appendChild(it.el));
  const bar=document.createElement('div');bar.className='qbar';bar.innerHTML=`⏱ <span class="timer"></span><button class="btn or fin">Сдать работу</button><span class="small">${N} заданий · ${MIN} мин</span>`;el.appendChild(bar);
  let left=MIN*60;const tm=bar.querySelector('.timer');const tick=()=>{tm.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');if(left<=300)tm.style.color='var(--bad)';if(left--<=0)finish()};tick();const iv=setInterval(tick,1000);
  let fin=false;function finish(){if(fin)return;fin=true;clearInterval(iv);
   const by={};items.forEach(it=>{it.check();const s=it.q.sec;by[s]=by[s]||{sc:0,n:0};by[s].sc+=it.score;by[s].n++});
   const tot=items.reduce((a,i)=>a+i.score,0);const pct=Math.round(100*tot/items.length);
   const rows=Object.keys(by).map(s=>({s,p:Math.round(100*by[s].sc/by[s].n),n:by[s].n,sc:by[s].sc})).sort((a,b)=>a.p-b.p);
   P.mock({d:new Date().toISOString().slice(0,10),pct,by:Object.fromEntries(rows.map(r=>[r.s,r.p]))});
   const weak=rows.filter(r=>r.p<70);
   const res=document.createElement('div');res.className='card';res.innerHTML=`<h2>Результат: ${tot.toFixed(1)} из ${items.length} (${pct}%)</h2><p>Использовано времени: ${Math.round((MIN*60-Math.max(left,0))/60)} мин.</p><div class="tw"><table><tr><th>Раздел</th><th>Баллы</th><th>%</th></tr>${rows.map(r=>`<tr><td><a href="${r.s}.html">${SECN[r.s]}</a></td><td>${r.sc.toFixed(1)} / ${r.n}</td><td>${r.p}%</td></tr>`).join('')}</table></div><h3>Рекомендации</h3>${weak.length?'<p>Слабые темы (меньше 70%) — повторите теорию и пройдите тематический тест:</p><ul>'+weak.map(r=>`<li><a href="${r.s}.html">${SECN[r.s]}</a> — ${r.p}%</li>`).join('')+'</ul>':'<p>Все разделы ≥70% — отлично! Переходите к задачам прошлых лет и разбору ошибок ниже.</p>'}<p class="small">Ниже — все задания с правильными ответами и пояснениями.</p><button class="btn" onclick="location.reload()">Новый вариант</button>`;
   el.insertBefore(res,box);bar.remove();res.scrollIntoView();}
  bar.querySelector('.fin').onclick=()=>{if(confirm('Сдать работу и посмотреть результат?'))finish()};
 };
};
window.Dash=function(el){
 const p=P.get();const ks=Object.keys(SECN);let sum=0,c=0;
 el.innerHTML=ks.map(k=>{const r=p.s[k];if(r){sum+=r.best;c++}return `<a class="card" href="${k}.html#test"><div class="ic">${SECI[k]}</div><h3>${SECN[k]}</h3><div class="small">${r?`Лучший: <b>${r.best}%</b> · последний ${r.last}% · попыток ${r.n}`:'Тест ещё не пройден'}</div><div class="meter"><i style="width:${r?r.best:0}%"></i></div></a>`}).join('');
 const s=document.getElementById('dsum');if(s){const m=p.m.slice(-1)[0];s.innerHTML=`Пройдено тем: <b>${c}/${ks.length}</b> · средний лучший результат: <b>${c?Math.round(sum/c):0}%</b>${m?` · последний пробный этап: <b>${m.pct}%</b> (${m.d})`:''} <button class="btn sm alt" id="reset">Сбросить прогресс</button>`;
  document.getElementById('reset').onclick=()=>{if(confirm('Удалить весь сохранённый прогресс?')){localStorage.removeItem('olymp9-progress');location.reload()}}}
};
})();
