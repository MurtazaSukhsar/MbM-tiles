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
     Filtering & Stock Adjustments
     -------------------------------------------------------------------------- */
  function getFilteredProducts() {
    let prods = [...catalog.products];

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      prods = prods.filter(p => {
        const name = (p.name || '').toLowerCase();
        const size = (p.size || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return name.includes(q) || size.includes(q) || cat.includes(q);
      });
    }

    // Category / Stock filter
    if (currentFilter === 'black') {
      prods = prods.filter(p => p.theme === 'black');
    } else if (currentFilter === 'peach') {
      prods = prods.filter(p => p.theme === 'peach');
    } else if (currentFilter === 'blue') {
      prods = prods.filter(p => p.theme === 'blue');
    } else if (currentFilter === 'pink') {
      prods = prods.filter(p => p.theme === 'pink');
    } else if (currentFilter === 'green') {
      prods = prods.filter(p => p.theme === 'green');
    } else if (currentFilter === 'low-stock') {
      prods = prods.filter(p => p.stock > 0 && p.stock < 20);
    } else if (currentFilter === 'out-of-stock') {
      prods = prods.filter(p => p.stock <= 0);
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
    // Grid Card input
    const cardInput = document.querySelector(`.tile-studio-card[data-id="${productId}"] .stock-num-field`);
    if (cardInput) {
      cardInput.value = newStock;
      cardInput.className = 'stock-num-field' + (newStock === 0 ? ' danger' : newStock < 20 ? ' warning' : '');
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
    const filtered = getFilteredProducts();

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
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1rem; color: var(--text-dim);">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">${ICONS.search}</div>
          <div style="font-size: 1rem; font-weight: 600; color: #fff;">No matching tiles</div>
          <p style="font-size: 0.8rem; margin-top: 0.25rem;">Adjust your search or clear filters to view catalog items.</p>
        </div>
      `;
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

          <div class="card-action-footer">
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
          <button class="card-tool-btn btn-edit-tile" title="Edit">${ICONS.edit}</button>
          <button class="card-tool-btn btn-delete-tile" style="color:var(--accent-rose);" title="Delete">${ICONS.trash}</button>
        </td>
      `;

      tr.querySelector('.tbl-tile-preview').onclick = () => openLightbox(p);
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

      // One photo: shown as big as the cell allows. Multiple photos (max 3
      // per tile): laid out as equal-width tiles side by side, each filling
      // its box the same way (cropped to fit) so every photo reads as the
      // same size instead of varying with its own original aspect ratio.
      const MAX_PDF_PHOTOS = 3;
      let photoInnerHtml = '';
      if (images.length === 0) {
        photoInnerHtml = `<span style="font-size:10px; color:#999;">No photo</span>`;
      } else if (images.length === 1) {
        photoInnerHtml = `<img src="${images[0].dataUrl}" alt="${p.name}">`;
      } else {
        const shown = images.slice(0, MAX_PDF_PHOTOS);
        const extraCount = images.length - shown.length;
        photoInnerHtml = `<div class="pdf-photo-grid count-${shown.length}">` +
          shown.map((im, idx) => {
            const isLast = idx === shown.length - 1;
            const badge = (isLast && extraCount > 0)
              ? `<span class="pdf-photo-more-badge">+${extraCount}</span>`
              : '';
            return `<div class="pdf-photo-tile"><img src="${im.dataUrl}" alt="${p.name}">${badge}</div>`;
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
          ${logoSrc ? `<img class="pdf-logo-icon" src="${logoSrc}" alt="Aqiq">` : ''}
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
     PDF Export & Print Engines
     -------------------------------------------------------------------------- */
  async function exportPdfDownload() {
    if (!window.jspdf || !window.html2canvas) {
      showToast('PDF libraries loading, please retry in a second...');
      return;
    }

    const prods = getFilteredProducts();
    if (!prods.length) {
      showToast('No products to export in current filter.');
      return;
    }

    const exportBtn = document.getElementById('btnDownloadPdf');
    const originalText = exportBtn.innerHTML;
    exportBtn.disabled = true;
    exportBtn.innerHTML = `${ICONS.loader} <span>Generating...</span>`;
    showToast('Rendering high-resolution PDF catalog...');

    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pages = chunkArray(prods, ROWS_PER_PAGE);

      const printRoot = document.getElementById('printRoot');
      printRoot.innerHTML = '';

      for (let i = 0; i < pages.length; i++) {
        const sheet = buildSinglePdfSheet(pages[i], i + 1, pages.length, i * ROWS_PER_PAGE);
        printRoot.appendChild(sheet);

        const imgs = [...sheet.querySelectorAll('img')];
        await Promise.all(imgs.map(im => {
          if (im.complete) return Promise.resolve();
          return new Promise(res => { im.onload = im.onerror = res; });
        }));

        const canvas = await html2canvas(sheet, {
          scale: 2.2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      printRoot.innerHTML = '';
      const filename = `AQIQ-MBM-Tiles-Catalog-${formatDateOnly()}.pdf`;
      pdf.save(filename);
      showToast(`<strong>${filename}</strong> downloaded successfully.`);
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Export failed. You can use Print as an alternative.');
    } finally {
      exportBtn.disabled = false;
      exportBtn.innerHTML = originalText;
    }
  }

  function triggerNativePrint() {
    const prods = getFilteredProducts();
    const pages = chunkArray(prods, ROWS_PER_PAGE);
    const printRoot = document.getElementById('printRoot');
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
      document.getElementById('editCategory').value = '600×1200 Standard';
      draftImages = [];
    } else {
      const p = catalog.products.find(x => x.id === id);
      if (!p) return;
      document.getElementById('editProductId').value = p.id;
      document.getElementById('editName').value = p.name || '';
      document.getElementById('editStock').value = p.stock || 0;
      document.getElementById('editSize').value = p.size || '600×1200';
      document.getElementById('editCategory').value = p.category || '';
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

  // PDF row color is no longer a manual choice - it's worked out from the
  // category/size text, matching the same 5 groups the old swatch picker offered.
  function inferProductTheme(category, size) {
    const text = `${category || ''} ${size || ''}`.toLowerCase();
    if (text.includes('blue art') || text.includes('blueart')) return 'pink';
    if (text.includes('cladding') || text.includes('clading')) return 'green';
    if (text.includes('tag') || text.includes('waterproof')) return 'blue';
    if (text.includes('full body') || text.includes('fullbody')) return 'peach';
    return 'black';
  }

  function renderDraftImages() {
    const grid = document.getElementById('draftImagesGrid');
    grid.innerHTML = '';

    const dropzone = document.getElementById('imageDropzone');
    if (dropzone) {
      dropzone.style.display = draftImages.length >= MAX_TILE_PHOTOS ? 'none' : '';
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
          const maxDim = 1200;
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
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        };
        img.src = e.target.result;
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

  const MAX_TILE_PHOTOS = 3;

  async function handleFilesUpload(files) {
    const imgFiles = [...files].filter(f => f.type.startsWith('image/'));
    if (!imgFiles.length) return;

    const remainingSlots = MAX_TILE_PHOTOS - draftImages.length;
    if (remainingSlots <= 0) {
      showToast(`Maximum ${MAX_TILE_PHOTOS} photos per tile.`);
      return;
    }

    const filesToProcess = imgFiles.slice(0, remainingSlots);
    if (imgFiles.length > filesToProcess.length) {
      showToast(`Only ${remainingSlots} more photo(s) can be added (max ${MAX_TILE_PHOTOS} per tile).`);
    }

    for (const f of filesToProcess) {
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
    const category = document.getElementById('editCategory').value.trim() || 'General';
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
  function openLightbox(product) {
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
    if (saved && saved.products && saved.products.length) {
      catalog = saved;
    } else if (window.DEFAULT_CATALOG_DATA) {
      catalog = JSON.parse(JSON.stringify(window.DEFAULT_CATALOG_DATA));
      await saveToStorage(catalog);
    }

    if (catalog.logoIcon) {
      document.getElementById('headerLogoImg').src = catalog.logoIcon;
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

    // Lightbox Close
    document.getElementById('btnLightboxClose').onclick = closeLightbox;
    document.getElementById('lightboxModal').onclick = (e) => {
      if (e.target.id === 'lightboxModal') closeLightbox();
    };

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeProductEditor();
        closeLightbox();
        backupModal.classList.remove('open');
        reorderModal.classList.remove('open');
      }
    });

    // Initial render
    renderCurrentView();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
