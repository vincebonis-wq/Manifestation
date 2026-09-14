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
const daySeed = (() => { const d=new Date(); return d.getFullYear()*372 + d.getMonth()*31 + d.getDate(); })();

/* ------------------------------------------------------------- store */
const KEY = 'manifest.v1';
const DEFAULT = {
  version: 1,
  vision: '',
  pillars: {},
  affirmation369: '',
  favorites: [],
  customAffirmations: [],
  days: {},          // dateKey -> { rituals:{}, gratitude:[], scripting:'', action:'', m369:0 }
  blocks: [],        // {id, ts, belief, reframe}
  createdAt: Date.now(),
};

let S = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    return Object.assign(structuredClone(DEFAULT), JSON.parse(raw));
  } catch { return structuredClone(DEFAULT); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }
function day(k=TODAY) {
  if (!S.days[k]) S.days[k] = { rituals:{}, gratitude:['','',''], scripting:'', action:'', m369:0 };
  return S.days[k];
}

/* day completion metrics */
const RITUAL_IDS = CONTENT.rituals.map(r=>r.id);
function doneCount(k=TODAY){ const d=S.days[k]; if(!d) return 0; return RITUAL_IDS.filter(id=>d.rituals[id]).length; }
function dayComplete(k){ return doneCount(k) >= 3; } // streak counts when ≥3 rituals

function streak() {
  let n=0; const d=new Date();
  // if today not complete yet, streak still counts up to yesterday
  for (let i=0;i<400;i++){
    const k=dateKey(d);
    if (dayComplete(k)) n++;
    else if (i>0) break;        // gap before today ends streak
    else if (!dayComplete(k)) { d.setDate(d.getDate()-1); continue; } // today incomplete: keep looking back
    d.setDate(d.getDate()-1);
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
  const r=26, c=2*Math.PI*r, off=c*(1-pct/100);
  return `<div class="ring"><svg width="64" height="64" viewBox="0 0 64 64">
    <g transform="rotate(-90 32 32)">
      <circle class="bg" cx="32" cy="32" r="${r}" fill="none" stroke-width="6"/>
      <circle class="fg" cx="32" cy="32" r="${r}" fill="none" stroke-width="6"
        stroke-dasharray="${c}" stroke-dashoffset="${off}"/>
    </g>
    <text class="pct" x="32" y="32" text-anchor="middle" dominant-baseline="central" fill="#f4f1ea">${Math.round(pct)}%</text>
  </svg></div>`;
}

/* ===================================================================== */
/* VIEWS                                                                  */
/* ===================================================================== */

function header(streakVal){
  return `<div class="topbar">
    <div class="brand"><div class="mark">M</div><div class="name">Manifestation</div></div>
    <div class="streak-pill">✦ ${streakVal} ${streakVal>1?'jours':'jour'}</div>
  </div>`;
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

  const vision = S.vision
    ? `<div class="vision-text">${esc(S.vision)}</div>`
    : `<div class="vision-text empty">Définis ta vision. Elle guidera chaque jour ton attention et ta réalité.</div>`;

  app.innerHTML = `
    ${header(st)}
    <div class="eyebrow center" style="margin-bottom:10px">${prettyDate()}</div>

    <div class="vision-hero fade-in">
      <button class="vision-edit" data-act="editVision" aria-label="Modifier">✎</button>
      <div class="eyebrow">Ma vision</div>
      ${vision}
    </div>

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
      <textarea id="main-vision" style="background:transparent;border:none;padding:0;font-family:var(--serif);font-size:22px;min-height:90px"
        placeholder="Écris la vie que tu crées, au présent...">${esc(S.vision)}</textarea>
    </div>

    <div class="section-title" style="margin-top:26px"><h2 style="font-size:19px">Les piliers</h2></div>
    <p class="muted" style="font-size:13px;margin:0 4px 12px">Détaille ta vision par domaine. Plus c'est précis et incarné, plus ton attention se recalibre.</p>
    ${pillars}

    <button class="btn btn-gold btn-block" id="save-vision" style="margin-top:18px">Enregistrer ma vision</button>
    <div style="height:8px"></div>
  `;
  $('#save-vision').addEventListener('click', ()=>{
    S.vision = $('#main-vision').value.trim();
    $$('[data-pillar]').forEach(t=> S.pillars[t.dataset.pillar]= t.value.trim());
    save(); toast('Vision enregistrée ✦'); haptic();
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

/* --- Visualization (guided, timed, breathing) --- */
let vizTimer;
function ritViz(){
  const DURATION = 120; // seconds
  app.innerHTML = ritualShell('Visualisation','2 minutes. Vis ta vision comme déjà réelle — le cerveau active les mêmes circuits que l\'expérience vécue.',`
    <div class="card">
      <div class="timer-big" id="timer">2:00</div>
      <div class="breath-stage">
        <div class="breath-orb" id="orb"></div>
        <div class="breath-word" id="bword">Prêt ?</div>
      </div>
      <div class="viz-prompt" id="vprompt">Installe-toi. Respire profondément. Quand tu es prêt, commence.</div>
    </div>
    <div class="btn-row" style="margin-top:16px">
      <button class="btn btn-ghost" id="stop">Arrêter</button>
      <button class="btn btn-gold" id="start">Commencer</button>
    </div>`);

  let left=DURATION, running=false, breathIn=true, pIdx=0;
  const orb=$('#orb'), bword=$('#bword'), vp=$('#vprompt'), tmr=$('#timer');
  const fmt = s => `${Math.floor(s/60)}:${pad(s%60)}`;

  function breathe(){
    if(!running) return;
    breathIn=!breathIn;
    orb.classList.toggle('in', breathIn);
    orb.classList.toggle('out', !breathIn);
    bword.textContent = breathIn?'Inspire…':'Expire…';
  }
  function tick(){
    if(!running) return;
    left--; tmr.textContent=fmt(left);
    if (left % 17 === 0){ pIdx=(pIdx+1)%CONTENT.vizPrompts.length; vp.textContent=CONTENT.vizPrompts[pIdx]; vp.classList.remove('fade-in'); void vp.offsetWidth; vp.classList.add('fade-in'); }
    if (left<=0){ finish(); }
  }
  function finish(){
    running=false; clearInterval(vizTimer); clearInterval(window._breathI);
    orb.className='breath-orb'; bword.textContent='✦'; vp.textContent='Séance terminée. Cette scène est ta nouvelle normalité.';
    markDone('viz'); toast('Visualisation ancrée ◉'); haptic();
    $('#start').textContent='Terminé ✓'; $('#start').disabled=true;
  }
  $('#start').addEventListener('click', ()=>{
    if(running) return; running=true; $('#start').textContent='En cours…'; $('#start').disabled=true;
    vp.textContent=CONTENT.vizPrompts[0];
    breathe(); window._breathI=setInterval(breathe,4000);
    vizTimer=setInterval(tick,1000);
  });
  $('#stop').addEventListener('click', ()=>{ running=false; clearInterval(vizTimer); clearInterval(window._breathI); location.hash='#/'; });
}

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
  app.innerHTML = ritualShell('Action alignée','La manifestation sans action crée de l\'impuissance. Choisis UNE action concrète, aujourd\'hui, vers ta vision.',`
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
  let idx=0; const pts=CONTENT.eftPoints; const SECS=7;
  const setup = `Même si ${belief.charAt(0).toLowerCase()+belief.slice(1).replace(/\.$/,'')}, je m'accepte profondément et complètement.`;

  function renderPoint(){
    const p=pts[idx];
    const phrase = idx===0 ? setup : reframe;
    openSheet(`
      <div class="eyebrow">Étape 2 · Tapping EFT · ${idx+1}/${pts.length}</div>
      <div class="eft-body">
        ${eftDiagram(p.key)}
        <div class="eft-point">${p.name}</div>
        <div class="muted" style="font-size:12.5px">${p.hint}</div>
      </div>
      <div class="card"><div class="eft-phrase">« ${esc(phrase)} »</div></div>
      <div class="timer-big" id="etimer" style="font-size:30px;margin-top:12px">${SECS}</div>
      <div class="progress-dots">${pts.map((_,i)=>`<span class="d ${i<=idx?'on':''}"></span>`).join('')}</div>
      <div class="btn-row" style="margin-top:6px">
        <button class="btn btn-ghost" data-close>Arrêter</button>
        <button class="btn btn-gold" id="enext">${idx<pts.length-1?'Point suivant':'Terminer'}</button>
      </div>
      <p class="muted center" style="font-size:12px;margin-top:12px">Tapote ce point ~7 fois en répétant la phrase à voix haute.</p>`);
    $('[data-close]').addEventListener('click', ()=>{ clearInterval(eftInt); closeSheet(); });
    $('#enext').addEventListener('click', next);
    let s=SECS; clearInterval(eftInt);
    eftInt=setInterval(()=>{ s--; const t=$('#etimer'); if(t)t.textContent=Math.max(s,0); if(s<=0){ clearInterval(eftInt); haptic(); } },1000);
  }
  function next(){
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

function eftDiagram(active){
  // simple head diagram with points
  const P = { eb:[42,54], se:[70,58], ue:[62,74], un:[50,88], ch:[50,100], cb:[38,128], ua:[24,150], th:[50,26], kc:[92,150] };
  const dots = Object.entries(P).map(([k,[x,y]])=>`<circle class="eft-dot ${k===active?'active':''}" cx="${x}" cy="${y}" r="${k===active?7:4.5}"/>`).join('');
  return `<svg class="eft-diagram" viewBox="0 0 100 175">
    <ellipse cx="50" cy="70" rx="34" ry="44" fill="none" stroke="var(--line-strong)"/>
    <line x1="50" y1="114" x2="50" y2="140" stroke="var(--line-strong)"/>
    <path d="M22 175 Q50 130 78 175" fill="none" stroke="var(--line-strong)"/>
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

    <div class="card" style="margin-top:14px">
      <div class="card-hd"><b>Constance</b></div>
      <p class="muted" style="font-size:13.5px">La neuroplasticité récompense la répétition. Vise la régularité plutôt que la perfection : 3 rituels par jour suffisent à faire compter ta journée.</p>
    </div>

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
  $('#reset').addEventListener('click', ()=>{
    openSheet(`<h2 style="font-size:22px">Tout réinitialiser ?</h2>
      <p class="muted" style="font-size:14px;margin:8px 0">Cette action efface définitivement ta vision, tes rituels et ton historique.</p>
      <div class="btn-row" style="margin-top:12px"><button class="btn btn-ghost" data-close>Annuler</button>
      <button class="btn btn-gold" id="confirm" style="background:var(--warn)">Effacer tout</button></div>`);
    $('[data-close]').addEventListener('click', closeSheet);
    $('#confirm').addEventListener('click', ()=>{ S=structuredClone(DEFAULT); save(); closeSheet(); toast('Réinitialisé'); location.hash='#/'; render(); });
  });
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

// onboarding: if no vision yet, gently prompt
if (!S.vision && !localStorage.getItem('manifest.onboarded')) {
  setTimeout(()=>{ localStorage.setItem('manifest.onboarded','1'); if(location.hash==='' || location.hash==='#/') editVisionSheet(); }, 700);
}

})();
