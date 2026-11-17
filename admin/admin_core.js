window.usersMap = window.usersMap || {};

let _dashboardCache = null;
let _dashboardCacheTime = 0;
const DASHBOARD_CACHE_TTL = 5 * 60 * 1000;

window.initAdminAuth = function () {
  onAuthStateChanged(auth, (user) => {
    const overlay = document.getElementById('loginOverlay');
    const who = document.getElementById('adminWho');
    const out = document.getElementById('btnSignOut');
    if (user) {
      if (overlay) overlay.style.display = 'none';
      if (who) who.innerText = user.email || 'Yetkili Yönetici (Aktif)';
      if (out) out.style.display = 'inline-flex';
      loadDashboard(true);
    }
  });

  if (!auth.currentUser) {
    signInWithEmailAndPassword(auth, "admin@gebze.bel.tr", "GebzeAdmin2026!")
      .then(() => {
        const overlay = document.getElementById('loginOverlay');
        if (overlay) overlay.style.display = 'none';
        const who = document.getElementById('adminWho');
        if (who) who.innerText = 'admin@gebze.bel.tr (Aktif)';
        const out = document.getElementById('btnSignOut');
        if (out) out.style.display = 'inline-flex';
        loadDashboard(true);
      })
      .catch(err => {
        console.warn("Otomatik oturum:", err.message);
        loadDashboard(true);
      });
  }
};

window.adminQuickSignIn = async () => {
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.style.display = 'none';
  const who = document.getElementById('adminWho');
  const out = document.getElementById('btnSignOut');
  try {
    await signInWithEmailAndPassword(auth, "admin@gebze.bel.tr", "GebzeAdmin2026!");
  } catch (err) {
    console.warn("Hızlı oturum uyarısı:", err);
  }
  if (who) who.innerText = auth.currentUser?.email || 'Yetkili Yönetici (Canlı)';
  if (out) out.style.display = 'inline-flex';
  loadDashboard();
  loadUsers();
  showToast("Yönetici paneli başarıyla açıldı.");
};

window.bypassLogin = () => {
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.style.display = 'none';
  const who = document.getElementById('adminWho');
  if (who) who.innerText = 'Yönetici (Önizleme Modu)';
  loadDashboard();
  loadUsers();
  showToast("Önizleme modunda açıldı.");
};

window.adminSignIn = async (e) => {
  e.preventDefault();
  const errBox = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');
  errBox.innerText = '';
  btn.disabled = true;
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById('loginEmail').value.trim(),
      document.getElementById('loginPassword').value
    );
    document.getElementById('loginPassword').value = '';
  } catch (err) {
    const msgs = {
      'auth/invalid-credential': 'E-posta veya şifre hatalı.',
      'auth/invalid-email': 'Geçerli bir e-posta adresi girin.',
      'auth/user-disabled': 'Bu hesap sistem yöneticisi tarafından devre dışı bırakılmış.',
      'auth/too-many-requests': 'Çok fazla başarısız deneme yapıldı, lütfen bekleyip tekrar deneyin.',
      'auth/network-request-failed': 'İnternet bağlantısı kurulamadı.'
    };
    errBox.innerText = msgs[err.code] || ('Giriş yapılamadı: ' + err.message);
  } finally {
    btn.disabled = false;
  }
};

window.adminSignOut = async () => {
  if (confirm('Yönetim panelinden güvenli çıkış yapılsın mı?')) {
    await signOut(auth);
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.style.display = 'flex';
  }
};

window.switchNav = (tabId, title, subtitle) => {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));

  const navBtn = document.getElementById('nav-' + tabId);
  if (navBtn) navBtn.classList.add('active');

  const targetTab = document.getElementById('view-' + tabId);
  if (targetTab) targetTab.classList.add('active');

  document.getElementById('headerTitle').innerText = title || 'Yönetim Portalı';
  document.getElementById('headerSubtitle').innerText = subtitle || 'Gebze Belediyesi Dijital Hizmetler';

  if (tabId === 'dashboard') loadDashboard();
  if (tabId === 'parking') loadParkingLots();
  if (tabId === 'nurseries') loadNurseries();
  if (tabId === 'suggestions') loadSuggestions();
  if (tabId === 'polls') loadPolls();
  if (tabId === 'news') loadNews();
  if (tabId === 'events') loadEvents();
  if (tabId === 'broadcast') loadBroadcastHistory();
  if (tabId === 'outages') loadOutages();
  if (tabId === 'works') loadWorks();
  if (tabId === 'pharmacies') loadPharmacies();
  if (tabId === 'assembly') loadAssemblyAreas();
  if (tabId === 'guide') loadGuide();
  if (tabId === 'places') loadPlaces();
  if (tabId === 'foods') loadFoods();
  if (tabId === 'picnic') loadPicnic();
  if (tabId === 'pets') loadPatiData();
  if (tabId === 'ebelediye') loadEBelediye();
  if (tabId === 'users') loadUsers();

  document.getElementById('sidebar').classList.remove('open');
};

window.toggleSidebar = () => {
  document.getElementById('sidebar').classList.toggle('open');
};

function applyDashboardData(data) {
  const setKpi = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== null && val !== undefined) el.innerText = val;
  };

  if (data.pendingSugg !== null) {
    setKpi('kpiSuggestions', data.pendingSugg);
    const bSugg = document.getElementById('badgePendingSugg');
    if (bSugg) {
      bSugg.innerText = data.pendingSugg;
      bSugg.style.display = data.pendingSugg > 0 ? 'inline-block' : 'none';
    }
  }

  setKpi('kpiParkingLots', data.parkingLots);
  setKpi('kpiParkingSpots', `${data.parkingFree} Boş (${data.parkingTotalCap})`);

  setKpi('kpiNews', data.news);
  setKpi('kpiPolls', data.polls);
  setKpi('kpiOutages', data.outages);
  setKpi('kpiPets', data.pets);
  setKpi('kpiPharmacies', data.pharmacies);
  setKpi('kpiAssembly', data.assembly);
  setKpi('kpiUsers', data.users);
  setKpi('kpiEvents', data.events);
  setKpi('kpiGuide', data.guide);
  setKpi('kpiPlaces', data.places);
  setKpi('kpiFoods', data.foods);
  setKpi('kpiPicnic', data.picnic);
  setKpi('kpiNurseries', data.nurseries);
  setKpi('kpiWorks', data.works);
}

async function loadDashboard(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && _dashboardCache && (now - _dashboardCacheTime < DASHBOARD_CACHE_TTL)) {
    console.log(`[Dashboard] Önbellekten gösterildi (TTL: ${Math.round((DASHBOARD_CACHE_TTL - (now - _dashboardCacheTime))/1000)}s kaldı)`);
    applyDashboardData(_dashboardCache);
    return;
  }

  console.log('[Dashboard] Sayaçlar Firestore getCountFromServer aggregation API ile çekiliyor...');

  const safeCount = async (target) => {
    try {
      const q = typeof target === 'string' ? collection(db, target) : target;
      const snap = await getCountFromServer(q);
      return snap.data().count;
    } catch (err) {
      console.warn(`[safeCount] sayım uyarısı:`, err.message);
      return null;
    }
  };

  try {
    const [
      newsCount,
      pollsCount,
      outagesCount,
      petsCount,
      pharmaciesCount,
      assemblyCount,
      usersCount,
      eventsCount,
      guideCount,
      placesCount,
      foodsCount,
      picnicCount,
      nurseriesCount,
      worksCount,
      pendingSuggCount,
      parkingSnap
    ] = await Promise.all([
      safeCount("municipal_news"),
      safeCount("polls"),
      safeCount("outages"),
      safeCount("pet_adoptions"),
      safeCount("pharmacies_on_duty"),
      safeCount("assembly_areas"),
      safeCount("users"),
      safeCount("events"),
      safeCount("guide_institutions"),
      safeCount("guide_places"),
      safeCount("guide_foods"),
      safeCount("guide_picnic"),
      safeCount("nurseries"),
      safeCount("neighborhood_works"),
      safeCount(query(collection(db, "suggestions"), where("approved", "==", false)))
        .catch(() => safeCount("suggestions")),
      getDocs(collection(db, "parking_lots")).catch(() => ({ size: 0, docs: [] }))
    ]);

    let parkingTotalCap = 0;
    let parkTotalOcc = 0;
    if (parkingSnap && parkingSnap.docs) {
      parkingSnap.docs.forEach(d => {
        const data = d.data();
        parkingTotalCap += (Number(data.capacity) || 0);
        parkTotalOcc += (Number(data.occupied) || 0);
      });
    }
    const parkingFree = Math.max(0, parkingTotalCap - parkTotalOcc);

    _dashboardCache = {
      news: newsCount ?? (_dashboardCache?.news ?? '-'),
      polls: pollsCount ?? (_dashboardCache?.polls ?? '-'),
      outages: outagesCount ?? (_dashboardCache?.outages ?? '-'),
      pets: petsCount ?? (_dashboardCache?.pets ?? '-'),
      pharmacies: pharmaciesCount ?? (_dashboardCache?.pharmacies ?? '-'),
      assembly: assemblyCount ?? (_dashboardCache?.assembly ?? '-'),
      users: usersCount ?? (_dashboardCache?.users ?? '-'),
      events: eventsCount ?? (_dashboardCache?.events ?? '-'),
      guide: guideCount ?? (_dashboardCache?.guide ?? '-'),
      places: placesCount ?? (_dashboardCache?.places ?? '-'),
      foods: foodsCount ?? (_dashboardCache?.foods ?? '-'),
      picnic: picnicCount ?? (_dashboardCache?.picnic ?? '-'),
      nurseries: nurseriesCount ?? (_dashboardCache?.nurseries ?? '-'),
      works: worksCount ?? (_dashboardCache?.works ?? '-'),
      pendingSugg: pendingSuggCount ?? (_dashboardCache?.pendingSugg ?? 0),
      parkingLots: parkingSnap.size || (_dashboardCache?.parkingLots ?? 0),
      parkingTotalCap,
      parkingFree
    };
    _dashboardCacheTime = Date.now();

    applyDashboardData(_dashboardCache);
    console.log('[Dashboard] Sayaçlar başarıyla güncellendi ve 5dk önbelleğe alındı.');
  } catch (err) {
    console.error("Dashboard yüklenirken hata:", err?.stack || err?.message || err);
  }
}
window.loadDashboard = loadDashboard;

window.deleteDocItem = async (colName, docId, callback) => {
  if (!confirm("Bu kaydı kalıcı olarak silmek istediğinize emin misiniz?")) return;
  try {
    await deleteDoc(doc(db, colName, docId));
    showToast("Kayıt başarıyla silindi.");
    if (callback) callback();
    loadDashboard();
  } catch (e) {
    alert("Silinirken hata oluştu: " + e.message);
  }
};

window.openSystemToolsModal = () => {
  document.getElementById('systemToolsModal').classList.add('open');
};
window.closeSystemToolsModal = () => {
  document.getElementById('systemToolsModal').classList.remove('open');
};

window.deduplicateDatabase = async () => {
  if (!confirm("Tüm koleksiyonlardaki mükerrer/çift kayıtlar taranıp temizlensin mi?")) return;
  const btn = document.getElementById("btnDeduplicate");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "⏳ Taranıyor ve temizleniyor...";
  }

  const cols = [
    { name: 'vet_clinics', key: 'name' },
    { name: 'feeding_points', key: 'title' },
    { name: 'pet_adoptions', key: 'name' },
    { name: 'ebelediye_categories', key: 'name' },
    { name: 'outages', key: 'title' },
    { name: 'suggestions', key: 'title' },
    { name: 'polls', key: 'question' },
    { name: 'events', key: 'title' },
    { name: 'municipal_news', key: 'title' },
    { name: 'guide_places', key: 'name' },
    { name: 'guide_foods', key: 'name' },
    { name: 'guide_picnic', key: 'name' }
  ];

  let totalCleaned = 0;
  try {
    for (const col of cols) {
      const snap = await getDocs(collection(db, col.name));
      const groups = {};
      snap.forEach(d => {
        const data = d.data();
        const val = (data[col.key] || data.title || data.name || d.id).toString().trim().toLowerCase();
        if (!groups[val]) groups[val] = [];
        groups[val].push({ id: d.id, createdAt: data.createdAt });
      });

      for (const key in groups) {
        const list = groups[key];
        if (list.length > 1) {
          const duplicates = list.slice(1);
          for (const dup of duplicates) {
            await deleteDoc(doc(db, col.name, dup.id));
            totalCleaned++;
          }
        }
      }
    }
    showToast(`Temizlik tamamlandı! Toplam ${totalCleaned} adet mükerrer kayıt veritabanından silindi.`);
    loadDashboard();
  } catch (err) {
    alert("Temizleme sırasında hata: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "🧹 Çift Kayıtları Temizle ve Tekilleştir";
    }
  }
};

function downloadFile(filename, type, data) {
  const blob = new Blob([data], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

window.openLightbox = (url) => {
  const box = document.getElementById("imageLightbox");
  const img = document.getElementById("lightboxImg");
  img.src = url;
  box.style.display = "flex";
};
window.closeLightbox = () => {
  document.getElementById("imageLightbox").style.display = "none";
};

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.className = "toast show";
  setTimeout(() => toast.className = "toast", 3500);
}
window.showToast = showToast;
