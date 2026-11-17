window._cachedOutages = {};
window.outageEditId = null;

window.onOutageTypeChange = function() {
  const type = document.getElementById("outageType")?.value;
  const provider = document.getElementById("outageProvider");
  if (!provider) return;
  if (type === 'su') provider.value = 'İSU';
  else if (type === 'elektrik') provider.value = 'SEDAŞ';
  else if (type === 'gaz') provider.value = 'PALGAZ';
  else if (type === 'internet') provider.value = 'Türk Telekom';
  else if (type === 'altyapi') provider.value = 'Gebze Belediyesi Fen İşleri';
};

function formatOutageDateForDisplay(val) {
  if (!val) return '';
  if (/^\d{2}\.\d{2}\.\d{4}/.test(val)) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth()+1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function parseOutageDateToInput(val) {
  if (!val) return '';
  if (typeof val === 'object' && val.toMillis) {
    val = new Date(val.toMillis());
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    const p = n => String(n).padStart(2, '0');
    return `${val.getFullYear()}-${p(val.getMonth()+1)}-${p(val.getDate())}T${p(val.getHours())}:${p(val.getMinutes())}`;
  }
  const s = String(val).trim();
  const m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) {
    const p = n => String(n).padStart(2, '0');
    const hh = m[4] ? p(m[4]) : '00';
    const mm = m[5] ? p(m[5]) : '00';
    return `${m[3]}-${p(m[2])}-${p(m[1])}T${hh}:${mm}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  return '';
}

async function loadOutages() {
  const container = document.getElementById("outagesGrid");
  container.innerHTML = '<div class="empty-state">Kesintiler yükleniyor...</div>';

  const startInp = document.getElementById("outageStart");
  const endInp = document.getElementById("outageEnd");
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const nowVal = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const endT = new Date(now.getTime() + 4 * 3600 * 1000);
  const endVal = `${endT.getFullYear()}-${pad(endT.getMonth()+1)}-${pad(endT.getDate())}T${pad(endT.getHours())}:${pad(endT.getMinutes())}`;
  if (startInp && !startInp.value) startInp.value = nowVal;
  if (endInp && !endInp.value) endInp.value = endVal;

  try {
    const snap = await getDocs(collection(db, "outages"));
    if (snap.empty) {
      container.innerHTML = '<div class="empty-state">Aktif planlı kesinti kaydı bulunamadı.</div>';
      return;
    }
    container.innerHTML = '';
    window._cachedOutages = {};
    snap.forEach(docSnap => {
      const d = docSnap.data();
      window._cachedOutages[docSnap.id] = { id: docSnap.id, ...d };
      const card = document.createElement("div");
      card.className = "item-card";
      const providerIcon = d.type === 'su' ? '💧' : (d.type === 'elektrik' ? '⚡' : (d.type === 'gaz' ? '🔥' : (d.type === 'internet' ? '🌐' : '🔧')));
      card.innerHTML = `
        <div class="item-card-body">
          <div class="item-card-meta">${providerIcon} ${d.provider || 'Altyapı'} • ${(d.type || 'KESİNTİ').toUpperCase()}</div>
          <div class="item-card-title">${d.title || 'Başlıksız Kesinti'}</div>
          <div class="item-card-desc">📍 ${d.neighborhood || 'Gebze Geneli'}${d.street ? ' – ' + d.street : ''}</div>
          <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">
            🕒 Başlangıç: ${d.startDate || 'Belirtilmedi'}<br>
            🏁 Bitiş: ${d.endDate || 'Belirtilmedi'}
          </div>
        </div>
        <div class="item-card-footer">
          <span class="badge ${d.status === 'Tamamlandı' ? 'badge-success' : 'badge-warning'}">${d.status || 'Devam Ediyor'}</span>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-outline btn-sm" onclick="editOutage('${docSnap.id}')">✏️ Düzenle</button>
            <button class="btn btn-danger btn-sm" onclick="deleteDocItem('outages', '${docSnap.id}', loadOutages)">Sil</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Hata: ${e.message}</div>`;
  }
}
window.loadOutages = loadOutages;

window.editOutage = function(id) {
  const d = window._cachedOutages[id];
  if (!d) return;
  window.outageEditId = id;

  const typeEl = document.getElementById("outageType");
  const providerEl = document.getElementById("outageProvider");
  const titleEl = document.getElementById("outageTitle");
  const hoodEl = document.getElementById("outageNeighborhood");
  const streetEl = document.getElementById("outageStreet");
  const startEl = document.getElementById("outageStart");
  const endEl = document.getElementById("outageEnd");
  const statusEl = document.getElementById("outageStatus");
  const titleCard = document.getElementById("outageFormTitle");
  const btnSubmit = document.getElementById("btnOutageSubmit");
  const btnCancel = document.getElementById("btnCancelOutageEdit");

  if (typeEl) typeEl.value = d.type || 'su';
  if (providerEl) providerEl.value = d.provider || 'İSU';
  if (titleEl) titleEl.value = d.title || '';
  if (hoodEl) hoodEl.value = d.neighborhood || 'Tüm Gebze Geneli';
  if (streetEl) streetEl.value = d.street || '';
  if (startEl) startEl.value = parseOutageDateToInput(d.startDate || d.startIso);
  if (endEl) endEl.value = parseOutageDateToInput(d.endDate || d.endIso);
  if (statusEl) statusEl.value = d.status || 'Devam Ediyor';

  if (titleCard) titleCard.innerText = '⚡ Planlı Kesintiyi Düzenle';
  if (btnSubmit) btnSubmit.innerText = '💾 Değişiklikleri Kaydet';
  if (btnCancel) btnCancel.style.display = 'inline-block';

  document.getElementById("formAddOutage")?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.cancelOutageEdit = function() {
  window.outageEditId = null;
  document.getElementById("formAddOutage")?.reset();
  const titleCard = document.getElementById("outageFormTitle");
  const btnSubmit = document.getElementById("btnOutageSubmit");
  const btnCancel = document.getElementById("btnCancelOutageEdit");
  if (titleCard) titleCard.innerText = '⚡ Yeni Planlı Kesinti Bildirimi';
  if (btnSubmit) btnSubmit.innerText = 'Kesintiyi Bildir';
  if (btnCancel) btnCancel.style.display = 'none';

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const startVal = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const endT = new Date(now.getTime() + 4 * 3600 * 1000);
  const endVal = `${endT.getFullYear()}-${pad(endT.getMonth()+1)}-${pad(endT.getDate())}T${pad(endT.getHours())}:${pad(endT.getMinutes())}`;
  const s = document.getElementById("outageStart");
  const e = document.getElementById("outageEnd");
  if (s) s.value = startVal;
  if (e) e.value = endVal;
};

window._cachedWorks = {};
window.workEditId = null;

const WORK_CATS = {
  kazi: { label: 'Kazı', icon: '🚧' },
  altyapi: { label: 'Altyapı', icon: '🔧' },
  cevre: { label: 'Çevre', icon: '🌳' },
  yol_bakim: { label: 'Yol Bakım', icon: '🛣️' }
};

const escW = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtTR = (d) => d.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const trInputToDate = (v) => new Date(v + ':00+03:00');
const trNowInputValue = () => new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 16);

async function loadWorks() {
  const container = document.getElementById("worksGrid");
  container.innerHTML = '<div class="empty-state">Çalışmalar yükleniyor...</div>';

  const startInput = document.getElementById("workStart");
  if (startInput && !startInput.value) startInput.value = trNowInputValue();

  try {
    const snap = await getDocs(query(collection(db, "neighborhood_works"), orderBy("endDate")));
    const catFilter = document.getElementById("workFilterCategory").value;
    const hoodFilter = document.getElementById("workFilterNeighborhood").value;
    const now = Date.now();

    const rows = [];
    window._cachedWorks = {};
    snap.forEach(docSnap => {
      const d = docSnap.data();
      window._cachedWorks[docSnap.id] = { id: docSnap.id, ...d };
      if (!d.startDate?.toMillis || !d.endDate?.toMillis) return;
      if (catFilter && d.category !== catFilter) return;
      if (hoodFilter && d.neighborhood !== hoodFilter) return;
      const start = d.startDate.toMillis(), end = d.endDate.toMillis();
      const state = end < now ? 'expired' : (start <= now ? 'ongoing' : 'planned');
      rows.push({ id: docSnap.id, d, start, end, state });
    });

    if (rows.length === 0) {
      container.innerHTML = '<div class="empty-state">Kayıtlı mahalle çalışması bulunamadı.</div>';
      return;
    }

    const order = { ongoing: 0, planned: 1, expired: 2 };
    rows.sort((a, b) => order[a.state] - order[b.state] || a.start - b.start);

    container.innerHTML = '';
    rows.forEach(({ id, d, start, end, state }) => {
      const cat = WORK_CATS[d.category] || WORK_CATS.kazi;
      const badge = state === 'ongoing'
        ? '<span class="badge badge-warning">Devam Ediyor</span>'
        : state === 'planned'
          ? '<span class="badge badge-primary">Planlandı</span>'
          : '<span class="badge badge-danger">Süresi Doldu (Mobilde Gizli)</span>';

      const card = document.createElement("div");
      card.className = "item-card";
      if (state === 'expired') card.style.opacity = '0.6';
      card.innerHTML = `
        <div class="item-card-body">
          <div class="item-card-meta">${cat.icon} ${cat.label}${d.unit ? ' • ' + escW(d.unit) : ''}</div>
          <div class="item-card-title">${escW(d.title)}</div>
          <div class="item-card-desc">📍 ${escW(d.neighborhood)}${d.address ? ' – ' + escW(d.address) : ''}</div>
          ${d.description ? `<div style="font-size:12px; color:var(--text-muted); line-height:1.4; margin-bottom:6px;">${escW(d.description)}</div>` : ''}
          <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">
            🕒 Başlangıç: ${fmtTR(new Date(start))}<br>
            🏁 Bitiş: ${fmtTR(new Date(end))}
          </div>
        </div>
        <div class="item-card-footer">
          ${badge}
          <div style="display:flex; gap:6px;">
            <button class="btn btn-outline btn-sm" onclick="window.editWork('${id}')">✏️ Düzenle</button>
            ${state !== 'expired' ? `<button class="btn btn-primary btn-sm" onclick="window.finishWork('${id}')">Bitir</button>` : ''}
            <button class="btn btn-danger btn-sm" onclick="window.deleteDocItem('neighborhood_works', '${id}', window.loadWorks)">Sil</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Hata: ${escW(e.message)}</div>`;
  }
}
window.loadWorks = loadWorks;

window.editWork = function(id) {
  const d = window._cachedWorks[id];
  if (!d) return;
  window.workEditId = id;

  const catEl = document.getElementById("workCategory");
  const titleEl = document.getElementById("workTitle");
  const descEl = document.getElementById("workDesc");
  const hoodEl = document.getElementById("workNeighborhood");
  const addrEl = document.getElementById("workAddress");
  const unitEl = document.getElementById("workUnit");
  const startEl = document.getElementById("workStart");
  const endEl = document.getElementById("workEnd");
  const btnSubmit = document.getElementById("btnWorkSubmit");
  const btnCancel = document.getElementById("btnCancelWorkEdit");

  if (catEl) catEl.value = d.category || 'kazi';
  if (titleEl) titleEl.value = d.title || '';
  if (descEl) descEl.value = d.description || '';
  if (hoodEl) hoodEl.value = d.neighborhood || '';
  if (addrEl) addrEl.value = d.address || '';
  if (unitEl) unitEl.value = d.unit || '';
  if (startEl && d.startDate?.toMillis) {
    startEl.value = new Date(d.startDate.toMillis() + 3 * 3600 * 1000).toISOString().slice(0, 16);
  }
  if (endEl && d.endDate?.toMillis) {
    endEl.value = new Date(d.endDate.toMillis() + 3 * 3600 * 1000).toISOString().slice(0, 16);
  }

  if (btnSubmit) btnSubmit.innerText = '💾 Değişiklikleri Kaydet';
  if (btnCancel) btnCancel.style.display = 'inline-block';
  document.getElementById("formAddWork")?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.cancelWorkEdit = function() {
  window.workEditId = null;
  document.getElementById("formAddWork")?.reset();
  const btnSubmit = document.getElementById("btnWorkSubmit");
  const btnCancel = document.getElementById("btnCancelWorkEdit");
  if (btnSubmit) btnSubmit.innerText = 'Çalışmayı Kaydet';
  if (btnCancel) btnCancel.style.display = 'none';
  const s = document.getElementById("workStart");
  if (s) s.value = trNowInputValue();
};

window.finishWork = async (id) => {
  if (!confirm("Çalışma tamamlandı olarak işaretlensin mi?")) return;
  try {
    await updateDoc(doc(db, "neighborhood_works", id), { endDate: Timestamp.now() });
    showToast("Çalışma tamamlandı olarak işaretlendi.");
    loadWorks();
    loadDashboard();
  } catch (e) { alert("Hata: " + e.message); }
};

window.cleanupExpiredWorks = async () => {
  try {
    const snap = await getDocs(collection(db, "neighborhood_works"));
    const now = Date.now();
    const expired = [];
    snap.forEach(d => {
      const e = d.data().endDate;
      if (e?.toMillis && e.toMillis() < now) expired.push(d.id);
    });
    if (expired.length === 0) { showToast("Süresi dolmuş kayıt yok."); return; }
    if (!confirm(`${expired.length} adet süresi dolmuş kayıt kalıcı olarak silinsin mi?`)) return;
    await Promise.all(expired.map(id => deleteDoc(doc(db, "neighborhood_works", id))));
    showToast(`${expired.length} kayıt silindi.`);
    loadWorks();
    loadDashboard();
  } catch (e) { alert("Temizlik hatası: " + e.message); }
};

async function loadAssemblyAreas() {
  const container = document.getElementById("assemblyTableBody");
  container.innerHTML = '<tr><td colspan="6" class="empty-state">Toplanma alanları yükleniyor...</td></tr>';
  try {
    const snap = await getDocs(collection(db, "assembly_areas"));
    if (snap.empty) {
      container.innerHTML = `<tr><td colspan="6" class="empty-state">
        <p style="margin-bottom:8px;">Kayıtlı afet toplanma alanı bulunmuyor.</p>
        <button class="btn btn-primary btn-sm" onclick="window.seedAssemblyAreas()">🏛️ Resmi Gebze Toplanma Alanlarını Eşitle</button>
      </td></tr>`;
      return;
    }
    container.innerHTML = '';
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const tr = document.createElement("tr");
      const cap = d.area ? Math.floor(d.area / 3.5) : '–';

      tr.innerHTML = `
        <td><strong>${d.name}</strong></td>
        <td>📍 ${d.neighborhood} Mah. ${d.street ? '– ' + d.street : ''}</td>
        <td>${d.area ? d.area.toLocaleString('tr-TR') + ' m²' : '–'}</td>
        <td><span class="badge badge-primary">~${cap.toLocaleString('tr-TR')} Kişi</span></td>
        <td>
          <span title="Elektrik">${d.e ? '⚡' : '⚪'}</span>
          <span title="Su">${d.w ? '💧' : '⚪'}</span>
          <span title="WC">${d.wc ? '🚻' : '⚪'}</span>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            ${d.lat && d.lng ? `<a href="https://www.google.com/maps?q=${d.lat},${d.lng}" target="_blank" class="btn btn-outline btn-sm">Harita</a>` : ''}
            <button class="btn btn-danger btn-sm" onclick="deleteDocItem('assembly_areas', '${docSnap.id}', loadAssemblyAreas)">Sil</button>
          </div>
        </td>
      `;
      container.appendChild(tr);
    });
  } catch (e) {
    container.innerHTML = `<tr><td colspan="6" class="empty-state">Hata: ${e.message}</td></tr>`;
  }
}
window.loadAssemblyAreas = loadAssemblyAreas;

async function loadPharmacies() {
  const container = document.getElementById("pharmaciesGrid");
  container.innerHTML = '<div class="empty-state">Eczaneler yükleniyor...</div>';
  try {
    const snap = await getDocs(collection(db, "pharmacies_on_duty"));
    if (snap.empty) {
      container.innerHTML = '<div class="empty-state">Kayıtlı nöbetçi eczane bulunmuyor.</div>';
      return;
    }
    container.innerHTML = '';
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        <div class="item-card-body">
          <div class="item-card-meta">💊 ${d.district || 'Gebze'} • ${d.hours || 'Nöbetçi'}</div>
          <div class="item-card-title">${d.name}</div>
          <div class="item-card-desc">📍 ${d.address}</div>
          <div style="font-size:12.5px; font-weight:700; color:var(--navy-light);">
            📞 ${d.phone || 'Telefon yok'}
          </div>
        </div>
        <div class="item-card-footer">
          <span class="badge badge-success">7/24 Açık</span>
          <button class="btn btn-danger btn-sm" onclick="deleteDocItem('pharmacies_on_duty', '${docSnap.id}', loadPharmacies)">Sil</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Hata: ${e.message}</div>`;
  }
}
window.loadPharmacies = loadPharmacies;

window.switchPatiTab = (subTab) => {
  document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.pati-sub-view').forEach(v => v.style.display = 'none');
  document.getElementById('sub-btn-' + subTab).classList.add('active');
  document.getElementById('pati-sub-' + subTab).style.display = 'block';
};

async function loadPatiData() {
  loadPets();
  loadFeeding();
  loadVets();
}
window.loadPatiData = loadPatiData;

async function loadPets() {
  const container = document.getElementById("petsGrid");
  container.innerHTML = '<div class="empty-state">Can dostlarımız yükleniyor...</div>';
  try {
    const snap = await getDocs(collection(db, "pet_adoptions"));
    if (snap.empty) {
      container.innerHTML = '<div class="empty-state">Henüz yuva arayan can dostumuz eklenmemiş.</div>';
      return;
    }
    container.innerHTML = '';
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        <img src="${d.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80'}" class="item-card-image" onclick="openLightbox('${d.imageUrl}')" alt="pet">
        <div class="item-card-body">
          <div class="item-card-meta">🐾 ${d.species} • ${d.gender} • ${d.age}</div>
          <div class="item-card-title">${d.name} (${d.breed || 'Melez'})</div>
          <div class="item-card-desc">${d.description || ''}</div>
          <div style="font-size:12px; color:var(--text-muted);">🩺 ${d.healthStatus || 'Sağlıklı'}</div>
        </div>
        <div class="item-card-footer">
          <button class="btn btn-sm ${d.isAdopted ? 'btn-success' : 'btn-outline'}" onclick="toggleAdopted('${docSnap.id}', ${!d.isAdopted})">
            ${d.isAdopted ? '✅ Sahiplendirildi' : '🏠 Yuva Arıyor'}
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteDocItem('pet_adoptions', '${docSnap.id}', loadPets)">Sil</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Hata: ${e.message}</div>`;
  }
}

window.toggleAdopted = async (id, status) => {
  try {
    await updateDoc(doc(db, "pet_adoptions", id), { isAdopted: status });
    showToast("Sahiplendirme durumu güncellendi.");
    loadPets();
  } catch (e) { alert("Hata: " + e.message); }
};

async function loadFeeding() {
  const container = document.getElementById("feedingGrid");
  container.innerHTML = '<div class="empty-state">Odaklar yükleniyor...</div>';
  try {
    const snap = await getDocs(collection(db, "feeding_points"));
    if (snap.empty) {
      container.innerHTML = '<div class="empty-state">Kayıtlı besleme odağı bulunmuyor.</div>';
      return;
    }
    container.innerHTML = '';
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        <div class="item-card-body">
          <div class="item-card-meta">🥣 ${d.neighborhood} Mah. • ${d.type || 'Besleme Noktası'}</div>
          <div class="item-card-title">${d.title}</div>
          <div class="item-card-desc">📍 ${d.address}</div>
          <div style="font-size:12px; color:var(--navy-light);">📦 ${d.equipment || 'Mama ve su ünitesi'}</div>
        </div>
        <div class="item-card-footer">
          <span class="badge badge-primary">Aktif İstasyon</span>
          <button class="btn btn-danger btn-sm" onclick="deleteDocItem('feeding_points', '${docSnap.id}', loadFeeding)">Sil</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Hata: ${e.message}</div>`;
  }
}

async function loadVets() {
  const container = document.getElementById("vetsGrid");
  container.innerHTML = '<div class="empty-state">Klinikler yükleniyor...</div>';
  try {
    const snap = await getDocs(collection(db, "vet_clinics"));
    if (snap.empty) {
      container.innerHTML = '<div class="empty-state">Kayıtlı veteriner kliniği yok.</div>';
      return;
    }
    container.innerHTML = '';
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        <div class="item-card-body">
          <div class="item-card-meta">🏥 ${d.district || 'Gebze'} • ${d.emergencyHours || 'Nöbetçi'}</div>
          <div class="item-card-title">${d.name}</div>
          <div class="item-card-desc">📍 ${d.address}</div>
          <div style="font-size:12.5px; font-weight:700; color:var(--navy-light);">📞 ${d.phone}</div>
        </div>
        <div class="item-card-footer">
          <span class="badge badge-success">7/24 Acil</span>
          <button class="btn btn-danger btn-sm" onclick="deleteDocItem('vet_clinics', '${docSnap.id}', loadVets)">Sil</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Hata: ${e.message}</div>`;
  }
}

async function loadEBelediye() {
  const container = document.getElementById("ebelediyeGrid");
  container.innerHTML = '<div class="empty-state">Kategoriler yükleniyor...</div>';
  try {
    const snap = await getDocs(collection(db, "ebelediye_categories"));
    if (snap.empty) {
      container.innerHTML = `
        <div class="empty-state">
          <p style="font-weight:700; margin-bottom:8px;">Firestore'da E-Belediye verisi bulunamadı.</p>
          <button class="btn btn-primary btn-sm" onclick="window.seedEBelediyeOnly()">🏛️ Resmi E-Belediye Şablonunu Eşitle</button>
        </div>
      `;
      return;
    }
    container.innerHTML = '';
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const sList = (d.services || []).map(s => `
        <li style="margin-bottom:8px; font-size:12.5px; border-bottom:1px dashed var(--border); padding-bottom:6px;">
          <strong>${s.name}</strong> - <span style="color:var(--text-muted);">${s.description || 'Resmi Portal'}</span><br>
          <a href="${s.url}" target="_blank" style="color:var(--navy-light); font-size:11.5px; text-decoration:none; font-weight:600;">🔗 ${s.url}</a>
        </li>
      `).join('');

      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        <div class="item-card-body">
          <div class="item-card-meta">📁 ID: ${d.id} • ${(d.services || []).length} Hizmet</div>
          <div class="item-card-title">${d.name}</div>
          <ul style="list-style:none; padding:0; margin-top:10px;">${sList}</ul>
        </div>
        <div class="item-card-footer">
          <span class="badge badge-primary">E-Devlet Entegre</span>
          <button class="btn btn-danger btn-sm" onclick="deleteDocItem('ebelediye_categories', '${docSnap.id}', loadEBelediye)">Sil</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Hata: ${e.message}</div>`;
  }
}
window.loadEBelediye = loadEBelediye;

window.usersListCache = [];

async function loadUsers(force = false) {
  const container = document.getElementById("usersTableBody");
  if (!force && window.usersListCache && window.usersListCache.length > 0) {
    console.log('[Users] Önbellekten listelendi.');
    renderUsersView();
    return;
  }
  if (container) {
    container.innerHTML = '<tr><td colspan="8" class="empty-state">Kullanıcı profilleri yükleniyor...</td></tr>';
  }
  try {
    console.log('[Users] Kullanıcılar Firestore\'dan çekiliyor...');
    const snap = await getDocs(collection(db, "users"));
    const list = [];
    window.usersMap = window.usersMap || {};
    snap.forEach(docSnap => {
      const d = { id: docSnap.id, ...docSnap.data() };
      window.usersMap[docSnap.id] = d;
      list.push(d);
    });

    list.sort((a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return tb - ta;
    });

    window.usersListCache = list;
    const b = document.getElementById('usersCountBadge');
    if (b) b.innerText = `${list.length} Vatandaş`;
    const kpi = document.getElementById('kpiUsers');
    if (kpi) kpi.innerText = list.length;

    renderUsersView();
  } catch (e) {
    console.error("loadUsers hatası:", e);
    if (container) {
      container.innerHTML = `<tr><td colspan="8" class="empty-state">Hata: ${e.message}</td></tr>`;
    }
  }
}
window.loadUsers = loadUsers;

function renderUsersView() {
  const container = document.getElementById("usersTableBody");
  if (!container) return;

  const q = (document.getElementById("usersSearchInput")?.value || '').trim().toLowerCase();
  const hoodFilter = document.getElementById("usersFilterNeighborhood")?.value || '';
  const verFilter = document.getElementById("usersFilterVerified")?.value || '';

  const filtered = (window.usersListCache || []).filter(u => {
    if (hoodFilter && u.neighborhood !== hoodFilter) return false;
    if (verFilter === 'verified' && u.isVerified !== true) return false;
    if (verFilter === 'unverified' && u.isVerified === true) return false;

    if (q) {
      const name = (u.fullName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phoneNumber || '').toLowerCase();
      const tc = (u.tcNo || '').toLowerCase();
      const hood = (u.neighborhood || '').toLowerCase();
      const addr = (u.address || '').toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !phone.includes(q) && !tc.includes(q) && !hood.includes(q) && !addr.includes(q)) {
        return false;
      }
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<tr><td colspan="8" class="empty-state">Arama kriterlerine uygun kayıtlı vatandaş bulunamadı.</td></tr>';
    return;
  }

  container.innerHTML = '';
  filtered.forEach(u => {
    const tr = document.createElement("tr");

    let regDate = '–';
    const rawDate = u.createdAt || u.updatedAt;
    if (rawDate) {
      if (rawDate.toMillis) regDate = new Date(rawDate.toMillis()).toLocaleDateString('tr-TR');
      else if (rawDate.seconds) regDate = new Date(rawDate.seconds * 1000).toLocaleDateString('tr-TR');
      else {
        try {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) regDate = d.toLocaleDateString('tr-TR');
        } catch (_) { }
      }
    }

    const fullName = u.fullName || 'İsimsiz Vatandaş';
    const initials = fullName.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'V';

    const tc = (u.tcNo || '').trim();
    const maskedTc = tc.length === 11 ? `${tc.substring(0, 3)}*****${tc.substring(8)}` : (tc || '–');

    const email = u.email || '–';
    const phone = u.phoneNumber || '–';

    const isVer = u.isVerified === true;
    const verBadge = isVer
      ? `<span class="badge badge-success" title="E-Devlet / SMS Doğrulaması Tamamlandı">✅ Doğrulandı</span>`
      : `<span class="badge badge-warning" title="Doğrulama Bekliyor">⏳ Bekliyor</span>`;

    const isAdm = u.role === 'admin';
    const roleBadge = isAdm
      ? `<span class="badge badge-purple" style="font-size:10.5px; margin-left:4px;">Yönetici</span>`
      : `<span class="badge badge-info" style="font-size:10.5px; margin-left:4px;">Vatandaş</span>`;

    tr.innerHTML = `
      <td>
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, var(--navy), var(--navy-light)); color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12.5px; flex-shrink:0;">
            ${initials}
          </div>
          <div>
            <div style="font-weight:700; color:var(--text-dark); display:flex; align-items:center;">
              ${fullName} ${roleBadge}
            </div>
            <div style="font-size:11px; color:var(--text-muted); font-family:monospace;">ID: ${u.id.substring(0, 10)}...</div>
          </div>
        </div>
      </td>
      <td>
        <span style="font-family:monospace; font-weight:700; color:var(--navy); font-size:12.5px;">${maskedTc}</span>
      </td>
      <td>
        <div style="font-size:12.5px; font-weight:600;">${email !== '–' ? `<a href="mailto:${email}" style="color:inherit; text-decoration:none;">✉️ ${email}</a>` : '–'}</div>
        <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${phone !== '–' ? `<a href="tel:${phone}" style="color:inherit; text-decoration:none;">📞 ${phone}</a>` : '–'}</div>
      </td>
      <td>
        <div style="font-weight:700; font-size:12.5px;">📍 ${u.neighborhood ? u.neighborhood + ' Mah.' : 'Belirtilmedi'}</div>
        <div style="font-size:11.5px; color:var(--text-muted); max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${u.address || ''}">
          ${u.address || 'Adres detayı yok'}
        </div>
      </td>
      <td>
        <div style="display:flex; flex-direction:column; gap:3px;">
          <span class="badge badge-purple" style="font-size:11px;">💡 ${u.totalSuggestions || 0} Öneri</span>
        </div>
      </td>
      <td>${verBadge}</td>
      <td><span style="font-size:12px; color:var(--text-muted);">${regDate}</span></td>
      <td>
        <div style="display:flex; align-items:center; gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="openUserDetailModal('${u.id}')" title="Detaylı Profil & Düzenleme" style="font-weight:700;">
            🔍 Detay
          </button>
          ${!isVer ? `
            <button class="btn btn-success btn-sm" onclick="toggleUserVerification('${u.id}', true, event)" title="Hesabı Hemen Onayla ve Doğrula" style="white-space:nowrap; padding:5px 9px; font-size:11.5px; font-weight:700;">
              ✓ Onayla
            </button>
          ` : `
            <button class="btn btn-outline btn-sm" onclick="toggleUserVerification('${u.id}', false, event)" title="Onayı Kaldır (Beklemeye Al)" style="white-space:nowrap; padding:5px 9px; font-size:11.5px; color:var(--text-muted);">
              ✕ Kaldır
            </button>
          `}
        </div>
      </td>
    `;
    container.appendChild(tr);
  });
}
window.renderUsersView = renderUsersView;

window.currentDetailUserId = null;

window.openUserDetailModal = (userId) => {
  window.currentDetailUserId = userId;
  const u = (window.usersListCache || []).find(x => x.id === userId) || (window.usersMap ? window.usersMap[userId] : null);
  if (!u) return alert("Kullanıcı bilgisi bulunamadı.");

  const statusBadge = document.getElementById("modalUserStatusBadge");
  const notice = document.getElementById("modalVerificationNotice");
  const btnApprove = document.getElementById("btnModalApprove");
  const btnRevoke = document.getElementById("btnModalRevoke");
  const btnRole = document.getElementById("btnModalToggleRole");

  const isVer = u.isVerified === true;
  if (statusBadge) {
    statusBadge.className = isVer ? "badge badge-success" : "badge badge-warning";
    statusBadge.innerText = isVer ? "✅ Doğrulanmış Hesap" : "⏳ Doğrulama Bekliyor";
  }

  if (notice) {
    notice.innerText = isVer
      ? "Bu vatandaşın belediye / kimlik doğrulaması tamamlanmıştır ve hesabı aktiftir."
      : "Bu vatandaşın hesabı henüz doğrulanmamış (onay bekliyor durumunda).";
  }

  if (btnApprove) btnApprove.style.display = isVer ? "none" : "inline-flex";
  if (btnRevoke) btnRevoke.style.display = isVer ? "inline-flex" : "none";

  const isAdm = u.role === 'admin';
  if (btnRole) {
    btnRole.innerText = isAdm ? "👤 Vatandaş Rolüne Al" : "👑 Yönetici (Admin) Yetkisi Ver";
    btnRole.className = isAdm ? "btn btn-outline btn-sm" : "btn btn-purple btn-sm";
  }

  const inputName = document.getElementById("modalEditFullName");
  const inputTc = document.getElementById("modalEditTcNo");
  const inputEmail = document.getElementById("modalEditEmail");
  const inputPhone = document.getElementById("modalEditPhone");
  const inputHood = document.getElementById("modalEditNeighborhood");
  const inputAddr = document.getElementById("modalEditAddress");

  if (inputName) inputName.value = u.fullName || '';
  if (inputTc) inputTc.value = u.tcNo || u.tcKimlik || '';
  if (inputEmail) inputEmail.value = u.email || '';
  if (inputPhone) inputPhone.value = u.phoneNumber || u.phone || '';
  if (inputHood) inputHood.value = u.neighborhood || '';
  if (inputAddr) inputAddr.value = u.address || '';

  const uidElem = document.getElementById("modalUserUid");
  if (uidElem) uidElem.innerText = u.id || '-';

  const dateElem = document.getElementById("modalUserCreatedAt");
  if (dateElem) {
    let regDate = '–';
    const rawDate = u.createdAt || u.updatedAt;
    if (rawDate) {
      if (rawDate.toMillis) regDate = new Date(rawDate.toMillis()).toLocaleString('tr-TR');
      else if (rawDate.seconds) regDate = new Date(rawDate.seconds * 1000).toLocaleString('tr-TR');
      else {
        try {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) regDate = d.toLocaleString('tr-TR');
        } catch (_) { }
      }
    }
    dateElem.innerText = regDate;
  }

  const themeElem = document.getElementById("modalUserTheme");
  if (themeElem) themeElem.innerText = u.themeMode === 'dark' ? '🌙 Koyu Tema' : '☀️ Açık Tema';
  const fontElem = document.getElementById("modalUserFont");
  if (fontElem) fontElem.innerText = u.largeFont ? '🔍 Büyük Yazı' : 'Standart Boyut';

  const actElem = document.getElementById("modalUserActivity");
  if (actElem) actElem.innerText = `💡 ${u.totalSuggestions || 0} Öneri • 👍 ${u.totalSupported || 0} Destek`;

  const np = u.notificationPreferences || {};
  const prefs = [];
  if (np.sms) prefs.push('📱 SMS');
  if (np.push) prefs.push('🔔 Push');
  if (np.emergency) prefs.push('🚨 Afet/Acil');
  if (np.outages) prefs.push('⚡ Kesinti');
  if (np.news) prefs.push('📰 Haberler');
  if (np.sozSende) prefs.push('🗳️ Söz Sende');
  const prefsElem = document.getElementById("modalUserPrefs");
  if (prefsElem) prefsElem.innerText = prefs.length ? prefs.join(' • ') : 'Tüm bildirimler açık';

  const statusElem = document.getElementById("modalSaveStatus");
  if (statusElem) {
    statusElem.innerText = '';
    statusElem.style.color = 'var(--text-muted)';
  }

  const modal = document.getElementById("userDetailModal");
  if (modal) {
    modal.classList.add("open");
    modal.classList.add("active");
    modal.style.display = "flex";
  }
};

window.closeUserDetailModal = () => {
  const modal = document.getElementById("userDetailModal");
  if (modal) {
    modal.classList.remove("open");
    modal.classList.remove("active");
    modal.style.display = "none";
  }
  window.currentDetailUserId = null;
};

window.toggleUserVerification = async (userId, isVerified, event) => {
  if (event && event.stopPropagation) event.stopPropagation();
  if (!userId) return;

  const u = (window.usersListCache || []).find(x => x.id === userId) || (window.usersMap ? window.usersMap[userId] : null);
  const name = u ? (u.fullName || 'Vatandaş') : 'Vatandaş';
  const actionText = isVerified
    ? `"${name}" isimli vatandaşın hesabını onaylamak (doğrulamak) istiyor musunuz?`
    : `"${name}" isimli vatandaşın onayını kaldırmak (bekleme durumuna almak) istiyor musunuz?`;

  if (!confirm(actionText)) return;

  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      isVerified: isVerified,
      updatedAt: serverTimestamp()
    });

    if (window.usersMap && window.usersMap[userId]) {
      window.usersMap[userId].isVerified = isVerified;
    }
    if (window.usersListCache) {
      const item = window.usersListCache.find(x => x.id === userId);
      if (item) item.isVerified = isVerified;
    }

    renderUsersView();

    if (window.currentDetailUserId === userId) {
      openUserDetailModal(userId);
    }

    showToast(isVerified ? `✅ ${name} hesabı başarıyla onaylandı (Doğrulandı)!` : `⚠️ ${name} hesabı onayı kaldırıldı.`);
  } catch (e) {
    console.error("toggleUserVerification hatası:", e);
    alert("Hesap durumu güncellenirken hata oluştu: " + e.message);
  }
};

window.toggleUserRole = async (userId) => {
  if (!userId) return;
  const u = (window.usersListCache || []).find(x => x.id === userId) || (window.usersMap ? window.usersMap[userId] : null);
  if (!u) return;

  const isCurrentAdmin = u.role === 'admin';
  const newRole = isCurrentAdmin ? 'citizen' : 'admin';
  const promptText = isCurrentAdmin
    ? `"${u.fullName || 'Vatandaş'}" kullanıcısının Yönetici (Admin) yetkisini kaldırıp normal Vatandaş yapmak istiyor musunuz?`
    : `"${u.fullName || 'Vatandaş'}" kullanıcısına Yönetici (Admin) yetkisi vermek istiyor musunuz?`;

  if (!confirm(promptText)) return;

  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });

    if (window.usersMap && window.usersMap[userId]) {
      window.usersMap[userId].role = newRole;
    }
    if (window.usersListCache) {
      const item = window.usersListCache.find(x => x.id === userId);
      if (item) item.role = newRole;
    }

    renderUsersView();
    if (window.currentDetailUserId === userId) {
      openUserDetailModal(userId);
    }

    showToast(`Rol güncellendi: ${newRole === 'admin' ? '👑 Yönetici' : '👤 Vatandaş'}`);
  } catch (e) {
    console.error("toggleUserRole hatası:", e);
    alert("Rol güncellenirken hata oluştu: " + e.message);
  }
};

window.saveUserDetailChanges = async () => {
  const userId = window.currentDetailUserId;
  if (!userId) return alert("Düzenlenecek kullanıcı seçili değil.");

  const inputName = document.getElementById("modalEditFullName");
  const inputTc = document.getElementById("modalEditTcNo");
  const inputEmail = document.getElementById("modalEditEmail");
  const inputPhone = document.getElementById("modalEditPhone");
  const inputHood = document.getElementById("modalEditNeighborhood");
  const inputAddr = document.getElementById("modalEditAddress");
  const btnSave = document.getElementById("btnSaveUserChanges");
  const statusElem = document.getElementById("modalSaveStatus");

  const fullName = (inputName?.value || '').trim();
  const tcNo = (inputTc?.value || '').trim();
  const email = (inputEmail?.value || '').trim();
  const phoneNumber = (inputPhone?.value || '').trim();
  const neighborhood = (inputHood?.value || '').trim();
  const address = (inputAddr?.value || '').trim();

  if (tcNo && tcNo.length !== 11) {
    alert("T.C. Kimlik Numarası 11 haneli olmalıdır.");
    if (inputTc) inputTc.focus();
    return;
  }

  if (btnSave) {
    btnSave.disabled = true;
    btnSave.innerText = "⏳ Kaydediliyor...";
  }
  if (statusElem) {
    statusElem.innerText = "Veritabanına kaydediliyor...";
    statusElem.style.color = "var(--navy-light)";
  }

  try {
    const userRef = doc(db, "users", userId);
    const updateData = {
      fullName,
      tcNo,
      email,
      phoneNumber,
      neighborhood,
      address,
      updatedAt: serverTimestamp()
    };

    await updateDoc(userRef, updateData);

    if (window.usersMap && window.usersMap[userId]) {
      Object.assign(window.usersMap[userId], updateData);
    }
    if (window.usersListCache) {
      const item = window.usersListCache.find(x => x.id === userId);
      if (item) Object.assign(item, updateData);
    }

    renderUsersView();

    if (statusElem) {
      statusElem.innerText = "✅ Değişiklikler başarıyla kaydedildi.";
      statusElem.style.color = "var(--success)";
    }
    showToast("💾 Vatandaş bilgileri başarıyla kaydedildi.");
  } catch (e) {
    console.error("saveUserDetailChanges hatası:", e);
    alert("Bilgiler kaydedilirken hata oluştu: " + e.message);
    if (statusElem) {
      statusElem.innerText = "❌ Hata: " + e.message;
      statusElem.style.color = "var(--danger)";
    }
  } finally {
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.innerHTML = `<span>💾</span> Bilgileri Kaydet`;
    }
  }
};

window.exportUsersCsv = () => {
  const list = window.usersListCache || [];
  if (!list.length) return alert("Dışa aktarılacak vatandaş verisi bulunamadı.");
  let csv = "ID;Ad Soyad;TC Kimlik;E-posta;Telefon;Mahalle;Adres;Durum\n";
  list.forEach(u => {
    csv += `"${u.id}";"${u.fullName || ''}";"${u.tcNo || ''}";"${u.email || ''}";"${u.phoneNumber || ''}";"${u.neighborhood || ''}";"${(u.address || '').replace(/"/g, '""')}";"${u.isVerified ? 'Dogrulandi' : 'Bekliyor'}"\n`;
  });
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gebze_belediyesi_vatandaslar_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

window.seedAssemblyAreas = async () => {
  if (!confirm("Resmi Gebze afet toplanma alanları veritabanına aktarılsın mı?")) return;
  const areas = [
    { name: 'Gebze 15 Temmuz Milli İrade Kent Meydanı', neighborhood: 'Hacıhalil', street: 'Hükümet Caddesi', lat: 40.8038, lng: 29.4326, area: 18500, e: true, w: true, wc: true, kind: 'municipal' },
    { name: 'Tatlıkuyu Vadisi Parkı', neighborhood: 'Tatlıkuyu', street: 'Körfez Caddesi', lat: 40.7960, lng: 29.4260, area: 120000, e: true, w: true, wc: true, kind: 'park' },
    { name: 'Gaziler Dağı Tabiat ve Mesire Parkı', neighborhood: 'Gaziler', street: 'Gaziler Caddesi', lat: 40.8250, lng: 29.4450, area: 350000, e: true, w: true, wc: true, kind: 'forest' },
    { name: 'Eskihisar Sahil ve Kale Parkı', neighborhood: 'Eskihisar', street: 'Sahil Yolu Caddesi', lat: 40.7675, lng: 29.4285, area: 45000, e: true, w: true, wc: true, kind: 'park' },
    { name: 'Mustafapaşa Şehitler Parkı', neighborhood: 'Mustafapaşa', street: 'Yeni Bağdat Caddesi', lat: 40.8075, lng: 29.4410, area: 14200, e: true, w: true, wc: true, kind: 'park' },
    { name: 'Osman Yılmaz Çamlık Alanı', neighborhood: 'Osman Yılmaz', street: 'İstasyon Caddesi', lat: 40.7985, lng: 29.4340, area: 22000, e: true, w: true, wc: true, kind: 'park' },
    { name: 'Alaettin Kurt Şehir Stadyumu', neighborhood: 'Güzeller', street: 'Gençlik Caddesi', lat: 40.8080, lng: 29.4310, area: 32000, e: true, w: true, wc: true, kind: 'sport' },
    { name: 'Beylikbağı Kapalı Pazar ve Açık Otoparkı', neighborhood: 'Beylikbağı', street: 'Bağdat Caddesi', lat: 40.8140, lng: 29.4050, area: 16500, e: true, w: true, wc: true, kind: 'market' }
  ];
  for (let i = 0; i < areas.length; i++) {
    const a = areas[i];
    const fixedId = "assembly_" + (i + 1).toString().padStart(2, "0");
    await setDoc(doc(db, "assembly_areas", fixedId), { ...a, createdAt: serverTimestamp() }, { merge: true });
  }
  showToast("Resmi toplanma alanları tekilleştirilerek eşitlendi!");
  loadAssemblyAreas();
  loadDashboard();
};

window.seedEBelediyeOnly = async () => {
  const cats = [
    {
      id: 29, name: 'Vergi İşlemleri', icon: 'receipt_long',
      services: [
        { id: 21, name: 'Vergi / Borç Ödeme', description: 'Emlak, çevre temizlik, ilan-reklam borç sorgulama ve ödeme', url: 'https://portal.gebze.bel.tr/ui/user/login', hasModal: false },
        { id: 123, name: 'e-Beyan', description: 'Arsa, arazi, mesken, işyeri ve çevre temizlik e-beyan formları', url: 'https://ulakbel.gebze.bel.tr/WebBasvuru/', hasModal: true },
        { id: 60, name: 'e-Beyan Bildirim Takip', description: 'Yapılan e-beyan bildirimlerinin durum sorgulaması', url: 'https://ulakbel.gebze.bel.tr/WebBasvuru/#/Status', hasModal: false }
      ]
    },
    {
      id: 30, name: 'Gebze İletişim Merkezi', icon: 'support_agent',
      services: [
        { id: 124, name: 'Başvuru Formu (Çözüm Merkezi)', description: 'İstek, şikayet, teşekkür, proje önerisi ve ihbar', url: 'https://ulakbel.gebze.bel.tr/WebBasvuru/', hasModal: true },
        { id: 69, name: 'Başvuru Takip', description: 'T.C. Kimlik veya Takip No ile sonuç sorgulama', url: 'https://ulakbel.gebze.bel.tr/WebBasvuru/#/Status', hasModal: false }
      ]
    },
    {
      id: 31, name: 'İnteraktif Hizmetler', icon: 'touch_app',
      services: [
        { id: 45, name: 'e-Eksper', description: 'Gayrimenkul değerleme ve ekspertiz raporu', url: 'https://ulakbel.gebze.bel.tr/WebBasvuru/eeksper#/', hasModal: false },
        { id: 51, name: 'e-İşyeri Ruhsat', description: 'Sıhhi ve gayrisıhhi müesseseler ruhsat başvurusu', url: 'https://ulakbel.gebze.bel.tr/WebBasvuru/e-isyeri-ruhsat#/', hasModal: false },
        { id: 59, name: 'E-Moloz Hattı', description: 'İnşaat ve tadilat atıkları için moloz alım talebi', url: 'https://ulakbel.gebze.bel.tr/WebBasvuru/e-moloz-hatti#/', hasModal: false }
      ]
    },
    {
      id: 32, name: 'İmar Yönetim Sistemi', icon: 'apartment',
      services: [
        { id: 127, name: 'İmar Durumu Başvurusu', description: 'Resmi parsel imar durumu belgesi başvurusu', url: 'https://eimar.gebze.bel.tr/', hasModal: false },
        { id: 128, name: 'Yapı Ruhsatı Başvuruları', description: 'Mimari ve statik proje onay süreçleri', url: 'https://eimar.gebze.bel.tr/', hasModal: false }
      ]
    }
  ];
  for (const c of cats) {
    await setDoc(doc(db, "ebelediye_categories", "cat_" + c.id), c, { merge: true });
  }
  showToast("E-Belediye şablonları tekilleştirilerek Firestore ile eşitlendi!");
  loadEBelediye();
};

window.parkingCache = [];
window.parkingEditId = null;

const OFFICIAL_PARKING_LOTS = [
  {
    code: 'GBZ-001',
    name: 'Gebze Katlı Otopark',
    capacity: 476,
    occupied: 310,
    lat: 40.8000,
    lng: 29.4300,
    profile: 'katli',
    pricing: 'İlk 15 dk ücretsiz • 1 saat 30 ₺',
    neighborhood: 'Hacıhalil',
    address: 'Hükümet Cd. No:12',
    features: 'Asansör, 7/24 Güvenlik, Plaka Tanıma, Şarj Ünitesi',
    status: 'aktif'
  },
  {
    code: 'GBZ-002',
    name: 'Gebze Yol Üstü Otoparkı (İstanbul Cad.)',
    capacity: 13,
    occupied: 9,
    lat: 40.8015,
    lng: 29.4310,
    profile: 'yolUstu',
    pricing: 'İlk 15 dk ücretsiz • Saatlik 20 ₺',
    neighborhood: 'Hacıhalil',
    address: 'İstanbul Cad.',
    features: 'Parkomat, Kısa Süreli Park',
    status: 'aktif'
  },
  {
    code: 'GBZ-003',
    name: 'Gebze Yol Üstü Otoparkı (Hükümet Cad.)',
    capacity: 18,
    occupied: 14,
    lat: 40.8020,
    lng: 29.4295,
    profile: 'yolUstu',
    pricing: 'İlk 15 dk ücretsiz • Saatlik 20 ₺',
    neighborhood: 'Mustafapaşa',
    address: 'Hükümet Cad.',
    features: 'Parkomat, Yol Üstü',
    status: 'aktif'
  },
  {
    code: 'GBZ-004',
    name: 'Gebze Yol Üstü Otoparkı (Ali Rıza Efendi Cad.)',
    capacity: 55,
    occupied: 38,
    lat: 40.7985,
    lng: 29.4280,
    profile: 'yolUstu',
    pricing: 'İlk 15 dk ücretsiz • Saatlik 20 ₺',
    neighborhood: 'Osman Yılmaz',
    address: 'Ali Rıza Efendi Cad.',
    features: 'Parkomat, Yol Üstü',
    status: 'aktif'
  },
  {
    code: 'GBZ-005',
    name: 'Gebze Yol Üstü Otoparkı (Zübeyde Hanım Cad.)',
    capacity: 42,
    occupied: 28,
    lat: 40.8035,
    lng: 29.4325,
    profile: 'yolUstu',
    pricing: 'İlk 15 dk ücretsiz • Saatlik 20 ₺',
    neighborhood: 'Arapçeşme',
    address: 'Zübeyde Hanım Cad.',
    features: 'Parkomat, Yol Üstü',
    status: 'aktif'
  },
  {
    code: 'GBZ-006',
    name: 'Gebze Yol Üstü Otoparkı (İsmetpaşa Cad.)',
    capacity: 33,
    occupied: 21,
    lat: 40.8010,
    lng: 29.4340,
    profile: 'yolUstu',
    pricing: 'İlk 15 dk ücretsiz • Saatlik 20 ₺',
    neighborhood: 'Hacıhalil',
    address: 'İsmetpaşa Cad.',
    features: 'Parkomat, Yol Üstü',
    status: 'aktif'
  },
  {
    code: 'GBZ-007',
    name: 'Gebze Yol Üstü Otoparkı (Adliye Cad.)',
    capacity: 10,
    occupied: 9,
    lat: 40.8040,
    lng: 29.4360,
    profile: 'adliye',
    pricing: 'İlk 15 dk ücretsiz • Saatlik 20 ₺',
    neighborhood: 'Gaziler',
    address: 'Adliye Cad.',
    features: 'Adliye Çevresi, Parkomat',
    status: 'aktif'
  },
  {
    code: 'GBZ-008',
    name: 'Gebze Yol Üstü Otoparkı (Atatürk Cad.)',
    capacity: 23,
    occupied: 15,
    lat: 40.7990,
    lng: 29.4315,
    profile: 'yolUstu',
    pricing: 'İlk 15 dk ücretsiz • Saatlik 20 ₺',
    neighborhood: 'Osman Yılmaz',
    address: 'Atatürk Cad.',
    features: 'Parkomat, Yol Üstü',
    status: 'aktif'
  },
  {
    code: 'GBZ-009',
    name: 'Gebze Yol Üstü Otoparkı (Körfez Cad.)',
    capacity: 25,
    occupied: 16,
    lat: 40.8005,
    lng: 29.4270,
    profile: 'yolUstu',
    pricing: 'İlk 15 dk ücretsiz • Saatlik 20 ₺',
    neighborhood: 'Mustafapaşa',
    address: 'Körfez Cad.',
    features: 'Parkomat, Yol Üstü',
    status: 'aktif'
  }
];

async function loadParkingLots() {
  const grid = document.getElementById("parkingGrid");
  if (!grid) return;
  grid.innerHTML = '<div class="empty-state">Otopark bilgileri yükleniyor...</div>';
  try {
    const snap = await getDocs(collection(db, "parking_lots"));
    if (snap.empty) {
      window.parkingCache = [];
      grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 36px 20px;">
        <div style="font-size:36px; margin-bottom:10px;">🅿️</div>
        <p style="font-size:15px; font-weight:700; margin-bottom:6px;">Henüz kayıtlı otopark verisi bulunamadı.</p>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">Gebze genelindeki 9 adet resmi otoparkı (Katlı ve Yol Üstü) tek tıkla veritabanına aktarabilirsiniz.</p>
        <button class="btn btn-primary" onclick="window.seedParkingLots()">⚡ Resmi Otoparkları Eşitle (GBZ-001..009)</button>
      </div>
    `;
      updateParkingKpis([]);
      return;
    }

    const list = [];
    snap.forEach(d => {
      list.push({ id: d.id, ...d.data() });
    });

    list.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    window.parkingCache = list;
    renderParkingView();
  } catch (e) {
    console.error("loadParkingLots hatası:", e);
    grid.innerHTML = `<div class="empty-state">Hata oluştu: ${e.message}</div>`;
  }
}
window.loadParkingLots = loadParkingLots;

function updateParkingKpis(list) {
  const totalLots = list.length;
  let totalCap = 0;
  let totalOcc = 0;
  list.forEach(item => {
    totalCap += (Number(item.capacity) || 0);
    totalOcc += (Number(item.occupied) || 0);
  });
  const totalFree = Math.max(0, totalCap - totalOcc);
  const avgPercent = totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0;

  const elLots = document.getElementById("statParkingLots");
  if (elLots) elLots.innerText = totalLots;
  const elCap = document.getElementById("statParkingCapacity");
  if (elCap) elCap.innerText = totalCap;
  const elOcc = document.getElementById("statParkingOccupied");
  if (elOcc) elOcc.innerText = totalOcc;
  const elFree = document.getElementById("statParkingFree");
  if (elFree) elFree.innerText = totalFree;
  const elPct = document.getElementById("statParkingPercent");
  if (elPct) elPct.innerText = `%${avgPercent}`;

  const kpiLots = document.getElementById("kpiParkingLots");
  if (kpiLots) kpiLots.innerText = totalLots;
  const kpiSpots = document.getElementById("kpiParkingSpots");
  if (kpiSpots) kpiSpots.innerText = `${totalFree} Boş (${totalCap})`;
}

function renderParkingView() {
  const grid = document.getElementById("parkingGrid");
  if (!grid) return;

  const filterProfile = document.getElementById("parkingFilterProfile")?.value || 'all';
  const filterStatus = document.getElementById("parkingFilterStatus")?.value || 'all';
  const search = (document.getElementById("parkingSearchInput")?.value || '').trim().toLowerCase();

  const filtered = (window.parkingCache || []).filter(item => {
    const prof = (item.profile || 'katli').toLowerCase();
    if (filterProfile !== 'all' && prof !== filterProfile) return false;

    const cap = Number(item.capacity) || 1;
    const occ = Number(item.occupied) || 0;
    const ratio = occ / cap;
    let status = 'musait';
    if (ratio >= 0.95) status = 'dolu';
    else if (ratio >= 0.80) status = 'yogun';

    if (filterStatus !== 'all' && status !== filterStatus) return false;

    if (search) {
      const name = (item.name || '').toLowerCase();
      const code = (item.code || '').toLowerCase();
      const hood = (item.neighborhood || '').toLowerCase();
      const addr = (item.address || '').toLowerCase();
      if (!name.includes(search) && !code.includes(search) && !hood.includes(search) && !addr.includes(search)) {
        return false;
      }
    }
    return true;
  });

  updateParkingKpis(window.parkingCache || []);

  const countBadge = document.getElementById("parkingCountBadge");
  if (countBadge) countBadge.innerText = `${filtered.length} Otopark`;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;">Kriterlere uyan otopark kaydı bulunamadı.</div>';
    return;
  }

  grid.innerHTML = '';
  filtered.forEach(p => {
    const cap = Number(p.capacity) || 0;
    const occ = Math.min(cap, Math.max(0, Number(p.occupied) || 0));
    const free = Math.max(0, cap - occ);
    const ratio = cap > 0 ? (occ / cap) : 0;
    const pct = Math.round(ratio * 100);

    let statusText = 'Müsait';
    let statusCls = 'badge-success';
    let progCls = 'status-musait';
    if (ratio >= 0.95) {
      statusText = 'Dolu';
      statusCls = 'badge-danger';
      progCls = 'status-dolu';
    } else if (ratio >= 0.80) {
      statusText = 'Yoğun';
      statusCls = 'badge-warning';
      progCls = 'status-yogun';
    }

    const profileLabels = {
      'katli': '🏢 Katlı Otopark',
      'yolUstu': '🛣️ Yol Üstü Otoparkı',
      'adliye': '⚖️ Adliye Otoparkı',
      'acik': '🅿️ Açık Otopark'
    };
    const profLabel = profileLabels[p.profile] || '🅿️ Otopark';

    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
    <div class="item-card-body" style="padding:16px;">
      <div class="item-card-meta" style="margin-bottom:8px;">
        <span style="font-family:monospace; font-weight:800; color:var(--navy); font-size:12px;">${p.code || 'GBZ'}</span>
        <span class="badge ${statusCls}" style="margin-left:auto;">${statusText} (%${pct})</span>
      </div>
      <div class="item-card-title" style="font-size:15px; margin-bottom:4px;">${p.name}</div>
      <div style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">
        ${profLabel} • 📍 ${p.neighborhood || 'Gebze'} ${p.address ? ('• ' + p.address) : ''}
      </div>

      <div class="parking-progress">
        <div class="parking-progress-fill ${progCls}" style="width: ${Math.min(100, pct)}%;"></div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; background:#F8FAFC; border-radius:8px; padding:8px 10px; margin-bottom:12px; text-align:center;">
        <div>
          <div style="font-size:10.5px; color:var(--text-muted); font-weight:600;">KAPASİTE</div>
          <div style="font-size:14px; font-weight:800; color:var(--text-dark);">${cap}</div>
        </div>
        <div>
          <div style="font-size:10.5px; color:var(--text-muted); font-weight:600;">DOLU ARAÇ</div>
          <div style="font-size:14px; font-weight:800; color:#DC2626;">${occ}</div>
        </div>
        <div>
          <div style="font-size:10.5px; color:var(--text-muted); font-weight:600;">BOŞ YER</div>
          <div style="font-size:14px; font-weight:800; color:#166534;">${free}</div>
        </div>
      </div>

      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; font-size:12px;">
        <span style="font-weight:600; color:var(--text-muted);">Canlı Doluluk Ayarla:</span>
        <div class="quick-stepper">
          <button type="button" title="-5 Araç" onclick="window.quickUpdateParkingOccupancy('${p.id}', -5)">-5</button>
          <button type="button" title="-1 Araç" onclick="window.quickUpdateParkingOccupancy('${p.id}', -1)">-1</button>
          <span>${occ}</span>
          <button type="button" title="+1 Araç" onclick="window.quickUpdateParkingOccupancy('${p.id}', 1)">+1</button>
          <button type="button" title="+5 Araç" onclick="window.quickUpdateParkingOccupancy('${p.id}', 5)">+5</button>
        </div>
      </div>

      ${p.pricing ? `<div style="font-size:11.5px; color:var(--text-muted); margin-bottom:6px;">💰 <strong>Tarife:</strong> ${p.pricing}</div>` : ''}
      ${p.features ? `<div style="font-size:11px; color:#475569; background:#EFF6FF; border-radius:6px; padding:4px 8px; margin-bottom:8px;">✨ ${p.features}</div>` : ''}
    </div>

    <div class="item-card-footer" style="padding:10px 16px; background:#FAFAFA; border-top:1px solid var(--border);">
      ${(p.lat && p.lng) ? `<a href="https://www.google.com/maps?q=${p.lat},${p.lng}" target="_blank" class="badge badge-info" style="text-decoration:none;">🗺️ Harita</a>` : ''}
      <div style="margin-left:auto; display:flex; gap:6px;">
        <button class="btn btn-outline btn-sm" onclick="window.editParkingLot('${p.id}')">Düzenle</button>
        <button class="btn btn-danger btn-sm" onclick="window.deleteParkingLot('${p.id}')">Sil</button>
      </div>
    </div>
  `;
    grid.appendChild(card);
  });
}
window.renderParkingView = renderParkingView;

window.quickUpdateParkingOccupancy = async (id, delta) => {
  const lot = (window.parkingCache || []).find(x => x.id === id);
  if (!lot) return;
  const cap = Number(lot.capacity) || 0;
  const currentOcc = Number(lot.occupied) || 0;
  const nextOcc = Math.min(cap, Math.max(0, currentOcc + delta));

  try {
    const ref = doc(db, "parking_lots", id);
    await updateDoc(ref, {
      occupied: nextOcc,
      updatedAt: serverTimestamp()
    });
    lot.occupied = nextOcc;
    renderParkingView();
    showToast(`${lot.name} doluluk ${nextOcc} olarak güncellendi.`);
  } catch (err) {
    alert("Doluluk güncellenemedi: " + err.message);
  }
};

window.seedParkingLots = async () => {
  if (!confirm("Gebze Belediyesi resmi otopark verileri (GBZ-001..009) veritabanına aktarılsın mı?")) return;
  try {
    for (const lot of OFFICIAL_PARKING_LOTS) {
      const ref = doc(db, "parking_lots", lot.code);
      await setDoc(ref, {
        ...lot,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
    showToast("9 adet resmi Gebze otoparkı başarıyla eşitlendi!");
    await loadParkingLots();
  } catch (err) {
    alert("Otoparklar eşitlenirken hata: " + err.message);
  }
};

window.saveParkingLot = async (e) => {
  if (e) e.preventDefault();
  const code = document.getElementById("parkingCode").value.trim().toUpperCase();
  const name = document.getElementById("parkingName").value.trim();
  const profile = document.getElementById("parkingProfile").value;
  const capacity = Number(document.getElementById("parkingCapacity").value) || 0;
  const occupied = Number(document.getElementById("parkingOccupied").value) || 0;
  const neighborhood = document.getElementById("parkingNeighborhood").value;
  const address = document.getElementById("parkingAddress").value.trim();
  const pricing = document.getElementById("parkingPricing").value.trim();
  const lat = parseFloat(document.getElementById("parkingLat").value) || 40.8000;
  const lng = parseFloat(document.getElementById("parkingLng").value) || 29.4300;
  const features = document.getElementById("parkingFeatures").value.trim();
  const status = document.getElementById("parkingStatus").value || 'aktif';

  const btn = document.getElementById("btnSaveParking");
  if (btn) btn.disabled = true;

  try {
    const data = {
      code,
      name,
      profile,
      capacity,
      occupied: Math.min(capacity, Math.max(0, occupied)),
      neighborhood,
      address,
      pricing,
      lat,
      lng,
      features,
      status,
      updatedAt: serverTimestamp()
    };

    if (window.parkingEditId) {
      await updateDoc(doc(db, "parking_lots", window.parkingEditId), data);
      showToast("Otopark bilgileri güncellendi!");
    } else {
      data.createdAt = serverTimestamp();
      const targetDocId = code || ('GBZ-' + Date.now().toString().slice(-4));
      await setDoc(doc(db, "parking_lots", targetDocId), data, { merge: true });
      showToast("Yeni otopark başarıyla eklendi!");
    }

    window.cancelParkingEdit();
    await loadParkingLots();
  } catch (err) {
    alert("Otopark kaydedilirken hata: " + err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.editParkingLot = (id) => {
  const p = (window.parkingCache || []).find(x => x.id === id);
  if (!p) return;
  window.parkingEditId = id;

  document.getElementById("parkingCode").value = p.code || '';
  document.getElementById("parkingName").value = p.name || '';
  document.getElementById("parkingProfile").value = p.profile || 'katli';
  document.getElementById("parkingCapacity").value = p.capacity || 0;
  document.getElementById("parkingOccupied").value = p.occupied || 0;
  document.getElementById("parkingNeighborhood").value = p.neighborhood || 'Hacıhalil';
  document.getElementById("parkingAddress").value = p.address || '';
  document.getElementById("parkingPricing").value = p.pricing || '';
  document.getElementById("parkingLat").value = p.lat ?? '';
  document.getElementById("parkingLng").value = p.lng ?? '';
  document.getElementById("parkingFeatures").value = p.features || '';
  document.getElementById("parkingStatus").value = p.status || 'aktif';

  document.getElementById("parkingFormTitle").innerText = "Otoparkı Düzenle (" + (p.code || p.name) + ")";
  document.getElementById("btnSaveParking").innerText = "Değişiklikleri Kaydet";
  document.getElementById("btnCancelParking").style.display = "inline-flex";

  document.getElementById("formParking")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.cancelParkingEdit = () => {
  window.parkingEditId = null;
  document.getElementById("formParking")?.reset();
  document.getElementById("parkingFormTitle").innerText = "Yeni Otopark Ekle";
  document.getElementById("btnSaveParking").innerText = "Otoparkı Kaydet";
  document.getElementById("btnCancelParking").style.display = "none";
};

window.deleteParkingLot = async (id) => {
  if (!confirm("Bu otopark kaydını silmek istediğinize emin misiniz?")) return;
  try {
    await deleteDoc(doc(db, "parking_lots", id));
    showToast("Otopark kaydı silindi.");
    await loadParkingLots();
  } catch (err) {
    alert("Silinemedi: " + err.message);
  }
};

window.nurseriesCache = [];

const OFFICIAL_NURSERIES = [
  {
    name: "Gebze Belediyesi Şehit İlker Ağır Çocuk Bakımevi",
    neighborhood: "Mustafapaşa",
    capacity: 120,
    ageGroup: "36-66 Ay",
    phone: "0262 642 04 30",
    address: "Mustafapaşa Mah. 714. Sok. No:4",
    description: "Modern eğitim sınıfları, oyun bahçesi, pedagog desteği ve uzman eğitmen kadrosu.",
    status: "aktif"
  },
  {
    name: "Gebze Belediyesi Arapçeşme Gündüz Bakımevi",
    neighborhood: "Arapçeşme",
    capacity: 90,
    ageGroup: "36-66 Ay",
    phone: "0262 642 04 31",
    address: "Arapçeşme Mah. Gençlik Cad. No:18",
    description: "Çocuk atölyeleri, müzik ve resim odaları, tam zamanlı güvenlik ve yemekhane.",
    status: "aktif"
  },
  {
    name: "Gebze Belediyesi Yenikent Çocuk Eğitim & Kreş Merkezi",
    neighborhood: "Yenikent",
    capacity: 110,
    ageGroup: "36-66 Ay",
    phone: "0262 642 04 32",
    address: "Yenikent Mah. Barış Parkı Yanı",
    description: "Geniş peyzaj bahçesi, montessori eğitim modülleri ve drama atölyesi.",
    status: "aktif"
  },
  {
    name: "Gebze Belediyesi Beylikbağı Çocuk Gelişim Merkezi",
    neighborhood: "Beylikbağı",
    capacity: 85,
    ageGroup: "36-66 Ay",
    phone: "0262 642 04 33",
    address: "Beylikbağı Mah. Ankara Cad. No:110",
    description: "Sosyal beceri geliştirme alanları, uyku odaları ve uzman psikolog danışmanlığı.",
    status: "aktif"
  }
];

async function loadNurseries() {
  const container = document.getElementById("nurseriesGrid");
  if (!container) return;
  container.innerHTML = '<div class="empty-state">Kreşler yükleniyor...</div>';
  try {
    const snap = await getDocs(collection(db, "nurseries"));
    if (snap.empty) {
      window.nurseriesCache = [];
      container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 36px 20px;">
        <div style="font-size:36px; margin-bottom:10px;">🧸</div>
        <p style="font-size:15px; font-weight:700; margin-bottom:6px;">Kayıtlı belediye kreşi bulunamadı.</p>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">Resmi Gebze Belediyesi çocuk bakımevlerini sisteme eşitlemek için aşağıdaki butonu kullanabilirsiniz.</p>
        <button class="btn btn-primary" onclick="window.seedNurseries()">👶 Resmi Kreşleri Eşitle</button>
      </div>
    `;
      return;
    }

    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    window.nurseriesCache = list;

    const countBadge = document.getElementById("nurseriesCountBadge");
    if (countBadge) countBadge.innerText = `${list.length} Kreş`;

    container.innerHTML = '';
    list.forEach(d => {
      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
      ${d.imageUrl ? `<img src="${d.imageUrl}" class="item-card-image" onclick="openLightbox('${d.imageUrl}')" alt="kreş">` : ''}
      <div class="item-card-body" style="padding:16px;">
        <div class="item-card-meta" style="margin-bottom:6px;">
          <span>👶 ${d.neighborhood || 'Gebze'}</span>
          <span class="badge badge-purple" style="margin-left:auto;">${d.capacity ? (d.capacity + ' Kontenjan') : 'Aktif'}</span>
        </div>
        <div class="item-card-title" style="font-size:15px; margin-bottom:4px;">${d.name}</div>
        <div style="font-size:12px; color:var(--text-muted); line-height:1.5; margin-bottom:8px;">
          📍 ${d.address || 'Gebze'}<br>
          📞 ${d.phone || '0262 642 04 30'}<br>
          ${d.ageGroup ? `🎓 <strong>Yaş Grubu:</strong> ${d.ageGroup}` : ''}
        </div>
        ${d.description ? `<div style="font-size:12px; color:#475569; background:#F8FAFC; padding:8px; border-radius:6px;">${d.description}</div>` : ''}
      </div>
      <div class="item-card-footer" style="padding:10px 16px; background:#FAFAFA; border-top:1px solid var(--border);">
        <span class="badge badge-success">Kayıt Alıyor</span>
        <button class="btn btn-danger btn-sm" onclick="deleteDocItem('nurseries', '${d.id}', window.loadNurseries)">Sil</button>
      </div>
    `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Hata: ${e.message}</div>`;
  }
}
window.loadNurseries = loadNurseries;

window.seedNurseries = async () => {
  if (!confirm("Gebze Belediyesi resmi çocuk bakımevleri veritabanına aktarılsın mı?")) return;
  try {
    for (const n of OFFICIAL_NURSERIES) {
      await addDoc(collection(db, "nurseries"), {
        ...n,
        createdAt: serverTimestamp()
      });
    }
    showToast("Resmi kreş ve bakımevleri başarıyla eklendi!");
    await loadNurseries();
  } catch (err) {
    alert("Kreşler eklenirken hata: " + err.message);
  }
};

window.saveNursery = async (e) => {
  if (e) e.preventDefault();
  const name = document.getElementById("nurseryName").value.trim();
  const neighborhood = document.getElementById("nurseryNeighborhood").value;
  const capacity = Number(document.getElementById("nurseryCapacity").value) || 0;
  const ageGroup = document.getElementById("nurseryAgeGroup").value.trim();
  const phone = document.getElementById("nurseryPhone").value.trim();
  const address = document.getElementById("nurseryAddress").value.trim();
  const imageUrl = document.getElementById("nurseryImage").value.trim();
  const description = document.getElementById("nurseryDesc").value.trim();

  const btn = document.getElementById("btnSaveNursery");
  if (btn) btn.disabled = true;
  try {
    await addDoc(collection(db, "nurseries"), {
      name,
      neighborhood,
      capacity,
      ageGroup,
      phone,
      address,
      imageUrl,
      description,
      createdAt: serverTimestamp()
    });
    showToast("Yeni kreş başarıyla eklendi!");
    document.getElementById("formNursery")?.reset();
    await loadNurseries();
  } catch (err) {
    alert("Kreş eklenirken hata: " + err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
};

(function bindDynamicForms() {
  const ready = (f) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', f) : f();
  ready(() => {
    document.getElementById('formParking')?.addEventListener('submit', window.saveParkingLot);
    document.getElementById('formNursery')?.addEventListener('submit', window.saveNursery);
  });
})();
