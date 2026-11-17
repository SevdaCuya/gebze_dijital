const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };

const GUIDE_CATS = {
  parklar: '🌳 Parklar', lokantalar: '🍽️ Lokantalar', pazar: '🛒 Pazar yerleri', spor: '⚽ Spor tesisleri',
  kultur: '🎭 Kültür merkezleri', mezarliklar: '🪦 Mezarlıklar', kresler: '🧸 Kreşler', belediye: '🏛️ Belediye birimleri'
};
window.guideCache = [];
window.guideFilter = 'all';
window.guideEditId = null;

const DEFAULT_CEMETERIES = [
  {
    id: "mezarlik_01",
    name: "Gebze Merkez Mezarlığı ve Şehitliği",
    description: "Gebze'nin ana asri mezarlığıdır; bünyesinde Gebze Şehitliği ve Mezarlıklar Şube Müdürlüğü yer alır.",
    address: "Gaziler Mah. Fatih Sultan Mehmet Cad. No:120, Gebze / Kocaeli",
    phone: "0262 642 04 30",
    mapQuery: "Gebze Merkez Mezarlığı ve Şehitliği",
    lat: 40.809088,
    lng: 29.435012,
    image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    category: "mezarliklar"
  },
  {
    id: "mezarlik_02",
    name: "Gebze Belediyesi Mezarlıklar Müdürlüğü",
    description: "7/24 Alo Cenaze 188 hattı, ücretsiz cenaze nakil, defin işlemleri, mezar yeri tahsisi ve taziye çadırı birimi.",
    address: "Gaziler Mah. Işıkgöl Cad. Gebze / Kocaeli",
    phone: "0262 642 04 30",
    mapQuery: "Gebze Belediyesi Mezarlıklar Müdürlüğü",
    lat: 40.809200,
    lng: 29.435200,
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    category: "mezarliklar"
  },
  {
    id: "mezarlik_03",
    name: "Pelitli Mezarlığı",
    description: "Gebze'nin kuzey aksında yer alan geniş kapasiteli, modern parsellenmiş ana defin mezarlığı.",
    address: "Pelitli Mah. Sanayi Cad. Gebze / Kocaeli",
    phone: "0262 642 04 30",
    mapQuery: "Pelitli Mezarlığı Gebze",
    lat: 40.865500,
    lng: 29.449000,
    image: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
    category: "mezarliklar"
  },
  {
    id: "mezarlik_04",
    name: "Adem Yavuz Mezarlığı",
    description: "Adem Yavuz, Cumhuriyet ve çevre mahalle sakinlerine hizmet veren semt mezarlığı.",
    address: "Adem Yavuz Mah. Yavuz Sultan Selim Cad. Gebze / Kocaeli",
    phone: "0262 642 04 30",
    mapQuery: "Adem Yavuz Mezarlığı Gebze",
    lat: 40.816000,
    lng: 29.398000,
    image: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
    category: "mezarliklar"
  },
  {
    id: "mezarlik_05",
    name: "Mimar Sinan Mezarlığı",
    description: "Mimar Sinan Mahallesi sakinlerine defin ve kabir ziyareti hizmeti sunan semt mezarlığı.",
    address: "Mimar Sinan Mah. Mimar Sinan Cad. Gebze / Kocaeli",
    phone: "0262 642 04 30",
    mapQuery: "Mimar Sinan Mezarlığı Gebze",
    lat: 40.822000,
    lng: 29.405000,
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    category: "mezarliklar"
  },
  {
    id: "mezarlik_06",
    name: "Balçık Köyü Mezarlığı",
    description: "Balçık Mahallesi sakinlerinin kullanımında olan, doğal dokusu korunan yerel mezarlık.",
    address: "Balçık Mah. Balçık Köy İçi Yolu, Gebze / Kocaeli",
    phone: "0262 642 04 30",
    mapQuery: "Balçık Köyü Mezarlığı Gebze",
    lat: 40.887000,
    lng: 29.412000,
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    category: "mezarliklar"
  },
  {
    id: "mezarlik_07",
    name: "Denizli Köyü Mezarlığı",
    description: "Denizli Mahallesi sınırlarında bulunan tarihi ve doğa hattına yakın kırsal mahalle mezarlığı.",
    address: "Denizli Mah. Köy İçi Mevkii, Gebze / Kocaeli",
    phone: "0262 642 04 30",
    mapQuery: "Denizli Mezarlığı Gebze",
    lat: 40.892000,
    lng: 29.508000,
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
    category: "mezarliklar"
  },
  {
    id: "mezarlik_08",
    name: "Mollafenari Mezarlığı",
    description: "Gebze'nin tarihi köylerinden Mollafenari bölgesinde bulunan yerel mezarlık.",
    address: "Mollafenari Mah. Eski İstanbul Cad. Gebze / Kocaeli",
    phone: "0262 642 04 30",
    mapQuery: "Mollafenari Mezarlığı Gebze",
    lat: 40.881000,
    lng: 29.539000,
    image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80",
    category: "mezarliklar"
  },
  {
    id: "mezarlik_09",
    name: "Tavşanlı Köyü Mezarlığı",
    description: "Ballıkayalar Tabiat Parkı güzergahındaki Tavşanlı Mahallesi yerel mezarlığı.",
    address: "Tavşanlı Mah. Kömürcüoğlu Cad. Gebze / Kocaeli",
    phone: "0262 642 04 30",
    mapQuery: "Tavşanlı Mezarlığı Gebze",
    lat: 40.789000,
    lng: 29.525000,
    image: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=800&q=80",
    category: "mezarliklar"
  },
  {
    id: "mezarlik_10",
    name: "Cumaköy Mezarlığı",
    description: "Cumaköy Mahallesi ve çevre kırsal yerleşimlerin defin ve kabristan alanı.",
    address: "Cumaköy Mah. Fatih Sultan Mehmet Cad. Gebze / Kocaeli",
    phone: "0262 642 04 30",
    mapQuery: "Cumaköy Mezarlığı Gebze",
    lat: 40.915000,
    lng: 29.467000,
    image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
    category: "mezarliklar"
  },
  {
    id: "mezarlik_11",
    name: "Ovacık Mezarlığı",
    description: "Ovacık Mahallesi yerel kabristanı ve defin sahası.",
    address: "Ovacık Mah. Köy İçi Mevkii, Gebze / Kocaeli",
    phone: "0262 642 04 30",
    mapQuery: "Ovacık Mezarlığı Gebze",
    lat: 40.899000,
    lng: 29.582000,
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    category: "mezarliklar"
  },
  {
    id: "mezarlik_12",
    name: "Barış Mahallesi Mezarlığı",
    description: "Barış Mahallesi ve D-100 aksındaki semt sakinleri için hizmet veren mezarlık alanı.",
    address: "Barış Mah. Koşuyolu Cad. Gebze / Kocaeli",
    phone: "0262 642 04 30",
    mapQuery: "Barış Mahallesi Mezarlığı Gebze",
    lat: 40.795000,
    lng: 29.418000,
    image: "https://images.unsplash.com/photo-1596276020587-8044fe049813?auto=format&fit=crop&w=800&q=80",
    category: "mezarliklar"
  },
  {
    id: "mezarlik_13",
    name: "e-Devlet Mezar Yeri ve Defin Bilgisi Sorgulama",
    description: "Gebze Belediyesi e-Devlet hizmeti ile vefat eden yakınlarınızın mezarlık, ada ve parsel bilgilerini online sorgulayabilirsiniz.",
    address: "Gebze Belediyesi Online Hizmetler / e-Devlet",
    phone: "188",
    mapQuery: "Gebze Belediyesi",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    url: "https://www.turkiye.gov.tr/gebze-belediyesi-defin-ve-mezar-yeri-sorgulama",
    category: "mezarliklar"
  }
];

window.seedCemeteries = async (silent = false) => {
  if (!silent && !confirm("Gebze'deki 13 resmi mezarlık ve defin hizmeti kaydı Firebase 'guide_institutions' veritabanına aktarılsın mı?")) return;
  const btn = document.getElementById('btnSeedCemeteries');
  const origText = btn ? btn.innerText : '';
  if (btn) {
    btn.disabled = true;
    btn.innerText = "⏳ Aktarılıyor...";
  }
  try {
    let count = 0;
    for (const m of DEFAULT_CEMETERIES) {
      const docData = {
        category: 'mezarliklar',
        name: m.name,
        description: m.description,
        address: m.address,
        phone: m.phone,
        mapQuery: m.mapQuery || (m.name + ' Gebze'),
        image: m.image,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      if (m.lat != null) docData.lat = m.lat;
      if (m.lng != null) docData.lng = m.lng;
      if (m.url) docData.url = m.url;

      await setDoc(doc(db, 'guide_institutions', m.id), docData, { merge: true });
      count++;
    }
    if (!silent) showToast(`${count} adet mezarlık ve defin hizmeti Firebase veritabanına başarıyla aktarıldı!`);
    await loadGuide();
    if (window.loadDashboard) loadDashboard();
  } catch (err) {
    alert("Mezarlıklar aktarılırken hata: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = origText || "🪦 Mezarlıkları Aktar";
    }
  }
};

const DEFAULT_NURSERIES = [
  {
    id: "kres_01",
    name: "Gebze Belediyesi Güzide Bebek ve Çocuk Bakım Evi",
    description: "0–66 ay arası çocuklara 7/24 gece ve gündüz bakım hizmeti ile gelişim atölyeleri sunar. Kayıt ve başvuru bilgisi için Gebze Belediyesi Çözüm Merkezi ile görüşebilirsiniz.",
    address: "Osman Yılmaz Mah. 608/2. Sokak No: 7, Gebze / Kocaeli",
    phone: "444 0 290",
    mapQuery: "Güzide 7/24 Bebek ve Çocuk Bakım Evi Gebze",
    image: "gorsel/tesisler/guzide_kress.jpg",
    category: "kresler"
  },
  {
    id: "kres_02",
    name: "Enderun Çocuk Atölyeleri - Mustafa Paşa Birimi",
    description: "2-6 yaş çocukların gelişimini oyun, keşif ve atölyelerle destekleyen çocuk merkezli eğitim alanı.",
    address: "Mustafa Paşa Mah. 712/2. Sokak No: 2 Onlar Apt., Gebze / Kocaeli",
    phone: "444 0 290",
    mapQuery: "Enderun Çocuk Atölyeleri Mustafa Paşa Gebze",
    image: "gorsel/tesisler/enderuncocukatolyesi.jpeg",
    category: "kresler"
  },
  {
    id: "kres_03",
    name: "Enderun Çocuk Atölyeleri - İstasyon Şubesi",
    description: "İstasyon Bilim Sanat Merkezi bünyesinde çocuklara yönelik sanat, bilim ve değerler eğitimi atölyeleri.",
    address: "İstasyon Mah. 1409/1. Sokak No: 14, 41400 Gebze / Kocaeli",
    phone: "444 0 290",
    mapQuery: "İstasyon Bilim Sanat Merkezi Gebze",
    image: "gorsel/tesisler/enderuncocukatolyesi.jpeg",
    category: "kresler"
  },
  {
    id: "kres_04",
    name: "Enderun Çocuk Atölyeleri - Arapçeşme Şubesi",
    description: "Arapçeşme Bilim Sanat Merkezi bünyesinde 2-6 yaş grubuna özel eğitim ve atölye faaliyetleri.",
    address: "Arapçeşme Mah. Kavak Cad. 1066. Sokak No: 27, Gebze / Kocaeli",
    phone: "444 0 290",
    mapQuery: "Arapçeşme Bilim Sanat Merkezi Gebze",
    image: "gorsel/tesisler/enderuncocukatolyesi.jpeg",
    category: "kresler"
  },
  {
    id: "kres_05",
    name: "Enderun Çocuk Atölyeleri - Âdem Yavuz Şubesi",
    description: "Âdem Yavuz Mahallesi sosyal tesis alanı içerisinde çocuk gelişim atölyeleri.",
    address: "Adem Yavuz Mah. 2341. Sokak No: 31, Gebze / Kocaeli",
    phone: "444 0 290",
    mapQuery: "Adem Yavuz Sosyal Tesisleri Gebze",
    image: "gorsel/tesisler/enderuncocukatolyesi.jpeg",
    category: "kresler"
  },
  {
    id: "kres_06",
    name: "Sportif Çocuk Atölyesi - Eray Şamdan Şubesi",
    description: "5-8 yaş çocuklara cimnastik, basketbol, masa tenisi, koordinasyon parkurları ve eğlenceli atletizm imkanı.",
    address: "Cumhuriyet Mah. Necip Fazıl Cad. No: 102 (Eray Şamdan Spor Salonu), Gebze / Kocaeli",
    phone: "0262 641 24 93",
    mapQuery: "Eray Şamdan Kapalı Spor Salonu Gebze",
    image: "gorsel/tesisler/sportifcocukatolyesi.jpg",
    category: "kresler"
  },
  {
    id: "kres_07",
    name: "Enderun Çocuk Atölyeleri - Kirazpınar Şubesi",
    description: "Kirazpınar bölgesindeki çocuklara yönelik okul öncesi eğitsel atölyeler.",
    address: "Kirazpınar Mah. 2814. Sokak (Takva Mescidi Yanı), Gebze / Kocaeli",
    phone: "444 0 290",
    mapQuery: "Kirazpınar Gebze",
    image: "gorsel/tesisler/enderuncocukatolyesi.jpeg",
    category: "kresler"
  },
  {
    id: "kres_08",
    name: "AKÇEM - Anne, Kadın ve Çocuk Eğitim Merkezi",
    description: "Annelerin, kadınların ve çocukların eğitim ile sosyal gelişim süreçlerini destekleyen aile odaklı merkez.",
    address: "Mustafa Paşa Mah. 712/2. Sokak No: 2 Onlar Apt., Gebze / Kocaeli",
    phone: "444 0 290",
    mapQuery: "AKÇEM Gebze",
    image: "gorsel/tesisler/annecocukatolyesi.jpg",
    category: "kresler"
  }
];

window.seedGuideNurseries = async (silent = false) => {
  if (!silent && !confirm("Gebze'deki 8 kreş ve çocuk atölyesi kaydı Firebase 'guide_institutions' veritabanına aktarılsın mı?")) return;
  const btn = document.getElementById('btnSeedNurseries');
  const origText = btn ? btn.innerText : '';
  if (btn) {
    btn.disabled = true;
    btn.innerText = "⏳ Aktarılıyor...";
  }
  try {
    let count = 0;
    for (const k of DEFAULT_NURSERIES) {
      const docData = {
        category: 'kresler',
        name: k.name,
        description: k.description,
        address: k.address,
        phone: k.phone,
        mapQuery: k.mapQuery || (k.name + ' Gebze'),
        image: k.image,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'guide_institutions', k.id), docData, { merge: true });
      count++;
    }
    if (!silent) showToast(`${count} adet kreş ve çocuk atölyesi Firebase veritabanına başarıyla aktarıldı!`);
    await loadGuide();
    if (window.loadDashboard) loadDashboard();
  } catch (err) {
    alert("Kreşler aktarılırken hata: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = origText || "🧸 Kreşleri Aktar";
    }
  }
};

window.seedAllGuide = async () => {
  if (!confirm("Mezarlıklar (13 kayıt) ve Kreş/Çocuk Atölyeleri (8 kayıt) Firebase veritabanına aktarılsın mı?")) return;
  const btn = document.getElementById('btnSeedAllGuide');
  if (btn) { btn.disabled = true; btn.innerText = "⏳ Aktarılıyor..."; }
  try {
    await window.seedCemeteries(true);
    await window.seedGuideNurseries(true);
    showToast("Tüm hazır mezarlık ve kreş kayıtları Firebase'e başarıyla aktarıldı!");
    await loadGuide();
    if (window.loadDashboard) loadDashboard();
  } catch (e) {
    alert("Toplu aktarım hatası: " + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerText = "⚡ Tümünü Yükle"; }
  }
};

async function loadGuide() {
  const grid = document.getElementById('guideGrid');
  grid.innerHTML = '<div class="empty-state">Rehber kayıtları yükleniyor...</div>';
  try {
    const snap = await getDocs(collection(db, 'guide_institutions'));
    window.guideCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderGuide();
  } catch (e) {
    grid.innerHTML = `<div class="empty-state">Kayıtlar okunamadı: ${esc(e.message)}</div>`;
  }
}
window.loadGuide = loadGuide;

function renderGuide() {
  const all = window.guideCache;
  const f = window.guideFilter;
  const counts = {};
  all.forEach(g => { counts[g.category] = (counts[g.category] || 0) + 1; });

  const mezarlikCount = counts['mezarliklar'] || 0;
  const kreslerCount = counts['kresler'] || 0;
  const alertBanner = document.getElementById('guideAlertBanner');
  if (alertBanner) {
    const missing = [];
    if (mezarlikCount === 0) missing.push('🪦 13 Mezarlık');
    if (kreslerCount === 0) missing.push('🧸 8 Kreş & Çocuk Atölyesi');

    if (missing.length > 0) {
      alertBanner.innerHTML = `
        <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 12px 16px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">ℹ️</span>
            <div>
              <div style="font-weight: 800; color: #92400E; font-size: 13.5px;">Firebase'e Aktarılmamış Yerel Kayıtlar Bulunuyor</div>
              <div style="color: #B45309; font-size: 12px; margin-top: 2px;">${missing.join(' ve ')} şu an yerel kodda. Tek tıkla Firebase veritabanına yükleyip panelden yönetebilirsiniz.</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${mezarlikCount === 0 ? `<button type="button" class="btn btn-outline btn-sm" onclick="seedCemeteries()">🪦 13 Mezarlığı Aktar</button>` : ''}
            ${kreslerCount === 0 ? `<button type="button" class="btn btn-outline btn-sm" onclick="seedGuideNurseries()">🧸 8 Kreşi Aktar</button>` : ''}
            <button type="button" class="btn btn-primary btn-sm" onclick="seedAllGuide()">⚡ Tümünü Yükle</button>
          </div>
        </div>`;
    } else {
      alertBanner.innerHTML = '';
    }
  }

  const chip = (key, label, n) =>
    `<button type="button" class="chip ${f === key ? 'active' : ''}" onclick="setGuideFilter('${key}')">${label}<span>${n}</span></button>`;
  document.getElementById('guideChips').innerHTML =
    chip('all', 'Tümü', all.length) + Object.entries(GUIDE_CATS).map(([k, l]) => chip(k, l, counts[k] || 0)).join('');

  const list = all
    .filter(g => f === 'all' || g.category === f)
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
  document.getElementById('guideCount').innerText = list.length;

  const grid = document.getElementById('guideGrid');
  if (!list.length) {
    if (f === 'mezarliklar') {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; background: white; border-radius: var(--radius); border: 2px dashed var(--border);">
          <div style="font-size: 42px; margin-bottom: 12px;">🪦</div>
          <div style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Firebase'de Henüz Mezarlık Kaydı Yok</div>
          <div style="font-size: 13px; color: var(--text-muted); max-width: 500px; margin: 0 auto 18px; line-height: 1.5;">
            Gebze Merkez Mezarlığı, Alo Cenaze 188, Pelitli, Adem Yavuz ve köy mezarlıkları dahil 13 resmi kayıt hazır bekliyor.
          </div>
          <button type="button" class="btn btn-primary" onclick="seedCemeteries()">
            ⚡ 13 Resmi Mezarlığı Firebase'e Yükle
          </button>
        </div>`;
    } else if (f === 'kresler') {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; background: white; border-radius: var(--radius); border: 2px dashed var(--border);">
          <div style="font-size: 42px; margin-bottom: 12px;">🧸</div>
          <div style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Firebase'de Henüz Kreş & Çocuk Atölyesi Kaydı Yok</div>
          <div style="font-size: 13px; color: var(--text-muted); max-width: 500px; margin: 0 auto 18px; line-height: 1.5;">
            Güzide Bebek ve Çocuk Bakım Evi, Mustafa Paşa, İstasyon, Arapçeşme, Âdem Yavuz, Kirazpınar Enderun Atölyeleri, Sportif Çocuk Atölyesi ve AKÇEM dahil 8 resmi kayıt hazır bekliyor.
          </div>
          <button type="button" class="btn btn-primary" onclick="seedGuideNurseries()">
            ⚡ 8 Kreş & Çocuk Atölyesini Firebase'e Yükle
          </button>
        </div>`;
    } else {
      grid.innerHTML = '<div class="empty-state">Bu kategoride kayıt yok. Soldaki formla ilk kaydı ekleyin.</div>';
    }
    return;
  }
  grid.innerHTML = list.map(g => `
    <div class="item-card">
      ${g.image ? `<img src="${esc(g.image)}" class="item-card-image" onclick="openLightbox('${esc(g.image)}')" alt="" onerror="this.style.display='none'">` : ''}
      <div class="item-card-body">
        <div class="item-card-meta"><span class="badge badge-primary">${esc(GUIDE_CATS[g.category] || g.category || 'Kategorisiz')}</span></div>
        <div class="item-card-title">${esc(g.name)}</div>
        <div class="item-card-desc">${esc(g.description || '')}</div>
        <div class="item-card-meta" style="margin-top:8px; flex-direction:column; align-items:flex-start; gap:2px;">
          ${g.address ? `<span>📍 ${esc(g.address)}</span>` : ''}
          ${g.phone ? `<span>📞 ${esc(g.phone)}</span>` : ''}
          ${g.url ? `<span>🔗 <a href="${esc(g.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--navy-light); text-decoration:underline;">Resmi / e-Devlet Linki</a></span>` : ''}
          ${(g.lat != null && g.lng != null) ? `<span>🌐 ${esc(g.lat)}, ${esc(g.lng)}</span>` : '<span style="color:var(--warning);">Konum bilgisi yok</span>'}
        </div>
      </div>
      <div class="item-card-footer">
        <button class="btn btn-outline btn-sm" onclick="editGuide('${g.id}')">Düzenle</button>
        <button class="btn btn-danger btn-sm" onclick="deleteDocItem('guide_institutions', '${g.id}', loadGuide)">Sil</button>
      </div>
    </div>`).join('');
}

window.setGuideFilter = (k) => { window.guideFilter = k; renderGuide(); };

window.editGuide = (id) => {
  const g = window.guideCache.find(x => x.id === id);
  if (!g) return;
  window.guideEditId = id;
  document.getElementById('guideCategory').value = g.category || 'parklar';
  document.getElementById('guideName').value = g.name || '';
  document.getElementById('guideDesc').value = g.description || '';
  document.getElementById('guideAddress').value = g.address || '';
  document.getElementById('guidePhone').value = g.phone || '';
  document.getElementById('guideMapQuery').value = g.mapQuery || '';
  document.getElementById('guideLat').value = g.lat ?? '';
  document.getElementById('guideLng').value = g.lng ?? '';
  document.getElementById('guideImage').value = g.image || '';
  const urlInput = document.getElementById('guideUrl');
  if (urlInput) urlInput.value = g.url || '';
  document.getElementById('guideFormTitle').innerText = 'Kaydı düzenle';
  document.getElementById('guideSubmitBtn').innerText = 'Değişiklikleri kaydet';
  document.getElementById('guideCancelBtn').style.display = 'inline-flex';
  document.getElementById('formGuide').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.cancelGuideEdit = () => {
  window.guideEditId = null;
  document.getElementById('formGuide').reset();
  const urlInput = document.getElementById('guideUrl');
  if (urlInput) urlInput.value = '';
  document.getElementById('guideFormTitle').innerText = 'Rehbere yeni kayıt ekle';
  document.getElementById('guideSubmitBtn').innerText = 'Rehbere ekle';
  document.getElementById('guideCancelBtn').style.display = 'none';
};

const DEFAULT_PLACES = [
  {
    id: 'cmp_camii',
    name: 'Çoban Mustafa Paşa Camii ve Külliyesi',
    summary: 'Çoban Mustafa Paşa\'nın 1523\'te yaptırdığı cami ve külliye, Gebze\'nin en önemli Osmanlı eserlerinden biridir.',
    detailUrl: 'https://www.gebze.bel.tr/gebze-tarihi-yerler_coban-mustafa-pasa-camii-ve-kulliyesi_1.html',
    image: 'gorsel/tarihi_yerler/cmpasa.jpg',
    category: 'Camiler'
  },
  {
    id: 'sultan_orhan',
    name: 'Sultan Orhan Camii',
    summary: 'Yaklaşık 1323-1331 yıllarında Orhan Bey tarafından yaptırılan, ilk dönem Osmanlı mimarisinin sade bir örneği.',
    detailUrl: 'https://www.gebze.bel.tr/gebze/sultan-orhan-camii_2.html',
    image: 'gorsel/tarihi_yerler/sorhan.jpg',
    category: 'Camiler'
  },
  {
    id: 'ilyas_bey',
    name: 'İlyas Bey Camii',
    summary: 'Osmanlı\'dan kalan en eski cami olarak kabul edilir. Kubbesizdir, girişinde sülüs yazılı bir kitabe bulunur.',
    detailUrl: 'https://www.gebze.bel.tr/gebze-tarihi-yerler_ilyas-bey-camii_3.html',
    image: 'gorsel/tarihi_yerler/ilyasb.jpg',
    category: 'Camiler'
  },
  {
    id: 'anibal',
    name: 'Anibal\'ın (Hannibal) Mezarı',
    summary: 'Selvilerle çevrili alanda duran 24 tonluk taş lahit, beş dilde yazılmış kitabelerle komutanın hayatını anlatır.',
    detailUrl: 'https://www.gebze.bel.tr/gebze-tarihi-yerler_anibalin-mezari_4.html',
    image: 'gorsel/tarihi_yerler/anibal.jpg',
    category: 'Tarihi'
  },
  {
    id: 'hunkar',
    name: 'Hünkar Çayırı',
    summary: 'Fatih Sultan Mehmet\'in 1481\'de ordusunu dinlendirdiği çayırlık alan. Bugün park olarak düzenlenmiştir.',
    detailUrl: 'https://www.gebze.bel.tr/gebze-tarihi-yerler_hunkar-cayiri_5.html',
    image: 'gorsel/tarihi_yerler/hunkar.jpg',
    category: 'Doğa'
  },
  {
    id: 'osman_hamdi',
    name: 'Osman Hamdi Bey Yalısı',
    summary: 'Osman Hamdi Bey\'in 1884\'te Eskihisar\'da yaptırdığı iki katlı yalı, bugün müze olarak ziyaret edilebiliyor.',
    detailUrl: 'https://www.gebze.bel.tr/gebze-tarihi-yerler_osman-hamdi-bey-yalisi_6.html',
    image: 'gorsel/tarihi_yerler/osmanbey.jpg',
    category: 'Müzeler'
  },
  {
    id: 'eskihisar_kalesi',
    name: 'Eskihisar Kalesi',
    summary: 'Bizans döneminden kalma tarihi kale. 10 burcu ve 4 kapısıyla özgün yapısını büyük ölçüde korur.',
    detailUrl: 'https://www.gebze.bel.tr/gebze/eskihisar-kalesi_7.html',
    image: 'gorsel/tarihi_yerler/eskale.jpg',
    category: 'Tarihi'
  },
  {
    id: 'ballikayalar',
    name: 'Ballıkayalar',
    summary: 'Karstik vadi; göletleri, şelaleleri, travertenleri ve çok sayıda mağarasıyla doğal güzelliğiyle öne çıkar.',
    detailUrl: 'https://www.gebze.bel.tr/gebze-tarihi-yerler_ballikayalar_8.html',
    image: 'gorsel/tarihi_yerler/ballikaya.jpg',
    category: 'Doğa'
  },
  {
    id: 'beylikdagi',
    name: 'Beylikdağı Orman Yürüyüşü',
    summary: 'Gebze\'nin doğal yeşil alanlarından biri olan Beylikdağı Kent Ormanı, açık havada yürüyüş ve doğa fotoğrafları için harika bir rotadır.',
    detailUrl: 'https://www.gebze.bel.tr',
    image: 'gorsel/piknik/beylikdagi.jpg',
    category: 'Doğa'
  },
  {
    id: 'denizli_goleti',
    name: 'Denizli Göleti Doğa Rotası',
    summary: 'Gebze\'nin Denizli Mahallesi çevresinde yer alan Denizli Göleti, gölet manzarasını kırsal doğayla buluşturan keyifli bir yürüyüş noktasıdır.',
    detailUrl: 'https://www.gebze.bel.tr',
    image: 'gorsel/piknik/denizli_goleti.jpg',
    category: 'Doğa'
  },
  {
    id: 'denizli_yoruk_yaylalari',
    name: 'Denizli Göleti – Yörük Yaylaları Doğa Rotası',
    summary: 'Denizli Göleti\'nden başlayarak Gebze\'nin kırsal alanlarına uzanan bu doğa rotası geniş çayırlıklar ve yayla manzaraları sunar.',
    detailUrl: 'https://www.gebze.bel.tr',
    image: 'gorsel/piknik/denizli_yoruk_yaylalari.png',
    category: 'Doğa'
  },
  {
    id: 'elmalidere_selalesi',
    name: 'Elmalıdere Şelalesi ve Orman Patikaları',
    summary: 'Gebze\'nin Denizli kırsalı çevresinde bulunan Elmalıdere Şelalesi dere yatağı ve orman yollarıyla yürüyüş meraklılarının gözdesidir.',
    detailUrl: 'https://www.gebze.bel.tr',
    image: 'gorsel/piknik/elmalidere_selalesi.jpg',
    category: 'Doğa'
  },
  {
    id: 'yelken_tepe',
    name: 'Yelken Tepe Doğa Yürüyüşü',
    summary: 'Gebze\'nin Denizli kırsalındaki Yelken Tepe, tepeden panoramik kırsal manzaralar sunan bir doğa yürüyüşü noktasıdır.',
    detailUrl: 'https://www.gebze.bel.tr',
    image: 'gorsel/piknik/yelken_tepe.png',
    category: 'Doğa'
  },
  {
    id: 'ibrahim_pasa_cesmesi',
    name: 'İbrahim Paşa Çeşmesi (Çarşı Çeşmesi)',
    summary: 'Gebze şehir merkezinde, Çoban Mustafa Paşa Hamamı\'nın hemen yanında yer alan; Vezir İbrahim Paşa tarafından 17. yüzyılda yaptırılan Osmanlı çeşmesi.',
    detailUrl: 'https://www.gebze.bel.tr/gebze-tarihi-yerler_ibrahim-pasa-cesmesi-carsi-cesmesi_9.html',
    image: 'gorsel/tarihi_yerler/ipasacesmesi.jpg',
    category: 'Tarihi'
  },
  {
    id: 'eskihisar_cesmesi',
    name: 'Eskihisar Çeşmesi',
    summary: 'Eskihisar köyünde bulunan, bölgenin Osmanlı dönemi su kültürünü yansıtan tarihi çeşme.',
    detailUrl: 'https://www.gebze.bel.tr/gebze-tarihi-yerler_eskihisar-cesmesi_11.html',
    image: 'gorsel/tarihi_yerler/escesme.jpg',
    category: 'Tarihi'
  },
  {
    id: 'su_dolabi',
    name: 'Tarihi Su Dolabı',
    summary: '1664\'te İbrahim Paşa tarafından yaptırılan yapı; Gebze Belediyesi tarafından restore edildi.',
    detailUrl: 'https://sende.gebze.bel.tr/tesislerimiz/su-dolabi',
    image: 'gorsel/tarihi_yerler/sudolabi.jpg',
    category: 'Tarihi'
  },
  {
    id: 'cmp_sadirvani',
    name: 'Çoban Mustafa Paşa Şadırvanı',
    summary: '16. yüzyılda inşa edilen Çoban Mustafa Paşa Külliyesi\'nin klasik dönem Osmanlı mimarisini yansıtan şadırvanı.',
    detailUrl: 'https://www.gebze.bel.tr/gebze-tarihi-yerler_coban-mustafa-pasa-sadirvani_10.html',
    image: 'gorsel/tarihi_yerler/sadirvan.jpg',
    category: 'Tarihi'
  },
  {
    id: 'cmp_hamami',
    name: 'Çoban Mustafa Paşa Hamamı',
    summary: 'Çoban Mustafa Paşa Külliyesi\'nin 16. yüzyıldan kalan tarihi hamamı; Gebze\'nin eski çarşı bölgesinde yer alır.',
    detailUrl: 'https://www.gebze.bel.tr/gebze-tarihi-yerler_coban-mustafa-pasa-hamami_12.html',
    image: 'gorsel/tarihi_yerler/hamam.jpg',
    category: 'Tarihi'
  }
];

window.seedPlaces = async () => {
  if (!confirm("Gebze'deki 18 tarihi ve gezilecek yer kaydı Firebase 'guide_places' veritabanına aktarılsın mı?")) return;
  const btn = document.getElementById('btnSeedPlaces');
  const origText = btn ? btn.innerText : '';
  if (btn) {
    btn.disabled = true;
    btn.innerText = "⏳ Aktarılıyor...";
  }
  try {
    let count = 0;
    for (const p of DEFAULT_PLACES) {
      await setDoc(doc(db, 'guide_places', p.id), {
        name: p.name,
        summary: p.summary,
        category: p.category,
        detailUrl: p.detailUrl,
        image: p.image,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      count++;
    }
    showToast(`${count} adet tarihi ve gezilecek yer Firebase'e başarıyla aktarıldı!`);
    await loadPlaces();
    if (window.loadDashboard) loadDashboard();
  } catch (err) {
    alert("Yerler aktarılırken hata: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = origText || "🏰 Tarihi Yerleri Firebase'e Aktar";
    }
  }
};

async function loadPlaces() {
  const grid = document.getElementById('placesGrid');
  grid.innerHTML = '<div class="empty-state">Yerler yükleniyor...</div>';
  try {
    const snap = await getDocs(collection(db, 'guide_places'));
    window.placesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    document.getElementById('placesCount').innerText = window.placesCache.length;
    if (!window.placesCache.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; background: white; border-radius: var(--radius); border: 2px dashed var(--border);">
          <div style="font-size: 42px; margin-bottom: 12px;">🏰</div>
          <div style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Firebase'de Henüz Kayıtlı Yer Yok</div>
          <div style="font-size: 13px; color: var(--text-muted); max-width: 500px; margin: 0 auto 18px; line-height: 1.5;">
            Çoban Mustafa Paşa, Eskihisar Kalesi, Osman Hamdi Bey, Ballıkayalar ve gölet rotaları dahil 18 resmi yer hazır bekliyor.
          </div>
          <button type="button" class="btn btn-primary" onclick="seedPlaces()">
            ⚡ 18 Tarihi & Gezilecek Yeri Firebase'e Yükle
          </button>
        </div>`;
      return;
    }
    grid.innerHTML = window.placesCache
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'))
      .map(p => `
      <div class="item-card">
        ${p.image ? `<img src="${esc(p.image)}" class="item-card-image" onclick="openLightbox('${esc(p.image)}')" alt="" onerror="this.style.display='none'">` : ''}
        <div class="item-card-body">
          <div class="item-card-meta">
            <span class="badge badge-purple">${esc(p.category || 'Tarihi')}</span>
            ${p.distanceKm != null ? `<span style="margin-left:auto;">${esc(p.distanceKm)} km</span>` : ''}
          </div>
          <div class="item-card-title">${esc(p.name)}</div>
          <div class="item-card-desc">${esc(p.summary || '')}</div>
          ${p.detailUrl ? `<div style="margin-top:6px;"><a href="${esc(p.detailUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--navy-light); font-weight:700; text-decoration:none; font-size:12px;">🔗 Detay Sayfası &rarr;</a></div>` : ''}
        </div>
        <div class="item-card-footer">
          <button class="btn btn-outline btn-sm" onclick="editPlace('${p.id}')">Düzenle</button>
          <button class="btn btn-danger btn-sm" onclick="deleteDocItem('guide_places', '${p.id}', loadPlaces)">Sil</button>
        </div>
      </div>`).join('');
  } catch (e) {
    grid.innerHTML = `<div class="empty-state">Kayıtlar okunamadı: ${esc(e.message)}</div>`;
  }
}
window.loadPlaces = loadPlaces;
window.placesCache = [];
window.placeEditId = null;

window.editPlace = (id) => {
  const p = window.placesCache.find(x => x.id === id);
  if (!p) return;
  window.placeEditId = id;
  document.getElementById('placeName').value = p.name || '';
  document.getElementById('placeSummary').value = p.summary || '';
  document.getElementById('placeCategory').value = p.category || 'Tarihi';
  document.getElementById('placeDistance').value = p.distanceKm ?? '';
  document.getElementById('placeUrl').value = p.detailUrl || '';
  document.getElementById('placeImage').value = p.image || '';
  document.getElementById('placeFormTitle').innerText = 'Yeri düzenle';
  document.getElementById('placeSubmitBtn').innerText = 'Değişiklikleri kaydet';
  document.getElementById('placeCancelBtn').style.display = 'inline-flex';
  document.getElementById('formPlace').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.cancelPlaceEdit = () => {
  window.placeEditId = null;
  document.getElementById('formPlace').reset();
  document.getElementById('placeFormTitle').innerText = 'Yeni yer ekle';
  document.getElementById('placeSubmitBtn').innerText = 'Yeri ekle';
  document.getElementById('placeCancelBtn').style.display = 'none';
};

(function bindGuideForms() {
  const ready = (f) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', f) : f();
  ready(() => {
    document.getElementById('formGuide')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('guideSubmitBtn');
      const name = document.getElementById('guideName').value.trim();
      const lat = num(document.getElementById('guideLat').value);
      const lng = num(document.getElementById('guideLng').value);
      if ((lat === null) !== (lng === null)) { alert('Enlem ve boylam birlikte girilmeli ya da ikisi de boş bırakılmalı.'); return; }
      const data = {
        category: document.getElementById('guideCategory').value,
        name,
        description: document.getElementById('guideDesc').value.trim(),
        address: document.getElementById('guideAddress').value.trim(),
        phone: document.getElementById('guidePhone').value.trim(),
        mapQuery: document.getElementById('guideMapQuery').value.trim() || (name + ' Gebze'),
        image: document.getElementById('guideImage').value.trim(),
        url: document.getElementById('guideUrl')?.value.trim() || ''
      };
      if (lat !== null) { data.lat = lat; data.lng = lng; }
      btn.disabled = true;
      try {
        if (window.guideEditId) {
          await updateDoc(doc(db, 'guide_institutions', window.guideEditId), { ...data, updatedAt: serverTimestamp() });
          showToast('Kayıt güncellendi.');
        } else {
          await addDoc(collection(db, 'guide_institutions'), { ...data, createdAt: serverTimestamp() });
          showToast('Rehbere eklendi.');
        }
        cancelGuideEdit();
        loadGuide();
        loadDashboard();
      } catch (err) { alert('Kaydedilemedi: ' + err.message); }
      finally { btn.disabled = false; }
    });

    document.getElementById('formPlace')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('placeSubmitBtn');
      const data = {
        name: document.getElementById('placeName').value.trim(),
        summary: document.getElementById('placeSummary').value.trim(),
        category: document.getElementById('placeCategory').value,
        detailUrl: document.getElementById('placeUrl').value.trim(),
        image: document.getElementById('placeImage').value.trim()
      };
      const km = num(document.getElementById('placeDistance').value);
      if (km !== null) data.distanceKm = km;
      btn.disabled = true;
      try {
        if (window.placeEditId) {
          await updateDoc(doc(db, 'guide_places', window.placeEditId), { ...data, updatedAt: serverTimestamp() });
          showToast('Yer güncellendi.');
        } else {
          await addDoc(collection(db, 'guide_places'), { ...data, createdAt: serverTimestamp() });
          showToast('Yer eklendi.');
        }
        cancelPlaceEdit();
        loadPlaces();
        loadDashboard();
      } catch (err) { alert('Kaydedilemedi: ' + err.message); }
      finally { btn.disabled = false; }
    });
  });
})();

const DEFAULT_FOODS = [
  {
    id: "gebze_coregi",
    name: "Gebze Çöreği",
    name_en: "Gebze Pastry (Corek)",
    name_ar: "كعك جبزة التقليدي",
    summary: "Asırlardır tarihi çarşı fırınlarında odun ateşinde pişirilen, nohut mayası, tarçın ve anason aromalı tescilli Gebze çöreği.",
    origin: "Osmanlı döneminde Gebze menzilinde konaklayan kervanlar ve hac kafileleri için tok tutan, uzun süre bayatlamayan özel bir yol azığı olarak doğmuştur.",
    ingredients: ["Buğday unu", "Doğal nohut mayası", "Tereyağı", "Zeytinyağı", "Tarçın", "Karanfil", "Anason", "Rezene", "Susam", "Çörek otu"],
    recipe: [
      "1. Doğal nohut mayası bir gün önceden ılık suyla dinlendirilip kabartılır.",
      "2. Elenmiş buğday unu, aromatik baharat harmanı ve eritilmiş tereyağı ile harmanlanır.",
      "3. Mayalı hamur kıvamına gelene kadar yoğrulup dinlenmeye bırakılır.",
      "4. Geleneksel yuvarlak ve desenli çörek formu verilir, üzerine susam ve çörek otu serpilir.",
      "5. Odun ateşinde taş tabanlı fırında ağır ağır nar gibi kızarana kadar pişirilir."
    ],
    whereToEat: "Tarihi Gebze Çarşısı fırınları, Kent Meydanı çevresi ve yerel unlu mamul işletmeleri.",
    image: "gorsel/yemek/corek.jpg",
    order: 1
  },
  {
    id: "mancarli_pide",
    name: "Mancarlı Pide",
    name_en: "Mancar Herb Flatbread",
    name_ar: "فطيرة أعشاب مانجار",
    summary: "Gebze ve Kandıra köylerinde doğadan toplanan taze mancar otları ve köy peyniriyle hazırlanan meşhur Manav pidesi.",
    origin: "Kocaeli ve Gebze'nin yerli Türkmen (Manav) halkının yüzyıllardır düğün, bayram ve imecelerde sac üzerinde hazırladığı kadim lezzet.",
    ingredients: ["Taze mancar otu (veya pazı/ıspanak)", "Kuru soğan", "Köy çökeleği / lor peyniri", "Sızma zeytinyağı", "Tuz", "Karabiber", "Pul biber", "Un", "Köy mayası"],
    recipe: [
      "1. Doğadan toplanan mancar yaprakları bol suyla yıkanıp ince ince kıyılır.",
      "2. İnce doğranmış soğan, sızma zeytinyağı ve baharatlarla hafifçe ovulup peynir eklenir.",
      "3. Mayalı hamurdan bezeler alınıp yufka inceliğinde açılır.",
      "4. İç harç yufkanın yarısına yayılıp 'D' şeklinde kapatılır ve kenarları bastırılır.",
      "5. Odun ateşindeki sıcak sac üzerinde iki tarafı yağlanarak altın sarısı pişirilir."
    ],
    whereToEat: "Gebze köyleri (Denizli, Pelitli, Mollafenari), yerel üretici pazarları ve köy kahvaltı salonları.",
    image: "gorsel/yemek/mancar.webp",
    order: 2
  },
  {
    id: "gebze_hosmerim",
    name: "Höşmerim Tatlısı",
    name_en: "Hosmerim Cheese Dessert",
    name_ar: "حلوى هوشمريم بالجبن",
    summary: "Taze yağlı koyun veya inek peynirinin irmik ve şekerle bakır kazanda kavrulmasıyla yapılan enfes peynir tatlısı.",
    origin: "Marmara ve Kocaeli kırsalında hayvancılıkla uğraşan yörüklerin taze peyniri değerlendirmek için geliştirdiği köklü bir tatlıdır.",
    ingredients: ["Taze tuzsuz peynir / teleme", "İrmik", "Kristal toz şeker", "Tereyağı", "Yumurta sarısı"],
    recipe: [
      "1. Taze tuzsuz peynir kısık ateşte bakır tencereye alınıp yavaşça eritilir.",
      "2. Üzerine yumurta sarısı eklenip peynire yedirilir.",
      "3. İrmik ve toz şeker azar azar ilave edilerek tahta kaşıkla sürekli karıştırılır.",
      "4. Yağını salıp altın sarısı kıvam alana kadar yaklaşık 25-30 dakika kavrulur.",
      "5. Ilık veya soğuk olarak servis edilir."
    ],
    whereToEat: "Tarihi Gebze Çarşısı tatlıcıları, yerel restorantlar ve süt ürünleri işletmeleri.",
    image: "gorsel/yemek/hosmerim.jpeg",
    order: 3
  },
  {
    id: "saray_pismaniyesi",
    name: "Geleneksel Saray Pişmaniyesi",
    name_en: "Traditional Palace Pismaniye",
    name_ar: "حلوى الغزل التركية (بيشمانية)",
    summary: "Un, kavrulmuş şeker ağdası ve tereyağının usta ellerde çekilerek tel tel ayrıldığı coğrafi tescilli saray tatlısı.",
    origin: "Osmanlı saraylarında padişahlara sunulan, asırlık helvacılık zanaatının Kocaeli ve Gebze'deki en seçkin mirasıdır.",
    ingredients: ["Kavrulmuş buğday unu", "Kristal toz şeker", "Tereyağı", "Limon tuzu", "İçme suyu", "Vanilin"],
    recipe: [
      "1. Toz şeker ve su kaynatılıp ağda kıvamına getirilir, mermer tezgâhta beyazlatılır.",
      "2. Un ve tereyağı ayrı bir kazanda kavrularak miyane haline getirilir.",
      "3. Halka şeklindeki şeker ağdası sıcak un miyanesiyle buluşturulur.",
      "4. Ustalar tarafından çevrile çevrile gerilerek binlerce ipeksi tele ayrıştırılır.",
      "5. Özel fincanlarla porsiyonlanıp kutulanır."
    ],
    whereToEat: "Gebze merkezindeki tescilli pişmaniye satış noktaları ve hediyelik dükkanları.",
    image: "gorsel/yemek/pismaniye.jpeg",
    order: 4
  },
  {
    id: "manda_yogurdu",
    name: "Doğal Manda Yoğurdu",
    name_en: "Natural Water Buffalo Yogurt",
    name_ar: "لبن زبادي حليب الجاموس الطبيعي",
    summary: "Gebze ve bölge meralarında yayılan mandaların zengin sütünden geleneksel yöntemlerle mayalanan porselen beyazı yoğun kıvamlı yoğurt.",
    origin: "Gebze ve Kandıra meralarındaki sulak alanlarda yüzlerce yıldır sürdürülen manda yetiştiriciliği ve mandıracılık geleneğidir.",
    ingredients: ["%100 saf taze manda sütü", "Geleneksel ana yoğurt mayası"],
    recipe: [
      "1. Taze sağılan manda sütü süzülerek bakır tencerede kabarıncaya kadar kaynatılır.",
      "2. Maya sıcaklığına (45°C) kadar ılıtılır.",
      "3. Geleneksel kıvamlı maya sütle inceltilerek tencereye eklenir ve karıştırılır.",
      "4. Toprak çömleklere dökülüp üzeri bezle örtülerek 4-5 saat mayalanmaya bırakılır.",
      "5. Buzdolabında en az 12 saat dinlendirilerek taş kıvamına ulaşması sağlanır."
    ],
    whereToEat: "Gebze yerel köylü pazarları, süt mandıraları ve organik kahvaltı mekanları.",
    image: "gorsel/yemek/yogurt.jpeg",
    order: 5
  },
  {
    id: "eskihisar_balik",
    name: "Eskihisar Deniz Mahsulleri & Balık",
    name_en: "Eskihisar Seafood & Fresh Catch",
    name_ar: "مأكولات إسكي حصار البحرية والأسماك الطازجة",
    summary: "Eskihisar Kalesi eteklerindeki tarihi balıkçı barınağından günlük tutulan taze Marmara balıkları ve deniz lezzetleri.",
    origin: "Antik çağlardan bugüne bir liman ve balıkçı yerleşimi olan Eskihisar'ın kesintisiz devam eden denizcilik ve balık sofrası kültürü.",
    ingredients: ["Mevsim balıkları (levrek, çipura, istavrit, palamut, lüfer)", "Sızma zeytinyağı", "Kaya tuzu", "Taze defne yaprağı", "Limon"],
    recipe: [
      "1. Günlük tutulan balıklar temizlenip deniz tuzu ve sızma zeytinyağı ile marine edilir.",
      "2. Odun kömürü ızgarasında balığın et kalınlığına göre her iki yüzü de nar gibi mühürlenir.",
      "3. Yanında taze mevsim yeşillikleri, mor soğan ve limon eşliğinde sıcak servis edilir."
    ],
    whereToEat: "Eskihisar Sahil Kordonu, balık restoranları ve Eskihisar Balıkçı Barınağı.",
    image: "gorsel/yemek/deniz.jpeg",
    order: 6
  }
];

window.foodsCache = [];
window.foodEditId = null;

window.seedFoods = async () => {
  if (!confirm("Gebze'nin 6 geleneksel tescilli yöresel lezzet kaydı Firebase 'guide_foods' koleksiyonuna aktarılsın mı?")) return;
  const btn = document.getElementById('btnSeedFoods');
  const origText = btn ? btn.innerText : '';
  if (btn) {
    btn.disabled = true;
    btn.innerText = "⏳ Aktarılıyor...";
  }
  try {
    let count = 0;
    for (const f of DEFAULT_FOODS) {
      await setDoc(doc(db, 'guide_foods', f.id), {
        name: f.name,
        name_en: f.name_en || '',
        name_ar: f.name_ar || '',
        summary: f.summary,
        origin: f.origin || '',
        ingredients: f.ingredients || [],
        recipe: f.recipe || [],
        whereToEat: f.whereToEat || '',
        image: f.image || '',
        order: f.order || (count + 1),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      count++;
    }
    showToast(`${count} adet yöresel lezzet Firebase'e başarıyla aktarıldı!`);
    await loadFoods();
    if (window.loadDashboard) loadDashboard();
  } catch (err) {
    alert("Lezzetler aktarılırken hata: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = origText || "🍲 6 Resmi Lezzeti Firebase'e Yükle";
    }
  }
};

async function loadFoods() {
  const grid = document.getElementById('foodsGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="empty-state">Yöresel lezzetler yükleniyor...</div>';
  try {
    const snap = await getDocs(collection(db, 'guide_foods'));
    window.foodsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const countEl = document.getElementById('foodsCount');
    if (countEl) countEl.innerText = window.foodsCache.length;
    renderFoods();
  } catch (e) {
    grid.innerHTML = `<div class="empty-state">Kayıtlar okunamadı: ${esc(e.message)}</div>`;
  }
}
window.loadFoods = loadFoods;

function renderFoods() {
  const grid = document.getElementById('foodsGrid');
  if (!grid) return;
  const q = (document.getElementById('foodsSearchInput')?.value || '').trim().toLowerCase();
  const list = (window.foodsCache || []).filter(f => {
    if (!q) return true;
    return (f.name || '').toLowerCase().includes(q) ||
      (f.summary || '').toLowerCase().includes(q) ||
      (f.whereToEat || '').toLowerCase().includes(q) ||
      (f.origin || '').toLowerCase().includes(q);
  }).sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));

  const countEl = document.getElementById('foodsCount');
  if (countEl) countEl.innerText = list.length;

  if (!window.foodsCache || !window.foodsCache.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; background: white; border-radius: var(--radius); border: 2px dashed var(--border);">
        <div style="font-size: 42px; margin-bottom: 12px;">🍲</div>
        <div style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Firebase'de Henüz Kayıtlı Yöresel Lezzet Yok</div>
        <div style="font-size: 13px; color: var(--text-muted); max-width: 520px; margin: 0 auto 18px; line-height: 1.5;">
          Gebze Çöreği, Mancarlı Pide, Höşmerim Tatlısı, Saray Pişmaniyesi, Doğal Manda Yoğurdu ve Eskihisar Deniz Mahsulleri dahil 6 resmi kayıt hazır bekliyor.
        </div>
        <button type="button" class="btn btn-primary" onclick="seedFoods()">
          ⚡ 6 Resmi Gebze Lezzetini Firebase'e Yükle
        </button>
      </div>`;
    return;
  }

  if (!list.length) {
    grid.innerHTML = '<div class="empty-state">Arama kriterlerine uygun yöresel lezzet bulunamadı.</div>';
    return;
  }

  grid.innerHTML = list.map(f => {
    const ings = Array.isArray(f.ingredients) ? f.ingredients : (f.ingredients ? String(f.ingredients).split(',') : []);
    const ingPreview = ings.slice(0, 4).join(', ') + (ings.length > 4 ? ` (+${ings.length - 4})` : '');
    return `
    <div class="item-card">
      ${f.image ? `<img src="${esc(f.image)}" class="item-card-image" onclick="openLightbox('${esc(f.image)}')" alt="" onerror="this.style.display='none'">` : ''}
      <div class="item-card-body">
        <div class="item-card-meta">
          <span class="badge badge-warning" style="background:#FFF7ED; color:#EA580C; border:1px solid #FFEDD5;">🍲 Yöresel Lezzet</span>
          <span style="margin-left:auto; font-weight:700; color:var(--text-muted); font-size:11.5px;">Sıra: #${f.order || 999}</span>
        </div>
        <div class="item-card-title">${esc(f.name)}</div>
        <div class="item-card-desc">${esc(f.summary || '')}</div>
        ${f.origin ? `<div style="font-size:12px; color:var(--text-muted); margin-top:8px; line-height:1.4;"><strong>🏺 Kökeni:</strong> ${esc(f.origin.length > 100 ? f.origin.substring(0, 100) + '...' : f.origin)}</div>` : ''}
        ${f.whereToEat ? `<div style="font-size:12px; color:var(--navy-light); font-weight:700; margin-top:6px;">📍 ${esc(f.whereToEat)}</div>` : ''}
        ${ingPreview ? `<div style="font-size:11.5px; color:var(--text-muted); margin-top:4px; font-style:italic;">🧂 ${esc(ingPreview)}</div>` : ''}
      </div>
      <div class="item-card-footer">
        <button class="btn btn-outline btn-sm" onclick="editFood('${f.id}')">Düzenle</button>
        <button class="btn btn-danger btn-sm" onclick="deleteDocItem('guide_foods', '${f.id}', loadFoods)">Sil</button>
      </div>
    </div>`;
  }).join('');
}
window.renderFoods = renderFoods;

window.editFood = (id) => {
  const f = window.foodsCache.find(x => x.id === id);
  if (!f) return;
  window.foodEditId = id;
  document.getElementById('foodName').value = f.name || '';
  document.getElementById('foodNameEn').value = f.name_en || '';
  document.getElementById('foodNameAr').value = f.name_ar || '';
  document.getElementById('foodSummary').value = f.summary || '';
  document.getElementById('foodOrigin').value = f.origin || '';
  document.getElementById('foodIngredients').value = Array.isArray(f.ingredients) ? f.ingredients.join(', ') : (f.ingredients || '');
  document.getElementById('foodRecipe').value = Array.isArray(f.recipe) ? f.recipe.join('\n') : (f.recipe || '');
  document.getElementById('foodWhereToEat').value = f.whereToEat || '';
  document.getElementById('foodImage').value = f.image || '';
  document.getElementById('foodOrder').value = f.order ?? 1;

  document.getElementById('foodFormTitle').innerText = 'Lezzeti düzenle';
  document.getElementById('foodSubmitBtn').innerText = 'Değişiklikleri kaydet';
  document.getElementById('foodCancelBtn').style.display = 'inline-flex';
  document.getElementById('formFood').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.cancelFoodEdit = () => {
  window.foodEditId = null;
  document.getElementById('formFood').reset();
  document.getElementById('foodFormTitle').innerText = 'Yeni yöresel lezzet ekle';
  document.getElementById('foodSubmitBtn').innerText = 'Lezzeti ekle';
  document.getElementById('foodCancelBtn').style.display = 'none';
};

const DEFAULT_PICNIC = [
  {
    id: 'doga_beylikdagi',
    name: 'Beylikdağı Orman Yürüyüşü',
    name_en: 'Beylikdagi Forest Walk',
    name_ar: 'مسار غابة بيليك داغي',
    summary: 'Gebze\'nin doğal yeşil alanlarından biri olan Beylikdağı Kent Ormanı, ağaçlandırılmış yamaçları ve orman dokusuyla açık havada yürüyüş yapmak, temiz hava almak ve doğa fotoğrafları çekmek isteyenlere harika bir rota sunar.',
    type: 'doga',
    village: 'Beylikdağı',
    address: 'Beylikdağı, Gebze, Kocaeli',
    mapQuery: 'Beylikdağı Kent Ormanı Gebze Kocaeli',
    image: 'gorsel/piknik/beylikdagi.jpg',
    features: ['Doğa Yürüyüşü', 'Manzara İzleme', 'Doğa Fotoğrafçılığı'],
    order: 1
  },
  {
    id: 'doga_denizli_goleti',
    name: 'Denizli Göleti Doğa Rotası',
    name_en: 'Denizli Pond Nature Route',
    name_ar: 'مسار بركة دينيزلي الطبيعي',
    summary: 'Gebze\'nin Denizli Mahallesi çevresinde yer alan Denizli Göleti, gölet manzarasını kırsal doğayla buluşturan keyifli bir yürüyüş noktasıdır. Toprak yollar ve orman patikaları şehrin gürültüsünden kaçış imkânı sunar.',
    type: 'doga',
    village: 'Denizli Mahallesi',
    address: 'Denizli Mahallesi, Gebze, Kocaeli',
    mapQuery: 'Denizli Göleti Gebze Kocaeli',
    image: 'gorsel/piknik/denizli_goleti.jpg',
    features: ['Gölet Manzarası', 'Kırsal Doğa', 'Orman Yürüyüşü', 'Fotoğrafçılık'],
    order: 2
  },
  {
    id: 'doga_denizli_yoruk_yaylalari',
    name: 'Denizli Göleti – Yörük Yaylaları Doğa Rotası',
    name_en: 'Denizli Pond – Yoruk Plateaus Nature Route',
    name_ar: 'مسار بركة دينيزلي – هضاب يوروك الطبيعي',
    summary: 'Denizli Göleti\'nden başlayarak Gebze\'nin kırsal alanlarına uzanan bu doğa rotası; orman yollarını, geniş çayırlıkları ve yayla manzaralarını bir araya getirir.',
    type: 'doga',
    village: 'Denizli & Yörük Yaylaları',
    address: 'Denizli Mahallesi ve Yörük Yaylaları çevresi, Gebze, Kocaeli',
    mapQuery: 'Denizli Göleti Yörük Yaylaları Gebze Kocaeli',
    image: 'gorsel/piknik/denizli_yoruk_yaylalari.png',
    features: ['Yayla Manzaraları', 'Orman Patikaları', 'Çayırlıklar', 'Uzun Doğa Yürüyüşleri'],
    order: 3
  },
  {
    id: 'doga_elmalidere_selalesi',
    name: 'Elmalıdere Şelalesi ve Orman Patikaları',
    name_en: 'Elmalidere Waterfall & Forest Trails',
    name_ar: 'شلال إلماليده ره ومسارات الغابة',
    summary: 'Gebze\'nin Denizli kırsalı çevresinde bulunan Elmalıdere Şelalesi, dere yatağı, doğal bitki örtüsü ve orman yollarıyla doğa yürüyüşü ve fotoğraf meraklılarının gözde rotasıdır.',
    type: 'doga',
    village: 'Denizli Kırsalı',
    address: 'Denizli kırsalı, Gebze, Kocaeli',
    mapQuery: 'Elmalıdere Şelalesi Denizli Gebze Kocaeli',
    image: 'gorsel/piknik/elmalidere_selalesi.jpg',
    features: ['Şelale Manzarası', 'Dere Yatağı', 'Orman Patikaları', 'Doğa Fotoğrafçılığı'],
    order: 4
  },
  {
    id: 'doga_yelken_tepe',
    name: 'Yelken Tepe Doğa Yürüyüşü',
    name_en: 'Yelken Tepe Nature Walk',
    name_ar: 'مسار جبل يلكن تيبي',
    summary: 'Gebze\'nin Denizli kırsalındaki Yelken Tepe, gölet ve yayla güzergâhlarıyla birleştirilebilen, zirveden panoramik kırsal manzaralar sunan özel bir tepe rotasıdır.',
    type: 'doga',
    village: 'Denizli Kırsalı',
    address: 'Yelken Tepe, Denizli kırsalı, Gebze, Kocaeli',
    mapQuery: 'Yelken Tepe Denizli Gebze Kocaeli',
    image: 'gorsel/piknik/yelken_tepe.png',
    features: ['Tepe Yürüyüşü', 'Orman Patikaları', 'Kırsal Manzara', 'Fotoğrafçılık'],
    order: 5
  },
  {
    id: 'fb_eskihisar',
    name: 'Eskihisar Korusu',
    summary: 'Tarihi Eskihisar Kalesi yanında, çam ağaçları arasında deniz manzaralı piknik ve dinlenme korusu.',
    type: 'piknik',
    village: 'Eskihisar',
    address: 'Eskihisar, Gebze',
    mapQuery: 'Eskihisar Korusu Gebze',
    image: 'gorsel/piknik/eskoru.webp',
    features: ['Piknik Masaları', 'Deniz Manzarası', 'Gölge Alanlar', 'Yürüyüş Yolu'],
    order: 6
  },
  {
    id: 'fb_pelitli',
    name: 'Pelitli Bayraktepe Mesire Alanı',
    summary: 'Pelitli köyünde hakim tepede yer alan, geniş ahşap çardakları ve panoramik Gebze manzarasıyla mesire alanı.',
    type: 'mesire',
    village: 'Pelitli',
    address: 'Pelitli, Gebze',
    mapQuery: 'Gebze Belediyesi Pelitli Bayraktepe Mesire Alanı',
    image: 'gorsel/piknik/pelitlimesire.webp',
    features: ['Mesire Alanı', 'Seyir Tepesi', 'Çardaklar', 'Otopark'],
    order: 7
  },
  {
    id: 'fb_gazilerdagi',
    name: 'Gazilerdağı Tabiat Parkı',
    summary: 'Gebze\'nin en yüksek tepesinde 350 dönümlük devasa çam ormanı, koşu parkurları ve temiz hava noktası.',
    type: 'doga',
    village: 'Gaziler',
    address: 'Gaziler Mah., Gebze',
    mapQuery: 'Gazilerdağı Tabiat Parkı Gebze',
    image: 'gorsel/piknik/gazilerdağı.webp',
    features: ['Tabiat Parkı', 'Yürüyüş Parkuru', 'Gözetleme Kulesi', 'Spor Alanları'],
    order: 8
  },
  {
    id: 'fb_gaziler_piknik',
    name: 'Gaziler Piknik Alanı',
    summary: 'Gaziler Dağı eteğinde ailelerin hafta sonu rahatça piknik yapabileceği çardaklı ve çeşmeli mesire yeri.',
    type: 'piknik',
    village: 'Gaziler',
    address: 'Dicle Cd. No:48, Gaziler, Gebze',
    mapQuery: 'Gaziler piknik alanı Gebze',
    image: 'gorsel/piknik/gazilerpiknik.webp',
    features: ['Piknik Masaları', 'Çardaklar', 'Çeşme', 'Çocuk Oyun Alanı'],
    order: 9
  },
  {
    id: 'fb_cumakoy',
    name: 'Cumaköy Mesire Alanı',
    summary: 'Cumaköy kırsalında asırlık çınar ve meşe ağaçlarının gölgesinde huzurlu doğa ve mesire alanı.',
    type: 'mesire',
    village: 'Cumaköy',
    address: 'Cumaköy, Gebze',
    mapQuery: 'Gebze Belediyesi Cumaköy Mesire Alanı',
    image: 'gorsel/piknik/cumakoymesire.jpg',
    features: ['Mesire Alanı', 'Ağaçlık Alan', 'Sessiz Doğa', 'Köy Atmosferi'],
    order: 10
  },
  {
    id: 'fb_duzmese',
    name: 'Düz Meşe Mesire Yeri',
    summary: 'Geniş meşe ağaçlarıyla kaplı düz arazide piknik, dinlenme ve doğa aktiviteleri alanı.',
    type: 'mesire',
    village: 'Gebze Kırsalı',
    address: 'Gebze / Kocaeli',
    mapQuery: 'Düz Meşe Mesire Yeri Gebze',
    image: 'gorsel/piknik/duzmese.webp',
    features: ['Meşe Ormanı', 'Piknik Masaları', 'Geniş Çim Alan'],
    order: 11
  },
  {
    id: 'fb_tatlikuyu',
    name: 'Tatlıkuyu Vadisi Parkı',
    summary: 'Gebze merkezinde vadi boyunca uzanan, göletleri, bisiklet yolları ve yürüyüş parkurlarıyla kentin en büyük yeşil vahası.',
    type: 'park',
    village: 'Tatlıkuyu',
    address: '1312/1. Sk. No:20, Tatlıkuyu, Gebze',
    mapQuery: 'Tatlıkuyu Vadisi Gebze',
    image: 'gorsel/piknik/tatlikuyu.webp',
    features: ['Kent Parkı', 'Yürüyüş ve Koşu Yolu', 'Bisiklet Parkuru', 'Göletler', 'Kafeterya'],
    order: 12
  },
  {
    id: 'fb_gaziler_parki',
    name: 'Gaziler Parkı',
    summary: 'Mahalle sakinleri için çocuk oyun alanları, fitness aletleri ve gölgelik oturma grupları barındıran kent parkı.',
    type: 'park',
    village: 'Gaziler',
    address: 'Şht. Özcan Demirci Cd. No:50, Gaziler, Gebze',
    mapQuery: 'Gaziler Parkı Gebze',
    image: 'gorsel/piknik/gazilerpiknik.webp',
    features: ['Park', 'Çocuk Oyun Alanı', 'Fitness Aletleri', 'Banklar'],
    order: 13
  },
  {
    id: 'fb_yumrukaya',
    name: 'Yumrukaya Piknik Alanı',
    summary: 'Yumrukaya mevkisinde yol kenarında ağaçlık ve gölgelik mola ve piknik noktası.',
    type: 'piknik',
    village: 'Yumrukaya',
    address: 'İbrahim Ağa Cd., Yumrukaya, Gebze',
    mapQuery: 'Yumrukaya Piknik Alanı Gebze',
    image: 'gorsel/piknik/eskoru.webp',
    features: ['Piknik Masaları', 'Yeşil Alan', 'Yol Kenarı Dinlenme'],
    order: 14
  },
  {
    id: 'fb_ballikayalar',
    name: 'Ballıkayalar Tabiat Parkı & Kanyon',
    summary: 'Milyonlarca yıllık karstik kanyon, şelaleler, kaya tırmanış duvarları ve eşsiz doğa yürüyüşü parkurları.',
    type: 'doga',
    village: 'Tavşanlı',
    address: 'Barış Cd., Tavşanlı Köyü, Gebze',
    mapQuery: 'Ballıkayalar Tabiat Parkı Gebze',
    image: 'gorsel/piknik/ballikayapark.webp',
    features: ['Kanyon Rotası', 'Kaya Tırmanışı', 'Doğa Yürüyüşü', 'Şelaleler', 'Kamp Alanı'],
    order: 15
  }
];

window.picnicCache = [];
window.picnicEditId = null;
window.picnicFilterType = 'all';

const PICNIC_TYPE_LABELS = {
  all: 'Tümü',
  piknik: '🧺 Piknik Alanı',
  mesire: '🏞️ Mesire Alanı',
  doga: '🌲 Doğa Alanı',
  park: '🌳 Park'
};

window.setPicnicTypeFilter = (type) => {
  window.picnicFilterType = type;
  renderPicnic();
};

window.seedPicnic = async () => {
  if (!confirm("Gebze'deki 15 resmi doğa, mesire ve piknik alanı kaydı Firebase 'guide_picnic' koleksiyonuna aktarılsın mı?")) return;
  const btn = document.getElementById('btnSeedPicnic');
  const origText = btn ? btn.innerText : '';
  if (btn) {
    btn.disabled = true;
    btn.innerText = "⏳ Aktarılıyor...";
  }
  try {
    let count = 0;
    for (const p of DEFAULT_PICNIC) {
      await setDoc(doc(db, 'guide_picnic', p.id), {
        name: p.name,
        name_en: p.name_en || '',
        name_ar: p.name_ar || '',
        summary: p.summary,
        type: p.type || 'piknik',
        village: p.village || '',
        address: p.address || '',
        lat: p.lat ?? null,
        lng: p.lng ?? null,
        mapQuery: p.mapQuery || (p.name + ' Gebze'),
        image: p.image || '',
        features: p.features || [],
        order: p.order || (count + 1),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      count++;
    }
    showToast(`${count} adet doğa ve piknik alanı Firebase'e başarıyla aktarıldı!`);
    await loadPicnic();
    if (window.loadDashboard) loadDashboard();
  } catch (err) {
    alert("Doğa ve piknik alanları aktarılırken hata: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = origText || "🌲 15 Resmi Alanı Firebase'e Yükle";
    }
  }
};

async function loadPicnic() {
  const grid = document.getElementById('picnicGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="empty-state">Doğa ve piknik alanları yükleniyor...</div>';
  try {
    const snap = await getDocs(collection(db, 'guide_picnic'));
    window.picnicCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const countEl = document.getElementById('picnicCount');
    if (countEl) countEl.innerText = window.picnicCache.length;
    renderPicnic();
  } catch (e) {
    grid.innerHTML = `<div class="empty-state">Kayıtlar okunamadı: ${esc(e.message)}</div>`;
  }
}
window.loadPicnic = loadPicnic;

function renderPicnic() {
  const grid = document.getElementById('picnicGrid');
  if (!grid) return;
  const q = (document.getElementById('picnicSearchInput')?.value || '').trim().toLowerCase();
  const filterType = window.picnicFilterType || 'all';

  const chipContainer = document.getElementById('picnicTypeChips');
  if (chipContainer) {
    const allCounts = { all: (window.picnicCache || []).length };
    (window.picnicCache || []).forEach(p => {
      const t = p.type || 'piknik';
      allCounts[t] = (allCounts[t] || 0) + 1;
    });
    chipContainer.innerHTML = Object.entries(PICNIC_TYPE_LABELS).map(([k, label]) => {
      const isAct = filterType === k;
      return `<button type="button" class="chip ${isAct ? 'active' : ''}" onclick="setPicnicTypeFilter('${k}')">${label} <span>${allCounts[k] || 0}</span></button>`;
    }).join('');
  }

  const list = (window.picnicCache || []).filter(p => {
    if (filterType !== 'all' && (p.type || 'piknik') !== filterType) return false;
    if (!q) return true;
    return (p.name || '').toLowerCase().includes(q) ||
      (p.summary || '').toLowerCase().includes(q) ||
      (p.village || '').toLowerCase().includes(q) ||
      (p.address || '').toLowerCase().includes(q);
  }).sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));

  const countEl = document.getElementById('picnicCount');
  if (countEl) countEl.innerText = list.length;

  if (!window.picnicCache || !window.picnicCache.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; background: white; border-radius: var(--radius); border: 2px dashed var(--border);">
        <div style="font-size: 42px; margin-bottom: 12px;">🌲</div>
        <div style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Firebase'de Henüz Kayıtlı Doğa & Piknik Alanı Yok</div>
        <div style="font-size: 13px; color: var(--text-muted); max-width: 520px; margin: 0 auto 18px; line-height: 1.5;">
          Beylikdağı, Denizli Göleti, Ballıkayalar, Eskihisar Korusu, Pelitli Bayraktepe ve Tatlıkuyu Vadisi dahil 15 resmi alan hazır bekliyor.
        </div>
        <button type="button" class="btn btn-primary" onclick="seedPicnic()">
          ⚡ 15 Resmi Doğa & Piknik Alanını Firebase'e Yükle
        </button>
      </div>`;
    return;
  }

  if (!list.length) {
    grid.innerHTML = '<div class="empty-state">Seçilen filtre ve arama kriterine uygun alan bulunamadı.</div>';
    return;
  }

  const typeBadgeColors = {
    piknik: 'badge-warning',
    mesire: 'badge-purple',
    doga: 'badge-success',
    park: 'badge-primary'
  };

  grid.innerHTML = list.map(p => {
    const feats = Array.isArray(p.features) ? p.features : (p.features ? String(p.features).split(',') : []);
    const featPills = feats.slice(0, 3).map(f => `<span style="display:inline-block; font-size:11px; background:#F1F5F9; color:#334155; padding:2px 7px; border-radius:6px; margin:2px 2px 0 0;">${esc(f)}</span>`).join('');
    const badgeCls = typeBadgeColors[p.type] || 'badge-primary';
    return `
    <div class="item-card">
      ${p.image ? `<img src="${esc(p.image)}" class="item-card-image" onclick="openLightbox('${esc(p.image)}')" alt="" onerror="this.style.display='none'">` : ''}
      <div class="item-card-body">
        <div class="item-card-meta">
          <span class="badge ${badgeCls}">${esc(PICNIC_TYPE_LABELS[p.type] || p.type || 'Piknik')}</span>
          ${p.village ? `<span style="margin-left:auto; font-weight:600; color:var(--navy-light);">📍 ${esc(p.village)}</span>` : ''}
        </div>
        <div class="item-card-title">${esc(p.name)}</div>
        <div class="item-card-desc">${esc(p.summary || '')}</div>
        ${p.address ? `<div style="font-size:12px; color:var(--text-muted); margin-top:6px;">📍 ${esc(p.address)}</div>` : ''}
        ${featPills ? `<div style="margin-top:8px;">${featPills}</div>` : ''}
      </div>
      <div class="item-card-footer">
        <span style="font-size:11.5px; font-weight:700; color:var(--text-muted);">Sıra: #${p.order || 999}</span>
        <div style="margin-left:auto; display:flex; gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="editPicnic('${p.id}')">Düzenle</button>
          <button class="btn btn-danger btn-sm" onclick="deleteDocItem('guide_picnic', '${p.id}', loadPicnic)">Sil</button>
        </div>
      </div>
    </div>`;
  }).join('');
}
window.renderPicnic = renderPicnic;

window.editPicnic = (id) => {
  const p = window.picnicCache.find(x => x.id === id);
  if (!p) return;
  window.picnicEditId = id;
  document.getElementById('picnicName').value = p.name || '';
  document.getElementById('picnicNameEn').value = p.name_en || '';
  document.getElementById('picnicNameAr').value = p.name_ar || '';
  document.getElementById('picnicType').value = p.type || 'piknik';
  document.getElementById('picnicVillage').value = p.village || '';
  document.getElementById('picnicAddress').value = p.address || '';
  document.getElementById('picnicSummary').value = p.summary || '';
  document.getElementById('picnicFeatures').value = Array.isArray(p.features) ? p.features.join(', ') : (p.features || '');
  document.getElementById('picnicLat').value = p.lat ?? '';
  document.getElementById('picnicLng').value = p.lng ?? '';
  document.getElementById('picnicMapQuery').value = p.mapQuery || '';
  document.getElementById('picnicImage').value = p.image || '';
  document.getElementById('picnicOrder').value = p.order ?? 1;

  document.getElementById('picnicFormTitle').innerText = 'Alanı düzenle';
  document.getElementById('picnicSubmitBtn').innerText = 'Değişiklikleri kaydet';
  document.getElementById('picnicCancelBtn').style.display = 'inline-flex';
  document.getElementById('formPicnic').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.cancelPicnicEdit = () => {
  window.picnicEditId = null;
  document.getElementById('formPicnic').reset();
  document.getElementById('picnicFormTitle').innerText = 'Yeni doğa / piknik alanı ekle';
  document.getElementById('picnicSubmitBtn').innerText = 'Alanı ekle';
  document.getElementById('picnicCancelBtn').style.display = 'none';
};

(function bindFoodsAndPicnicForms() {
  const ready = (f) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', f) : f();
  ready(() => {
    document.getElementById('formFood')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('foodSubmitBtn');
      const rawIng = document.getElementById('foodIngredients').value;
      const ingredients = rawIng.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
      const rawRecipe = document.getElementById('foodRecipe').value;
      const recipe = rawRecipe.split('\n').map(s => s.trim()).filter(Boolean);
      const data = {
        name: document.getElementById('foodName').value.trim(),
        name_en: document.getElementById('foodNameEn').value.trim(),
        name_ar: document.getElementById('foodNameAr').value.trim(),
        summary: document.getElementById('foodSummary').value.trim(),
        origin: document.getElementById('foodOrigin').value.trim(),
        ingredients,
        recipe,
        whereToEat: document.getElementById('foodWhereToEat').value.trim(),
        image: document.getElementById('foodImage').value.trim(),
        order: parseInt(document.getElementById('foodOrder').value, 10) || 999
      };
      btn.disabled = true;
      try {
        if (window.foodEditId) {
          await updateDoc(doc(db, 'guide_foods', window.foodEditId), { ...data, updatedAt: serverTimestamp() });
          showToast('Lezzet güncellendi.');
        } else {
          await addDoc(collection(db, 'guide_foods'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
          showToast('Yöresel lezzet eklendi.');
        }
        cancelFoodEdit();
        loadFoods();
        loadDashboard();
      } catch (err) { alert('Kaydedilemedi: ' + err.message); }
      finally { btn.disabled = false; }
    });

    document.getElementById('formPicnic')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('picnicSubmitBtn');
      const rawFeat = document.getElementById('picnicFeatures').value;
      const features = rawFeat.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
      const lat = num(document.getElementById('picnicLat').value);
      const lng = num(document.getElementById('picnicLng').value);
      const name = document.getElementById('picnicName').value.trim();
      const data = {
        name,
        name_en: document.getElementById('picnicNameEn').value.trim(),
        name_ar: document.getElementById('picnicNameAr').value.trim(),
        type: document.getElementById('picnicType').value,
        village: document.getElementById('picnicVillage').value.trim(),
        address: document.getElementById('picnicAddress').value.trim(),
        summary: document.getElementById('picnicSummary').value.trim(),
        features,
        mapQuery: document.getElementById('picnicMapQuery').value.trim() || (name + ' Gebze'),
        image: document.getElementById('picnicImage').value.trim(),
        order: parseInt(document.getElementById('picnicOrder').value, 10) || 999
      };
      if (lat !== null) data.lat = lat;
      if (lng !== null) data.lng = lng;

      btn.disabled = true;
      try {
        if (window.picnicEditId) {
          await updateDoc(doc(db, 'guide_picnic', window.picnicEditId), { ...data, updatedAt: serverTimestamp() });
          showToast('Alan güncellendi.');
        } else {
          await addDoc(collection(db, 'guide_picnic'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
          showToast('Doğa / piknik alanı eklendi.');
        }
        cancelPicnicEdit();
        loadPicnic();
        loadDashboard();
      } catch (err) { alert('Kaydedilemedi: ' + err.message); }
      finally { btn.disabled = false; }
    });
  });
})();
