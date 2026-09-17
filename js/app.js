/* =====================================================================
   MANIFESTATION — app logic (vanilla JS, no build step)
   State in localStorage. Hash router. Everything offline-first.
   ===================================================================== */
(() => {
'use strict';

/* ------------------------------------------------------------- helpers */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const app = $('#app');

const pad = n => String(n).padStart(2,'0');
const dateKey = (d=new Date()) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const TODAY = dateKey();

const FR_DAYS = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const FR_MON  = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const prettyDate = (d=new Date()) => `${FR_DAYS[d.getDay()]} ${d.getDate()} ${FR_MON[d.getMonth()]}`;

const esc = s => String(s??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rot = (arr, seed) => arr[Math.abs(seed) % arr.length];
// Taille de police adaptée à la longueur (évite le re-wrap disgracieux des visions longues)
function fitSize(t, sizes){ // sizes = [max, l1, l2, l3, l4]
  const n=(t||'').length;
  if(n>240) return sizes[4]; if(n>170) return sizes[3];
  if(n>110) return sizes[2]; if(n>60) return sizes[1]; return sizes[0];
}
const daySeed = (() => { const d=new Date(); return d.getFullYear()*372 + d.getMonth()*31 + d.getDate(); })();

/* ------------------------------------------------------------- store */
const KEY = 'manifest.v1';
const DEFAULT = {
  version: 3,
  vision: '',
  identity: '',      // loi de l'assumption : "je suis déjà..."
  pillars: {},
  affirmation369: '',
  favorites: [],
  customAffirmations: [],
  desires: [],       // {id, ts, desire, belief, expectancy, action, released, done}  (formule 4 étapes · Trudeau)
  teachability: null,// {learn, change, ts}  (Teachability Index · Trudeau)
  days: {},          // dateKey -> { rituals:{}, gratitude:[], scripting:'', action:'', m369:0, frequency:null }
  blocks: [],        // {id, ts, belief, reframe}
  createdAt: Date.now(),
  updatedAt: 0,      // horloge pour la synchro (dernier changement local)
};

let S = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    return Object.assign(structuredClone(DEFAULT), JSON.parse(raw));
  } catch { return structuredClone(DEFAULT); }
}
function save(sync=true) {
  S.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {}
  if (sync && window.Sync && window.Sync.isOnline()) window.Sync.push(S, S.updatedAt);
}
function day(k=TODAY) {
  if (!S.days[k]) S.days[k] = { rituals:{}, gratitude:['','',''], scripting:'', action:'', m369:0, frequency:null };
  return S.days[k];
}

/* day completion metrics */
const RITUAL_IDS = CONTENT.rituals.map(r=>r.id);
function doneCount(k=TODAY){ const d=S.days[k]; if(!d) return 0; return RITUAL_IDS.filter(id=>d.rituals[id]).length; }
function dayComplete(k){ return doneCount(k) >= 3; } // streak counts when ≥3 rituals

function streak() {
  let n = 0; const d = new Date();
  // Today may be incomplete without breaking the streak; count back from yesterday then.
  if (!dayComplete(dateKey(d))) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 400; i++) {
    if (!dayComplete(dateKey(d))) break;
    n++; d.setDate(d.getDate() - 1);
  }
  return n;
}

/* ------------------------------------------------------------- UI utils */
let toastT;
function toast(msg){
  const t=$('#toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'), 1900);
}
function haptic(){ if (navigator.vibrate) try{navigator.vibrate(12);}catch{} }

function openSheet(html){
  $('#sheet-content').innerHTML = html;
  $('#sheet-backdrop').classList.add('open');
}
function closeSheet(){ $('#sheet-backdrop').classList.remove('open'); }
$('#sheet-backdrop').addEventListener('click', e => { if (e.target.id==='sheet-backdrop') closeSheet(); });

/* ------------------------------------------------------------- ring */
function ring(pct){
  const r=32, c=2*Math.PI*r, off=c*(1-pct/100);
  return `<div class="ring"><svg width="78" height="78" viewBox="0 0 78 78">
    <g transform="rotate(-90 39 39)">
      <circle class="bg" cx="39" cy="39" r="${r}" fill="none" stroke-width="7"/>
      <circle class="fg" cx="39" cy="39" r="${r}" fill="none" stroke-width="7"
        stroke-dasharray="${c}" stroke-dashoffset="${off}"/>
    </g>
    <text class="pct" x="39" y="40" text-anchor="middle" dominant-baseline="central">${Math.round(pct)}%</text>
  </svg></div>`;
}

/* ===================================================================== */
/* VIEWS                                                                  */
/* ===================================================================== */

const SYNC_LABEL = { off:'Local', connecting:'Connexion…', online:'Synchronisé', 'signed-out':'Non connecté', error:'Erreur sync' };
function header(streakVal){
  const st = window.Sync ? window.Sync.status : 'off';
  return `<div class="topbar">
    <div class="brand"><div class="mark">${ouroborosSVG(22)}</div><div class="name">Manifestation</div></div>
    <div class="row" style="gap:10px">
      <a class="sync-dot ${st}" href="#/progress" title="Synchro : ${SYNC_LABEL[st]||st}" aria-label="Synchronisation"><span class="d"></span></a>
      <div class="streak-pill">✦ ${streakVal} ${streakVal>1?'jours':'jour'}</div>
    </div>
  </div>`;
}
function paintSync(){
  const el = $('.sync-dot'); if(!el || !window.Sync) return;
  const st = window.Sync.status;
  el.className = 'sync-dot ' + st;
  el.title = 'Synchro : ' + (SYNC_LABEL[st]||st);
}

/* -------------------------------------------------- HOME */
function viewHome(){
  const st = streak();
  const done = doneCount();
  const pct = (done/RITUAL_IDS.length)*100;
  const q = rot(CONTENT.quotes, daySeed);
  const d = day();

  const rituals = CONTENT.rituals.map(r=>{
    const on = !!d.rituals[r.id];
    return `<a class="ritual ${on?'done':''}" href="${r.route}">
      <div class="ico">${r.icon}</div>
      <div class="body"><div class="t">${r.title}</div><div class="s">${r.sub}</div></div>
      <div class="chk">✓</div>
    </a>`;
  }).join('');

  const vSize = fitSize(S.vision, [27,24,21,18,16]);
  const vision = S.vision
    ? `<div class="vision-text" style="font-size:clamp(16px,4.6vw,${vSize}px)">${esc(S.vision)}</div>`
    : `<div class="vision-text empty">Définis ta vision. Elle guidera chaque jour ton attention et ta réalité.</div>`;
  const identity = S.identity
    ? `<div class="identity-line"><span class="eyebrow" style="display:block;margin-bottom:6px">Je suis</span>${esc(S.identity)}</div>` : '';

  const fq = CONTENT.frequency;
  const cur = d.frequency;
  const freqCard = `
    <div class="card">
      <div class="card-hd"><b>Ma fréquence, maintenant</b>${cur!=null?`<span class="gold" style="font-size:13px">${fq[cur].emoji} ${fq[cur].label.split(' ')[0]}</span>`:''}</div>
      <div class="freq-scale" id="freq">
        ${fq.map(f=>`<button class="freq-cell ${cur===f.i?'on':''}" data-f="${f.i}" title="${f.label}" style="--fc:${f.color}"><span class="fe">${f.emoji}</span></button>`).join('')}
      </div>
      <div class="freq-legend"><span>Basse</span><span class="muted">Courage = le passage vers la puissance</span><span>Haute</span></div>
    </div>`;

  app.innerHTML = `
    ${header(st)}
    <div class="eyebrow center" style="margin-bottom:10px">${prettyDate()}</div>

    <div class="vision-hero altar fade-in">
      <div class="altar-glyph">${ouroborosSVG(150)}</div>
      <button class="vision-edit" data-act="editVision" aria-label="Modifier">✎</button>
      <div class="altar-orn"><span class="l"></span><i>❖</i><span class="r"></span></div>
      <div class="eyebrow">Ma vision</div>
      ${vision}
      ${identity}
      ${S.vision?`<button class="btn-immersion" data-act="immerse">✦&nbsp; Entrer en immersion</button>`:''}
    </div>

    ${desiresHomeCard()}

    <div class="section-title"><h2 style="font-size:19px">Ma fréquence</h2></div>
    ${freqCard}

    <div class="section-title"><h2>Rituel du jour</h2></div>
    <div class="card day-progress" style="margin-bottom:14px">
      ${ring(pct)}
      <div>
        <div style="font-weight:600;font-size:15px">${done}/${RITUAL_IDS.length} rituels accomplis</div>
        <div class="s muted" style="font-size:13px">${done===RITUAL_IDS.length?'Journée alignée. Bravo. ✦':'Chaque geste programme ton cerveau vers ta vision.'}</div>
      </div>
    </div>
    ${rituals}

    <div class="card" style="margin-top:20px">
      <div class="quote">« ${q.q} »<span class="src">${q.s}</span></div>
    </div>

    <div style="margin-top:16px" class="pill-note">
      💡 La visualisation programme ton cerveau, mais c'est <b>l'action alignée</b> qui crée le résultat. Fais les deux chaque jour.
    </div>
  `;

  $('[data-act="editVision"]').addEventListener('click', editVisionSheet);
  const immBtn=$('[data-act="immerse"]'); if(immBtn) immBtn.addEventListener('click', immerse);
  $$('#freq .freq-cell').forEach(b => b.addEventListener('click', () => {
    const v = +b.dataset.f; d.frequency = v; save(); haptic();
    $$('#freq .freq-cell').forEach(x => x.classList.toggle('on', +x.dataset.f===v));
    toast(`Fréquence : ${CONTENT.frequency[v].label}`);
  }));
}

function desiresHomeCard(){
  const active = S.desires.filter(d=>!d.done);
  const top = active[0];
  if (!top) {
    return `<div class="section-title"><h2 style="font-size:19px">Mes désirs</h2><a class="link" href="#/desires">Ouvrir ›</a></div>
      <a class="card desire-cta" href="#/desires">
        <div><b>Formule ton premier désir</b><div class="s muted" style="font-size:13px;margin-top:2px">Désir · Croyance · Attente · Action — la méthode Trudeau</div></div>
        <span class="gold" style="font-size:22px">✦</span>
      </a>`;
  }
  const prog = desireProgress(top);
  return `<div class="section-title"><h2 style="font-size:19px">Mes désirs</h2><a class="link" href="#/desires">Tout voir ›</a></div>
    <a class="card desire-cta" href="#/desires">
      <div style="min-width:0">
        <div class="eyebrow" style="margin-bottom:4px">Désir prioritaire</div>
        <b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(top.desire)}</b>
        <div class="s muted" style="font-size:12.5px;margin-top:3px">${prog}/4 étapes${active.length>1?` · +${active.length-1} autre${active.length>2?'s':''}`:''}</div>
      </div>
      <span class="gold" style="font-size:20px">›</span>
    </a>`;
}

function immerse(){
  if (!S.vision) { editVisionSheet(); return; }
  const el = document.createElement('div'); el.id='immersion';
  el.innerHTML = `
    <div class="imm-glyph">${ouroborosSVG(220)}</div>
    <button class="imm-close" aria-label="Fermer">✕</button>
    <div class="imm-inner">
      <div class="altar-orn"><span class="l"></span><i>❖</i><span class="r"></span></div>
      <div class="eyebrow" style="text-align:center;margin-bottom:20px">Ma vision</div>
      <div class="imm-vision" style="--vmax:${fitSize(S.vision,[42,38,32,27,23])}px">${esc(S.vision)}</div>
      ${S.identity?`<div class="imm-identity">« ${esc(S.identity)} »</div>`:''}
      <div class="imm-hint">Lis-la lentement · Ressens-la déjà réelle</div>
    </div>`;
  document.body.appendChild(el);
  const nav=$('#nav'); if(nav) nav.hidden=true;
  const close=()=>{ el.remove(); if(nav) nav.hidden=false; };
  el.querySelector('.imm-close').addEventListener('click', close);
  el.addEventListener('click', e=>{ if(e.target===el || e.target.classList.contains('imm-inner')) close(); });
  haptic();
}

function editVisionSheet(){
  openSheet(`
    <h2 style="font-size:22px;margin-bottom:6px">Ta vision</h2>
    <p class="muted" style="font-size:13.5px;margin-bottom:8px">Une phrase claire, au présent, chargée d'émotion. C'est ton étoile polaire.</p>
    <textarea id="v-in" placeholder="Ex : Je vis de mon business qui génère 20k€/mois, libre, en pleine santé, entouré des bonnes personnes.">${esc(S.vision)}</textarea>
    <div class="btn-row" style="margin-top:16px">
      <button class="btn btn-ghost" data-close>Annuler</button>
      <button class="btn btn-gold" id="v-save">Enregistrer</button>
    </div>`);
  $('#v-save').addEventListener('click', ()=>{
    S.vision = $('#v-in').value.trim(); save(); closeSheet(); toast('Vision enregistrée ✦'); render();
  });
  $('[data-close]').addEventListener('click', closeSheet);
}

/* -------------------------------------------------- VISION */
function viewVision(){
  const pillars = CONTENT.pillars.map(p=>{
    const val = S.pillars[p.id] || '';
    return `<div class="card">
      <div class="card-hd"><div class="row" style="gap:10px"><span class="gold" style="font-size:20px">${p.icon}</span><b>${p.label}</b></div></div>
      <textarea data-pillar="${p.id}" placeholder="Que veux-tu vraiment dans ce domaine ? Décris-le au présent...">${esc(val)}</textarea>
    </div>`;
  }).join('');

  app.innerHTML = `
    ${header(streak())}
    <div class="section-title"><h2>Ma Vision</h2></div>

    <div class="vision-hero">
      <div class="eyebrow">Vision principale</div>
      <textarea id="main-vision" style="background:transparent;border:none;padding:0;font-family:var(--sans);font-weight:300;font-size:21px;line-height:1.4;min-height:90px"
        placeholder="Écris la vie que tu crées, au présent...">${esc(S.vision)}</textarea>
    </div>
    <button class="btn-immersion btn-block" id="immerse2" style="margin-top:14px">✦&nbsp; Entrer en immersion</button>

    <div class="section-title" style="margin-top:26px"><h2 style="font-size:19px">Mon identité</h2></div>
    <p class="muted" style="font-size:13px;margin:0 4px 12px">Loi de l'assumption : tu ne manifestes pas ce que tu <i>veux</i>, mais ce que tu <b>assumes être</b>. Décris la personne que tu es déjà.</p>
    <div class="card">
      <div class="eyebrow" style="margin-bottom:8px">Je suis…</div>
      <textarea id="identity" placeholder="Je suis quelqu'un qui crée sa réalité, agit avec certitude, et pour qui l'argent circule avec facilité...">${esc(S.identity)}</textarea>
      <div class="chips" style="margin-top:12px" id="idstart">
        ${CONTENT.identityStarters.map(s=>`<button class="chip" data-start="${esc(s)}">${esc(s)}</button>`).join('')}
      </div>
    </div>

    <div class="section-title" style="margin-top:26px"><h2 style="font-size:19px">Les piliers</h2></div>
    <p class="muted" style="font-size:13px;margin:0 4px 12px">Détaille ta vision par domaine. Plus c'est précis et incarné, plus ton attention se recalibre.</p>
    ${pillars}

    <button class="btn btn-gold btn-block" id="save-vision" style="margin-top:18px">Enregistrer ma vision</button>
    <div style="height:8px"></div>
  `;
  $('#save-vision').addEventListener('click', ()=>{
    S.vision = $('#main-vision').value.trim();
    S.identity = $('#identity').value.trim();
    $$('[data-pillar]').forEach(t=> S.pillars[t.dataset.pillar]= t.value.trim());
    save(); toast('Vision enregistrée ✦'); haptic();
  });
  $('#immerse2').addEventListener('click', immerse);
  $$('#idstart .chip').forEach(c=> c.addEventListener('click', ()=>{
    const ta=$('#identity'); const s=c.dataset.start;
    ta.value = (ta.value.trim() ? ta.value.trim()+'\n' : '') + s + ' ';
    ta.focus();
  }));
}

/* -------------------------------------------------- DÉSIRS · formule 4 étapes (Trudeau) */
let chargedDesireId = null;
function desireById(id){ return S.desires.find(d=>d.id===id); }
function desireProgress(d){ return CONTENT.desireSteps.filter(s=>(d[s.key]||'').trim()).length; }

function viewDesires(){
  const items = S.desires.slice().sort((a,b)=>(a.done-b.done)||(b.ts-a.ts));
  const list = items.length ? items.map(d=>{
    const prog = desireProgress(d);
    const steps = CONTENT.desireSteps.map(s=>`<span class="dstep ${ (d[s.key]||'').trim()?'on':''}" title="${s.label}">${s.n}</span>`).join('');
    return `<div class="card desire ${d.done?'is-done':''}">
      <div class="card-hd">
        <div class="desire-title">${d.done?'✓ ':''}${esc(d.desire||'Désir sans titre')}</div>
        <button class="icon-btn" data-edit="${d.id}" aria-label="Modifier">✎</button>
      </div>
      <div class="desire-steps">${steps}<span class="desire-prog">${prog}/4</span></div>
      ${d.expectancy?`<div class="desire-line"><span class="k">Attente</span>${esc(d.expectancy)}</div>`:''}
      ${d.action?`<div class="desire-line"><span class="k">Action</span>${esc(d.action)}</div>`:''}
      <div class="btn-row" style="margin-top:14px">
        <button class="btn btn-ghost" data-charge="${d.id}">◉ Charger</button>
        <button class="btn ${d.done?'btn-ghost':'btn-gold'}" data-done="${d.id}">${d.done?'Réactiver':'C\'est réalisé ✦'}</button>
      </div>
    </div>`;
  }).join('') : `<div class="card center"><p class="muted" style="font-size:14px;padding:8px 0">Aucun désir pour l'instant. Formule ton premier avec les 4 étapes.</p></div>`;

  app.innerHTML = `
    ${header(streak())}
    <a href="#/" class="back-link">‹ Accueil</a>
    <div class="section-title" style="margin-top:6px"><h2>Mes Désirs</h2></div>
    <p class="muted" style="font-size:13.5px;margin:-6px 4px 16px">La formule de Kevin Trudeau : <b>Désir</b> → <b>Croyance</b> → <b>Attente</b> → <b>Action</b>. Sois précis, crois-y, attends-le avec certitude, puis agis.</p>
    <button class="btn btn-gold btn-block" id="new-desire">✦ Formuler un nouveau désir</button>
    <div class="stack" style="margin-top:16px">${list}</div>
    <div style="height:8px"></div>
  `;
  $('#new-desire').addEventListener('click', ()=>desireSheet());
  $$('[data-edit]').forEach(b=>b.addEventListener('click',()=>desireSheet(b.dataset.edit)));
  $$('[data-charge]').forEach(b=>b.addEventListener('click',()=>{ chargedDesireId=b.dataset.charge; location.hash='#/ritual/viz'; }));
  $$('[data-done]').forEach(b=>b.addEventListener('click',()=>{
    const d=desireById(b.dataset.done); if(!d) return; d.done=!d.done; save(); haptic();
    if(d.done) toast('Désir marqué réalisé ✦'); viewDesires();
  }));
}

function desireSheet(id){
  const d = id ? desireById(id) : null;
  const fields = CONTENT.desireSteps.map(s=>`
    <div class="dfield">
      <div class="dfield-hd"><span class="dnum">${s.n}</span><span class="dfield-label">${s.label}</span></div>
      <p class="dfield-hint">${s.hint}</p>
      <textarea data-k="${s.key}" style="min-height:${s.key==='desire'?90:70}px" placeholder="${esc(s.ph)}">${d?esc(d[s.key]||''):''}</textarea>
    </div>`).join('');
  openSheet(`
    <div class="eyebrow">Formule de manifestation · 4 étapes</div>
    <h2 style="font-size:22px;margin:6px 0 14px">${d?'Modifier le désir':'Nouveau désir'}</h2>
    ${fields}
    <div class="btn-row" style="margin-top:18px">
      ${d?`<button class="btn btn-ghost" id="d-del" style="flex:0 0 auto;color:var(--warn)">Supprimer</button>`:'<button class="btn btn-ghost" data-close>Annuler</button>'}
      <button class="btn btn-gold" id="d-save">Enregistrer</button>
    </div>`);
  const closeBtn=$('[data-close]'); if(closeBtn) closeBtn.addEventListener('click', closeSheet);
  $('#d-save').addEventListener('click', ()=>{
    const vals={}; $$('[data-k]').forEach(t=> vals[t.dataset.k]=t.value.trim());
    if(!vals.desire){ toast('Décris au moins ton désir (étape 1)'); return; }
    if(d){ Object.assign(d, vals); }
    else { S.desires.push({ id:'dz'+Date.now(), ts:Date.now(), released:false, done:false, ...vals }); }
    save(); closeSheet(); toast('Désir enregistré ✦'); haptic(); viewDesires();
  });
  const del=$('#d-del'); if(del) del.addEventListener('click', ()=>{
    S.desires = S.desires.filter(x=>x.id!==id); save(); closeSheet(); toast('Désir supprimé'); viewDesires();
  });
}

/* -------------------------------------------------- RITUALS dispatcher */
function viewRitual(id){
  const map = { gratitude:ritGratitude, m369:rit369, viz:ritViz, scripting:ritScripting, action:ritAction };
  (map[id] || viewHome)();
}
function ritualShell(title, sub, inner){
  return `${header(streak())}
    <a href="#/" class="link" style="color:var(--gold-2);font-size:13px;text-decoration:none">‹ Retour</a>
    <div class="section-title" style="margin-top:6px"><h2>${title}</h2></div>
    <p class="muted" style="font-size:13.5px;margin:-6px 4px 16px">${sub}</p>
    ${inner}`;
}
function markDone(id){ day().rituals[id]=true; save(); }

/* --- Gratitude --- */
function ritGratitude(){
  const d=day();
  app.innerHTML = ritualShell('Gratitude','La gratitude accorde ton cerveau à l\'abondance et ouvre le filtre attentionnel.',`
    <div class="card">
      ${[0,1,2].map(i=>`<label class="field"><span class="lbl">Je suis reconnaissant pour…</span>
        <input type="text" data-g="${i}" value="${esc(d.gratitude[i]||'')}" placeholder="${['Une personne','Une chose que j\'ai','Un progrès récent'][i]}"></label>`).join('')}
    </div>
    <button class="btn btn-gold btn-block" id="save" style="margin-top:16px">Valider ma gratitude</button>`);
  $('#save').addEventListener('click', ()=>{
    d.gratitude = $$('[data-g]').map(i=>i.value.trim());
    if (d.gratitude.some(x=>x)) markDone('gratitude');
    save(); toast('Gratitude ancrée ☼'); haptic(); location.hash='#/';
  });
}

/* --- 369 method --- */
function rit369(){
  const d=day();
  const aff = S.affirmation369 || '';
  const total = 18; // 3+6+9
  app.innerHTML = ritualShell('Méthode 369','Écris ton affirmation 3× le matin, 6× le midi, 9× le soir. La répétition grave de nouveaux circuits.',`
    <label class="field"><span class="lbl">Mon affirmation clé</span>
      <input type="text" id="aff369" value="${esc(aff)}" placeholder="Ex : Je suis riche, libre et aligné."></label>
    <div class="card" style="margin-top:16px">
      <div class="count369"><div class="num" id="cnum">${d.m369||0}</div><div class="of">sur ${total} répétitions aujourd'hui</div></div>
      <div class="tap-target" id="tap">Appuie<br>à chaque répétition<br>écrite / dite</div>
      <div class="progress-dots" id="dots"></div>
    </div>
    <button class="btn btn-ghost btn-block" id="reset" style="margin-top:12px">Réinitialiser le compteur du jour</button>`);

  const drawDots=()=>{ $('#dots').innerHTML = Array.from({length:total},(_,i)=>`<span class="d ${i<(d.m369||0)?'on':''}"></span>`).join(''); };
  drawDots();
  $('#aff369').addEventListener('change', e=>{ S.affirmation369=e.target.value.trim(); save(); });
  $('#tap').addEventListener('click', ()=>{
    if ((d.m369||0)>=total) return;
    d.m369=(d.m369||0)+1; $('#cnum').textContent=d.m369; drawDots(); haptic();
    if (d.m369>=total){ markDone('m369'); toast('369 complété ! ❸'); }
    save();
  });
  $('#reset').addEventListener('click', ()=>{ d.m369=0; d.rituals.m369=false; save(); rit369(); });
}

/* --- Visualization : induction thêta + fréquence/puissance/durée + lâcher-prise (Trudeau) --- */
let vizTimer, vizBreathI;
function ritViz(){
  const THETA = 24, VIZ = 90, TOTAL = THETA + VIZ;   // secondes
  const charged = chargedDesireId ? desireById(chargedDesireId) : null;
  const target = charged ? charged.desire : (S.vision || 'ta vision');

  const chargedBanner = charged
    ? `<div class="viz-charge">◉ Tu charges : <b>${esc(charged.desire)}</b></div>` : '';

  app.innerHTML = ritualShell('Visualisation','Descends en onde thêta — la « fréquence de l\'abondance » — puis vis ton désir comme déjà réel, avec puissance et durée.',`
    ${chargedBanner}
    <div class="card">
      <div class="row spread" style="margin-bottom:6px">
        <span class="viz-phase eyebrow" id="phase">Préparation</span>
        <span class="timer-big" id="timer" style="font-size:26px">${fmtT(TOTAL)}</span>
      </div>
      <div class="breath-stage" style="min-height:280px">
        <div class="breath-orb" id="orb"></div>
        <div class="breath-word" id="bword">Prêt ?</div>
      </div>
      <div class="viz-prompt" id="vprompt">Installe-toi confortablement. Quand tu es prêt, commence la descente.</div>
    </div>
    <div class="btn-row" style="margin-top:16px">
      <button class="btn btn-ghost" id="stop">Quitter</button>
      <button class="btn btn-gold" id="start">Commencer</button>
    </div>`);

  let elapsed=0, running=false, breathIn=true;
  const orb=$('#orb'), bword=$('#bword'), vp=$('#vprompt'), tmr=$('#timer'), phase=$('#phase');
  function setPrompt(txt){ vp.textContent=txt; vp.classList.remove('fade-in'); void vp.offsetWidth; vp.classList.add('fade-in'); }

  function breathe(slow){
    if(!running) return;
    breathIn=!breathIn;
    orb.classList.toggle('in', breathIn); orb.classList.toggle('out', !breathIn);
    bword.textContent = breathIn ? 'Inspire…' : 'Expire…';
  }
  function tick(){
    if(!running) return;
    elapsed++; tmr.textContent = fmtT(Math.max(TOTAL-elapsed,0));
    if (elapsed <= THETA){
      phase.textContent = 'Onde thêta';
      if (elapsed % 4 === 1) setPrompt(rot(CONTENT.thetaScript, Math.floor(elapsed/4)));
    } else if (elapsed <= TOTAL){
      const t = elapsed - THETA;
      phase.textContent = 'Vis ton désir';
      if (t === 1) setPrompt(`Vois-le : ${esc0(target)}. C'est déjà réel.`);
      else if (t % 13 === 0) setPrompt(rot(CONTENT.vizPromptsPlus, Math.floor(t/13)));
    }
    if (elapsed >= TOTAL) release();
  }
  function release(){
    running=false; clearInterval(vizTimer); clearInterval(vizBreathI);
    orb.className='breath-orb'; orb.classList.add('in'); bword.textContent='✦';
    phase.textContent='Lâcher-prise';
    setPrompt(rot(CONTENT.releaseLines, daySeed));
    $('#start').textContent='C\'est confié ✓'; $('#start').disabled=false; $('#start').onclick=finish;
    $('#start').classList.remove('btn-gold'); $('#start').classList.add('btn-gold');
    haptic();
  }
  function finish(){
    markDone('viz'); toast('Visualisation ancrée ◉'); haptic();
    chargedDesireId=null; location.hash='#/';
  }
  $('#start').addEventListener('click', ()=>{
    if(running) return; running=true;
    $('#start').textContent='En cours…'; $('#start').disabled=true;
    setPrompt(CONTENT.thetaScript[0]);
    breathe(); vizBreathI=setInterval(breathe, 5000);   // respiration lente (5s) = thêta
    vizTimer=setInterval(tick, 1000);
  });
  $('#stop').addEventListener('click', ()=>{ running=false; clearInterval(vizTimer); clearInterval(vizBreathI); chargedDesireId=null; location.hash='#/'; });
}
function fmtT(s){ return `${Math.floor(s/60)}:${pad(s%60)}`; }
function esc0(s){ return esc(String(s).replace(/\.$/,'')); }

/* --- Scripting --- */
function ritScripting(){
  const d=day();
  const prompt = rot(CONTENT.scriptingPrompts, daySeed);
  app.innerHTML = ritualShell('Scripting','Écris ta réalité au présent, comme si elle était déjà là. Ressens-la en écrivant.',`
    <div class="card" style="margin-bottom:14px"><div class="quote" style="font-size:16px">${prompt}</div></div>
    <textarea id="script" placeholder="Aujourd'hui, je me réveille dans...">${esc(d.scripting||'')}</textarea>
    <button class="btn btn-gold btn-block" id="save" style="margin-top:16px">Enregistrer mon scripting</button>`);
  $('#save').addEventListener('click', ()=>{
    d.scripting=$('#script').value.trim();
    if (d.scripting) markDone('scripting');
    save(); toast('Scripting enregistré ✎'); haptic(); location.hash='#/';
  });
}

/* --- Aligned action --- */
function ritAction(){
  const d=day();
  app.innerHTML = ritualShell('Action identitaire','Le subconscient ne croit que ce qu\'il te voit faire. Prouve-lui qui tu deviens : UNE action que ferait ton futur moi, aujourd\'hui.',`
    <div class="card" style="margin-bottom:14px"><div class="quote" style="font-size:15px">« Que ferait aujourd'hui la personne que je suis déjà en train de devenir ? »</div></div>
    <label class="field"><span class="lbl">Mon action du jour</span>
      <input type="text" id="act" value="${esc(d.action||'')}" placeholder="Ex : Envoyer 3 propositions à des clients."></label>
    <div class="card" style="margin-top:16px">
      <label class="ritual ${d.rituals.action?'done':''}" id="doneRow" style="cursor:pointer">
        <div class="ico">➤</div>
        <div class="body"><div class="t">Je l'ai accomplie</div><div class="s">Coche une fois l'action réalisée</div></div>
        <div class="chk">✓</div>
      </label>
    </div>
    <button class="btn btn-gold btn-block" id="save" style="margin-top:16px">Enregistrer</button>`);
  $('#act').addEventListener('input', e=>{ d.action=e.target.value.trim(); save(); });
  $('#doneRow').addEventListener('click', ()=>{
    d.rituals.action=!d.rituals.action; save(); haptic();
    $('#doneRow').classList.toggle('done', d.rituals.action);
    if (d.rituals.action) toast('Action accomplie ➤');
  });
  $('#save').addEventListener('click', ()=>{ save(); location.hash='#/'; });
}

/* -------------------------------------------------- BLOCKS (limiting beliefs + EFT) */
function viewBlocks(){
  const list = S.blocks.slice().reverse().map(b=>`
    <div class="entry">
      <div class="meta"><span class="tag">libéré</span>${new Date(b.ts).toLocaleDateString('fr-FR')}</div>
      <div class="body-txt"><s style="color:var(--text-mut)">${esc(b.belief)}</s><br>→ <b class="gold">${esc(b.reframe)}</b></div>
    </div>`).join('') || `<p class="muted" style="font-size:14px">Aucun blocage traité pour l'instant.</p>`;

  app.innerHTML = `
    ${header(streak())}
    <div class="section-title"><h2>Libérer les blocages</h2></div>
    <p class="muted" style="font-size:13.5px;margin:-6px 4px 16px">Identifie une croyance limitante, questionne-la, recadre-la, puis libère-la par le tapping (EFT).</p>

    <button class="btn btn-gold btn-block" id="new-block">⟡ Traiter un blocage maintenant</button>

    <div class="section-title" style="margin-top:26px"><h2 style="font-size:19px">Blocages fréquents</h2></div>
    <div class="stack">
      ${CONTENT.commonBlocks.map((c,i)=>`<button class="ritual" data-common="${i}" style="text-align:left">
        <div class="ico">⟡</div><div class="body"><div class="t" style="font-size:14px">${esc(c.b)}</div><div class="s">Toucher pour recadrer & libérer</div></div><div class="chk" style="border:none">›</div>
      </button>`).join('')}
    </div>

    <div class="section-title" style="margin-top:26px"><h2 style="font-size:19px">Mes libérations</h2></div>
    <div class="card">${list}</div>
  `;
  $('#new-block').addEventListener('click', ()=>blockFlow());
  $$('[data-common]').forEach(b=> b.addEventListener('click', ()=>{
    const c=CONTENT.commonBlocks[+b.dataset.common];
    blockFlow(c.b, c.r);
  }));
}

function blockFlow(belief='', reframe=''){
  // Step 1: identify + reframe
  openSheet(`
    <div class="eyebrow">Étape 1 · Identifier & recadrer</div>
    <h2 style="font-size:22px;margin:6px 0 4px">Le blocage</h2>
    <label class="field"><span class="lbl">La croyance / peur qui te freine</span>
      <input type="text" id="b-belief" value="${esc(belief)}" placeholder="Ex : Je n'y arriverai jamais."></label>
    <label class="field"><span class="lbl">Le recadrage puissant (au présent)</span>
      <input type="text" id="b-reframe" value="${esc(reframe)}" placeholder="Ex : Je suis capable et j'apprends vite."></label>
    <div class="pill-note" style="margin-top:14px">Demande-toi : est-ce factuellement vrai à 100% ? Que dirais-je à un ami ? Qui serais-je sans cette croyance ?</div>
    <button class="btn btn-gold btn-block" id="to-eft" style="margin-top:16px">Passer au tapping →</button>`);
  $('#to-eft').addEventListener('click', ()=>{
    const bl=$('#b-belief').value.trim(), rf=$('#b-reframe').value.trim();
    if(!bl){ toast('Décris d\'abord le blocage'); return; }
    eftFlow(bl, rf||'Je me libère de cette croyance.');
  });
}

let eftInt;
function eftFlow(belief, reframe){
  let idx=0, paused=false, s=0; const pts=CONTENT.eftPoints; const SECS=8;
  const setup = `Même si ${belief.charAt(0).toLowerCase()+belief.slice(1).replace(/\.$/,'')}, je m'accepte profondément et complètement.`;

  function renderPoint(){
    const p=pts[idx];
    const phrase = idx===0 ? setup : reframe;
    openSheet(`
      <div class="eyebrow center">Étape 2 · Tapping EFT · ${idx+1}/${pts.length}</div>
      <div class="eft-body">
        ${eftDiagram(p.key)}
        <div class="eft-point">${p.name}</div>
        <div class="muted center" style="font-size:12.5px;max-width:260px">${p.hint}</div>
      </div>
      <div class="card"><div class="eft-phrase">« ${esc(phrase)} »</div></div>
      <div class="eft-timerbar"><div class="eft-timerfill" id="ebar"></div></div>
      <div class="row spread" style="margin-top:8px">
        <span class="muted" style="font-size:12px">Ça avance tout seul · <span id="etimer">${SECS}</span>s</span>
        <span class="muted" style="font-size:12px">Tapote ~7× en répétant à voix haute</span>
      </div>
      <div class="btn-row" style="margin-top:14px">
        <button class="btn btn-ghost" id="epause">Pause</button>
        <button class="btn btn-gold" id="enext">${idx<pts.length-1?'Point suivant ›':'Terminer'}</button>
      </div>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:10px">Arrêter la séance</button>`);
    $('[data-close]').addEventListener('click', ()=>{ clearInterval(eftInt); closeSheet(); });
    $('#enext').addEventListener('click', advance);
    $('#epause').addEventListener('click', ()=>{ paused=!paused; $('#epause').textContent = paused?'Reprendre':'Pause'; });
    startTimer();
  }
  function startTimer(){
    s=SECS; paint();
    clearInterval(eftInt);
    eftInt=setInterval(()=>{
      if(paused) return;
      s--; paint();
      if(s<=0){ advance(); }
    },1000);
  }
  function paint(){
    const t=$('#etimer'); if(t) t.textContent=Math.max(s,0);
    const bar=$('#ebar'); if(bar) bar.style.width = (100*(SECS-s)/SECS)+'%';
  }
  function advance(){
    clearInterval(eftInt); haptic();
    if (idx<pts.length-1){ idx++; renderPoint(); }
    else finish();
  }
  function finish(){
    clearInterval(eftInt);
    S.blocks.push({ id:Date.now(), ts:Date.now(), belief, reframe }); save();
    openSheet(`<div class="center" style="padding:20px 0">
      <div style="font-size:44px" class="gold">✦</div>
      <h2 style="font-size:24px;margin:10px 0">Blocage libéré</h2>
      <p class="muted" style="font-size:14px;max-width:340px;margin:0 auto 6px">Respire. Sens la différence dans ton corps.</p>
      <div class="card" style="margin-top:16px"><div class="eft-phrase gold">« ${esc(reframe)} »</div></div>
      <button class="btn btn-gold btn-block" id="done" style="margin-top:18px">C'est ancré ✓</button>
    </div>`);
    $('#done').addEventListener('click', ()=>{ closeSheet(); toast('Blocage libéré ✦'); render(); });
  }
  renderPoint();
}

/* Diagramme EFT — visage + torse + main, points anatomiquement placés */
function eftDiagram(active){
  // positions réelles des 9 points (viewBox 120x164)
  const P = {
    th:[60,10],  eb:[49,40], se:[77,46], ue:[49,57], un:[60,66],
    ch:[60,76], cb:[45,108], ua:[23,120], kc:[99,132],
  };
  const label = {th:'Sommet',eb:'Sourcil',se:'Coin œil',ue:'Sous l’œil',un:'Sous nez',ch:'Menton',cb:'Clavicule',ua:'Sous bras',kc:'Tranche main'};
  const dots = Object.entries(P).map(([k,[x,y]])=>{
    const on = k===active;
    return `<g class="eft-dot ${on?'active':''}">
      ${on?`<circle cx="${x}" cy="${y}" r="11" class="eft-halo"/>`:''}
      <circle cx="${x}" cy="${y}" r="${on?6:4}" class="eft-pt"/>
    </g>`;
  }).join('');
  const [ax,ay]=P[active]||[60,60];
  return `<svg class="eft-diagram" viewBox="0 0 120 164" aria-label="Point : ${label[active]||''}">
    <!-- épaules / torse -->
    <path d="M6 164 C 6 128 26 116 42 112 L 78 112 C 94 116 114 128 114 164 Z"
          fill="var(--surface)" stroke="var(--line-strong)" stroke-width="1.5"/>
    <!-- cou -->
    <path d="M50 96 h20 v14 q-10 6 -20 0 z" fill="var(--surface)" stroke="var(--line-strong)" stroke-width="1.5"/>
    <!-- oreilles -->
    <ellipse cx="33" cy="52" rx="4" ry="7" fill="var(--surface)" stroke="var(--line-strong)" stroke-width="1.5"/>
    <ellipse cx="87" cy="52" rx="4" ry="7" fill="var(--surface)" stroke="var(--line-strong)" stroke-width="1.5"/>
    <!-- tête -->
    <ellipse cx="60" cy="50" rx="27" ry="33" fill="var(--surface)" stroke="var(--line-strong)" stroke-width="1.5"/>
    <!-- sourcils -->
    <path d="M42 38 q7 -4 14 0" fill="none" stroke="var(--text-mut)" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M64 38 q7 -4 14 0" fill="none" stroke="var(--text-mut)" stroke-width="1.6" stroke-linecap="round"/>
    <!-- yeux -->
    <ellipse cx="49" cy="46" rx="4.5" ry="2.8" fill="none" stroke="var(--text-mut)" stroke-width="1.4"/>
    <ellipse cx="71" cy="46" rx="4.5" ry="2.8" fill="none" stroke="var(--text-mut)" stroke-width="1.4"/>
    <!-- nez -->
    <path d="M60 50 v8 q-3 2 -5 0" fill="none" stroke="var(--text-mut)" stroke-width="1.4" stroke-linecap="round"/>
    <!-- bouche -->
    <path d="M52 70 q8 5 16 0" fill="none" stroke="var(--text-mut)" stroke-width="1.4" stroke-linecap="round"/>
    <!-- main (tranche) pour karaté chop -->
    <g transform="translate(92 118) rotate(18)">
      <rect x="0" y="0" width="16" height="26" rx="7" fill="var(--surface)" stroke="var(--line-strong)" stroke-width="1.5"/>
      <line x1="3" y1="7" x2="3" y2="20" stroke="var(--line)" stroke-width="1"/>
    </g>
    ${dots}
  </svg>`;
}

/* -------------------------------------------------- AFFIRMATIONS */
function viewAffirmations(){
  // pool = favorites + all + custom
  const all = [];
  CONTENT.pillars.forEach(p => (CONTENT.affirmations[p.id]||[]).forEach(a=> all.push({t:a, p:p.id})));
  S.customAffirmations.forEach(a=> all.push({t:a, p:'self', custom:true}));
  const featured = rot(all.map(a=>a.t), daySeed + (new Date().getHours()));

  const isFav = t => S.favorites.includes(t);
  const listFor = pid => (pid==='fav' ? S.favorites.map(t=>({t})) : all.filter(a=>a.p===pid))
    .map(a=>`<div class="item"><div class="txt">${esc(a.t)}</div>
      <button class="fav-btn ${isFav(a.t)?'on':''}" data-fav="${esc(a.t)}">${isFav(a.t)?'★':'☆'}</button></div>`).join('')
    || `<p class="muted" style="font-size:14px;padding:8px 0">Aucune affirmation ici.</p>`;

  app.innerHTML = `
    ${header(streak())}
    <div class="section-title"><h2>Affirmations</h2></div>

    <div class="affirm-card fade-in" id="fcard"><div class="q">« ${esc(featured)} »</div></div>
    <div class="btn-row" style="margin-top:12px">
      <button class="btn btn-ghost" id="shuffle">↻ Autre</button>
      <button class="btn btn-gold" id="favf">${isFav(featured)?'★ Favori':'☆ Ajouter aux favoris'}</button>
    </div>

    <div class="section-title" style="margin-top:24px"><h2 style="font-size:19px">Créer la mienne</h2></div>
    <div class="row"><input type="text" id="custom" placeholder="Mon affirmation au présent…"><button class="btn btn-gold" id="addc">Ajouter</button></div>

    <div class="section-title" style="margin-top:24px"><h2 style="font-size:19px">Bibliothèque</h2></div>
    <div class="chips" id="tabs">
      <button class="chip on" data-tab="fav">★ Favoris</button>
      ${CONTENT.pillars.map(p=>`<button class="chip" data-tab="${p.id}">${p.icon} ${p.label.split(' ')[0]}</button>`).join('')}
    </div>
    <div class="card affirm-list" id="alist" style="margin-top:12px">${listFor('fav')}</div>
  `;

  let current = featured;
  const pool = all.map(a=>a.t);
  const setFeatured = t => { current=t; $('#fcard').innerHTML=`<div class="q">« ${esc(t)} »</div>`; $('#fcard').classList.remove('fade-in'); void $('#fcard').offsetWidth; $('#fcard').classList.add('fade-in'); $('#favf').textContent = isFav(t)?'★ Favori':'☆ Ajouter aux favoris'; };

  $('#shuffle').addEventListener('click', ()=> setFeatured(pool[Math.floor(Math.random()*pool.length)]));
  $('#favf').addEventListener('click', ()=>{ toggleFav(current); $('#favf').textContent=isFav(current)?'★ Favori':'☆ Ajouter aux favoris'; });
  $('#addc').addEventListener('click', ()=>{
    const v=$('#custom').value.trim(); if(!v) return;
    S.customAffirmations.push(v); S.favorites.push(v); save(); toast('Affirmation créée ★'); viewAffirmations();
  });
  bindFav();
  $$('#tabs .chip').forEach(c=> c.addEventListener('click', ()=>{
    $$('#tabs .chip').forEach(x=>x.classList.remove('on')); c.classList.add('on');
    $('#alist').innerHTML = listFor(c.dataset.tab); bindFav();
  }));

  function toggleFav(t){
    const i=S.favorites.indexOf(t);
    if(i>=0) S.favorites.splice(i,1); else S.favorites.push(t);
    save();
  }
  function bindFav(){ $$('[data-fav]').forEach(b=> b.addEventListener('click', ()=>{ toggleFav(b.dataset.fav); viewAffirmations(); })); }
}

/* -------------------------------------------------- PROGRESS */
function viewProgress(){
  const st=streak();
  const totalDays = Object.keys(S.days).filter(k=>doneCount(k)>0).length;
  const totalRituals = Object.keys(S.days).reduce((s,k)=>s+doneCount(k),0);
  const blocks = S.blocks.length;

  // last 5 weeks calendar — columns aligned Mon..Sun
  const cells=[];
  const now=new Date();
  const dow=(now.getDay()+6)%7;               // 0=Mon .. 6=Sun
  const sunday=new Date(now); sunday.setDate(now.getDate()+(6-dow)); // Sunday of current week
  const start=new Date(sunday); start.setDate(sunday.getDate()-34);  // 5 weeks back, a Monday
  for(let i=0;i<35;i++){ const d=new Date(start); d.setDate(start.getDate()+i); const k=dateKey(d);
    const future = d> now;
    const c=doneCount(k); let lvl= c>=5?'l3':c>=3?'l2':c>=1?'l1':'';
    cells.push(`<div class="cell ${future?'':lvl} ${k===TODAY?'today':''}" style="${future?'opacity:.35':''}" title="${k}: ${c} rituels"></div>`);
  }

  // frequency chart — 14 derniers jours
  const fq=CONTENT.frequency; const fdays=[]; let fsum=0,fn=0;
  for(let i=13;i>=0;i--){ const dd=new Date(); dd.setDate(dd.getDate()-i); const k=dateKey(dd);
    const v=S.days[k]?S.days[k].frequency:null;
    if(v!=null){ fsum+=v; fn++; }
    fdays.push({k,v,d:dd});
  }
  const favg = fn? Math.round(fsum/fn) : null;
  const freqChart = `
    <div class="card" style="margin-top:14px">
      <div class="card-hd"><b>Ma fréquence</b>${favg!=null?`<span class="gold" style="font-size:13px">${fq[favg].emoji} moy. ${fq[favg].label.split(' ')[0]}</span>`:'<span class="muted" style="font-size:12px">14 jours</span>'}</div>
      <div class="freq-chart">
        ${fdays.map(x=>`<div class="fbar" title="${x.k}"><div class="fill" style="height:${x.v!=null?((x.v+1)/8*100):3}%;background:${x.v!=null?fq[x.v].color:'var(--surface-2)'}"></div></div>`).join('')}
      </div>
    </div>`;

  app.innerHTML = `
    ${header(st)}
    <div class="section-title"><h2>Progrès</h2></div>

    <div class="stat-grid">
      <div class="stat"><div class="v">${st}</div><div class="l">Série</div></div>
      <div class="stat"><div class="v">${totalDays}</div><div class="l">Jours actifs</div></div>
      <div class="stat"><div class="v">${blocks}</div><div class="l">Blocages libérés</div></div>
    </div>
    <div class="stat-grid" style="margin-top:12px">
      <div class="stat" style="grid-column:span 3"><div class="v">${totalRituals}</div><div class="l">Rituels accomplis au total</div></div>
    </div>

    <div class="card" style="margin-top:18px">
      <div class="card-hd"><b>5 dernières semaines</b><span class="muted" style="font-size:12px">intensité = rituels/jour</span></div>
      <div class="cal-labels"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
      <div class="cal">${cells.join('')}</div>
    </div>

    ${freqChart}

    <div class="card" style="margin-top:14px">
      <div class="card-hd"><b>Constance</b></div>
      <p class="muted" style="font-size:13.5px">La neuroplasticité récompense la répétition. Vise la régularité plutôt que la perfection : 3 rituels par jour suffisent à faire compter ta journée.</p>
    </div>

    <div class="section-title" style="margin-top:26px"><h2 style="font-size:19px">Teachability Index</h2></div>
    ${teachabilityCard()}

    <div class="section-title" style="margin-top:26px"><h2 style="font-size:19px">Synchronisation</h2></div>
    ${syncSection()}

    <div class="divider"></div>
    <button class="btn btn-ghost btn-block" id="export">Exporter mes données (sauvegarde)</button>
    <label class="btn btn-ghost btn-block" style="margin-top:10px;cursor:pointer">Importer une sauvegarde
      <input type="file" id="import" accept="application/json" class="hidden"></label>
    <button class="btn btn-ghost btn-block" id="reset" style="margin-top:10px;color:var(--warn)">Tout réinitialiser</button>
    <div style="height:6px"></div>
  `;

  $('#export').addEventListener('click', ()=>{
    const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`manifestation-sauvegarde-${TODAY}.json`; a.click();
    toast('Sauvegarde exportée');
  });
  $('#import').addEventListener('change', e=>{
    const f=e.target.files[0]; if(!f) return; const r=new FileReader();
    r.onload=()=>{ try{ S=Object.assign(structuredClone(DEFAULT), JSON.parse(r.result)); save(); toast('Sauvegarde importée'); render(); }catch{ toast('Fichier invalide'); } };
    r.readAsText(f);
  });
  bindTeachability();
  bindSync();
  $('#reset').addEventListener('click', ()=>{
    openSheet(`<h2 style="font-size:22px">Tout réinitialiser ?</h2>
      <p class="muted" style="font-size:14px;margin:8px 0">Cette action efface définitivement ta vision, tes rituels et ton historique.</p>
      <div class="btn-row" style="margin-top:12px"><button class="btn btn-ghost" data-close>Annuler</button>
      <button class="btn btn-gold" id="confirm" style="background:var(--warn)">Effacer tout</button></div>`);
    $('[data-close]').addEventListener('click', closeSheet);
    $('#confirm').addEventListener('click', ()=>{ S=structuredClone(DEFAULT); save(); closeSheet(); toast('Réinitialisé'); location.hash='#/'; render(); });
  });
}

/* -------------------------------------------------- TEACHABILITY INDEX (Trudeau) */
function teachabilityCard(){
  const t = S.teachability || { learn:50, change:50 };
  const score = Math.round((t.learn + t.change)/2);
  const T = CONTENT.teachability;
  const sliders = T.axes.map(a=>`
    <div class="ti-axis">
      <div class="row spread"><span class="ti-label">${a.label}</span><span class="ti-val gold" id="tiv-${a.key}">${t[a.key]}</span></div>
      <input type="range" min="0" max="100" step="5" value="${t[a.key]}" data-ti="${a.key}">
      <p class="ti-hint">${a.hint}</p>
    </div>`).join('');
  return `<div class="card">
    <p class="muted" style="font-size:13px;margin-bottom:6px">${T.intro}</p>
    <div class="ti-score"><span class="ti-score-v" id="ti-score">${score}</span><span class="ti-score-l">/100</span></div>
    ${sliders}
    <p class="pill-note" style="margin-top:12px">${T.note}</p>
    <button class="btn btn-gold btn-block" id="ti-save" style="margin-top:14px">Enregistrer mon index</button>
  </div>`;
}
function bindTeachability(){
  const upd=()=>{
    const learn=+($('[data-ti="learn"]').value), change=+($('[data-ti="change"]').value);
    $('#tiv-learn').textContent=learn; $('#tiv-change').textContent=change;
    $('#ti-score').textContent=Math.round((learn+change)/2);
  };
  $$('[data-ti]').forEach(r=> r.addEventListener('input', upd));
  const sv=$('#ti-save'); if(sv) sv.addEventListener('click', ()=>{
    S.teachability={ learn:+($('[data-ti="learn"]').value), change:+($('[data-ti="change"]').value), ts:Date.now() };
    save(); haptic(); toast('Teachability Index enregistré ✦');
  });
}

/* -------------------------------------------------- SYNC UI */
function syncSection(){
  if (!window.Sync) return `<div class="card"><p class="muted" style="font-size:14px">Synchro indisponible.</p></div>`;
  const st = window.Sync.status, u = window.Sync.user;
  const dot = `<span class="sync-dot ${st}" style="display:inline-flex"><span class="d"></span></span>`;

  if (!window.Sync.isConfigured()) {
    return `<div class="card">
      <div class="card-hd"><b>Synchro temps réel Mac ↔ iPhone</b>${dot}</div>
      <p class="muted" style="font-size:13.5px;margin-bottom:6px">Activée en 2 min avec un projet Firebase gratuit. Tes données restent privées, dans <b>ton</b> compte. Sans ça, l'app fonctionne en local sur cet appareil.</p>
      <button class="btn btn-gold btn-block" id="sy-config" style="margin-top:8px">Activer la synchro</button>
    </div>`;
  }
  if (st === 'online' && u) {
    return `<div class="card">
      <div class="card-hd"><b>Synchronisé</b>${dot}</div>
      <p class="soft" style="font-size:14px">Connecté en tant que <b class="gold">${esc(u.email||'compte')}</b>. Tes rituels se synchronisent en temps réel sur tous tes appareils.</p>
      <div class="btn-row" style="margin-top:14px">
        <button class="btn btn-ghost" id="sy-reconf">Reconfigurer</button>
        <button class="btn btn-ghost" id="sy-signout">Se déconnecter</button>
      </div>
    </div>`;
  }
  // configured but signed-out / connecting / error → login form
  return `<div class="card">
    <div class="card-hd"><b>Se connecter pour synchroniser</b>${dot}</div>
    ${st==='error'?`<div class="pill-note" style="margin-bottom:10px;border-color:var(--warn)">${esc(window.Sync.statusMsg||'Erreur')}</div>`:''}
    <p class="muted" style="font-size:13px;margin-bottom:4px">Le même compte sur ton Mac et ton iPhone = mêmes données, en direct.</p>
    <label class="field"><span class="lbl">Email</span><input type="text" id="sy-email" placeholder="toi@exemple.com"></label>
    <label class="field"><span class="lbl">Mot de passe</span><input type="text" id="sy-pw" placeholder="••••••••" autocomplete="off"></label>
    <div class="btn-row" style="margin-top:14px">
      <button class="btn btn-ghost" id="sy-create">Créer un compte</button>
      <button class="btn btn-gold" id="sy-signin">Se connecter</button>
    </div>
    <button class="btn btn-ghost btn-block" id="sy-reconf" style="margin-top:10px">Reconfigurer Firebase</button>
  </div>`;
}

function bindSync(){
  if (!window.Sync) return;
  const on = (id, ev, fn) => { const el=$('#'+id); if(el) el.addEventListener(ev, fn); };

  on('sy-config','click', configSheet);
  on('sy-reconf','click', configSheet);
  on('sy-signout','click', async ()=>{ try{ await window.Sync.signOut(); toast('Déconnecté'); }catch(e){ toast('Erreur'); } });

  const doAuth = async (create) => {
    const email=$('#sy-email').value.trim(), pw=$('#sy-pw').value;
    if(!email||!pw){ toast('Email + mot de passe requis'); return; }
    try { await window.Sync.signIn(email, pw, create); toast(create?'Compte créé ✦':'Connecté ✦'); }
    catch(e){ toast(traduireErreur(e)); }
  };
  on('sy-signin','click', ()=>doAuth(false));
  on('sy-create','click', ()=>doAuth(true));
}

function traduireErreur(e){
  const c = (e && e.code) || '';
  if (c.includes('invalid-credential')||c.includes('wrong-password')) return 'Identifiants incorrects';
  if (c.includes('email-already-in-use')) return 'Compte déjà existant — connecte-toi';
  if (c.includes('weak-password')) return 'Mot de passe trop court (min. 6)';
  if (c.includes('invalid-email')) return 'Email invalide';
  if (c.includes('network')) return 'Pas de réseau';
  return (e && e.message) ? e.message.replace('Firebase:','').trim() : 'Erreur';
}

function configSheet(){
  const existing = window.Sync.getConfig();
  openSheet(`
    <div class="eyebrow">Synchro · Firebase</div>
    <h2 style="font-size:22px;margin:6px 0 6px">Activer la synchro</h2>
    <ol class="muted" style="font-size:13px;padding-left:18px;line-height:1.7">
      <li>Va sur <b>console.firebase.google.com</b> → nouveau projet (gratuit).</li>
      <li>Ajoute une app <b>Web</b> (icône &lt;/&gt;) et copie l'objet <code>firebaseConfig</code>.</li>
      <li>Active <b>Authentication → Email/Password</b> et crée une base <b>Firestore</b>.</li>
      <li>Colle la config ci-dessous.</li>
    </ol>
    <label class="field"><span class="lbl">Config Firebase</span>
      <textarea id="cfg" style="min-height:150px;font-family:ui-monospace,monospace;font-size:13px" placeholder='{\n  "apiKey": "...",\n  "authDomain": "...",\n  "projectId": "...",\n  "appId": "..."\n}'>${existing?esc(JSON.stringify(existing,null,2)):''}</textarea></label>
    <div class="pill-note" style="margin-top:10px">Astuce : tu peux coller le bloc entier <code>const firebaseConfig = {…}</code>, je m'occupe du reste.</div>
    <div class="btn-row" style="margin-top:14px">
      <button class="btn btn-ghost" data-close>Annuler</button>
      <button class="btn btn-gold" id="cfg-save">Enregistrer & connecter</button>
    </div>`);
  $('[data-close]').addEventListener('click', closeSheet);
  $('#cfg-save').addEventListener('click', ()=>{
    try {
      const obj = parseConfig($('#cfg').value);
      window.Sync.setConfig(obj);
      closeSheet(); toast('Config enregistrée — connexion…');
      window.Sync.init();
      setTimeout(render, 400);
    } catch(e){ toast('Config invalide : vérifie le collage'); }
  });
}

function parseConfig(text){
  let t = (text||'').trim();
  const i = t.indexOf('{'), j = t.lastIndexOf('}');
  if (i<0||j<0) throw new Error('no object');
  t = t.slice(i, j+1);
  let obj;
  try { obj = JSON.parse(t); }
  catch { obj = Function('return (' + t + ')')(); }   // config JS de la console (clés non quotées)
  if (!obj.apiKey || !obj.projectId) throw new Error('missing keys');
  return obj;
}

/* -------------------------------------------------- AUTH GATE (comptes partagés) */
let gateMode = 'signin';   // 'signin' | 'signup'
function ouroborosSVG(size=64){
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
    <path d="M50 12 A38 38 0 1 1 39 14" fill="none" stroke="var(--gold-2)" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M39 14 q-11 -2 -16 6 q7 2 9 8 q5 -7 15 -6 q2 -5 -8 -8 z" fill="var(--gold-2)"/>
    <circle cx="30.5" cy="20.5" r="1.9" fill="#14100a"/>
    <path d="M0 -13 C2 -4 4 -2 13 0 C4 2 2 4 0 13 C-2 4 -4 2 -13 0 C-4 -2 -2 -4 0 -13 Z" transform="translate(50 54)" fill="var(--gold)"/>
  </svg>`;
}
function gateShell(inner){
  return `<div class="gate-card fade-in">
    <div class="gate-mark">${ouroborosSVG(72)}</div>
    <h1 class="gate-title">Manifestation</h1>
    <div class="gate-sub">Crée ta réalité. Chaque compte est privé.</div>
    ${inner}
  </div>`;
}
function paintGate(){
  const configured = window.Sync && window.Sync.isConfigured();
  const st = window.Sync ? window.Sync.status : 'off';
  const show = configured && st !== 'online';
  let gate = $('#gate'), nav = $('#nav');
  if (!show) { if (gate) gate.remove(); if (nav) nav.hidden = false; return; }
  if (nav) nav.hidden = true;
  if (!gate) { gate = document.createElement('div'); gate.id = 'gate'; document.body.appendChild(gate); }

  if (st === 'connecting') { gate.innerHTML = gateShell(`<div class="gate-load">Connexion…</div>`); return; }

  const isUp = gateMode === 'signup';
  gate.innerHTML = gateShell(`
    <div class="gate-tabs">
      <button class="gate-tab ${!isUp?'on':''}" data-m="signin">Connexion</button>
      <button class="gate-tab ${isUp?'on':''}" data-m="signup">Créer un compte</button>
    </div>
    ${st==='error' ? `<div class="gate-err">${esc(window.Sync.statusMsg||'Erreur')}</div>`:''}
    <label class="field"><span class="lbl">Email</span><input type="email" id="g-email" placeholder="toi@exemple.com" autocomplete="email"></label>
    <label class="field"><span class="lbl">Mot de passe</span><input type="password" id="g-pw" placeholder="••••••••" autocomplete="${isUp?'new-password':'current-password'}"></label>
    <button class="btn btn-gold btn-block" id="g-go" style="margin-top:18px">${isUp?'Créer mon compte ✦':'Entrer'}</button>
    <div class="gate-note">${isUp?'Ton espace est privé. Personne d\'autre n\'y a accès.':'Ravi de te revoir.'}</div>
  `);
  bindGate();
}
function bindGate(){
  $$('#gate .gate-tab').forEach(t => t.addEventListener('click', () => { gateMode = t.dataset.m; paintGate(); }));
  const go = $('#g-go'); if (!go) return;
  const submit = async () => {
    const email = $('#g-email').value.trim(), pw = $('#g-pw').value;
    if (!email || !pw) { toast('Email + mot de passe requis'); return; }
    if (gateMode==='signup' && pw.length < 6) { toast('Mot de passe : 6 caractères min.'); return; }
    go.disabled = true; go.textContent = '…';
    try { await window.Sync.signIn(email, pw, gateMode==='signup'); }
    catch(e){ go.disabled=false; go.textContent = gateMode==='signup'?'Créer mon compte ✦':'Entrer'; toast(traduireErreur(e)); }
  };
  go.addEventListener('click', submit);
  $('#g-pw').addEventListener('keydown', e => { if (e.key==='Enter') submit(); });
}

/* ===================================================================== */
/* ROUTER                                                                 */
/* ===================================================================== */
function render(){
  const hash = location.hash.replace(/^#/,'') || '/';
  const [ , seg1, seg2 ] = hash.split('/'); // e.g. /ritual/viz
  window.scrollTo(0,0);
  closeSheet();

  if (hash.startsWith('/ritual/')) viewRitual(seg2);
  else switch('/'+ (seg1||'')) {
    case '/':             viewHome(); break;
    case '/desires':      viewDesires(); break;
    case '/vision':       viewVision(); break;
    case '/blocks':       viewBlocks(); break;
    case '/affirmations': viewAffirmations(); break;
    case '/progress':     viewProgress(); break;
    default:              viewHome();
  }
  // nav active state
  const tab = hash.startsWith('/ritual/') ? '/' : '/'+(seg1||'');
  $$('#nav a').forEach(a=> a.classList.toggle('active', a.dataset.tab===tab));
}

window.addEventListener('hashchange', render);
render();

/* ---------------------------------------------------------- SYNC bootstrap */
if (window.Sync) {
  let wasOnline = false;
  window.Sync.onStatus((st) => {
    paintSync(); paintGate();
    if (st === 'online' && !wasOnline) { wasOnline = true; render(); }        // connexion réussie
    else if (st !== 'online') wasOnline = false;
    if (['signed-out','error'].includes(st) && (location.hash.replace(/^#/,'')||'/')==='/progress') render();
  });
  window.Sync.onRemote((remote, ts) => {
    // adopte l'état distant s'il est plus récent que le local
    if (!remote || (ts||0) <= (S.updatedAt||0)) return;
    S = Object.assign(structuredClone(DEFAULT), remote);
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {}
    render(); toast('Synchronisé ✦');
  });
  if (window.Sync.isConfigured()) window.Sync.init();
  paintGate();
}

// onboarding: if no vision yet, gently prompt (mais pas quand l'écran de connexion est actif)
if (!S.vision && !localStorage.getItem('manifest.onboarded')) {
  setTimeout(()=>{
    const gated = window.Sync && window.Sync.isConfigured() && !window.Sync.isOnline();
    if (gated) return;
    localStorage.setItem('manifest.onboarded','1');
    if(location.hash==='' || location.hash==='#/') editVisionSheet();
  }, 800);
}

})();
