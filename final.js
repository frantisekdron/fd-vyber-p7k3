// Finální vizualizace B · D · E – statická verze (GitHub Pages). Vyjádření se ukládá jen v prohlížeči
// a klientka ho odešle zprávou (sdílení / zkopírování). Žádný server, žádné osobní údaje.
const VIEWS = [
  { id: 'shora', label: 'Pohled shora' },
  { id: '0095', label: 'Hlavní pohled od jihozápadu' },
];
const VARIANTS = [
  { id: 'B-01', layout: 'B', title: 'Osazení B', garden: 'Zahrada 01 · Rodinná zahrada s bazénem a jezírkem',
    description: 'Jeden přízemní dům do L. V nádvoří bazén s pergolou, v zahradě skleník a velké přírodní jezírko v louce.' },
  { id: 'D-03', layout: 'D', title: 'Osazení D', garden: 'Zahrada 03 · s bazénem u domu do L',
    description: 'Dva přízemní domy. U domu do L bazén podle vašeho přání, vedle skleník; velké přírodní jezírko v louce.' },
  { id: 'E-02', layout: 'E', title: 'Osazení E', garden: 'Zahrada 02 · Přírodní zahrada',
    description: 'Tři patrové domy s dřevěným obkladem u společného příjezdu, koupací jezírko u prvního domu, skleník a velké přírodní jezírko v louce.' },
];
const KEY = 'pitkovice-final-vyjadreni-20261020';
const byId = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const state = { view: {}, before: {}, approvals: {}, cards: {} };
function load() { try { state.approvals = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { state.approvals = {}; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(state.approvals)); } catch { /* bez úložiště stránka funguje dál */ } }
const IMG_V = '6';   // zvýšit při výměně obrázků (prohlížeč jinak drží starý obrázek až 10 min)
const src = (v, w) => (state.before[v.id] ? `final/pred-${state.view[v.id]}-${w}.jpg` : `final/${v.id}-${state.view[v.id]}-${w}.jpg`) + `?v=${IMG_V}`;
const viewLabel = id => VIEWS.find(x => x.id === id)?.label || '';

function openLightbox(href, alt) {
  const prev = document.activeElement;
  const overlay = el('div', 'lightbox-backdrop'); const box = el('div', 'lightbox');
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', alt);
  const close = el('button', 'lightbox-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Zavřít zvětšený náhled');
  const img = document.createElement('img'); img.src = href; img.alt = alt;
  box.append(close, img); overlay.append(box); document.body.append(overlay);
  const finish = () => { overlay.remove(); document.removeEventListener('keydown', onKey); prev?.focus({ preventScroll: true }); };
  const onKey = e => { if (e.key === 'Escape') finish(); };
  close.addEventListener('click', finish); overlay.addEventListener('click', e => { if (e.target === overlay) finish(); });
  document.addEventListener('keydown', onKey); close.focus();
}

function buildCard(v) {
  const card = el('article', 'final-card'); card.id = `varianta-${v.layout}`;
  const head = el('div', 'final-head'); const t = el('div');
  t.append(el('span', 'eyebrow', `VARIANTA ${v.layout} · DO VIDEA`), el('h3', 'final-title', v.title), el('p', 'final-garden', v.garden));
  const status = el('span', 'final-status'); head.append(t, status);
  const tabs = el('div', 'final-views'); tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', `Pohledy · ${v.title}`);
  const viewButtons = VIEWS.map(view => {
    const b = el('button', 'final-view', view.label); b.type = 'button';
    b.addEventListener('click', () => { state.view[v.id] = view.id; update(v); });
    tabs.append(b); return [view.id, b];
  });
  const fig = el('figure', 'final-figure');
  const open = el('button', 'image-open final-open'); open.type = 'button';
  const stage = el('span', 'image-stage'); const img = document.createElement('img'); img.decoding = 'async'; img.loading = 'lazy';
  stage.append(img); open.append(stage, el('span', 'zoom-label', 'Zvětšit'));
  open.addEventListener('click', () => openLightbox(src(v, 2400), img.alt));
  const ba = el('div', 'before-after'); ba.setAttribute('role', 'group'); ba.setAttribute('aria-label', 'Návrh nebo současný stav');
  const bA = el('button', '', 'Návrh'); bA.type = 'button'; const bB = el('button', '', 'Současný stav'); bB.type = 'button';
  bA.addEventListener('click', () => { state.before[v.id] = false; update(v); });
  bB.addEventListener('click', () => { state.before[v.id] = true; update(v); });
  ba.append(bA, bB); const cap = el('figcaption', 'final-caption'); fig.append(open, ba, cap);
  const box = el('div', 'approval');
  const label = el('label', 'approval-label', 'Poznámka · u požadavku na úpravu prosím napište, co změnit'); label.htmlFor = `note-${v.id}`;
  const note = document.createElement('textarea'); note.id = `note-${v.id}`; note.maxLength = 1000; note.rows = 3; note.placeholder = 'Např. jiná barva fasády, menší bazén…';
  note.value = state.approvals[v.id]?.note || '';
  const actions = el('div', 'approval-actions');
  const ok = el('button', 'primary', `Schvaluji variantu ${v.layout}`); ok.type = 'button';
  const change = el('button', 'secondary', 'Požaduji úpravu'); change.type = 'button';
  const msg = el('p', 'fineprint approval-msg'); msg.setAttribute('role', 'status'); msg.setAttribute('aria-live', 'polite');
  ok.addEventListener('click', () => setApproval(v, 'ok'));
  change.addEventListener('click', () => {
    if (!note.value.trim()) { msg.textContent = 'Napište prosím do poznámky, co upravit.'; msg.classList.add('error'); note.focus(); return; }
    setApproval(v, 'zmena');
  });
  note.addEventListener('input', () => { if (state.approvals[v.id]) { state.approvals[v.id].note = note.value.trim(); save(); updateSummary(); } });
  const clear = el('button', 'text-button approval-clear', 'Zrušit moje vyjádření'); clear.type = 'button';
  clear.addEventListener('click', () => { delete state.approvals[v.id]; note.value = ''; save(); msg.textContent = `Vyjádření k variantě ${v.layout} je zrušené.`; update(v); updateSummary(); });
  actions.append(ok, change); box.append(label, note, actions, clear, msg);
  card.append(head, el('p', 'final-desc', v.description), tabs, fig, box);
  state.cards[v.id] = { card, status, viewButtons, img, bA, bB, cap, ok, change, clear, msg, note };
  return card;
}
function setApproval(v, status) {
  const c = state.cards[v.id];
  state.approvals[v.id] = { status, note: c.note.value.trim(), at: new Date().toISOString() }; save();
  c.msg.classList.remove('error');
  c.msg.textContent = status === 'ok' ? `Varianta ${v.layout} je označená jako schválená. Nezapomeňte vyjádření dole odeslat.` : `Požadavek na úpravu varianty ${v.layout} je připravený. Nezapomeňte vyjádření dole odeslat.`;
  update(v); updateSummary();
}
function update(v) {
  const c = state.cards[v.id]; const view = state.view[v.id]; const before = Boolean(state.before[v.id]);
  c.viewButtons.forEach(([id, b]) => b.setAttribute('aria-pressed', String(id === view)));
  c.img.src = src(v, 1200); c.img.srcset = `${src(v, 1200)} 1200w, ${src(v, 2400)} 2400w`; c.img.sizes = '(max-width: 700px) 100vw, 1080px';
  c.img.alt = `${v.title} · ${viewLabel(view)} · ${before ? 'současný stav pozemku' : 'návrh'}`;
  c.bA.setAttribute('aria-pressed', String(!before)); c.bB.setAttribute('aria-pressed', String(before));
  c.cap.textContent = `${viewLabel(view)} · ${before ? 'současný stav pozemku' : 'návrh'}`;
  const a = state.approvals[v.id];
  c.card.classList.toggle('is-approved', a?.status === 'ok'); c.card.classList.toggle('is-change', a?.status === 'zmena');
  c.status.textContent = !a ? 'Čeká na vaše vyjádření' : a.status === 'ok' ? '✓ Schváleno' : 'Požadována úprava';
  c.ok.textContent = a?.status === 'ok' ? `✓ Varianta ${v.layout} schválena` : `Schvaluji variantu ${v.layout}`;
  c.change.textContent = a?.status === 'zmena' ? 'Upravit požadavek' : 'Požaduji úpravu';
  c.clear.hidden = !a;
}
function messageText() {
  const lines = ['Pitkovice – vyjádření k finálním vizualizacím:'];
  for (const v of VARIANTS) {
    const a = state.approvals[v.id];
    lines.push(`• ${v.title} (${v.garden.split(' · ')[0]}): ${!a ? 'zatím bez vyjádření' : a.status === 'ok' ? 'SCHVALUJI' : 'PROSÍM UPRAVIT'}${a?.note ? ' – ' + a.note : ''}`);
  }
  return lines.join('\n');
}
function updateSummary() {
  const n = VARIANTS.filter(v => state.approvals[v.id]?.status === 'ok').length;
  const z = VARIANTS.filter(v => state.approvals[v.id]?.status === 'zmena').length;
  const root = byId('final-summary'); root.replaceChildren();
  const links = el('span', 'final-jump');
  for (const v of VARIANTS) { const s = state.approvals[v.id]?.status; const a = el('a', s === 'ok' ? 'done' : s === 'zmena' ? 'change' : '', v.layout); a.href = `#varianta-${v.layout}`; links.append(a); }
  root.append(el('span', '', `Schváleno ${n} ze ${VARIANTS.length} variant` + (z ? ` · úprava u ${z}` : '')), links);
  root.classList.toggle('all-done', n === VARIANTS.length);
  byId('send-preview').textContent = messageText();
}
async function share() {
  const text = messageText(); const m = byId('send-msg');
  if (navigator.share) { try { await navigator.share({ title: 'Pitkovice – vyjádření', text }); m.textContent = 'Děkujeme, vyjádření je odeslané.'; return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  await copy(true);
}
async function copy(fromShare) {
  const text = messageText(); const m = byId('send-msg');
  try { await navigator.clipboard.writeText(text); m.textContent = (fromShare ? 'Sdílení zde není k dispozici – ' : '') + 'text je zkopírovaný. Vložte ho prosím do zprávy, kterou si píšeme.'; }
  catch { const r = document.createRange(); r.selectNodeContents(byId('send-preview')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); m.textContent = 'Text je označený – zkopírujte ho prosím a pošlete nám ho zprávou.'; }
}
function init() {
  load();
  const list = byId('final-list');
  for (const v of VARIANTS) { state.view[v.id] = VIEWS[0].id; list.append(buildCard(v)); update(v); }
  updateSummary();
  byId('send-share').addEventListener('click', share);
  byId('send-copy').addEventListener('click', () => copy(false));
}
init();
