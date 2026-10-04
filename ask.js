const esc=s=>(s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));const escAttr=t=>esc(t).replace(/"/g,'&quot;');(function(){const MAP={click:'act',change:'change',input:'input',keydown:'key',toggle:'toggle'};function run(attr,e){const el=e.target&&e.target.closest?e.target.closest('[data-'+attr+']'):null;if(!el)return;const f=window[el.getAttribute('data-'+attr)];if(typeof f==='function'){const arg=el.getAttribute('data-arg');f.call(el,arg===null?undefined:arg,e,el);}}
for(const[type,attr]of Object.entries(MAP)){document.addEventListener(type,(e)=>run(attr,e),type==='toggle');}})();window.ASKD=window.ASKD||{};window.ASK_SEEN=window.ASK_SEEN||{};let ASK_FOCUS=null;function askState(id){return ASKD[id]||(ASKD[id]={v:'',picks:[],sending:false,err:''});}
function askCard(id){return(LIVE.displays||[]).find(x=>x&&x.id===id)||(ASK_PREVIEW&&ASK_PREVIEW.id===id?ASK_PREVIEW:null);}
function askIdOf(el){const box=el&&el.closest&&el.closest('[data-ask]');return box?box.getAttribute('data-ask'):'';}
function askIsPreview(el){return!!(el&&el.closest&&el.closest('[data-ask-preview]'));}
function askNum(v){return Number.isInteger(v)?String(v):String(+(+v).toFixed(6));}
function askViewsHtml(d){const vs=d.views||[];if(!vs.length)return'';return'<div class="ask-views">'+vs.map((v,i)=>`<button class="askb ask-view" data-act="askView" data-arg="${i}" title="${escAttr(v.url?'Opens in a new tab':'Asks for it')}">`
+`${esc(v.label||'')}${v.url?' <span aria-hidden="true">↗</span>':''}</button>`).join('')+'</div>';}
function askBodyHtml(d,s){const opts=d.options||[],dis=s.sending?' disabled':'';const submit=(enabled)=>`<button class="askb ask-send" data-act="askSubmit"${(enabled&&!s.sending)?'':' disabled'}>`
+`${s.sending?'Sending…':esc(d.submit_label||'Send')}</button>`;const w=d.widget;if(w==='choice'){return'<div class="ask-opts">'+opts.map((o,i)=>`<button class="askb ask-opt" style="--i:${i}" data-act="askPick" data-arg="${escAttr(o.value)}"${dis}>`
+`<span class="ask-opt-l">${esc(o.label)}</span>`
+(o.desc?`<span class="ask-opt-d">${esc(o.desc)}</span>`:'')+'</button>').join('')+'</div>';}
if(w==='select'){return'<div class="ask-row"><select class="ask-in" data-change="askSelect" aria-label="'+escAttr(d.title||'Choose')+'"'+dis+'>'
+`<option value="">Choose…</option>`
+opts.map(o=>`<option value="${escAttr(o.value)}"${o.value===s.v?' selected':''}>${esc(o.label)}</option>`).join('')
+'</select>'+submit(!!s.v)+'</div>';}
if(w==='multi'){return'<div class="ask-opts ask-multi">'+opts.map((o,i)=>{const on=s.picks.indexOf(o.value)>=0;return`<button class="askb ask-opt ask-chk${on?' on':''}" style="--i:${i}" role="checkbox" aria-checked="${on}" data-act="askToggle" data-arg="${escAttr(o.value)}"${dis}>`
+`<span class="ask-tick" aria-hidden="true">${on?'✓':''}</span>`
+`<span class="ask-opt-l">${esc(o.label)}</span>`
+(o.desc?`<span class="ask-opt-d">${esc(o.desc)}</span>`:'')+'</button>';}).join('')+'</div><div class="ask-row ask-row-end">'+submit(s.picks.length>0)+'</div>';}
if(w==='text'){return'<div class="ask-row"><input class="ask-in" type="text" maxlength="500" autocomplete="off"'
+` value="${escAttr(s.v)}" placeholder="${escAttr(d.placeholder||'')}"`
+` data-input="askType" data-key="askEnter" aria-label="${escAttr(d.title||'Answer')}"${dis}>`
+submit(!!s.v.trim())+'</div>';}
if(w==='number'){const at=(k,v)=>v==null?'':` ${k}="${escAttr(askNum(v))}"`;return'<div class="ask-row"><span class="ask-num"><input class="ask-in" type="number" inputmode="decimal"'
+at('min',d.min)+at('max',d.max)+at('step',d.step||'any')
+` value="${escAttr(s.v)}" data-input="askType" data-key="askEnter" aria-label="${escAttr(d.title||'Number')}"${dis}>`
+(d.unit?`<span class="ask-unit">${esc(d.unit)}</span>`:'')+'</span>'
+submit(s.v!=='')+'</div>';}
if(w==='date'){return'<div class="ask-row"><input class="ask-in" type="date"'
+` value="${escAttr(s.v)}" data-change="askSelect" data-input="askType" aria-label="${escAttr(d.title||'Date')}"${dis}>`
+submit(!!s.v)+'</div>';}
return'<p class="muted">This question needs a newer version of the page — just type the answer.</p>';}
function askCardHtml(d){const id=d.id||'',s=askState(id);const style=(d.style||'clay').replace(/[^a-z]/g,'');const state=d.answer?'done':(d.closed?'closed':'open');const fresh=ASK_SEEN[id]!==state;const cls=`ask ask-skin-${style} ask-${state}${fresh?' ask-enter':''}`;let h=`<div class="${cls}" data-ask="${escAttr(id)}">`
+`<div class="ask-q">${esc(d.title||'')}</div>`;if(state==='done'){h+=`<div class="ask-answer"><span class="ask-chip">✓ ${esc((d.answer||{}).label||'')}</span></div>`;}else if(state==='closed'){h+='<div class="ask-hint">Moved on — you can still type or say an answer.</div>';}else{h+=`<div class="ask-hint">${esc(d.hint||'')}</div>`+askBodyHtml(d,s);if(s.err)h+=`<div class="ask-err" role="alert">${esc(s.err)}</div>`;}
return h+askViewsHtml(d)+'</div>';}
function askRedraw(id){if(ASK_PREVIEW&&ASK_PREVIEW.id===id){askPreviewRender();return;}
if(typeof renderLivePane==='function')renderLivePane();if(typeof callCardsRender==='function')callCardsRender();}
function askAfterRender(root){(root||document).querySelectorAll('.ask[data-ask]').forEach(el=>{const id=el.getAttribute('data-ask'),c=askCard(id);if(c)ASK_SEEN[id]=c.answer?'done':(c.closed?'closed':'open');});(root||document).querySelectorAll('.res-skin[data-cardid]').forEach(el=>{ASK_SEEN[el.getAttribute('data-cardid')]='shown';});if(!ASK_FOCUS)return;const a=document.activeElement;if(a&&a!==document.body&&!(a.closest&&a.closest('.ask')))return;const box=document.querySelector(`.ask[data-ask="${CSS.escape(ASK_FOCUS)}"] .ask-in`);if(box&&box!==a){box.focus({preventScroll:true});try{if(box.type==='text'){const n=box.value.length;box.setSelectionRange(n,n);}}catch(_){}}}
document.addEventListener('focusin',e=>{const t=e.target;if(t&&t.classList&&t.classList.contains('ask-in'))ASK_FOCUS=askIdOf(t);});document.addEventListener('focusout',e=>{const t=e.target;if(t&&t.classList&&t.classList.contains('ask-in')&&t.isConnected&&e.relatedTarget)ASK_FOCUS=null;});function askPick(value,_e,el){askSend(askIdOf(el),value,el);}
function askToggle(value,_e,el){const id=askIdOf(el),s=askState(id),i=s.picks.indexOf(value);if(i>=0)s.picks.splice(i,1);else s.picks.push(value);s.err='';askRedraw(id);}
function askType(_a,_e,el){ASK_FOCUS=askIdOf(el);const s=askState(ASK_FOCUS);s.v=el.value;s.err='';const btn=el.closest('.ask').querySelector('.ask-send');if(btn&&!s.sending)btn.disabled=!String(s.v).trim();}
function askSelect(_a,_e,el){const id=askIdOf(el);askState(id).v=el.value;askState(id).err='';askRedraw(id);}
function askEnter(_a,e,el){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();askSubmit(null,e,el);}}
function askSubmit(_a,_e,el){const id=askIdOf(el),c=askCard(id),s=askState(id);if(!c)return;if(c.widget==='multi')return askSend(id,s.picks.slice(),el);const v=String(s.v==null?'':s.v).trim();if(!v){s.err=c.widget==='text'?'Type an answer first.':'Pick one first.';askRedraw(id);return;}
askSend(id,v,el);}
function askView(i,_e,el){const c=askCard(askIdOf(el)),v=c&&(c.views||[])[+i];if(!v)return;if(askIsPreview(el)){docToast('That button opens “'+v.label+'”.',2500);return;}
if(v.url)window.open(v.url,'_blank','noopener');else if(v.say&&typeof liveSaySteer==='function')liveSaySteer(v.say);}
async function askSend(id,value,el){const s=askState(id);if(!id||s.sending)return;if(askIsPreview(el)){askPreviewAnswer(value);return;}
s.sending=true;s.err='';askRedraw(id);try{const r=await apiRetry('/app/api/live/answer',{method:'POST',body:JSON.stringify({ask_id:id,value,msg_id:apiMsgId()}),timeout:20000});if(r&&r.card)askApply(r.card);if(r&&r.said&&typeof liveSayPendingStart==='function')liveSayPendingStart(r.said);if(!LIVE.sid&&typeof livePoll==='function')livePoll();delete ASKD[id];}catch(e){s.err=(e&&e.message)||'Couldn’t send that — try again, or just type it.';}finally{s.sending=false;askRedraw(id);}}
function askApply(card){const list=LIVE.displays||[],i=list.findIndex(x=>x&&x.id===card.id);if(i>=0)list[i]=card;}
let SPEC=null,CARDS=[],AT=0,ANS={};window.LIVE={displays:CARDS};function apiRetry(){return Promise.reject(new Error('offline'));}
function askCard(id){return CARDS.find(c=>c.id===id)||null;}
function askRedraw(){render();}
function labelOf(c,v){const o=(c.options||[]).find(o=>o.value===v);return o?o.label:String(v);}
function askSend(id,value){const c=askCard(id);if(!c||c.answer)return;const vals=Array.isArray(value)?value:[value];c.answer={value,label:vals.map(v=>labelOf(c,v)).join(', ')+(c.unit?' '+c.unit:'')};ANS[c.field]=vals.join(',');delete ASKD[id];if(AT<CARDS.length-1){AT++;render();return;}
render();sendPrompt(SPEC.prefix+': '+(CARDS.length===1&&!c.field?ANS['']:CARDS.map(c=>c.field+'='+ANS[c.field]).join(' ')));}
function askView(i,_e,el){const c=askCard(askIdOf(el)),v=c&&(c.views||[])[+i];if(!v)return;if(v.url)openLink(v.url);else if(v.say)sendPrompt(v.say);}
function askBack(i){i=+i;for(let k=i;k<CARDS.length;k++){CARDS[k].answer=null;delete ANS[CARDS[k].field];}AT=i;render();}
function render(){const root=document.getElementById('vask');root.innerHTML=CARDS.slice(0,AT+1).map((c,i)=>{let h=askCardHtml(c);if(c.answer&&CARDS.length>1&&!(i===CARDS.length-1))h=h.slice(0,-6)+`<div class="ask-views"><button class="askb ask-view" data-act="askBack" data-arg="${i}">Change</button></div></div>`;return h;}).join('');askAfterRender(root);}
function vaskStart(spec){SPEC=spec;CARDS=spec.cards.map(c=>Object.assign({answer:null,closed:'',options:[],views:[]},c));AT=0;ANS={};window.LIVE.displays=CARDS;render();}