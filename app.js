/**
 * AQIQ (MBM) TILES - Inventory & Catalog Studio
 * Modern Enterprise Application Engine
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     Constants & Utilities
     -------------------------------------------------------------------------- */
  const DB_KEY = 'current_catalog'; // localStorage cache key (offline fallback)
  const ROWS_PER_PAGE = 5;

  // Cloud backend: product/catalog text data lives in Supabase, photos live in
  // Cloudinary. localStorage is kept only as an offline fallback cache.
  const SUPABASE_URL = 'https://flnqwklklduizezaxlzk.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsbnF3a2xrbGR1aXplemF4bHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NDU0MTUsImV4cCI6MjEwNTMyMTQxNX0.VG-jQriTQdt8sZsioD6w5s-o3pb1Z7jwxpMEx5f4WjI';
  const CLOUDINARY_CLOUD_NAME = 'o29bwz7m';
  // One-time setup still needed: create an UNSIGNED upload preset in the
  // Cloudinary dashboard (Settings -> Upload -> Upload presets -> Add upload
  // preset -> Signing Mode: Unsigned), then paste its name below. Until this
  // is set, adding brand-new tile photos will show an error toast; everything
  // else (all 111 existing tiles, edits, stock, reordering, PDF export) works.
  const CLOUDINARY_UPLOAD_PRESET = 'gpdccoxx';

  const supabaseClient = (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  // Crisp Vector SVG Helper Dictionary
  const ICONS = {
    edit: `<svg class="svg-icon sm" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    trash: `<svg class="svg-icon sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    copy: `<svg class="svg-icon sm" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
    grip: `<svg class="svg-icon sm" viewBox="0 0 24 24"><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>`,
    camera: `<svg class="svg-icon sm" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`,
    star: `<svg class="svg-icon sm" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    arrowLeft: `<svg class="svg-icon sm" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
    arrowRight: `<svg class="svg-icon sm" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
    search: `<svg class="svg-icon sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    share: `<svg class="svg-icon sm" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>`,
    whatsapp: `<svg class="svg-icon sm" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.15c-.24.68-1.39 1.26-1.92 1.34-.5.07-1.14.1-3.32-.8-2.79-1.15-4.57-3.99-4.71-4.18-.14-.18-1.13-1.51-1.13-2.88 0-1.37.72-2.05.98-2.33.26-.28.56-.35.75-.35.19 0 .38 0 .54.01.18.01.42-.07.65.49.24.58.82 2 .89 2.15.07.15.12.33.02.53-.1.2-.15.33-.3.51-.15.18-.31.4-.44.54-.15.15-.3.31-.13.61.17.29.77 1.27 1.65 2.05 1.13 1.01 2.09 1.32 2.38 1.47.3.15.47.12.65-.08.18-.21.75-.88.95-1.18.2-.3.41-.25.68-.15.28.1 1.78.84 2.09.99.3.15.51.22.58.35.08.12.08.7-.16 1.38z"/></svg>`,
    loader: `<svg class="svg-icon sm" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>`
  };

  function uid(prefix = 'tile_') {
    return prefix + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  }

  function formatDateTime(d = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());
    const secs = pad(d.getSeconds());
    return `${day}/${month}/${year}, ${hours}:${mins}:${secs}`;
  }

  function formatDateOnly(d = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  /* --------------------------------------------------------------------------
     State Management
     -------------------------------------------------------------------------- */
  let catalog = null;
  let currentFilter = 'all';
  let searchQuery = '';
  let currentSort = 'custom';
  let currentView = 'cards'; // 'cards' | 'table' | 'pdf'
  let editingProductId = null;
  let draftImages = []; // [{ id, dataUrl, name }]
  let historyStack = [];
  let currentUser = null;
  let isAuthBypassed = false;

  /* --------------------------------------------------------------------------
     Persistence (Supabase, with a localStorage cache for offline resilience)
     -------------------------------------------------------------------------- */
  function productRowToLocal(r) {
    return {
      id: r.id,
      name: r.name,
      stock: r.stock || 0,
      unit: r.unit || 'Box',
      size: r.size || '',
      theme: r.theme || 'black',
      category: r.category || '',
      description: r.description || '',
      price: r.price,
      pdfImageMode: r.pdf_image_mode || 'auto',
      images: (r.images || []).map(im => ({ id: im.id, dataUrl: im.url, name: im.name || '' })),
      updatedAt: r.updated_at
    };
  }

  function productLocalToRow(p, position) {
    return {
      id: p.id,
      name: p.name,
      stock: p.stock || 0,
      unit: p.unit || 'Box',
      size: p.size || '',
      theme: p.theme || 'black',
      category: p.category || '',
      description: p.description || '',
      price: (p.price === undefined || p.price === null || p.price === '') ? null : p.price,
      pdf_image_mode: p.pdfImageMode || 'auto',
      images: (p.images || []).map(im => ({ id: im.id, url: im.dataUrl, name: im.name || '' })),
      position: position
    };
  }

  async function loadFromStorage() {
    if (supabaseClient) {
      try {
        const [settingsRes, productsRes] = await Promise.all([
          supabaseClient.from('catalog_settings').select('*').eq('id', 1).maybeSingle(),
          supabaseClient.from('products').select('*').order('position', { ascending: true })
        ]);
        if (settingsRes.error) throw settingsRes.error;
        if (productsRes.error) throw productsRes.error;

        const settingsRow = settingsRes.data;
        const productRows = productsRes.data || [];
        const seed = window.DEFAULT_CATALOG_DATA || {};

        const loaded = {
          title: (settingsRow && settingsRow.title) || seed.title || 'Catalog',
          subtitle: (settingsRow && settingsRow.subtitle) || seed.subtitle || '',
          companyName: (settingsRow && settingsRow.company_name) || seed.companyName || '',
          brandName: (settingsRow && settingsRow.brand_name) || seed.brandName || '',
          brandSubtitle: (settingsRow && settingsRow.brand_subtitle) || seed.brandSubtitle || '',
          logoIcon: (settingsRow && settingsRow.logo_icon_url) || seed.logoIcon || '',
          logoLockup: (settingsRow && settingsRow.logo_lockup_url) || seed.logoLockup || '',
          rowsPerPage: (settingsRow && settingsRow.rows_per_page) || seed.rowsPerPage || ROWS_PER_PAGE,
          products: productRows.map(productRowToLocal)
        };

        try { localStorage.setItem(DB_KEY, JSON.stringify(loaded)); } catch (e) {}
        return loaded;
      } catch (err) {
        console.warn('Supabase load failed, falling back to local cache:', err);
      }
    }

    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && cached.products && cached.products.length) {
          showToast('Offline — showing the last saved catalog.');
          return cached;
        }
      }
    } catch (e) {
      console.warn('Local cache read failed:', e);
    }

    return null;
  }

  async function saveToStorage(data) {
    try { localStorage.setItem(DB_KEY, JSON.stringify(data)); } catch (e) {}

    if (!supabaseClient) return false;

    try {
      const rows = (data.products || []).map(productLocalToRow);
      if (rows.length) {
        const { error: upsertErr } = await supabaseClient.from('products').upsert(rows, { onConflict: 'id' });
        if (upsertErr) throw upsertErr;
      }

      const keepIds = (data.products || []).map(p => p.id);
      const { data: existingRows, error: listErr } = await supabaseClient.from('products').select('id');
      if (!listErr && existingRows) {
        const toDelete = existingRows.map(r => r.id).filter(id => !keepIds.includes(id));
        if (toDelete.length) {
          await supabaseClient.from('products').delete().in('id', toDelete);
        }
      }
      return true;
    } catch (err) {
      console.error('Supabase save failed (saved locally only):', err);
      showToast('Could not sync to the cloud — changes are saved on this device only.');
      return false;
    }
  }

  let saveDebounceTimer = null;
  function scheduleSave() {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(async () => {
      await saveToStorage(catalog);
    }, 350);
  }

  /* --------------------------------------------------------------------------
     Toast & Undo Notifications
     -------------------------------------------------------------------------- */
  function showToast(msg, undoAction = null, duration = 3800) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast-item';

    const textSpan = document.createElement('span');
    textSpan.innerHTML = msg;
    toast.appendChild(textSpan);

    if (undoAction) {
      const undoBtn = document.createElement('button');
      undoBtn.className = 'btn btn-sm btn-secondary';
      undoBtn.textContent = 'Undo';
      undoBtn.style.padding = '0.15rem 0.5rem';
      undoBtn.style.fontSize = '0.72rem';
      undoBtn.onclick = () => {
        undoAction();
        toast.remove();
      };
      toast.appendChild(undoBtn);
    }

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  /* --------------------------------------------------------------------------
     Filtering & Search & Stock Adjustments
     -------------------------------------------------------------------------- */
  function normalizeSearchString(str) {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .replace(/[×x*]/g, 'x')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getFilteredProducts() {
    let prods = [...catalog.products];

    // Category / Size / Stock filter
    if (currentFilter === '600x1200' || currentFilter === 'black') {
      prods = prods.filter(p => {
        const s = normalizeSearchString(p.size);
        const cat = normalizeSearchString(p.category);
        return s.includes('600x1200') || cat.includes('600x1200') || p.theme === 'black' || p.theme === 'peach';
      });
    } else if (currentFilter === '600x600' || currentFilter === 'blue') {
      prods = prods.filter(p => {
        const s = normalizeSearchString(p.size);
        const cat = normalizeSearchString(p.category);
        return s.includes('600x600') || cat.includes('600x600') || p.theme === 'blue' || p.theme === 'pink';
      });
    } else if (currentFilter === '600x300' || currentFilter === 'green') {
      prods = prods.filter(p => {
        const s = normalizeSearchString(p.size);
        const cat = normalizeSearchString(p.category);
        return s.includes('600x300') || cat.includes('600x300') || p.theme === 'green';
      });
    } else if (currentFilter === 'low-stock') {
      prods = prods.filter(p => p.stock > 0 && p.stock < 20);
    } else if (currentFilter === 'out-of-stock') {
      prods = prods.filter(p => p.stock <= 0);
    }

    // Search query
    if (searchQuery && searchQuery.trim()) {
      const q = normalizeSearchString(searchQuery);
      prods = prods.filter(p => {
        const name = normalizeSearchString(p.name);
        const size = normalizeSearchString(p.size);
        const cat = normalizeSearchString(p.category);
        const desc = normalizeSearchString(p.description);
        const theme = normalizeSearchString(p.theme);
        const stockStr = String(p.stock || 0);
        return name.includes(q) || size.includes(q) || cat.includes(q) || desc.includes(q) || theme.includes(q) || stockStr === q;
      });
    }

    // Sort
    if (currentSort === 'name-asc') {
      prods.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (currentSort === 'name-desc') {
      prods.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (currentSort === 'stock-desc') {
      prods.sort((a, b) => b.stock - a.stock);
    } else if (currentSort === 'stock-asc') {
      prods.sort((a, b) => a.stock - b.stock);
    } else if (currentSort === 'category') {
      const order = { black: 1, peach: 2, blue: 3, pink: 4, green: 5 };
      prods.sort((a, b) => (order[a.theme] || 9) - (order[b.theme] || 9));
    } else if (currentSort === 'size') {
      prods.sort((a, b) => (a.size || '').localeCompare(b.size || ''));
    }

    return prods;
  }

  function updateFilterCounts() {
    if (!catalog || !catalog.products) return;
    const all = catalog.products;

    const countAll = all.length;
    const count600x1200 = all.filter(p => {
      const s = normalizeSearchString(p.size);
      const cat = normalizeSearchString(p.category);
      return s.includes('600x1200') || cat.includes('600x1200') || p.theme === 'black' || p.theme === 'peach';
    }).length;
    const count600x600 = all.filter(p => {
      const s = normalizeSearchString(p.size);
      const cat = normalizeSearchString(p.category);
      return s.includes('600x600') || cat.includes('600x600') || p.theme === 'blue' || p.theme === 'pink';
    }).length;
    const count600x300 = all.filter(p => {
      const s = normalizeSearchString(p.size);
      const cat = normalizeSearchString(p.category);
      return s.includes('600x300') || cat.includes('600x300') || p.theme === 'green';
    }).length;
    const countLow = all.filter(p => p.stock > 0 && p.stock < 20).length;
    const countOut = all.filter(p => p.stock <= 0).length;

    const elAll = document.getElementById('chipCountAll');
    if (elAll) elAll.textContent = countAll;

    const el1200 = document.getElementById('chipCount600x1200');
    if (el1200) el1200.textContent = count600x1200;

    const el600 = document.getElementById('chipCount600x600');
    if (el600) el600.textContent = count600x600;

    const el300 = document.getElementById('chipCount600x300');
    if (el300) el300.textContent = count600x300;

    const elLow = document.getElementById('chipCountLow');
    if (elLow) elLow.textContent = countLow;

    const elOut = document.getElementById('chipCountOut');
    if (elOut) elOut.textContent = countOut;
  }

  function clearSearchAndFilter() {
    searchQuery = '';
    currentFilter = 'all';
    const searchInput = document.getElementById('searchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');
    if (searchInput) {
      searchInput.value = '';
    }
    if (searchClearBtn) {
      searchClearBtn.classList.remove('visible');
    }
    document.querySelectorAll('.filter-chip-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === 'all');
    });
    renderCurrentView();
  }

  function adjustProductStock(productId, delta) {
    const p = catalog.products.find(x => x.id === productId);
    if (!p) return;

    const oldVal = p.stock;
    const newVal = Math.max(0, p.stock + delta);
    if (oldVal === newVal) return;

    p.stock = newVal;
    p.updatedAt = new Date().toISOString();

    historyStack.push({
      type: 'stock',
      productId: p.id,
      tileName: p.name,
      oldVal: oldVal,
      newVal: newVal
    });

    scheduleSave();
    updateHeaderStats();
    updateCardOrRowStockUI(p.id, newVal);

    const deltaStr = delta < 0 ? `${delta} Boxes` : `+${delta} Boxes`;
    showToast(
      `<strong>${p.name}</strong> stock updated: ${deltaStr} (Now <strong>${newVal} Box</strong>)`,
      () => {
        p.stock = oldVal;
        scheduleSave();
        updateHeaderStats();
        updateCardOrRowStockUI(p.id, oldVal);
        showToast(`Reverted stock for <strong>${p.name}</strong> to ${oldVal} Box.`);
      }
    );
  }

  function setDirectStock(productId, value) {
    const p = catalog.products.find(x => x.id === productId);
    if (!p) return;

    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) return;

    const oldVal = p.stock;
    p.stock = parsed;
    p.updatedAt = new Date().toISOString();

    scheduleSave();
    updateHeaderStats();
    updateCardOrRowStockUI(p.id, parsed);
  }

  function updateCardOrRowStockUI(productId, newStock) {
    // Grid Card display number
    const cardStockNum = document.querySelector(`.tile-studio-card[data-id="${productId}"] .stock-display-num`);
    if (cardStockNum) {
      cardStockNum.textContent = newStock;
      cardStockNum.className = 'stock-display-num' + (newStock === 0 ? ' danger' : newStock < 20 ? ' warning' : '');
    }

    // Table Row input
    const tblInput = document.querySelector(`tr[data-id="${productId}"] .stock-num-field`);
    if (tblInput) {
      tblInput.value = newStock;
      tblInput.className = 'stock-num-field' + (newStock === 0 ? ' danger' : newStock < 20 ? ' warning' : '');
    }

    if (currentView === 'pdf') {
      renderPdfPreview();
    }
  }

  /* --------------------------------------------------------------------------
     Rendering Views
     -------------------------------------------------------------------------- */
  // The header stat badges (SKUs / Total Stock / Low Stock) were removed,
  // so this is now a no-op kept only so its existing call sites don't need
  // to change.
  function updateHeaderStats() {}

  function renderCurrentView() {
    updateHeaderStats();
    updateFilterCounts();
    const filtered = getFilteredProducts();

    // Update live results count text in toolbar
    const visibleCountNum = document.getElementById('visibleCountNum');
    const totalCountNum = document.getElementById('totalCountNum');
    const resultsCountEl = document.getElementById('searchResultsCount');

    if (visibleCountNum && totalCountNum) {
      const total = catalog ? (catalog.products || []).length : 0;
      visibleCountNum.textContent = filtered.length;
      totalCountNum.textContent = total;

      if (resultsCountEl) {
        if (searchQuery.trim()) {
          resultsCountEl.innerHTML = `Showing <strong style="color:#fff">${filtered.length}</strong> of ${total} matching <span style="color:var(--cat-blue); font-weight:600;">"${searchQuery.trim()}"</span>`;
        } else if (currentFilter !== 'all') {
          resultsCountEl.innerHTML = `Showing <strong style="color:#fff">${filtered.length}</strong> of ${total} filtered tiles`;
        } else {
          resultsCountEl.innerHTML = `Showing <strong style="color:#fff">${filtered.length}</strong> of ${total} tiles`;
        }
      }
    }

    if (currentView === 'cards') {
      renderCardsGrid(filtered);
    } else if (currentView === 'table') {
      renderInventoryTable(filtered);
    } else if (currentView === 'pdf') {
      renderPdfPreview();
    }
  }

  /* --------------------------------------------------------------------------
     VIEW 1: Tile Grid Cards
     -------------------------------------------------------------------------- */
  function renderCardsGrid(products) {
    const container = document.getElementById('tilesGridContainer');
    container.innerHTML = '';

    if (!products.length) {
      const isSearching = searchQuery.trim().length > 0;
      const isFiltering = currentFilter !== 'all';

      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1rem; color: var(--text-dim);">
          <div style="font-size: 2rem; margin-bottom: 0.75rem; color: var(--text-muted);">${ICONS.search}</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 0.35rem;">
            ${isSearching ? `No tiles matching "${searchQuery.trim()}"` : 'No matching tiles found'}
          </div>
          <p style="font-size: 0.82rem; margin-bottom: 1.25rem; color: var(--text-dim);">
            ${isSearching || isFiltering ? 'Try searching for a different tile name, size (e.g. 600×1200), finish, or clear filters.' : 'There are currently no tiles in this catalog.'}
          </p>
          ${isSearching || isFiltering ? `
            <button id="btnEmptyStateClear" class="btn btn-primary btn-sm" style="margin: 0 auto; gap: 0.45rem;" type="button">
              <svg class="svg-icon sm" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              <span>Clear Search &amp; Filters</span>
            </button>
          ` : ''}
        </div>
      `;

      const emptyClearBtn = document.getElementById('btnEmptyStateClear');
      if (emptyClearBtn) {
        emptyClearBtn.onclick = () => {
          clearSearchAndFilter();
        };
      }
      return;
    }

    products.forEach((p) => {
      const globalIndex = catalog.products.findIndex(x => x.id === p.id) + 1;
      const card = document.createElement('div');
      card.className = 'tile-studio-card';
      card.dataset.id = p.id;

      const coverImg = p.images && p.images[0] ? p.images[0].dataUrl : '';
      const imgCount = p.images ? p.images.length : 0;

      card.innerHTML = `
        <div class="card-category-strip ${p.theme || 'black'}"></div>
        <div class="card-topbar">
          <div class="card-seq-wrap" title="Type a number to move this tile">
            <span class="card-seq-hash">#</span>
            <input type="number" class="card-seq-input" min="1" max="${catalog.products.length}" step="1" inputmode="numeric" value="${globalIndex}">
          </div>
          <div class="card-top-tools">
            <button class="card-tool-btn btn-share-tile" title="Share Tile Product">${ICONS.share}</button>
            <button class="card-tool-btn btn-edit-tile" title="Edit Product Info">${ICONS.edit}</button>
          </div>
        </div>

        <div class="card-preview-stage" title="Click to inspect photo">
          ${coverImg ? `<img src="${coverImg}" alt="${p.name}">` : `<span style="color:var(--text-dim); font-size:0.75rem;">No Photo</span>`}
          ${imgCount > 1 ? `<div class="card-photo-count-pill">${ICONS.camera} ${imgCount}</div>` : ''}
        </div>

        <div class="card-details-section">
          <div class="card-item-title" title="${p.name}">${p.name}</div>
          <div class="card-meta-tags">
            <span class="card-size-pill" title="${p.size}">${p.size}</span>
            <span style="font-size:0.72rem; text-transform:capitalize; color:var(--text-dim);">${p.theme} Series</span>
          </div>

          <div class="card-stock-deck">
            <div class="card-stock-readout">
              <span class="card-stock-label">Current Stock</span>
              <div class="card-stock-value-wrap">
                <span class="stock-display-num ${p.stock === 0 ? 'danger' : p.stock < 20 ? 'warning' : ''}">${p.stock}</span>
                <span class="stock-boxes-label">Boxes</span>
              </div>
            </div>
          </div>

          <div class="card-action-footer">
            <button class="btn btn-sm btn-secondary btn-share-tile" style="font-size:0.75rem; color:#fff; gap:0.35rem;">
              ${ICONS.share} <span>Share</span>
            </button>
            <button class="btn btn-sm btn-secondary btn-delete-tile" style="font-size:0.72rem; color:var(--accent-rose); margin-left:auto;">
              ${ICONS.trash} <span>Delete</span>
            </button>
          </div>
        </div>
      `;

      // Event Listeners
      card.querySelector('.card-preview-stage').onclick = () => openLightbox(p);
      card.querySelector('.btn-edit-tile').onclick = () => openProductEditor(p.id);
      card.querySelector('.btn-delete-tile').onclick = () => deleteProduct(p.id);
      card.querySelectorAll('.btn-share-tile').forEach(b => {
        b.onclick = (e) => {
          e.stopPropagation();
          openShareModal(p.id);
        };
      });

      const seqInput = card.querySelector('.card-seq-input');
      seqInput.addEventListener('click', (e) => e.stopPropagation());
      seqInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') e.target.blur();
      });
      seqInput.addEventListener('change', (e) => {
        const total = catalog.products.length;
        let newPos = parseInt(e.target.value, 10);
        if (!newPos || isNaN(newPos)) newPos = globalIndex;
        newPos = Math.max(1, Math.min(total, newPos));

        const fromIndex = catalog.products.findIndex(x => x.id === p.id);
        if (fromIndex === -1) return;

        const [movedItem] = catalog.products.splice(fromIndex, 1);
        catalog.products.splice(newPos - 1, 0, movedItem);

        scheduleSave();
        renderCurrentView();
        showToast(`Moved "${p.name}" to position ${newPos}.`);
      });

      container.appendChild(card);
    });
  }

  /* --------------------------------------------------------------------------
     VIEW 2: Inventory Data Table
     -------------------------------------------------------------------------- */
  function renderInventoryTable(products) {
    const tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = '';

    if (!products.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:3rem; color:var(--text-dim);">No items found.</td></tr>`;
      return;
    }

    products.forEach((p) => {
      const globalIndex = catalog.products.findIndex(x => x.id === p.id) + 1;
      const tr = document.createElement('tr');
      tr.dataset.id = p.id;
      const coverImg = p.images && p.images[0] ? p.images[0].dataUrl : '';
      const stockStatusClass = p.stock === 0 ? 'danger' : p.stock < 20 ? 'warning' : '';

      tr.innerHTML = `
        <td style="text-align:center; font-family:var(--font-mono); font-weight:700; color:var(--text-dim);">#${globalIndex}</td>
        <td>
          <div class="tbl-tile-preview" title="View photo">
            ${coverImg ? `<img src="${coverImg}" alt="${p.name}">` : `<span style="font-size:0.6rem; color:var(--text-dim);">No img</span>`}
          </div>
        </td>
        <td>
          <div style="font-weight:600; color:#ffffff;">${p.name}</div>
          <div style="font-size:0.72rem; color:var(--text-dim);">${p.images ? p.images.length : 0} photos attached</div>
        </td>
        <td>
          <span style="display:inline-flex; align-items:center; gap:0.35rem; font-size:0.78rem;">
            <span class="filter-color-dot ${p.theme || 'black'}"></span>
            <span style="text-transform:capitalize;">${p.theme || 'black'}</span>
          </span>
        </td>
        <td style="font-family:var(--font-mono); font-size:0.78rem;">${p.size}</td>
        <td>
          <div class="tbl-stepper-cell">
            <button class="step-btn dec" data-delta="-10" style="padding:0.15rem 0.35rem;">-10</button>
            <button class="step-btn dec" data-delta="-1" style="padding:0.15rem 0.35rem;">-1</button>
            <input type="number" class="stock-num-field ${stockStatusClass}" value="${p.stock}" min="0" step="1" style="width:65px;">
            <span style="font-size:0.72rem; color:var(--text-dim); margin-right:0.2rem;">Boxes</span>
            <button class="step-btn inc" data-delta="1" style="padding:0.15rem 0.35rem;">+1</button>
            <button class="step-btn inc" data-delta="10" style="padding:0.15rem 0.35rem;">+10</button>
          </div>
        </td>
        <td style="text-align:right;">
          <button class="card-tool-btn btn-share-tile" title="Share Tile">${ICONS.share}</button>
          <button class="card-tool-btn btn-edit-tile" title="Edit">${ICONS.edit}</button>
          <button class="card-tool-btn btn-delete-tile" style="color:var(--accent-rose);" title="Delete">${ICONS.trash}</button>
        </td>
      `;

      tr.querySelector('.tbl-tile-preview').onclick = () => openLightbox(p);
      tr.querySelector('.btn-share-tile').onclick = () => openShareModal(p.id);
      tr.querySelector('.btn-edit-tile').onclick = () => openProductEditor(p.id);
      tr.querySelector('.btn-delete-tile').onclick = () => deleteProduct(p.id);

      const stockInput = tr.querySelector('.stock-num-field');
      stockInput.onchange = (e) => setDirectStock(p.id, e.target.value);

      const stepBtns = tr.querySelectorAll('.step-btn');
      stepBtns.forEach(btn => {
        btn.onclick = () => {
          const delta = parseInt(btn.dataset.delta, 10);
          adjustProductStock(p.id, delta);
        };
      });

      tbody.appendChild(tr);
    });
  }

  /* --------------------------------------------------------------------------
     VIEW 3: Exact PDF Catalog Sheet Generator
     -------------------------------------------------------------------------- */
  function chunkArray(arr, size) {
    const res = [];
    for (let i = 0; i < arr.length; i += size) {
      res.push(arr.slice(i, i + size));
    }
    return res;
  }

  function buildSinglePdfSheet(pageProducts, pageNumber, totalPages, startIndex) {
    const sheet = document.createElement('div');
    sheet.className = 'pdf-sheet';

    const logoSrc = catalog.logoIcon || '';
    const nowTimeStr = formatDateTime();

    const rowsHtml = pageProducts.map((p, i) => {
      const globalIdx = startIndex + i + 1;
      const themeClass = 'theme-' + (p.theme || 'black');
      const images = p.images || [];

      // Photos layout in PDF: Fixed, predictable, and even grid layout for 1, 2, 3, 4, 5, 6+ photos
      let photoInnerHtml = '';
      if (images.length === 0) {
        photoInnerHtml = `<div class="pdf-photo-empty">No Photo</div>`;
      } else {
        const count = images.length;
        const gridClass = count === 1 ? 'count-1' : count === 2 ? 'count-2' : count === 3 ? 'count-3' : count === 4 ? 'count-4' : count === 5 ? 'count-5' : 'count-6';
        const MAX_PDF_SHOWN = 6;
        const shown = images.slice(0, MAX_PDF_SHOWN);
        const extraCount = images.length - shown.length;
        photoInnerHtml = `<div class="pdf-photo-grid ${gridClass}">` +
          shown.map((im, idx) => {
            const isLast = idx === shown.length - 1;
            const badge = (isLast && extraCount > 0)
              ? `<span class="pdf-photo-more-badge">+${extraCount}</span>`
              : '';
            return `<div class="pdf-photo-tile"><img src="${im.dataUrl}" alt="${p.name}" loading="eager" crossorigin="anonymous">${badge}</div>`;
          }).join('') +
          `</div>`;
      }

      return `
        <div class="pdf-trow ${themeClass}">
          <div class="pdf-td td-index">${globalIdx}</div>
          <div class="pdf-td td-name">${p.name || ''}</div>
          <div class="pdf-td td-stock">${p.stock} Box</div>
          <div class="pdf-td td-size">${p.size || ''}</div>
          <div class="pdf-td td-photo">
            <div class="pdf-photo-box">
              ${photoInnerHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    sheet.innerHTML = `
      <div class="sheet-top-accent"></div>
      <div class="pdf-sheet-header">
        <div class="pdf-brand-left">
          ${logoSrc ? `<img class="pdf-logo-icon" src="${logoSrc}" alt="Aqiq" loading="eager" crossorigin="anonymous">` : ''}
          <div class="pdf-brand-titles">
            <span class="pdf-brand-name">Aqiq</span>
            <span class="pdf-brand-sub">Aqiq</span>
            <span class="pdf-gen-meta">Generated: ${nowTimeStr}</span>
          </div>
        </div>
        <div class="pdf-brand-right">AQIQ (MBM) TILES</div>
      </div>

      <div class="pdf-table">
        <div class="pdf-thead">
          <div class="pdf-th center">#</div>
          <div class="pdf-th">Item name</div>
          <div class="pdf-th">Box calicut</div>
          <div class="pdf-th">Size</div>
          <div class="pdf-th">Photo</div>
        </div>
        <div class="pdf-tbody">
          ${rowsHtml}
        </div>
      </div>

      <div class="pdf-sheet-footer">
        Page ${pageNumber} of ${totalPages}
      </div>
    `;

    return sheet;
  }

  function renderPdfPreview() {
    const feed = document.getElementById('pdfPagesFeed');
    feed.innerHTML = '';

    const prods = getFilteredProducts();
    const pages = chunkArray(prods, ROWS_PER_PAGE);

    document.getElementById('pdfPageCountBadge').textContent = `${pages.length} Pages (${prods.length} items · 5 items/page)`;

    pages.forEach((pageGroup, idx) => {
      const sheet = buildSinglePdfSheet(pageGroup, idx + 1, pages.length, idx * ROWS_PER_PAGE);
      feed.appendChild(sheet);
    });
  }

  /* --------------------------------------------------------------------------
     PDF Export & Print Engines (High-Speed & Non-Blocking)
     -------------------------------------------------------------------------- */
  async function exportPdfDownload() {
    if (!window.jspdf || !window.html2canvas) {
      showToast('PDF generator is initializing, please retry in a moment...');
      return;
    }

    const prods = getFilteredProducts();
    if (!prods.length) {
      showToast('No products to export in current filter.');
      return;
    }

    const exportBtn = document.getElementById('btnDownloadPdf');
    const previewExportBtn = document.getElementById('btnPdfPreviewDownload');
    const originalText = exportBtn ? exportBtn.innerHTML : '';
    const origPreviewText = previewExportBtn ? previewExportBtn.innerHTML : '';

    if (exportBtn) {
      exportBtn.disabled = true;
      exportBtn.innerHTML = `<svg class="svg-icon spin" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> <span>Exporting PDF...</span>`;
    }
    if (previewExportBtn) {
      previewExportBtn.disabled = true;
      previewExportBtn.innerHTML = `<svg class="svg-icon spin" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> <span>Exporting...</span>`;
    }

    // Show Progress Modal
    const progressModal = document.getElementById('pdfExportProgressModal');
    const statusText = document.getElementById('pdfExportStatusText');
    const progressBar = document.getElementById('pdfExportProgressBar');
    const pagesCount = document.getElementById('pdfExportPagesCount');
    const percentText = document.getElementById('pdfExportPercent');

    if (progressModal) {
      progressModal.classList.add('open');
      if (progressBar) progressBar.style.width = '0%';
      if (percentText) percentText.textContent = '0%';
      if (statusText) statusText.textContent = 'Initializing PDF engine...';
    }

    // Dedicated off-screen fixed-width rendering stage (avoids DOM measurement locks)
    let renderStage = document.getElementById('pdfRenderStage');
    if (!renderStage) {
      renderStage = document.createElement('div');
      renderStage.id = 'pdfRenderStage';
      renderStage.style.cssText = 'position:fixed; left:-9999px; top:0; width:800px; z-index:-999; opacity:1; pointer-events:none; background:#ffffff;';
      document.body.appendChild(renderStage);
    }
    renderStage.innerHTML = '';

    try {
      const { jsPDF } = window.jspdf;
      // High-resolution A4 (210mm x 297mm)
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
      const pages = chunkArray(prods, ROWS_PER_PAGE);

      for (let i = 0; i < pages.length; i++) {
        const pageNum = i + 1;
        const total = pages.length;
        const pct = Math.round((i / total) * 100);

        if (statusText) statusText.textContent = `Rendering page ${pageNum} of ${total}...`;
        if (pagesCount) pagesCount.textContent = `Page ${pageNum} of ${total} (${pages[i].length} tiles)`;
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (percentText) percentText.textContent = `${pct}%`;

        // Render sheet into stage
        renderStage.innerHTML = '';
        const sheet = buildSinglePdfSheet(pages[i], pageNum, total, i * ROWS_PER_PAGE);
        renderStage.appendChild(sheet);

        // Preload & decode images with safe fallback timeout
        const imgs = [...sheet.querySelectorAll('img')];
        await Promise.all(imgs.map(im => {
          if (!im.src) return Promise.resolve();
          if (im.complete && im.naturalWidth > 0) return Promise.resolve();
          return new Promise(res => {
            const tm = setTimeout(res, 800);
            im.onload = () => { clearTimeout(tm); res(); };
            im.onerror = () => { clearTimeout(tm); res(); };
          });
        }));

        // Yield execution to browser for responsive UI rendering
        await new Promise(r => setTimeout(r, 20));

        // High-Quality rasterization (Scale 2.0 provides ~200-300 DPI print quality without memory spikes)
        const canvas = await html2canvas(sheet, {
          scale: 2.0,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 800
        });

        // Convert to high-grade JPEG and append with FAST compression
        const imgData = canvas.toDataURL('image/jpeg', 0.94);
        if (i > 0) pdf.addPage('a4', 'portrait');
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

        // Free memory immediately
        renderStage.innerHTML = '';
        canvas.width = 1;
        canvas.height = 1;

        // Micro-yield between pages for garbage collection
        await new Promise(r => setTimeout(r, 15));
      }

      if (progressBar) progressBar.style.width = '100%';
      if (percentText) percentText.textContent = '100%';
      if (statusText) statusText.textContent = 'Saving PDF document...';
      await new Promise(r => setTimeout(r, 150));

      const filename = `AQIQ-MBM-Tiles-Catalog-${formatDateOnly()}.pdf`;
      pdf.save(filename);
      showToast(`<strong>${filename}</strong> downloaded successfully.`);
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Export encountered an issue. You can also use "Instant Print / Save".');
    } finally {
      if (progressModal) progressModal.classList.remove('open');
      if (renderStage) {
        renderStage.innerHTML = '';
      }
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.innerHTML = originalText;
      }
      if (previewExportBtn) {
        previewExportBtn.disabled = false;
        previewExportBtn.innerHTML = origPreviewText;
      }
    }
  }

  function triggerNativePrint() {
    const prods = getFilteredProducts();
    const pages = chunkArray(prods, ROWS_PER_PAGE);
    const printRoot = document.getElementById('printRoot');
    if (!printRoot) return;
    printRoot.innerHTML = '';

    pages.forEach((pageGroup, idx) => {
      const sheet = buildSinglePdfSheet(pageGroup, idx + 1, pages.length, idx * ROWS_PER_PAGE);
      printRoot.appendChild(sheet);
    });

    window.print();
  }

  /* --------------------------------------------------------------------------
     Product Editor Modal
     -------------------------------------------------------------------------- */
  function openProductEditor(id = null) {
    editingProductId = id;
    const isNew = !id;
    const modal = document.getElementById('productModal');
    const titleEl = document.getElementById('modalProductTitle');
    const deleteBtn = document.getElementById('btnDeleteProduct');

    titleEl.textContent = isNew ? 'Add New Tile' : 'Edit Product Details';
    deleteBtn.style.display = isNew ? 'none' : 'block';

    if (isNew) {
      document.getElementById('editProductId').value = '';
      document.getElementById('editName').value = '';
      document.getElementById('editStock').value = 100;
      document.getElementById('editSize').value = '600×1200';
      document.getElementById('editCategory').value = '600×1200 Glossy';
      draftImages = [];
    } else {
      const p = catalog.products.find(x => x.id === id);
      if (!p) return;
      document.getElementById('editProductId').value = p.id;
      document.getElementById('editName').value = p.name || '';
      document.getElementById('editStock').value = p.stock || 0;
      document.getElementById('editSize').value = p.size || '600×1200';
      document.getElementById('editCategory').value = p.category || inferProductCategory(p.name, p.size);
      draftImages = JSON.parse(JSON.stringify(p.images || []));
    }

    renderDraftImages();
    modal.classList.add('open');
  }

  function closeProductEditor() {
    document.getElementById('productModal').classList.remove('open');
    editingProductId = null;
    draftImages = [];
  }

  function inferProductCategory(name, size) {
    const fullText = `${name || ''} ${size || ''}`.toLowerCase();

    // 600x300 Cladding Elevation
    if (fullText.includes('600x300') || fullText.includes('600×300') || fullText.includes('cladding') || fullText.includes('clading') || fullText.includes('stone') || fullText.includes('brick')) {
      return '600×300 Cladding Elevation';
    }

    // 600x600 Blue Art / Full Body
    if (fullText.includes('blue art') || fullText.includes('blueart') || (fullText.includes('600x600') && fullText.includes('fullbody'))) {
      if (fullText.includes('glossy')) return '600×600 Full Body (Glossy)';
      if (fullText.includes('rustic') || fullText.includes('blast') || fullText.includes('punch')) return '600×600 Full Body (Rustic)';
      if (fullText.includes('matt') || fullText.includes('mat')) return '600×600 Full Body (Matt)';
      return '600×600 Full Body';
    }

    // 600x600 Tag & Waterproof
    if (fullText.includes('600x600') || fullText.includes('600×600')) {
      if (fullText.includes('tag')) return '600×600 Tag Series';
      if (fullText.includes('matt') || fullText.includes('mat') || fullText.includes('waterproof')) return '600×600 Matt Waterproof';
      return '600×600 Standard';
    }

    // 600x1200 Full Body
    if (fullText.includes('full body') || fullText.includes('fullbody')) {
      if (fullText.includes('glossy')) return '600×1200 Full Body (Glossy)';
      if (fullText.includes('matt') || fullText.includes('mat')) return '600×1200 Full Body (Matt)';
      return '600×1200 Full Body';
    }

    // 600x1200 Carving
    if (fullText.includes('carving') || fullText.includes('decor')) {
      return '600×1200 Carving';
    }

    // 600x1200 Glossy (explicit)
    if (name.toLowerCase().includes('(glossy)') || name.toLowerCase().includes('glossy')) {
      return '600×1200 Glossy';
    }

    // 600x1200 Diamond Matt
    if (fullText.includes('diamond') || fullText.includes(' dm') || fullText.includes('dm')) {
      return '600×1200 Diamond Matt';
    }

    // 600x1200 Matt
    if (fullText.includes('matt') || fullText.includes('mat') || fullText.includes('onetime matt')) {
      return '600×1200 Matt';
    }

    // 600x1200 Glossy
    return '600×1200 Glossy';
  }

  // PDF row color is no longer a manual choice - it's worked out from the
  // category/size text, matching the same 5 groups the old swatch picker offered.
  function inferProductTheme(category, size) {
    const text = `${category || ''} ${size || ''}`.toLowerCase();
    if (text.includes('blue art') || text.includes('blueart') || text.includes('600×600 full body') || text.includes('600x600 full body')) return 'pink';
    if (text.includes('cladding') || text.includes('clading') || text.includes('elevation')) return 'green';
    if (text.includes('tag') || text.includes('waterproof') || text.includes('600×600 tag') || text.includes('600×600 matt')) return 'blue';
    if (text.includes('full body') || text.includes('fullbody')) return 'peach';
    return 'black';
  }

  function renderDraftImages() {
    const grid = document.getElementById('draftImagesGrid');
    grid.innerHTML = '';

    const dropzone = document.getElementById('imageDropzone');
    if (dropzone) {
      dropzone.style.display = ''; // Keep dropzone always visible so users can add unlimited photos
    }

    draftImages.forEach((img, idx) => {
      const card = document.createElement('div');
      card.className = 'draft-thumb-card' + (idx === 0 ? ' is-cover' : '');
      card.innerHTML = `
        <img src="${img.dataUrl}" alt="${img.name || 'Tile Image'}">
        ${idx === 0 ? `<div style="position:absolute; top:3px; left:3px; background:var(--accent-amber-light); color:#000; font-size:0.6rem; font-weight:700; padding:1px 3px; border-radius:2px;">COVER</div>` : ''}
        <div class="draft-thumb-actions">
          ${idx > 0 ? `<button class="btn-thumb-action btn-set-cover" title="Set as Cover">${ICONS.star}</button>` : ''}
          ${idx > 0 ? `<button class="btn-thumb-action btn-move-left" title="Move Left">${ICONS.arrowLeft}</button>` : ''}
          ${idx < draftImages.length - 1 ? `<button class="btn-thumb-action btn-move-right" title="Move Right">${ICONS.arrowRight}</button>` : ''}
          <button class="btn-thumb-action btn-del-img" style="color:var(--accent-rose);" title="Delete">${ICONS.trash}</button>
        </div>
      `;

      const setCoverBtn = card.querySelector('.btn-set-cover');
      if (setCoverBtn) {
        setCoverBtn.onclick = () => {
          const item = draftImages.splice(idx, 1)[0];
          draftImages.unshift(item);
          renderDraftImages();
        };
      }

      const moveLeftBtn = card.querySelector('.btn-move-left');
      if (moveLeftBtn) {
        moveLeftBtn.onclick = () => {
          const item = draftImages.splice(idx, 1)[0];
          draftImages.splice(idx - 1, 0, item);
          renderDraftImages();
        };
      }

      const moveRightBtn = card.querySelector('.btn-move-right');
      if (moveRightBtn) {
        moveRightBtn.onclick = () => {
          const item = draftImages.splice(idx, 1)[0];
          draftImages.splice(idx + 1, 0, item);
          renderDraftImages();
        };
      }

      const delBtn = card.querySelector('.btn-del-img');
      delBtn.onclick = () => {
        draftImages.splice(idx, 1);
        renderDraftImages();
      };

      grid.appendChild(card);
    });
  }

  function resizeImageFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Ultra-high resolution preservation (up to 2560px for crystal-clear PDF & print)
          const maxDim = 2560;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Preserve transparency for PNGs, otherwise 0.96 high-quality JPEG
          if (file.type === 'image/png') {
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(canvas.toDataURL('image/jpeg', 0.96));
          }
        };
        img.onerror = () => {
          resolve(e.target.result);
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(file);
    });
  }

  async function uploadImageToCloudinary(dataUrl, filename) {
    if (!CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET.indexOf('REPLACE_WITH') === 0) {
      throw new Error('Cloudinary upload preset is not configured yet.');
    }
    const formData = new FormData();
    formData.append('file', dataUrl);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'mbm-tiles/products');

    const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error('Cloudinary upload failed: ' + errText);
    }
    const json = await resp.json();
    return json.secure_url;
  }

  // Upload unlimited photos per tile
  async function handleFilesUpload(files) {
    const imgFiles = [...files].filter(f => f.type.startsWith('image/'));
    if (!imgFiles.length) return;

    showToast(`Uploading ${imgFiles.length} photo(s)...`);

    for (const f of imgFiles) {
      try {
        const resizedDataUrl = await resizeImageFile(f);
        const hostedUrl = await uploadImageToCloudinary(resizedDataUrl, f.name);
        draftImages.push({
          id: uid('img_'),
          name: f.name,
          dataUrl: hostedUrl
        });
        renderDraftImages();
      } catch (err) {
        console.error('Photo upload failed:', err);
        showToast('Could not upload photo — check the Cloudinary setup in app.js.');
      }
    }
  }

  function saveProductFromEditor() {
    const name = document.getElementById('editName').value.trim();
    if (!name) {
      alert('Please enter an Item Name.');
      return;
    }

    const stock = parseInt(document.getElementById('editStock').value, 10) || 0;
    const size = document.getElementById('editSize').value.trim() || '600×1200';
    let category = document.getElementById('editCategory').value.trim();
    if (!category) {
      category = inferProductCategory(name, size);
    }
    const theme = inferProductTheme(category, size);
    const pdfMode = 'auto';

    if (editingProductId) {
      const p = catalog.products.find(x => x.id === editingProductId);
      if (p) {
        p.name = name;
        p.stock = stock;
        p.size = size;
        p.category = category;
        p.theme = theme;
        p.pdfImageMode = pdfMode;
        p.images = draftImages;
        p.updatedAt = new Date().toISOString();
      }
    } else {
      const newProduct = {
        id: uid('p_'),
        name: name,
        stock: stock,
        unit: 'Box',
        size: size,
        category: category,
        theme: theme,
        pdfImageMode: pdfMode,
        images: draftImages,
        updatedAt: new Date().toISOString()
      };
      catalog.products.unshift(newProduct);
    }

    scheduleSave();
    closeProductEditor();
    renderCurrentView();
    showToast(`Saved <strong>${name}</strong> successfully.`);
  }

  function duplicateProduct(id) {
    const p = catalog.products.find(x => x.id === id);
    if (!p) return;

    const copy = JSON.parse(JSON.stringify(p));
    copy.id = uid('p_');
    copy.name = p.name + ' (Copy)';
    copy.updatedAt = new Date().toISOString();

    const idx = catalog.products.findIndex(x => x.id === id);
    catalog.products.splice(idx + 1, 0, copy);

    scheduleSave();
    renderCurrentView();
    showToast(`Duplicated <strong>${copy.name}</strong>.`);
  }

  function deleteProduct(id) {
    const idx = catalog.products.findIndex(x => x.id === id);
    if (idx === -1) return;

    const removed = catalog.products.splice(idx, 1)[0];
    scheduleSave();
    if (editingProductId === id) closeProductEditor();
    renderCurrentView();

    showToast(
      `Deleted <strong>${removed.name}</strong>.`,
      () => {
        catalog.products.splice(idx, 0, removed);
        scheduleSave();
        renderCurrentView();
        showToast(`Restored <strong>${removed.name}</strong>.`);
      }
    );
  }

  /* --------------------------------------------------------------------------
     Lightbox Photo Viewer
     -------------------------------------------------------------------------- */
  let activeLightboxProduct = null;
  let activeLightboxImgIndex = 0;

  function openLightbox(product) {
    activeLightboxProduct = product;
    activeLightboxImgIndex = 0;
    const modal = document.getElementById('lightboxModal');
    const mainImg = document.getElementById('lightboxImg');
    const caption = document.getElementById('lightboxCaption');
    const thumbs = document.getElementById('lightboxThumbs');

    const images = product.images || [];
    if (!images.length) return;

    mainImg.src = images[0].dataUrl;
    caption.textContent = `${product.name} — ${product.size} (${product.stock} Box)`;
    thumbs.innerHTML = '';

    images.forEach((im, idx) => {
      const t = document.createElement('img');
      t.src = im.dataUrl;
      t.style.width = '44px';
      t.style.height = '44px';
      t.style.objectFit = 'contain';
      t.style.background = '#fff';
      t.style.borderRadius = '3px';
      t.style.cursor = 'pointer';
      t.style.border = idx === 0 ? '2px solid var(--accent-amber-light)' : '2px solid transparent';

      t.onclick = () => {
        activeLightboxImgIndex = idx;
        mainImg.src = im.dataUrl;
        [...thumbs.children].forEach(c => c.style.border = '2px solid transparent');
        t.style.border = '2px solid var(--accent-amber-light)';
      };

      thumbs.appendChild(t);
    });

    modal.classList.add('open');
  }

  function closeLightbox() {
    document.getElementById('lightboxModal').classList.remove('open');
    activeLightboxProduct = null;
  }

  /* --------------------------------------------------------------------------
     Product Sharing System
     -------------------------------------------------------------------------- */
  let activeShareProduct = null;
  let activeSharePhotoIndex = 0;

  function sanitizeFilename(name) {
    return (name || 'tile').replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  function loadImageAsync(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      if (!src.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (img.crossOrigin) {
          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.onerror = () => resolve(null);
          fallbackImg.src = src;
        } else {
          resolve(null);
        }
      };
      img.src = src;
    });
  }

  async function generateShareCardBlob(product, photoIndex = 0) {
    const canvas = document.createElement('canvas');
    // Ultra-HD 2x Retina Resolution (1600x1920) for razor sharp clarity on all screens & WhatsApp
    const W = 1600;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Background
    ctx.fillStyle = '#090c14';
    ctx.fillRect(0, 0, W, H);

    // Subtle header gradient
    const grad = ctx.createLinearGradient(0, 0, W, 200);
    grad.addColorStop(0, '#0f131f');
    grad.addColorStop(1, '#182035');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 180);

    // Accent line
    ctx.fillStyle = '#3b4998';
    ctx.fillRect(0, 176, W, 4);

    // 2. Brand Header
    const logoSrc = catalog.logoIcon || '';
    let textLeft = 60;
    if (logoSrc) {
      const logoImg = await loadImageAsync(logoSrc);
      if (logoImg) {
        ctx.fillStyle = '#ffffff';
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(48, 36, 240, 108, 12);
          ctx.fill();
        } else {
          ctx.fillRect(48, 36, 240, 108);
        }
        ctx.drawImage(logoImg, 56, 44, 224, 92);
        textLeft = 320;
      }
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.fillText('AQIQ (MBM) TILES', textLeft, 88);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 28px "Inter", -apple-system, sans-serif';
    ctx.fillText('Tile Catalog & Inventory', textLeft, 134);

    // Category / Size Pill top right
    const pillText = product.size || '600×1200';
    ctx.font = 'bold 28px "JetBrains Mono", monospace';
    const pillW = ctx.measureText(pillText).width + 48;
    ctx.fillStyle = '#20293f';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(W - 48 - pillW, 52, pillW, 72, 36);
      ctx.fill();
    } else {
      ctx.fillRect(W - 48 - pillW, 52, pillW, 72);
    }
    ctx.strokeStyle = '#3b4968';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#7dc3fc';
    ctx.fillText(pillText, W - 48 - pillW + 24, 98);

    // 3. Tile Photo Stage
    const stageX = 48;
    const stageY = 220;
    const stageW = W - 96;
    const stageH = 1180;

    ctx.fillStyle = '#ffffff';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(stageX, stageY, stageW, stageH, 24);
      ctx.fill();
    } else {
      ctx.fillRect(stageX, stageY, stageW, stageH);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const currentImgUrl = (product.images && product.images[photoIndex])
      ? product.images[photoIndex].dataUrl
      : (product.images && product.images[0] ? product.images[0].dataUrl : '');

    if (currentImgUrl) {
      const tileImg = await loadImageAsync(currentImgUrl);
      if (tileImg) {
        const padding = 48;
        const maxImgW = stageW - padding * 2;
        const maxImgH = stageH - padding * 2;
        let drawW = tileImg.naturalWidth || tileImg.width;
        let drawH = tileImg.naturalHeight || tileImg.height;

        const scale = Math.min(maxImgW / drawW, maxImgH / drawH);
        drawW *= scale;
        drawH *= scale;

        const imgX = stageX + (stageW - drawW) / 2;
        const imgY = stageY + (stageH - drawH) / 2;
        ctx.drawImage(tileImg, imgX, imgY, drawW, drawH);
      }
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = '32px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No Image Available', W / 2, stageY + stageH / 2);
      ctx.textAlign = 'left';
    }

    // 4. Product Details Deck
    const deckY = 1440;
    const deckH = 320;
    ctx.fillStyle = '#131826';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(stageX, deckY, stageW, deckH, 24);
      ctx.fill();
    } else {
      ctx.fillRect(stageX, deckY, stageW, deckH);
    }
    ctx.strokeStyle = '#26314c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Product Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(product.name || 'Untitled Tile', stageX + 40, deckY + 80);

    // Meta row badges (Size & Category)
    const metaY = deckY + 140;
    const badgeW = (stageW - 100) / 2;
    const badgeH = 104;
    
    // Size badge
    ctx.fillStyle = '#0c0f18';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(stageX + 40, metaY, badgeW, badgeH, 16);
      ctx.fill();
    } else {
      ctx.fillRect(stageX + 40, metaY, badgeW, badgeH);
    }
    ctx.fillStyle = '#64748b';
    ctx.font = '600 22px "Inter", sans-serif';
    ctx.fillText('SIZE SPECIFICATION', stageX + 68, metaY + 40);
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 32px "JetBrains Mono", monospace';
    ctx.fillText(product.size || '-', stageX + 68, metaY + 82);

    // Category / Series badge
    const catName = product.category || `${(product.theme || 'Standard')} Series`;
    const catX = stageX + 60 + badgeW;
    ctx.fillStyle = '#0c0f18';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(catX, metaY, badgeW, badgeH, 16);
      ctx.fill();
    } else {
      ctx.fillRect(catX, metaY, badgeW, 52);
    }
    ctx.fillStyle = '#64748b';
    ctx.font = '600 22px "Inter", sans-serif';
    ctx.fillText('CATEGORY / SERIES', catX + 28, metaY + 40);
    ctx.fillStyle = '#7dc3fc';
    ctx.font = 'bold 30px "Inter", sans-serif';
    ctx.fillText(catName.length > 25 ? catName.substring(0, 23) + '...' : catName, catX + 28, metaY + 82);

    // 5. Footer Branding
    ctx.fillStyle = '#64748b';
    ctx.font = '600 24px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AQIQ (MBM) TILES · Professional Catalog Studio', W / 2, H - 50);
    ctx.textAlign = 'left';

    // Maximum JPEG Quality (0.98) for supreme crispness
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.98);
    });
  }

  function openShareModal(productId, photoIndex = 0) {
    const p = catalog.products.find(x => x.id === productId);
    if (!p) return;

    activeShareProduct = p;
    activeSharePhotoIndex = photoIndex;

    const modal = document.getElementById('shareModal');
    const titleEl = document.getElementById('shareModalTitle');
    const cardLogo = document.getElementById('shareCardLogo');
    const cardCategoryPill = document.getElementById('shareCardCategoryPill');
    const cardImg = document.getElementById('shareCardImg');
    const cardName = document.getElementById('shareCardName');
    const cardSize = document.getElementById('shareCardSize');
    const photoSelectorRow = document.getElementById('sharePhotoSelectorRow');
    const photoThumbs = document.getElementById('sharePhotoThumbs');

    titleEl.textContent = `Share: ${p.name}`;
    cardName.textContent = p.name;
    cardSize.textContent = p.size;
    const catTextEl = document.getElementById('shareCardCategoryText');
    if (catTextEl) {
      catTextEl.textContent = p.category || (p.theme ? (p.theme.charAt(0).toUpperCase() + p.theme.slice(1) + ' Series') : 'Standard');
    }
    cardCategoryPill.textContent = p.size || p.category || 'Standard';

    if (catalog.logoIcon) {
      cardLogo.src = catalog.logoIcon;
      cardLogo.style.display = 'block';
    } else {
      cardLogo.style.display = 'none';
    }

    const images = p.images || [];
    const currentImg = images[photoIndex] ? images[photoIndex].dataUrl : (images[0] ? images[0].dataUrl : '');
    cardImg.src = currentImg;

    if (images.length > 1) {
      photoSelectorRow.style.display = 'block';
      photoThumbs.innerHTML = '';
      images.forEach((img, idx) => {
        const thumb = document.createElement('img');
        thumb.className = 'share-photo-thumb' + (idx === photoIndex ? ' active' : '');
        thumb.src = img.dataUrl;
        thumb.onclick = () => {
          activeSharePhotoIndex = idx;
          cardImg.src = img.dataUrl;
          photoThumbs.querySelectorAll('.share-photo-thumb').forEach((t, i) => {
            t.classList.toggle('active', i === idx);
          });
        };
        photoThumbs.appendChild(thumb);
      });
    } else {
      photoSelectorRow.style.display = 'none';
    }

    modal.classList.add('open');
  }

  function closeShareModal() {
    document.getElementById('shareModal').classList.remove('open');
    activeShareProduct = null;
  }

  async function shareProductNativeAction() {
    if (!activeShareProduct) return;
    const p = activeShareProduct;
    const photoIdx = activeSharePhotoIndex;

    const btn = document.getElementById('btnNativeShare');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `${ICONS.loader} <span>Preparing HD Share...</span>`;

    try {
      const cardBlob = await generateShareCardBlob(p, photoIdx);
      const filename = `AQIQ-${sanitizeFilename(p.name)}.jpg`;
      const file = new File([cardBlob], filename, { type: 'image/jpeg' });
      const categoryName = p.category || (p.theme ? (p.theme.charAt(0).toUpperCase() + p.theme.slice(1) + ' Series') : 'Standard');
      const shareText = `*AQIQ (MBM) TILES*\nItem: ${p.name}\nSize: ${p.size}\nCategory: ${categoryName}`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `AQIQ TILES - ${p.name}`,
          text: shareText,
          files: [file]
        });
        showToast('Shared in Ultra-HD successfully!');
      } else if (navigator.share) {
        await navigator.share({
          title: `AQIQ TILES - ${p.name}`,
          text: shareText,
          url: window.location.href
        });
        showToast('Product shared!');
      } else {
        shareProductWhatsAppAction();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Share error, falling back:', err);
        shareProductWhatsAppAction();
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  async function shareProductWhatsAppAction() {
    if (!activeShareProduct) return;
    const p = activeShareProduct;
    const photoIdx = activeSharePhotoIndex;

    const categoryName = p.category || (p.theme ? (p.theme.charAt(0).toUpperCase() + p.theme.slice(1) + ' Series') : 'Standard');

    // Check if the primary image is a web URL (e.g. Cloudinary)
    const currentImgUrl = (p.images && p.images[photoIdx])
      ? p.images[photoIdx].dataUrl
      : (p.images && p.images[0] ? p.images[0].dataUrl : '');
    const isCloudUrl = currentImgUrl && (currentImgUrl.startsWith('http://') || currentImgUrl.startsWith('https://'));

    const msgLines = [
      `*AQIQ (MBM) TILES*`,
      `━━━━━━━━━━━━━━━━━━`,
      `📦 *Item Name:* ${p.name}`,
      `📐 *Size:* ${p.size}`,
      `🏷️ *Category:* ${categoryName}`,
      `━━━━━━━━━━━━━━━━━━`
    ];

    if (isCloudUrl) {
      msgLines.push(`🖼️ *Photo:* ${currentImgUrl}`);
    }

    const appUrl = window.location.origin.includes('localhost') ? 'https://mb-m-tiles.vercel.app' : window.location.origin;
    msgLines.push(`🔗 *Catalog:* ${appUrl}`);

    const msg = msgLines.join('\n');

    try {
      const cardBlob = await generateShareCardBlob(p, photoIdx);
      if (navigator.clipboard && window.ClipboardItem) {
        const img = await loadImageAsync(URL.createObjectURL(cardBlob));
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const cctx = c.getContext('2d');
        cctx.drawImage(img, 0, 0);
        c.toBlob(async (pngBlob) => {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': pngBlob })
          ]);
        }, 'image/png');
        showToast('<strong>WhatsApp opened!</strong> 📋 Ultra-HD Photo copied to clipboard — press <strong>Ctrl+V</strong> in WhatsApp to paste photo.', null, 6000);
      } else {
        showToast('WhatsApp opened!');
      }
    } catch (e) {
      showToast('WhatsApp opened!');
    }

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  }

  async function downloadShareCardAction() {
    if (!activeShareProduct) return;
    const p = activeShareProduct;
    const photoIdx = activeSharePhotoIndex;

    const btn = document.getElementById('btnDownloadShareCard');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `${ICONS.loader} <span>Generating Ultra HD...</span>`;

    try {
      const cardBlob = await generateShareCardBlob(p, photoIdx);
      const url = URL.createObjectURL(cardBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AQIQ-Tile-${sanitizeFilename(p.name)}-HD.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Saved <strong>${p.name}</strong> in Ultra-HD 1600×1920.`);
    } catch (err) {
      console.error('Download card error:', err);
      showToast('Could not save card image.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  async function downloadRawPhotoAction() {
    if (!activeShareProduct) return;
    const p = activeShareProduct;
    const photoIdx = activeSharePhotoIndex;

    const images = p.images || [];
    const src = images[photoIdx] ? images[photoIdx].dataUrl : (images[0] ? images[0].dataUrl : '');
    if (!src) {
      showToast('No photo available for this tile.');
      return;
    }

    try {
      const a = document.createElement('a');
      a.href = src;
      a.download = `AQIQ-${sanitizeFilename(p.name)}-Original.png`;
      a.click();
      showToast(`Saved original uncompressed photo for <strong>${p.name}</strong>.`);
    } catch (e) {
      showToast('Could not download raw photo.');
    }
  }

  async function copyProductDetailsAction() {
    if (!activeShareProduct) return;
    const p = activeShareProduct;
    const categoryName = p.category || (p.theme ? (p.theme.charAt(0).toUpperCase() + p.theme.slice(1) + ' Series') : 'Standard');
    const text = `AQIQ (MBM) TILES\nItem: ${p.name}\nSize: ${p.size}\nCategory: ${categoryName}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Product details copied to clipboard!');
    } catch (err) {
      showToast('Could not copy text.');
    }
  }

  async function copyProductImageAction() {
    if (!activeShareProduct) return;
    const p = activeShareProduct;
    const photoIdx = activeSharePhotoIndex;

    const btn = document.getElementById('btnCopyProductImage');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `${ICONS.loader} <span>Copying HD...</span>`;

    try {
      const cardBlob = await generateShareCardBlob(p, photoIdx);
      if (navigator.clipboard && window.ClipboardItem) {
        const img = await loadImageAsync(URL.createObjectURL(cardBlob));
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const cctx = c.getContext('2d');
        cctx.drawImage(img, 0, 0);
        c.toBlob(async (pngBlob) => {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': pngBlob })
          ]);
          showToast('<strong>Ultra-HD Photo Card copied!</strong> Paste (Ctrl+V) anywhere in crystal clear quality.');
          btn.disabled = false;
          btn.innerHTML = originalText;
        }, 'image/png');
      } else {
        showToast('Clipboard image copying not supported in this browser.');
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    } catch (err) {
      console.error('Copy photo error:', err);
      showToast('Could not copy image.');
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }


  /* --------------------------------------------------------------------------
     Backup, Restore & Export CSV
     -------------------------------------------------------------------------- */
  function exportJsonBackup() {
    const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AQIQ-MBM-Tiles-Backup-${formatDateOnly()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Catalog backup JSON downloaded.');
  }

  function importJsonBackup(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed && Array.isArray(parsed.products)) {
          catalog = parsed;
          await saveToStorage(catalog);
          renderCurrentView();
          document.getElementById('backupModal').classList.remove('open');
          showToast(`Restored catalog with ${catalog.products.length} items.`);
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  }

  function exportCsvCatalog() {
    const rows = [
      ['Index', 'Item Name', 'Stock Boxes', 'Size', 'Category Theme', 'Category Name', 'Images Count']
    ];

    catalog.products.forEach((p, i) => {
      rows.push([
        i + 1,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        p.stock || 0,
        `"${(p.size || '').replace(/"/g, '""')}"`,
        p.theme || 'black',
        `"${(p.category || '').replace(/"/g, '""')}"`,
        p.images ? p.images.length : 0
      ]);
    });

    const csvContent = rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AQIQ-MBM-Tiles-Stock-${formatDateOnly()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Inventory CSV spreadsheet downloaded.');
  }

  async function resetToDefaultCatalog() {
    if (confirm('Are you sure you want to reset all tiles to the default 111 products from the original PDF? Any unsaved edits will be replaced.')) {
      catalog = JSON.parse(JSON.stringify(window.DEFAULT_CATALOG_DATA));
      await saveToStorage(catalog);
      renderCurrentView();
      document.getElementById('backupModal').classList.remove('open');
      showToast('Catalog reset to original 111 PDF tiles.');
    }
  }

  /* --------------------------------------------------------------------------
     Initialization & Event Bindings
     -------------------------------------------------------------------------- */
  async function init() {
    const saved = await loadFromStorage();
    const seed = window.DEFAULT_CATALOG_DATA;
    if (saved && saved.products && saved.products.length) {
      catalog = saved;
      // Auto-upgrade existing cached catalog to High-Res images if version is upgraded
      if (seed && (!catalog.version || catalog.version < (seed.version || 2))) {
        const seedMap = new Map((seed.products || []).map(p => [p.id, p]));
        let upgraded = false;
        catalog.products.forEach(p => {
          const seedProd = seedMap.get(p.id);
          if (seedProd && seedProd.images && seedProd.images.length) {
            // Upgrade to high-resolution image from the master catalog
            p.images = seedProd.images;
            upgraded = true;
          }
        });
        catalog.version = seed.version || 2;
        if (upgraded) {
          await saveToStorage(catalog);
          console.info('Catalog auto-upgraded to Ultra-HD images from reference PDF.');
        }
      }
    } else if (seed) {
      catalog = JSON.parse(JSON.stringify(seed));
      await saveToStorage(catalog);
    }

    if (catalog.logoIcon) {
      document.getElementById('headerLogoImg').src = catalog.logoIcon;
    }

    // Auto-migrate any unspecific/standard categories to their specific finish/series (e.g., 600×1200 Matt, 600×1200 Glossy, etc.)
    if (catalog && catalog.products) {
      let migrated = false;
      catalog.products.forEach((p, idx) => {
        if (!p.category || p.category === '600×1200 Standard' || p.category === '600x1200 Standard' || p.category === 'General') {
          p.category = inferProductCategory(p.name, p.size);
          p.theme = inferProductTheme(p.category, p.size);
          migrated = true;
        }
      });
      if (migrated) {
        scheduleSave();
      }
    }

    // Header Actions
    document.getElementById('btnAddNewTile').onclick = () => openProductEditor(null);
    document.getElementById('btnDownloadPdf').onclick = exportPdfDownload;

    // PDF Preview Modal
    const pdfPreviewModal = document.getElementById('pdfPreviewModal');
    document.getElementById('btnPdfPreviewOpen').onclick = () => {
      pdfPreviewModal.classList.add('open');
      renderPdfPreview();
    };
    document.getElementById('btnPdfPreviewClose').onclick = () => pdfPreviewModal.classList.remove('open');
    document.getElementById('btnPdfPreviewDone').onclick = () => pdfPreviewModal.classList.remove('open');
    document.getElementById('btnPdfPreviewDownload').onclick = exportPdfDownload;
    const btnPdfPrint = document.getElementById('btnPdfPreviewPrint');
    if (btnPdfPrint) {
      btnPdfPrint.onclick = triggerNativePrint;
    }

    // Backup Modal (opened only from code now - no header button launches it)
    const backupModal = document.getElementById('backupModal');
    document.getElementById('btnBackupClose').onclick = () => backupModal.classList.remove('open');
    document.getElementById('btnBackupDone').onclick = () => backupModal.classList.remove('open');
    document.getElementById('btnExportJson').onclick = exportJsonBackup;
    document.getElementById('btnExportCsv').onclick = exportCsvCatalog;
    document.getElementById('btnResetCatalog').onclick = resetToDefaultCatalog;

    const importInput = document.getElementById('importJsonInput');
    document.getElementById('btnTriggerImportJson').onclick = () => importInput.click();
    importInput.onchange = () => {
      if (importInput.files.length) {
        importJsonBackup(importInput.files[0]);
      }
    };

    // Reorder Modal (opened only from code now - the "Arrange" button that
    // launched it lived in the toolbar row that was removed)
    const reorderModal = document.getElementById('reorderModal');
    document.getElementById('btnReorderClose').onclick = () => reorderModal.classList.remove('open');
    document.getElementById('btnReorderDone').onclick = () => reorderModal.classList.remove('open');

    document.getElementById('btnSortByCategory').onclick = () => {
      const order = { black: 1, peach: 2, blue: 3, pink: 4, green: 5 };
      catalog.products.sort((a, b) => (order[a.theme] || 9) - (order[b.theme] || 9));
      scheduleSave();
      renderCurrentView();
      reorderModal.classList.remove('open');
      showToast('Catalog grouped by category theme.');
    };

    document.getElementById('btnSortByName').onclick = () => {
      catalog.products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      scheduleSave();
      renderCurrentView();
      reorderModal.classList.remove('open');
      showToast('Catalog sorted alphabetically.');
    };

    document.getElementById('btnSortByStockDesc').onclick = () => {
      catalog.products.sort((a, b) => (b.stock || 0) - (a.stock || 0));
      scheduleSave();
      renderCurrentView();
      reorderModal.classList.remove('open');
      showToast('Catalog sorted by highest stock level.');
    };

    // Product Modal
    document.getElementById('btnModalClose').onclick = closeProductEditor;
    document.getElementById('btnModalCancel').onclick = closeProductEditor;
    document.getElementById('btnSaveProduct').onclick = saveProductFromEditor;
    document.getElementById('btnDeleteProduct').onclick = () => {
      if (editingProductId) deleteProduct(editingProductId);
    };

    const editNameInput = document.getElementById('editName');
    const editSizeInput = document.getElementById('editSize');
    const editCategoryInput = document.getElementById('editCategory');
    const updateCategoryAutoSuggestion = () => {
      if (!editingProductId) {
        editCategoryInput.value = inferProductCategory(editNameInput.value, editSizeInput.value);
      }
    };
    editNameInput.addEventListener('input', updateCategoryAutoSuggestion);
    editSizeInput.addEventListener('input', updateCategoryAutoSuggestion);

    // Image Dropzone
    const dropzone = document.getElementById('imageDropzone');
    const fileInput = document.getElementById('imageFileInput');

    dropzone.onclick = () => fileInput.click();
    fileInput.onchange = () => {
      if (fileInput.files.length) handleFilesUpload(fileInput.files);
    };

    dropzone.ondragover = (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    };
    dropzone.ondragleave = () => dropzone.classList.remove('dragover');
    dropzone.ondrop = (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) handleFilesUpload(e.dataTransfer.files);
    };

    // Clipboard Paste (Ctrl+V)
    window.addEventListener('paste', (e) => {
      const modal = document.getElementById('productModal');
      if (!modal.classList.contains('open')) return;
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      const imageFiles = [];
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          imageFiles.push(item.getAsFile());
        }
      }
      if (imageFiles.length) {
        handleFilesUpload(imageFiles);
        showToast('Pasted image from clipboard.');
      }
    });

    // Lightbox & Share Connections
    document.getElementById('btnLightboxClose').onclick = closeLightbox;
    document.getElementById('lightboxModal').onclick = (e) => {
      if (e.target.id === 'lightboxModal') closeLightbox();
    };
    document.getElementById('btnLightboxShare').onclick = () => {
      if (activeLightboxProduct) {
        openShareModal(activeLightboxProduct.id, activeLightboxImgIndex);
      }
    };

    // Share Modal Controls
    const shareModal = document.getElementById('shareModal');
    document.getElementById('btnShareClose').onclick = closeShareModal;
    document.getElementById('btnShareDone').onclick = closeShareModal;
    document.getElementById('btnNativeShare').onclick = shareProductNativeAction;
    document.getElementById('btnWhatsappShare').onclick = shareProductWhatsAppAction;
    document.getElementById('btnDownloadShareCard').onclick = downloadShareCardAction;
    document.getElementById('btnDownloadRawPhoto').onclick = downloadRawPhotoAction;
    document.getElementById('btnCopyProductDetails').onclick = copyProductDetailsAction;
    document.getElementById('btnCopyProductImage').onclick = copyProductImageAction;

    // Search Input & Filter Chips
    const searchInput = document.getElementById('searchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (searchClearBtn) {
          searchClearBtn.classList.toggle('visible', searchQuery.trim().length > 0);
        }
        renderCurrentView();
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (searchInput.value) {
            searchInput.value = '';
            searchQuery = '';
            if (searchClearBtn) searchClearBtn.classList.remove('visible');
            renderCurrentView();
          } else {
            searchInput.blur();
          }
        }
      });
    }

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        searchQuery = '';
        searchClearBtn.classList.remove('visible');
        renderCurrentView();
      });
    }

    // Filter Chips
    document.querySelectorAll('.filter-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter || 'all';
        renderCurrentView();
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeProductEditor();
        closeLightbox();
        closeShareModal();
        backupModal.classList.remove('open');
        reorderModal.classList.remove('open');
      }

      // Quick Search Focus: '/' or 'Ctrl+K' / 'Cmd+K' when not in any input/modal
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInputActive = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';
      const isModalOpen = document.querySelector('.modal-layer.open') || document.querySelector('.lightbox-overlay.open');

      if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) && !isInputActive && !isModalOpen) {
        e.preventDefault();
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    });

    // ========================================================================
    // SUPABASE AUTHENTICATION SYSTEM
    // ========================================================================
    const authScreen = document.getElementById('authScreen');
    const authAlert = document.getElementById('authAlert');
    const authLogoImg = document.getElementById('authLogoImg');
    const tabSignIn = document.getElementById('tabSignIn');
    const tabSignUp = document.getElementById('tabSignUp');
    const tabForgot = document.getElementById('tabForgot');
    const formSignIn = document.getElementById('formSignIn');
    const formSignUp = document.getElementById('formSignUp');
    const formForgot = document.getElementById('formForgot');
    const linkForgotPassword = document.getElementById('linkForgotPassword');
    const btnBypassAuth = document.getElementById('btnBypassAuth');
    const btnUserMenu = document.getElementById('btnUserMenu');
    const userProfileWrap = document.querySelector('.user-profile-wrap');
    const userAvatarBadge = document.getElementById('userAvatarBadge');
    const userEmailLabel = document.getElementById('userEmailLabel');
    const userDropdownEmail = document.getElementById('userDropdownEmail');
    const btnSignOut = document.getElementById('btnSignOut');

    if (authLogoImg && catalog && catalog.logoIcon) {
      authLogoImg.src = catalog.logoIcon;
    }

    function showAuthAlert(msg, type = 'error') {
      if (!authAlert) return;
      authAlert.className = `auth-alert-banner ${type}`;
      authAlert.innerHTML = `
        <svg class="svg-icon sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <span>${msg}</span>
      `;
      authAlert.style.display = 'flex';
    }

    function clearAuthAlert() {
      if (!authAlert) return;
      authAlert.style.display = 'none';
      authAlert.innerHTML = '';
    }

    function switchAuthTab(mode) {
      clearAuthAlert();
      [tabSignIn, tabSignUp, tabForgot].forEach(t => {
        if (t) t.classList.remove('active');
      });
      [formSignIn, formSignUp, formForgot].forEach(f => {
        if (f) f.classList.remove('active');
      });

      if (mode === 'signIn') {
        if (tabSignIn) tabSignIn.classList.add('active');
        if (formSignIn) formSignIn.classList.add('active');
      } else if (mode === 'signUp') {
        if (tabSignUp) tabSignUp.classList.add('active');
        if (formSignUp) formSignUp.classList.add('active');
      } else if (mode === 'forgot') {
        if (tabForgot) tabForgot.classList.add('active');
        if (formForgot) formForgot.classList.add('active');
      }
    }

    function updateAuthUI(isLoggedIn) {
      if (isLoggedIn && currentUser) {
        const email = currentUser.email || '';
        const name = (currentUser.user_metadata && currentUser.user_metadata.full_name) || email.split('@')[0] || 'User';
        const initial = name[0].toUpperCase();

        if (userAvatarBadge) userAvatarBadge.textContent = initial;
        if (userEmailLabel) userEmailLabel.textContent = name;
        if (userDropdownEmail) userDropdownEmail.textContent = email;
      } else {
        if (userAvatarBadge) userAvatarBadge.textContent = 'G';
        if (userEmailLabel) userEmailLabel.textContent = 'Guest';
        if (userDropdownEmail) userDropdownEmail.textContent = 'Guest Mode (Offline/Local)';
      }
    }

    function showAuthScreen(tab = 'signIn') {
      if (authScreen) authScreen.classList.add('active');
      switchAuthTab(tab);
    }

    function hideAuthScreen() {
      if (authScreen) authScreen.classList.remove('active');
    }

    // Tab bindings
    if (tabSignIn) tabSignIn.onclick = () => switchAuthTab('signIn');
    if (tabSignUp) tabSignUp.onclick = () => switchAuthTab('signUp');
    if (tabForgot) tabForgot.onclick = () => switchAuthTab('forgot');
    if (linkForgotPassword) linkForgotPassword.onclick = () => switchAuthTab('forgot');

    // Toggle password visibility buttons
    document.querySelectorAll('.btn-toggle-pw').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.closest('.auth-input-wrap')?.querySelector('input');
        if (!input) return;
        const isPw = input.type === 'password';
        input.type = isPw ? 'text' : 'password';
        btn.innerHTML = isPw
          ? `<svg class="svg-icon sm" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
          : `<svg class="svg-icon sm" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      });
    });

    // Sign In Submit
    if (formSignIn) {
      formSignIn.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAuthAlert();
        const email = document.getElementById('loginEmail')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;
        if (!email || !password) return;

        const btn = document.getElementById('btnSubmitLogin');
        const origText = btn ? btn.innerHTML : '';
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = `<svg class="svg-icon sm spin" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> <span>Authenticating with Supabase...</span>`;
        }

        try {
          if (!supabaseClient || !supabaseClient.auth) {
            throw new Error('Supabase client is not connected.');
          }
          const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
          if (error) throw error;

          currentUser = data.user;
          isAuthBypassed = false;
          updateAuthUI(true);
          hideAuthScreen();
          showToast(`Welcome back, <strong>${email.split('@')[0]}</strong>!`);
        } catch (err) {
          console.error('Login error:', err);
          showAuthAlert(err.message || 'Invalid email or password.', 'error');
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = origText;
          }
        }
      });
    }

    // Sign Up Submit
    if (formSignUp) {
      formSignUp.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAuthAlert();
        const fullName = document.getElementById('signupName')?.value.trim();
        const email = document.getElementById('signupEmail')?.value.trim();
        const password = document.getElementById('signupPassword')?.value;
        if (!email || !password) return;

        const btn = document.getElementById('btnSubmitSignup');
        const origText = btn ? btn.innerHTML : '';
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = `<svg class="svg-icon sm spin" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> <span>Creating account...</span>`;
        }

        try {
          if (!supabaseClient || !supabaseClient.auth) {
            throw new Error('Supabase client is not connected.');
          }
          const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName }
            }
          });
          if (error) throw error;

          if (data.session) {
            currentUser = data.user;
            isAuthBypassed = false;
            updateAuthUI(true);
            hideAuthScreen();
            showToast(`Account created! Welcome, <strong>${fullName || email}</strong>.`);
          } else {
            // Confirmation email required
            showAuthAlert(`Account created for ${email}! Please check your inbox to confirm your email.`, 'success');
          }
        } catch (err) {
          console.error('Sign up error:', err);
          showAuthAlert(err.message || 'Could not create account.', 'error');
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = origText;
          }
        }
      });
    }

    // Reset Password Submit
    if (formForgot) {
      formForgot.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAuthAlert();
        const email = document.getElementById('forgotEmail')?.value.trim();
        if (!email) return;

        const btn = document.getElementById('btnSubmitForgot');
        const origText = btn ? btn.innerHTML : '';
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = `<svg class="svg-icon sm spin" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> <span>Sending link...</span>`;
        }

        try {
          if (!supabaseClient || !supabaseClient.auth) {
            throw new Error('Supabase client is not connected.');
          }
          const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
          });
          if (error) throw error;

          showAuthAlert(`Password recovery link sent to ${email}. Please check your email.`, 'success');
        } catch (err) {
          console.error('Forgot password error:', err);
          showAuthAlert(err.message || 'Could not send recovery email.', 'error');
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = origText;
          }
        }
      });
    }

    // Guest / Offline Mode Bypass
    if (btnBypassAuth) {
      btnBypassAuth.onclick = () => {
        isAuthBypassed = true;
        hideAuthScreen();
        updateAuthUI(false);
        showToast('Browsing studio in offline / guest mode.');
      };
    }

    // User Profile Dropdown Toggle
    if (btnUserMenu && userProfileWrap) {
      btnUserMenu.onclick = (e) => {
        e.stopPropagation();
        userProfileWrap.classList.toggle('open');
      };
      document.addEventListener('click', (e) => {
        if (!userProfileWrap.contains(e.target)) {
          userProfileWrap.classList.remove('open');
        }
      });
    }

    // Sign Out
    if (btnSignOut) {
      btnSignOut.onclick = async () => {
        if (userProfileWrap) userProfileWrap.classList.remove('open');
        if (supabaseClient && supabaseClient.auth) {
          try {
            await supabaseClient.auth.signOut();
          } catch (e) {
            console.warn('Sign out error:', e);
          }
        }
        currentUser = null;
        isAuthBypassed = false;
        updateAuthUI(false);
        showToast('You have signed out.');
        showAuthScreen('signIn');
      };
    }

    // Initial Supabase Session Check
    if (supabaseClient && supabaseClient.auth) {
      try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        const session = sessionData && sessionData.session;
        if (session && session.user) {
          currentUser = session.user;
          updateAuthUI(true);
          hideAuthScreen();
        } else {
          showAuthScreen('signIn');
        }

        // Live auth state listener
        supabaseClient.auth.onAuthStateChange((event, newSession) => {
          if (newSession && newSession.user) {
            currentUser = newSession.user;
            updateAuthUI(true);
            hideAuthScreen();
          } else {
            currentUser = null;
            updateAuthUI(false);
            if (!isAuthBypassed) {
              showAuthScreen('signIn');
            }
          }
        });
      } catch (err) {
        console.warn('Supabase auth session check failed:', err);
        showAuthScreen('signIn');
      }
    } else {
      // Fallback for offline mode without Supabase connection
      isAuthBypassed = true;
      hideAuthScreen();
      updateAuthUI(false);
    }

    // Initial render
    renderCurrentView();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
