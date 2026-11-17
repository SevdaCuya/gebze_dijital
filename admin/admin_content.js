async function loadNews() {
  const container = document.getElementById("newsGrid");
  container.innerHTML = '<div class="empty-state">Haberler yükleniyor...</div>';
  try {
    const snap = await getDocs(collection(db, "municipal_news"));
    if (snap.empty) {
      container.innerHTML = '<div class="empty-state">Kayıtlı belediye haberi bulunmamaktadır.</div>';
      return;
    }
    const items = [];
    let fallbackSeq = Math.floor(Date.now() / 1000);
    for (const docSnap of snap.docs) {
      const d = docSnap.data();
      let sortKey = Number(d.newsId) || 0;
      const createdMillis = d.createdAt?.toMillis ? d.createdAt.toMillis() : (d.publishedAt?.toMillis ? d.publishedAt.toMillis() : 0);
      if (createdMillis && (!d.newsId || Number(d.newsId) > 100000)) {
        sortKey = Math.floor(createdMillis / 1000);
      } else if (!d.newsId) {
        sortKey = fallbackSeq--;
      }
      if (d.newsId === undefined || d.newsId === null) {
        updateDoc(doc(db, "municipal_news", docSnap.id), { newsId: sortKey }).catch(() => {});
      }
      items.push({ id: docSnap.id, data: d, sortKey });
    }
    items.sort((a, b) => b.sortKey - a.sortKey);

    container.innerHTML = '';
    items.forEach(({ id, data: d, sortKey }) => {
      const isAdminAdded = sortKey > 100000;
      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        <img src="${d.image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80'}" class="item-card-image" onclick="openLightbox('${d.image}')" alt="haber">
        <div class="item-card-body">
          <div class="item-card-meta">
            <span>📅 ${d.publishedAtText || 'Bugün'}</span>
            ${isAdminAdded ? `<span class="badge badge-success" style="margin-left:6px;">⚡ Canlı Yayında</span>` : ''}
            ${d.category ? `<span class="badge badge-primary" style="margin-left:auto;">${d.category}</span>` : ''}
          </div>
          <div class="item-card-title">${d.title}</div>
          <div class="item-card-desc">${d.summary || d.description || (d.url ? '🔗 ' + d.url : 'Belediye Güncel Haberi')}</div>
        </div>
        <div class="item-card-footer">
          <span class="badge badge-primary">No: ${d.newsId || sortKey}</span>
          <button class="btn btn-danger btn-sm" onclick="deleteDocItem('municipal_news', '${id}', loadNews)">Sil</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Hata: ${e.message}</div>`;
  }
}
window.loadNews = loadNews;

async function seedOfficialNews() {
  const btn = document.getElementById("btnSyncOfficialNews");
  if (btn) btn.disabled = true;
  try {
    const newsData = window.GEBZE_OFFICIAL_NEWS;
    if (!Array.isArray(newsData) || newsData.length === 0) {
      throw new Error("Resmi haber veri paketi (news_cache.js) bulunamadı.");
    }

    showToast(`${newsData.length} resmi belediye haberi senkronize ediliyor...`);

    const trMonthsMap = {
      "ocak": 0, "şubat": 1, "mart": 2, "nisan": 3, "mayıs": 4, "haziran": 5,
      "temmuz": 6, "ağustos": 7, "eylül": 8, "ekim": 9, "kasım": 10, "aralık": 11
    };
    const parseTrDate = (str) => {
      if (!str) return null;
      const m = str.match(/(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})/i);
      if (!m) return null;
      const day = parseInt(m[1], 10);
      const month = trMonthsMap[m[2].toLowerCase()];
      const year = parseInt(m[3], 10);
      if (month === undefined) return null;
      return new Date(Date.UTC(year, month, day, 12, 0, 0));
    };

    let count = 0;
    for (const item of newsData) {
      const docId = item.id || ('news_' + (item.newsId || (count + 1)));
      const dateObj = parseTrDate(item.publishedAtText) || new Date(2026, 9, 26);
      await setDoc(doc(db, "municipal_news", docId), {
        id: docId,
        title: item.title,
        url: item.url || '',
        image: item.image || '',
        publishedAtText: item.publishedAtText || '26 Ekim 2026',
        publishedAt: Timestamp.fromDate(dateObj),
        newsId: item.newsId || (7400 + count),
        pageIndex: item.pageIndex || 1,
        itemIndex: item.itemIndex || count,
        summary: item.summary || item.title,
        title_en: item.title_en || item.title,
        title_ar: item.title_ar || item.title,
        summary_en: item.summary_en || (item.summary || item.title),
        summary_ar: item.summary_ar || (item.summary || item.title),
        category: "Belediye",
        source: "Gebze Belediyesi",
        syncedAt: serverTimestamp()
      }, { merge: true });
      count++;
    }

    showToast(`✅ ${count} adet resmi belediye haberi başarıyla Firestore'a aktarıldı!`);
    loadNews();
    loadDashboard();
  } catch (err) {
    alert("Haber senkronizasyonu hatası: " + err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}
window.seedOfficialNews = seedOfficialNews;

window.eventsListCache = [];

async function loadEvents() {
  const container = document.getElementById("eventsGrid");
  if (container) {
    container.innerHTML = '<div class="empty-state">Etkinlikler yükleniyor...</div>';
  }
  try {
    const snap = await getDocs(collection(db, "events"));
    const list = [];
    snap.forEach(docSnap => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });

    list.sort((a, b) => {
      const da = a.date || '';
      const db = b.date || '';
      return db.localeCompare(da);
    });

    window.eventsListCache = list;
    const b = document.getElementById('eventsCountBadge');
    if (b) b.innerText = `${list.length} Etkinlik`;
    const kpi = document.getElementById('kpiEvents');
    if (kpi) kpi.innerText = list.length;

    renderEventsList();
  } catch (e) {
    console.error("loadEvents hatası:", e);
    if (container) {
      container.innerHTML = `<div class="empty-state">Hata: ${e.message}</div>`;
    }
  }
}
window.loadEvents = loadEvents;

function renderEventsList() {
  const container = document.getElementById("eventsGrid");
  if (!container) return;

  const q = (document.getElementById("eventsSearchInput")?.value || '').trim().toLowerCase();
  const catFilter = document.getElementById("eventsFilterCategory")?.value || '';
  const monthFilter = document.getElementById("eventsFilterMonth")?.value || '';

  const filtered = (window.eventsListCache || []).filter(d => {
    if (catFilter && d.category !== catFilter) return false;
    if (monthFilter && !(d.date || '').startsWith(monthFilter)) return false;
    if (q) {
      const title = (d.title || d.name || '').toLowerCase();
      const loc = (d.location || d.subtitle || '').toLowerCase();
      const desc = (d.description || '').toLowerCase();
      if (!title.includes(q) && !loc.includes(q) && !desc.includes(q)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">Kriterlere uygun etkinlik bulunamadı.</div>';
    return;
  }

  container.innerHTML = '';
  filtered.forEach(d => {
    const imgUrl = d.image || d.imageUrl || '';
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      ${imgUrl ? `<img src="${imgUrl}" class="item-card-image" onerror="this.style.display='none'" onclick="openLightbox('${imgUrl}')" alt="etkinlik">` : ''}
      <div class="item-card-body">
        <div class="item-card-meta">
          <span>🎭 ${d.category || 'Kültür & Sanat'}</span>
          <span style="margin-left:auto; font-weight:700;">📅 ${d.formattedDate || d.date || 'Yakında'} ${d.time ? '• ' + d.time : ''}</span>
        </div>
        <div class="item-card-title">${d.title || d.name || ''}</div>
        <div class="item-card-desc">📍 ${d.subtitle || d.location || 'Gebze'}</div>
        ${d.description && d.description !== d.category ? `<div style="font-size:12px; color:var(--text-muted); margin-top:4px;">${d.description}</div>` : ''}
      </div>
      <div class="item-card-footer">
        ${d.url ? `<a href="${d.url}" target="_blank" class="badge badge-info" style="text-decoration:none;">🔗 Resmi Sayfa</a>` : '<span class="badge badge-success">Aktif</span>'}
        <button class="btn btn-danger btn-sm" onclick="deleteDocItem('events', '${d.id}', loadEvents)">Sil</button>
      </div>
    `;
    container.appendChild(card);
  });
}
window.renderEventsList = renderEventsList;

window.syncEventsFromWeb = async () => {
  const btn = document.getElementById("btnSyncEventsWeb");
  const monthSelect = document.getElementById("syncEventMonth");
  const selectedMonth = monthSelect ? monthSelect.value : "2026-11";

  if (btn) {
    btn.disabled = true;
    btn.innerText = "⏳ Etkinlikler Çekiliyor...";
  }
  try {
    const targetUrl = "https://www.gebze.bel.tr/json/etkinlik.json";
    let data = null;

    try {
      const res = await fetch(targetUrl);
      if (res.ok) data = await res.json();
    } catch (_) { }

    if (!data || !Array.isArray(data)) {
      try {
        const res = await fetch("https://corsproxy.io/?url=" + encodeURIComponent(targetUrl));
        if (res.ok) data = await res.json();
      } catch (_) { }
    }

    if (!data || !Array.isArray(data)) {
      try {
        const res = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(targetUrl));
        if (res.ok) data = await res.json();
      } catch (_) { }
    }

    const localEvents = window.GEBZE_OFFICIAL_EVENTS || [];
    if (!data || !Array.isArray(data)) {
      data = localEvents;
    } else if (localEvents.length > 0) {
      const existingIds = new Set(data.map(x => String(x.id)));
      for (const ev of localEvents) {
        if (!existingIds.has(String(ev.id))) {
          data.push(ev);
        }
      }
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Etkinlik listesi resmi siteden alınamadı.");
    }

    const trMonths = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const formatTrDate = (dStr) => {
      if (!dStr || !dStr.includes("-")) return dStr || "";
      const p = dStr.split("-");
      if (p.length !== 3) return dStr;
      const day = parseInt(p[2], 10);
      const m = parseInt(p[1], 10);
      return `${day} ${trMonths[m] || ''} ${p[0]}`.trim();
    };

    let targetEvents;
    if (selectedMonth && selectedMonth !== 'all') {
      targetEvents = data.filter(x => (x.tarih || '').startsWith(selectedMonth));
      if (targetEvents.length === 0 && localEvents.length > 0) {
        targetEvents = localEvents.filter(x => (x.tarih || '').startsWith(selectedMonth));
      }
    } else {
      targetEvents = data.filter(x => (x.tarih || '') >= '2026-10-01');
    }

    const finalEvents = targetEvents.length > 0 ? targetEvents : data.slice(0, 50);

    let count = 0;
    for (const item of finalEvents) {
      const id = String(item.id || Date.now() + count);
      const title = (item.baslik || "").trim();
      const category = (item.kategori || "Kültür & Sanat").trim();
      const location = (item.konum || "Gebze Kültür Merkezi").trim();
      const date = (item.tarih || "").trim();
      const time = (item.saat || "").trim();
      const formattedDate = formatTrDate(date);
      const subtitle = [location, formattedDate, time].filter(Boolean).join(" • ");
      const rawImg = (item.resim || "").trim();
      const image = rawImg ? (rawImg.startsWith("http") ? rawImg : `https://www.gebze.bel.tr/${rawImg}`) : "";
      const rawUrl = (item.url || "").trim();
      const url = rawUrl ? (rawUrl.startsWith("http") ? rawUrl : `https://www.gebze.bel.tr/${rawUrl}`) : "https://www.gebze.bel.tr/etkinlik.html";

      await setDoc(doc(db, "events", `etkinlik_${id}`), {
        id: `etkinlik_${id}`,
        eventId: id,
        title,
        name: title,
        category,
        location,
        address: location,
        date,
        time,
        formattedDate,
        subtitle,
        description: (item.aciklama || category).trim(),
        image,
        imageUrl: image,
        url,
        source: "Gebze Belediyesi",
        syncedAt: serverTimestamp()
      }, { merge: true });
      count++;
    }

    const monthName = selectedMonth === '2026-11' ? 'Kasım 2026' : (selectedMonth === '2026-10' ? 'Ekim 2026' : (selectedMonth === '2026-12' ? 'Aralık 2026' : (selectedMonth === 'all' ? 'Tüm Program' : selectedMonth)));
    showToast(`✅ ${count} adet ${monthName} etkinliği başarıyla Firestore'a aktarıldı!`);

    const filterMonthSelect = document.getElementById("eventsFilterMonth");
    if (filterMonthSelect && selectedMonth !== 'all') {
      filterMonthSelect.value = selectedMonth;
    }

    loadEvents();
    loadDashboard();
  } catch (err) {
    alert("Etkinlik senkronizasyonu hatası: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "🌐 Seçili Ayın Etkinliklerini Çek / Güncelle";
    }
  }
};

window.cleanOldEvents = async () => {
  if (!confirm("Ekim 2026 öncesine ait eski etkinlikler veritabanından kalıcı olarak silinecek. Onaylıyor musunuz?")) {
    return;
  }
  const btn = document.getElementById("btnCleanOldEvents");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "⏳ Siliniyor...";
  }
  try {
    const snap = await getDocs(collection(db, "events"));
    let deleted = 0;
    for (const d of snap.docs) {
      const data = d.data();
      const dateStr = data.date || data.tarih || '';
      if (!dateStr || dateStr < '2026-10-01') {
        await deleteDoc(doc(db, "events", d.id));
        deleted++;
      }
    }
    showToast(`🧹 ${deleted} adet eski etkinlik silindi.`);
    loadEvents();
    loadDashboard();
  } catch (err) {
    alert("Temizleme hatası: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "🧹 Eski Verileri Sil";
    }
  }
};

async function loadPolls() {
  const container = document.getElementById("pollsGrid");
  container.innerHTML = '<div class="empty-state">Anketler yükleniyor...</div>';

  const endInp = document.getElementById("pollEndDate");
  if (endInp && !endInp.value) {
    const d = new Date(Date.now() + 14 * 24 * 3600 * 1000);
    endInp.value = d.toISOString().slice(0, 10);
  }

  try {
    const snap = await getDocs(collection(db, "polls"));
    if (snap.empty) {
      container.innerHTML = '<div class="empty-state">Henüz aktif anket bulunmuyor.</div>';
      return;
    }
    container.innerHTML = '';
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const optionsHtml = (d.options || []).map((opt, i) => {
        const votes = (d.votes && d.votes[i]) ? d.votes[i] : 0;
        return `<li style="font-size:12.5px; margin-bottom:6px; color:var(--text-dark); display:flex; justify-content:space-between; align-items:center;">
          <span>${opt}</span> <span class="badge badge-primary">${votes} Oy</span>
        </li>`;
      }).join('');

      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        <div class="item-card-body">
          <div class="item-card-meta">🗳️ ${d.neighborhood || 'Tüm Gebze'} • Bitiş: ${d.endDate || 'Süresiz'}</div>
          <div class="item-card-title">${d.question}</div>
          <div class="item-card-desc">${d.description || ''}</div>
          <ul style="list-style:none; padding:8px 0; margin:6px 0; border-top:1px dashed var(--border); border-bottom:1px dashed var(--border);">${optionsHtml}</ul>
        </div>
        <div class="item-card-footer">
          <button class="btn btn-sm ${d.isActive ? 'btn-success' : 'btn-outline'}" onclick="togglePollStatus('${docSnap.id}', ${!d.isActive})">
            ${d.isActive ? '🟢 Oylamaya Açık' : '🔴 Oylamaya Kapalı'}
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteDocItem('polls', '${docSnap.id}', loadPolls)">Sil</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Hata: ${e.message}</div>`;
  }
}
window.loadPolls = loadPolls;

window.togglePollStatus = async (id, currentStatus) => {
  try {
    await updateDoc(doc(db, "polls", id), { isActive: currentStatus });
    showToast("Anket oylama durumu güncellendi.");
    loadPolls();
  } catch (e) { alert("Hata: " + e.message); }
};

window.allSuggestionsCache = [];
window.currentSuggFilter = 'all';

window.setSuggFilter = (filter) => {
  window.currentSuggFilter = filter;
  document.getElementById('btnSuggFilterAll')?.classList.toggle('btn-primary', filter === 'all');
  document.getElementById('btnSuggFilterAll')?.classList.toggle('btn-outline', filter !== 'all');
  document.getElementById('btnSuggFilterPending')?.classList.toggle('btn-primary', filter === 'pending');
  document.getElementById('btnSuggFilterPending')?.classList.toggle('btn-outline', filter !== 'pending');
  document.getElementById('btnSuggFilterApproved')?.classList.toggle('btn-primary', filter === 'approved');
  document.getElementById('btnSuggFilterApproved')?.classList.toggle('btn-outline', filter !== 'approved');
  renderSuggestionsList();
};

async function loadSuggestions() {
  const container = document.getElementById("suggestionsGrid");
  if (container) container.innerHTML = '<div class="empty-state">Öneriler yükleniyor...</div>';
  try {
    const snap = await getDocs(collection(db, "suggestions"));
    const list = [];
    snap.forEach(docSnap => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });

    list.sort((a, b) => {
      const aPending = a.approved !== true ? 1 : 0;
      const bPending = b.approved !== true ? 1 : 0;
      if (aPending !== bPending) return bPending - aPending;
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });

    window.allSuggestionsCache = list;
    renderSuggestionsList();
  } catch (e) {
    if (container) container.innerHTML = `<div class="empty-state">Hata: ${e.message}</div>`;
  }
}
window.loadSuggestions = loadSuggestions;

function renderSuggestionsList() {
  const container = document.getElementById("suggestionsGrid");
  if (!container) return;

  const list = window.allSuggestionsCache || [];
  const filter = window.currentSuggFilter || 'all';
  const q = (document.getElementById("suggSearchInput")?.value || '').trim().toLowerCase();
  const hoodFilter = document.getElementById("suggFilterNeighborhood")?.value || '';

  let pendingCount = 0;
  let approvedCount = 0;
  list.forEach(d => {
    if (d.approved === true) approvedCount++;
    else pendingCount++;
  });

  const elCntAll = document.getElementById('cntSuggAll');
  const elCntPending = document.getElementById('cntSuggPending');
  const elCntApproved = document.getElementById('cntSuggApproved');
  if (elCntAll) elCntAll.innerText = list.length;
  if (elCntPending) elCntPending.innerText = pendingCount;
  if (elCntApproved) elCntApproved.innerText = approvedCount;

  const badgeTab = document.getElementById('suggPendingCountBadge');
  if (badgeTab) {
    badgeTab.innerText = `${pendingCount} Onay Bekliyor`;
    badgeTab.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }
  const bNav = document.getElementById('badgePendingSugg');
  if (bNav) {
    bNav.innerText = pendingCount;
    bNav.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }
  const kpi = document.getElementById('kpiSuggestions');
  if (kpi) kpi.innerText = pendingCount;

  const filtered = list.filter(d => {
    const isApproved = d.approved === true;
    if (filter === 'pending' && isApproved) return false;
    if (filter === 'approved' && !isApproved) return false;
    if (hoodFilter && (d.neighborhood || '') !== hoodFilter) return false;
    if (!q) return true;
    const searchStr = `${d.title || ''} ${d.description || ''} ${d.author || ''} ${d.authorEmail || ''} ${d.neighborhood || ''} ${d.category || ''}`.toLowerCase();
    return searchStr.includes(q);
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; background: white; border-radius: var(--radius); border: 2px dashed var(--border);">Kriterlere uygun öneri kaydı bulunamadı.</div>';
    return;
  }

  container.innerHTML = '';
  filtered.forEach(d => {
    const isApproved = d.approved === true;
    const card = document.createElement("div");
    card.className = "item-card";
    if (!isApproved) {
      card.style.border = "1.5px solid #f59e0b";
      card.style.background = "rgba(245, 158, 11, 0.02)";
    }

    const dateStr = d.createdAt?.toMillis
      ? new Date(d.createdAt.toMillis()).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : (d.date || 'Tarih belirtilmedi');

    card.innerHTML = `
      <div class="item-card-body">
        <div class="item-card-meta">
          <span>💡 ${d.category || 'Genel'} • 📍 ${d.neighborhood || 'Gebze'}</span>
          <span class="badge ${isApproved ? 'badge-success' : 'badge-warning'}" style="margin-left:auto;">
            ${isApproved ? '✅ Yayında' : '⏳ Onay Bekliyor (İncelemede)'}
          </span>
        </div>
        <div class="item-card-title">${d.title || 'Başlıksız Öneri'}</div>
        <div class="item-card-desc">${d.description || ''}</div>

        <div style="font-size:12px; color:var(--text-muted); font-weight:600; margin-top:8px; line-height:1.4;">
          <div>👤 <strong>Vatandaş:</strong> ${d.author || 'Vatandaş'} ${d.authorEmail ? `(${d.authorEmail})` : ''}</div>
          <div style="color:var(--text-muted); font-weight:500; font-size:11.5px; margin-top:2px;">🕒 <strong>Tarih:</strong> ${dateStr} • ❤️ <strong>${d.likes || 0} Destek</strong></div>
        </div>

        ${!isApproved ? `
          <div style="font-size:11.5px; color:#b45309; margin-top:10px; background:rgba(245, 158, 11, 0.1); padding:6px 10px; border-radius:6px; font-weight:600; display:flex; align-items:center; gap:6px;">
            <span>⚠️</span> <span>Şu anda yalnızca öneriyi yapan vatandaşın cihazında görünüyor. Tüm kullanıcılara açmak için onaylayın.</span>
          </div>
        ` : `
          <div style="font-size:11.5px; color:#15803d; margin-top:10px; background:rgba(34, 197, 94, 0.08); padding:6px 10px; border-radius:6px; font-weight:600; display:flex; align-items:center; gap:6px;">
            <span>🌐</span> <span>Tüm cihazlarda ve kullanıcılarda yayında. Vatandaşlar oylayabilir ve destekleyebilir.</span>
          </div>
        `}
      </div>
      <div class="item-card-footer">
        ${!isApproved ? `
          <button class="btn btn-success btn-sm" onclick="approveSuggestion('${d.id}')">✅ Onayla ve Yayınla</button>
        ` : `
          <button class="btn btn-outline btn-sm" onclick="unapproveSuggestion('${d.id}')">⏸️ Yayından Kaldır (İncelemeye Al)</button>
        `}
        <button class="btn btn-danger btn-sm" onclick="deleteDocItem('suggestions', '${d.id}', loadSuggestions)">Sil</button>
      </div>
    `;
    container.appendChild(card);
  });
}
window.renderSuggestionsList = renderSuggestionsList;

window.approveSuggestion = async (id) => {
  try {
    await updateDoc(doc(db, "suggestions", id), {
      approved: true,
      status: "Onaylandı",
      reviewedAt: serverTimestamp()
    });
    showToast("✅ Öneri onaylandı ve tüm cihazlarda yayına alındı!");
    loadSuggestions();
    loadDashboard();
  } catch (e) { alert("Hata: " + e.message); }
};

window.unapproveSuggestion = async (id) => {
  try {
    await updateDoc(doc(db, "suggestions", id), {
      approved: false,
      status: "İncelemede",
      reviewedAt: serverTimestamp()
    });
    showToast("Öneri yayından kaldırıldı ve inceleme aşamasına alındı.");
    loadSuggestions();
    loadDashboard();
  } catch (e) { alert("Hata: " + e.message); }
};

const BROADCAST_TARGET_LABELS = {
  detail_only: "📄 Sadece Duyuru Detayı (Yönlendirme Yok)",
  home: "🏠 Ana Sayfa (Vitrin)",
  news: "📰 Haberler & Belediye Duyuruları",
  outages: "⚡ Planlı Su & Elektrik Kesintileri",
  emergency: "🚨 Afet & Acil Toplanma Alanları",
  neighborhood: "🚧 Mahallemde (Saha & Altyapı Çalışmaları)",
  pharmacy: "💊 Nöbetçi Eczaneler",
  parking: "🅿️ Otoparklar & Canlı Doluluk",
  sozSende: "🗳️ Söz Sende (Anketler & Öneriler)",
  ebelediye: "🏛️ E-Belediye Hizmetleri (Vergi/Borç/İmar)",
  services: "🧭 Tüm Belediye Hizmetleri Ekranı",
  weather: "🌤️ Hava Durumu & Meteoroloji",
  profile: "👤 Profil & Hesap Ayarları",
  guide_institutions: "🏢 Şehir Rehberi: Kurumsal Hizmetler (Tümü)",
  guide_etkinlikler: "🎭 Kültür & Sanat Etkinlikleri",
  guide_lokantalar: "🍽️ Kent Lokantaları",
  guide_parklar: "🌳 Parklar & Yeşil Alanlar",
  guide_pazar: "🛒 Semt Pazar Yerleri",
  guide_spor: "⚽ Spor Tesisleri & Salonlar",
  guide_kultur: "🏛️ Kültür Merkezleri & Kütüphaneler",
  guide_kresler: "🧸 Kreşler & Çocuk Atölyeleri (AKÇEM)",
  guide_mezarliklar: "🪦 Mezarlıklar & Defin Hizmetleri",
  guide_belediye: "🏢 Belediye Hizmet Birimleri & Müdürlükler",
  discover_places: "🏰 Gebze'yi Keşfet: Tarihi & Gezilecek Yerler",
  discover_foods: "🍲 Gebze'yi Keşfet: Yöresel Lezzetler (Ne Yenir?)",
  discover_picnic: "🌲 Gebze'yi Keşfet: Doğa, Mesire & Piknik Alanları",
  pati_center: "🐾 Gebze Pati: Bakım Merkezi & Hayvan Ambulansı",
  pati_adoption: "🐶 Gebze Pati: Yuva Arayanlar (Sahiplendirme)",
  pati_feeding: "🥣 Gebze Pati: Mama Odakları & Nöbetçi Veteriner",
  external_url: "🌐 Harici Web Bağlantısı (Link)"
};

const BROADCAST_PRESETS = {
  su_kesinti: {
    title: "Planlı Su Kesintisi Duyurusu",
    message: "İSU tarafından yapılacak şebeke iyileştirme çalışması nedeniyle belirtilen saatler arasında su kesintisi uygulanacaktır.",
    targetPage: "outages",
    topic: "outages",
    category: "outages",
    priority: "important",
    actionButtonLabel: "Kesintileri İncele"
  },
  elektrik_kesinti: {
    title: "Planlı Elektrik Kesintisi Bilgilendirmesi",
    message: "SEDAŞ bakım ve trafo yenileme çalışmaları kapsamında mahallelerimizde planlı kesinti yapılacaktır.",
    targetPage: "outages",
    topic: "outages",
    category: "outages",
    priority: "important",
    actionButtonLabel: "Kesinti Listesini Gör"
  },
  acil_durum: {
    title: "Önemli Afet & Acil Durum Bilgilendirmesi",
    message: "Mahallenizdeki en yakın güvenli afet toplanma alanlarını ve acil durum iletişim hatlarını kontrol edebilirsiniz.",
    targetPage: "emergency",
    topic: "emergency",
    category: "announcements",
    priority: "urgent",
    actionButtonLabel: "Toplanma Alanlarını Gör"
  },
  etkinlik: {
    title: "Kültür & Sanat Etkinliğimize Davetlisiniz",
    message: "Gebze Kültür Merkezi'nde düzenlenecek ücretsiz etkinlik ve gösteri takvimimiz güncellendi.",
    targetPage: "guide_etkinlikler",
    topic: "guide_etkinlikler",
    category: "announcements",
    priority: "normal",
    actionButtonLabel: "Etkinlik Takvimini Aç"
  },
  kent_lokanta: {
    title: "Kent Lokantası Günün Menüsü Hazır",
    message: "Gebze Belediyesi Kent Lokantalarımızda 4 çeşit sağlıklı ve ekonomik sıcak yemek servisimiz başlamıştır.",
    targetPage: "guide_lokantalar",
    topic: "guide_lokantalar",
    category: "services",
    priority: "normal",
    actionButtonLabel: "Kent Lokantalarını Gör"
  },
  pati: {
    title: "Can Dostlarımız Yuva Arıyor",
    message: "Gebze Pati Bakım Merkezimizdeki sevimli dostlarımızı inceleyerek ücretsiz sahiplenme başvurusu yapabilirsiniz.",
    targetPage: "pati_adoption",
    topic: "pati_adoption",
    category: "announcements",
    priority: "normal",
    actionButtonLabel: "Yuva Arayanları Gör"
  },
  mahalle_calisma: {
    title: "Mahallenizde Saha & Asfalt Çalışması",
    message: "Fen İşleri Müdürlüğü ekiplerimiz tarafından yürütülen yol bakım ve altyapı çalışmalarını canlı takip edebilirsiniz.",
    targetPage: "neighborhood",
    topic: "neighborhood",
    category: "services",
    priority: "normal",
    actionButtonLabel: "Saha Çalışmalarını Gör"
  },
  anket: {
    title: "Söz Sende: Yeni Belediye Anketi Yayında!",
    message: "Gebze'mizin geleceği için görüşünüz önemli. Yeni mahalle ve proje anketimize katılarak oyunuzu kullanın.",
    targetPage: "sozSende",
    topic: "sozSende",
    category: "announcements",
    priority: "important",
    actionButtonLabel: "Ankete Katıl"
  }
};

window._broadcastManualTargetSelected = false;

window.detectBroadcastTargetFromText = (title, msg) => {
  const text = `${title || ''} ${msg || ''}`.toLocaleLowerCase('tr-TR');
  if (text.includes('lokanta') || text.includes('günün menüsü') || text.includes('sıcak yemek')) return 'guide_lokantalar';
  if (text.includes('eczane') || text.includes('nöbetçi')) return 'pharmacy';
  if (text.includes('otopark')) return 'parking';
  if (text.includes('kesinti') || text.includes('isu ') || text.includes('sedaş')) return 'outages';
  if (text.includes('toplanma alan') || text.includes('afet') || text.includes('deprem')) return 'emergency';
  if (text.includes('kreş') || text.includes('akçem') || text.includes('çocuk atölye')) return 'guide_kresler';
  if (text.includes('mezarlık') || text.includes('cenaze') || text.includes('defin')) return 'guide_mezarliklar';
  if (text.includes('pazar yer') || text.includes('semt pazar')) return 'guide_pazar';
  if (text.includes('spor tesis') || text.includes('spor salon')) return 'guide_spor';
  if (text.includes('kültür merkez') || text.includes('kütüphane')) return 'guide_kultur';
  if (text.includes('tiyatro') || text.includes('konser') || text.includes('sinema') || text.includes('etkinlik')) return 'guide_etkinlikler';
  if (text.includes('piknik') || text.includes('mesire')) return 'discover_picnic';
  if (text.includes('yöresel lezzet') || text.includes('ne yenir')) return 'discover_foods';
  if (text.includes('tarihi yer') || text.includes('kale') || text.includes('müze')) return 'discover_places';
  if (text.includes('mama oda') || text.includes('veteriner')) return 'pati_feeding';
  if (text.includes('hayvan ambulans') || text.includes('bakım merkezi')) return 'pati_center';
  if (text.includes('pati') || text.includes('sahiplen') || text.includes('yuva arayan') || text.includes('can dost')) return 'pati_adoption';
  if (text.includes('asfalt') || text.includes('kazı') || text.includes('altyapı') || text.includes('saha çalış') || text.includes('mahallemde')) return 'neighborhood';
  if (text.includes('anket') || text.includes('söz sende') || text.includes('oylama')) return 'sozSende';
  if (text.includes('vergi') || text.includes('e-belediye') || text.includes('borç sorgu')) return 'ebelediye';
  if (text.includes('hava durumu') || text.includes('yağış') || text.includes('fırtına') || text.includes('meteoroloji')) return 'weather';
  return null;
};

window.applyBroadcastPreset = (key) => {
  const p = BROADCAST_PRESETS[key];
  if (!p) return;
  window._broadcastManualTargetSelected = true;
  document.getElementById("broadcastTitle").value = p.title;
  document.getElementById("broadcastMessage").value = p.message;
  const targetVal = p.targetPage || p.topic;
  if (document.getElementById("broadcastTargetPage")) document.getElementById("broadcastTargetPage").value = targetVal;
  if (document.getElementById("broadcastTopic")) document.getElementById("broadcastTopic").value = targetVal;
  document.getElementById("broadcastCategory").value = p.category;
  document.getElementById("broadcastPriority").value = p.priority;
  document.getElementById("broadcastActionLabel").value = p.actionButtonLabel || "";
  window.onBroadcastTargetChange('target');
  window.updateBroadcastPreview();
  showToast("Hazır duyuru şablonu yüklendi.");
};

window.onBroadcastTargetChange = (source = 'target') => {
  window._broadcastManualTargetSelected = true;
  const targetEl = document.getElementById("broadcastTargetPage");
  const topicEl = document.getElementById("broadcastTopic");
  let target = "news";
  if (source === 'topic' && topicEl) {
    target = topicEl.value || "news";
    if (targetEl) targetEl.value = target;
  } else if (targetEl) {
    target = targetEl.value || "news";
    if (topicEl) topicEl.value = target;
  }

  const urlWrap = document.getElementById("broadcastExternalUrlGroup");
  if (urlWrap) {
    urlWrap.style.display = target === "external_url" ? "block" : "none";
  }
  const catEl = document.getElementById("broadcastCategory");
  if ((target === "outages" || target === "neighborhood") && catEl) {
    catEl.value = "outages";
  } else if ((target.startsWith("guide_") || target === "pharmacy" || target === "parking" || target === "ebelediye" || target === "services") && catEl && target !== "guide_etkinlikler") {
    catEl.value = "services";
  } else if (catEl && (target === "emergency" || target === "sozSende" || target === "news" || target === "guide_etkinlikler" || target.startsWith("pati_") || target.startsWith("discover_"))) {
    catEl.value = "announcements";
  }
  window.updateBroadcastPreview();
};

window.updateBroadcastPreview = () => {
  const title = document.getElementById("broadcastTitle")?.value.trim() || "Örnek Duyuru Başlığı";
  const msg = document.getElementById("broadcastMessage")?.value.trim() || "Duyuru metniniz vatandaşların ekranında ve bildirim merkezinde bu şekilde görünecektir.";
  const targetEl = document.getElementById("broadcastTargetPage");
  const topicEl = document.getElementById("broadcastTopic");

  if (!window._broadcastManualTargetSelected) {
    const detected = window.detectBroadcastTargetFromText(title, msg);
    if (detected) {
      if (targetEl) targetEl.value = detected;
      if (topicEl) topicEl.value = detected;
    }
  }

  const target = targetEl?.value || topicEl?.value || "news";
  const priority = document.getElementById("broadcastPriority")?.value || "normal";
  const neighborhood = document.getElementById("broadcastNeighborhood")?.value || "all";
  const btnLabel = document.getElementById("broadcastActionLabel")?.value.trim();

  const prevTitle = document.getElementById("previewBroadcastTitle");
  const prevMsg = document.getElementById("previewBroadcastMsg");
  const prevTarget = document.getElementById("previewBroadcastTarget");
  const prevBadge = document.getElementById("previewBroadcastPriority");
  const prevNeigh = document.getElementById("previewBroadcastNeighborhood");

  if (prevTitle) prevTitle.innerText = title;
  if (prevMsg) prevMsg.innerText = msg;
  if (prevTarget) {
    const cleanTarget = (BROADCAST_TARGET_LABELS[target] || target).replace(/^[^\s]+\s/, '');
    prevTarget.innerText = btnLabel ? `${btnLabel} (${cleanTarget}) ›` : `${cleanTarget} ›`;
  }
  if (prevBadge) {
    if (priority === "urgent") {
      prevBadge.style.display = "inline-block";
      prevBadge.style.background = "#D32F2F";
      prevBadge.innerText = "🚨 ACİL DUYURU";
    } else if (priority === "important") {
      prevBadge.style.display = "inline-block";
      prevBadge.style.background = "#FF6B00";
      prevBadge.innerText = "⚡ ÖNEMLİ";
    } else {
      prevBadge.style.display = "none";
    }
  }
  if (prevNeigh) {
    if (neighborhood && neighborhood !== "all") {
      prevNeigh.style.display = "inline-block";
      prevNeigh.innerText = `📍 ${neighborhood}`;
    } else {
      prevNeigh.style.display = "none";
    }
  }
};

async function loadBroadcastHistory() {
  const container = document.getElementById("broadcastHistoryGrid");
  container.innerHTML = '<div class="empty-state">Yayın geçmişi yükleniyor...</div>';
  try {
    const snap = await getDocs(collection(db, "broadcast_notifications"));
    if (snap.empty) {
      container.innerHTML = '<div class="empty-state">Henüz yayınlanmış acil duyuru veya toplu bildirim bulunmuyor.</div>';
      return;
    }
    const docs = [];
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const ts = d.createdAt?.toMillis ? d.createdAt.toMillis() : 0;
      docs.push({ id: docSnap.id, data: d, ts });
    });
    docs.sort((a, b) => b.ts - a.ts);

    container.innerHTML = '';
    docs.forEach(({ id, data: d }) => {
      let targetKey = (d.targetPage && d.targetPage !== 'news') ? d.targetPage
        : ((d.actionType && d.actionType !== 'news') ? d.actionType : (d.topic || 'news'));
      if (targetKey === 'news' || targetKey === 'all' || targetKey === 'announcements') {
        const detected = window.detectBroadcastTargetFromText(d.title, d.message);
        if (detected) {
          targetKey = detected;
          updateDoc(doc(db, "broadcast_notifications", id), {
            topic: detected,
            targetPage: detected,
            actionType: detected,
            targetLabel: (BROADCAST_TARGET_LABELS[detected] || detected).replace(/^[^\s]+\s/, '')
          }).catch(() => {});
        }
      } else if (d.topic !== targetKey) {
        updateDoc(doc(db, "broadcast_notifications", id), {
          topic: targetKey,
          targetPage: targetKey,
          actionType: targetKey
        }).catch(() => {});
      }
      const targetText = BROADCAST_TARGET_LABELS[targetKey] || d.targetLabel || targetKey;
      const prio = d.priority || 'normal';
      const prioBadge = prio === 'urgent'
        ? `<span class="badge badge-danger">🚨 Acil</span>`
        : (prio === 'important' ? `<span class="badge badge-warning">⚡ Önemli</span>` : `<span class="badge badge-success">Yayınlandı</span>`);
      const neighBadge = (d.neighborhood && d.neighborhood !== 'all')
        ? `<span class="badge badge-primary">📍 ${esc(d.neighborhood)}</span>`
        : '';

      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        ${d.imageUrl ? `<img src="${esc(d.imageUrl)}" class="item-card-image" onclick="openLightbox('${esc(d.imageUrl)}')" alt="duyuru">` : ''}
        <div class="item-card-body">
          <div class="item-card-meta" style="flex-wrap:wrap; gap:6px;">
            <span>📡 Kanal: ${esc(targetText)}</span>
            ${neighBadge}
            <span style="margin-left:auto;">${prioBadge}</span>
          </div>
          <div class="item-card-title">${esc(d.title)}</div>
          <div class="item-card-desc">${esc(d.message)}</div>
          <div style="margin-top:8px; padding:7px 10px; background:var(--navy-soft); border-radius:8px; font-size:11.5px; font-weight:700; color:var(--navy);">
            🎯 Yönlendirme: ${esc(targetText)}
            ${d.actionButtonLabel ? ` <span style="color:var(--orange);">• [${esc(d.actionButtonLabel)}]</span>` : ''}
          </div>
          <div style="font-size:11.5px; color:var(--text-muted); margin-top:6px;">
            🕒 ${esc(d.createdAtText || 'Yeni')} • Sekme: ${esc(d.category || 'announcements')}
          </div>
        </div>
        <div class="item-card-footer">
          <span class="badge badge-primary">Tüm Cihazlara Ulaştı</span>
          <button class="btn btn-danger btn-sm" onclick="deleteDocItem('broadcast_notifications', '${id}', loadBroadcastHistory)">Sil</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Hata: ${e.message}</div>`;
  }
}
window.loadBroadcastHistory = loadBroadcastHistory;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("formAddNews")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      const generatedNewsId = Math.floor(Date.now() / 1000);
      await addDoc(collection(db, "municipal_news"), {
        newsId: generatedNewsId,
        title: document.getElementById("newsTitle").value.trim(),
        summary: document.getElementById("newsSummary").value.trim(),
        category: document.getElementById("newsCategory").value,
        publishedAtText: document.getElementById("newsDate").value.trim() || new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
        image: document.getElementById("newsImage").value.trim() || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80",
        url: document.getElementById("newsUrl").value.trim() || "https://www.gebze.bel.tr/",
        pageIndex: 1,
        itemIndex: 1,
        publishedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      e.target.reset();
      showToast("Haber canlı olarak mobil uygulamada yayınlandı!");
      loadNews();
      loadDashboard();
    } catch (err) { alert(err.message); }
    finally { btn.disabled = false; }
  });

  document.getElementById("formAddEvent")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      await addDoc(collection(db, "events"), {
        title: document.getElementById("eventTitle").value.trim(),
        subtitle: document.getElementById("eventSubtitle").value.trim(),
        date: document.getElementById("eventDate").value.trim(),
        createdAt: serverTimestamp()
      });
      e.target.reset();
      showToast("Etkinlik başarıyla eklendi!");
      loadEvents();
    } catch (err) { alert(err.message); }
    finally { btn.disabled = false; }
  });

  document.getElementById("formAddOutage")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      const type = document.getElementById("outageType").value;
      const provider = document.getElementById("outageProvider").value.trim();
      const title = document.getElementById("outageTitle").value.trim();
      const neighborhood = document.getElementById("outageNeighborhood").value.trim();
      const street = document.getElementById("outageStreet") ? document.getElementById("outageStreet").value.trim() : '';
      const startVal = document.getElementById("outageStart").value;
      const endVal = document.getElementById("outageEnd").value;
      const status = document.getElementById("outageStatus").value;

      const data = {
        title,
        type,
        provider,
        neighborhood,
        street,
        startDate: formatOutageDateForDisplay(startVal),
        endDate: formatOutageDateForDisplay(endVal),
        startIso: startVal ? new Date(startVal).toISOString() : '',
        endIso: endVal ? new Date(endVal).toISOString() : '',
        status,
        updatedAt: serverTimestamp()
      };

      if (window.outageEditId) {
        await updateDoc(doc(db, "outages", window.outageEditId), data);
        showToast("Planlı kesinti güncellendi!");
        window.cancelOutageEdit();
      } else {
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, "outages"), data);
        e.target.reset();
        window.cancelOutageEdit();
        showToast("Planlı kesinti sisteme kaydedildi!");
      }

      loadOutages();
      loadDashboard();
    } catch (err) { alert(err.message); }
    finally { btn.disabled = false; }
  });

  document.getElementById("formAddPoll")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    const questionText = document.getElementById("pollQuestion").value.trim();
    if (!questionText) return;

    btn.disabled = true;
    try {
      const qSnap = await getDocs(query(collection(db, "polls"), where("question", "==", questionText)));
      if (!qSnap.empty) {
        alert("Bu soruyla zaten sistemde kayıtlı aktif bir anket bulunuyor. Mükerrer kayıt engellendi.");
        btn.disabled = false;
        return;
      }

      const rawOpts = document.getElementById("pollOptions").value.split("\n").map(s => s.trim()).filter(Boolean);
      const votesMap = {};
      rawOpts.forEach((_, i) => votesMap[i] = 0);

      const rawEnd = document.getElementById("pollEndDate").value.trim();
      let formattedEnd = "Süresiz";
      if (rawEnd) {
        const parts = rawEnd.split("-");
        if (parts.length === 3) formattedEnd = `${parts[2]}.${parts[1]}.${parts[0]}`;
        else formattedEnd = rawEnd;
      }

      await addDoc(collection(db, "polls"), {
        question: questionText,
        description: document.getElementById("pollDesc").value.trim(),
        neighborhood: document.getElementById("pollNeighborhood").value.trim() || "Tüm Gebze (Genel)",
        endDate: formattedEnd,
        endDateIso: rawEnd || null,
        options: rawOpts,
        votes: votesMap,
        isActive: true,
        createdAt: serverTimestamp()
      });
      e.target.reset();
      const pollEndEl = document.getElementById("pollEndDate");
      if (pollEndEl) {
        const d = new Date(Date.now() + 14 * 24 * 3600 * 1000);
        pollEndEl.value = d.toISOString().slice(0, 10);
      }
      showToast("Yeni anket oylamaya açıldı!");
      loadPolls();
      loadDashboard();
    } catch (err) { alert(err.message); }
    finally { btn.disabled = false; }
  });

  document.getElementById("formAddPet")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      await addDoc(collection(db, "pet_adoptions"), {
        name: document.getElementById("petName").value.trim(),
        species: document.getElementById("petSpecies").value,
        breed: document.getElementById("petBreed").value.trim() || "Melez",
        gender: document.getElementById("petGender").value,
        age: document.getElementById("petAge").value.trim(),
        imageUrl: document.getElementById("petImage").value.trim() || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80",
        healthStatus: document.getElementById("petHealth").value.trim() || "Aşılı, çipli",
        description: document.getElementById("petDesc").value.trim(),
        isAdopted: false,
        createdAt: serverTimestamp()
      });
      e.target.reset();
      showToast("Can dostumuz ilana eklendi!");
      loadPets();
      loadDashboard();
    } catch (err) { alert(err.message); }
    finally { btn.disabled = false; }
  });

  document.getElementById("formAddAssembly")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      await addDoc(collection(db, "assembly_areas"), {
        name: document.getElementById("assemblyName").value.trim(),
        neighborhood: document.getElementById("assemblyNeighborhood").value,
        street: document.getElementById("assemblyStreet").value.trim(),
        area: parseInt(document.getElementById("assemblyAreaM2").value, 10) || 5000,
        lat: parseFloat(document.getElementById("assemblyLat").value) || 40.8028,
        lng: parseFloat(document.getElementById("assemblyLng").value) || 29.4307,
        e: document.getElementById("assemblyHasElec").checked,
        w: document.getElementById("assemblyHasWater").checked,
        wc: document.getElementById("assemblyHasWc").checked,
        kind: document.getElementById("assemblyKind").value,
        createdAt: serverTimestamp()
      });
      e.target.reset();
      showToast("Yeni afet toplanma alanı kaydedildi!");
      loadAssemblyAreas();
      loadDashboard();
    } catch (err) { alert(err.message); }
    finally { btn.disabled = false; }
  });

  document.getElementById("formBroadcast")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      const title = document.getElementById("broadcastTitle").value.trim();
      const message = document.getElementById("broadcastMessage").value.trim();
      let targetPage = document.getElementById("broadcastTargetPage")?.value
        || document.getElementById("broadcastTopic")?.value
        || "news";
      if (!window._broadcastManualTargetSelected && (targetPage === "news" || targetPage === "all")) {
        const detected = window.detectBroadcastTargetFromText(title, message);
        if (detected) targetPage = detected;
      }
      const targetLabel = (BROADCAST_TARGET_LABELS[targetPage] || targetPage).replace(/^[^\s]+\s/, '').trim();
      const topic = targetPage;
      const category = document.getElementById("broadcastCategory").value;
      const priority = document.getElementById("broadcastPriority")?.value || "normal";
      const neighborhood = document.getElementById("broadcastNeighborhood")?.value || "all";
      const actionButtonLabel = document.getElementById("broadcastActionLabel")?.value.trim() || "";
      const externalUrl = document.getElementById("broadcastExternalUrl")?.value.trim() || "";
      const imageUrl = document.getElementById("broadcastImageUrl")?.value.trim() || "";

      await addDoc(collection(db, "broadcast_notifications"), {
        title,
        message,
        targetPage,
        actionType: targetPage,
        targetLabel,
        topic,
        category,
        priority,
        neighborhood,
        actionButtonLabel,
        externalUrl,
        imageUrl,
        createdAtText: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('tr-TR'),
        createdAt: serverTimestamp()
      });
      e.target.reset();
      window._broadcastManualTargetSelected = false;
      window.updateBroadcastPreview();
      showToast("Duyuru ve sayfa yönlendirmesi canlı olarak tüm cihazlara yayınlandı!");
      loadBroadcastHistory();
    } catch (err) { alert(err.message); }
    finally { btn.disabled = false; }
  });

  document.getElementById("formAddWork")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    const start = trInputToDate(document.getElementById("workStart").value);
    const end = trInputToDate(document.getElementById("workEnd").value);
    if (isNaN(start) || isNaN(end)) { alert("Başlangıç ve bitiş zamanı girin."); return; }
    if (end <= start) { alert("Bitiş zamanı başlangıçtan sonra olmalıdır."); return; }
    btn.disabled = true;
    try {
      const workData = {
        category: document.getElementById("workCategory").value,
        title: document.getElementById("workTitle").value.trim(),
        description: document.getElementById("workDesc").value.trim(),
        neighborhood: document.getElementById("workNeighborhood").value,
        address: document.getElementById("workAddress").value.trim(),
        unit: document.getElementById("workUnit").value.trim(),
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        updatedAt: serverTimestamp()
      };

      if (window.workEditId) {
        await updateDoc(doc(db, "neighborhood_works", window.workEditId), workData);
        window.cancelWorkEdit();
        showToast("Mahalle çalışması güncellendi!");
      } else {
        workData.createdAt = serverTimestamp();
        await addDoc(collection(db, "neighborhood_works"), workData);
        e.target.reset();
        document.getElementById("workStart").value = trNowInputValue();
        showToast("Mahalle çalışması kaydedildi!");
      }
      loadWorks();
      loadDashboard();
    } catch (err) { alert(err.message); }
    finally { btn.disabled = false; }
  });
});
