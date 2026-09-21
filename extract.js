const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('Claude outputs/mbm-tiles-catalog-import.json', 'utf8'));
const html = fs.readFileSync('Claude outputs/catalog-studio.html', 'utf8');

const iconMarker = 'const LOGO_ICON = "';
const iconStart = html.indexOf(iconMarker) + iconMarker.length;
const iconEnd = html.indexOf('";', iconStart);
const logoIcon = html.substring(iconStart, iconEnd);

const lockupMarker = 'const LOGO_LOCKUP = "';
const lockupStart = html.indexOf(lockupMarker) + lockupMarker.length;
const lockupEnd = html.indexOf('";', lockupStart);
const logoLockup = html.substring(lockupStart, lockupEnd);

console.log('Logo icon len:', logoIcon.length, 'Logo lockup len:', logoLockup.length);

function inferCategoryAndTheme(p, idx) {
  const name = p.name || '';
  const size = p.size || '';
  const fullText = (name + ' ' + size).toLowerCase();

  // 600x300 Cladding Elevation
  if (idx >= 92 || fullText.includes('600x300') || fullText.includes('cladding') || fullText.includes('stone') || fullText.includes('brick')) {
    return { category: '600×300 Cladding Elevation', theme: 'green' };
  }

  // 600x600 Blue Art Fullbody
  if (idx >= 84 && idx <= 91) {
    if (fullText.includes('glossy')) return { category: '600×600 Full Body (Glossy)', theme: 'pink' };
    if (fullText.includes('rustic') || fullText.includes('blast') || fullText.includes('punch')) return { category: '600×600 Full Body (Rustic)', theme: 'pink' };
    if (fullText.includes('matt') || fullText.includes('mat')) return { category: '600×600 Full Body (Matt)', theme: 'pink' };
    return { category: '600×600 Full Body', theme: 'pink' };
  }

  // 600x600 Tag & Waterproof
  if (idx >= 68 && idx <= 83 || fullText.includes('600x600')) {
    if (fullText.includes('tag')) return { category: '600×600 Tag Series', theme: 'blue' };
    if (fullText.includes('matt') || fullText.includes('waterproof')) return { category: '600×600 Matt Waterproof', theme: 'blue' };
    return { category: '600×600 Standard', theme: 'blue' };
  }

  // 600x1200 Full Body
  if (idx >= 62 && idx <= 67 || fullText.includes('full body') || fullText.includes('fullbody')) {
    if (fullText.includes('glossy')) return { category: '600×1200 Full Body (Glossy)', theme: 'peach' };
    if (fullText.includes('matt') || fullText.includes('mat')) return { category: '600×1200 Full Body (Matt)', theme: 'peach' };
    return { category: '600×1200 Full Body', theme: 'peach' };
  }

  // 600x1200 Carving
  if (fullText.includes('carving') || fullText.includes('decor')) {
    return { category: '600×1200 Carving', theme: 'black' };
  }

  // 600x1200 Glossy (explicit)
  if (name.toLowerCase().includes('(glossy)') || name.toLowerCase().includes('glossy')) {
    return { category: '600×1200 Glossy', theme: 'black' };
  }

  // 600x1200 Diamond Matt
  if (fullText.includes('diamond') || fullText.includes(' dm') || fullText.includes('dm')) {
    return { category: '600×1200 Diamond Matt', theme: 'black' };
  }

  // 600x1200 Matt
  if (fullText.includes('matt') || fullText.includes('mat') || fullText.includes('onetime matt')) {
    return { category: '600×1200 Matt', theme: 'black' };
  }

  // 600x1200 Glossy
  return { category: '600×1200 Glossy', theme: 'black' };
}

const enrichedProducts = raw.products.map((p, idx) => {
  const { category, theme } = inferCategoryAndTheme(p, idx);

  // Ensure each image has id and dataUrl
  const images = (p.images || []).map((img, imgIdx) => {
    if (typeof img === 'string') {
      return { id: 'img_' + idx + '_' + imgIdx, dataUrl: img, name: 'Image ' + (imgIdx + 1) };
    }
    return {
      id: img.id || ('img_' + idx + '_' + imgIdx),
      dataUrl: img.dataUrl || img.url || '',
      name: img.name || ('Image ' + (imgIdx + 1))
    };
  });

  return {
    id: p.id || ('p_' + (idx + 1)),
    name: p.name || 'Untitled Tile',
    stock: typeof p.stock === 'number' ? p.stock : parseInt(p.stock, 10) || 0,
    unit: 'Box',
    size: p.size || '600x1200',
    theme: theme,
    category: category,
    description: p.description || '',
    price: p.price || '',
    images: images,
    pdfImageMode: 'auto', // 'auto', 'single', 'multi-grid'
    updatedAt: new Date().toISOString()
  };
});

const defaultCatalog = {
  version: 2,
  title: 'AQIQ (MBM) TILES',
  subtitle: 'Aqiq · Inventory & Stock Catalog',
  companyName: 'AQIQ (MBM) TILES',
  brandName: 'Aqiq',
  brandSubtitle: 'Aqiq',
  logoIcon: logoIcon,
  logoLockup: logoLockup,
  rowsPerPage: 5,
  products: enrichedProducts
};

const jsContent = `// AQIQ (MBM) TILES - Default Seed Data
window.DEFAULT_CATALOG_DATA = ${JSON.stringify(defaultCatalog, null, 2)};
`;

fs.writeFileSync('catalog-data.js', jsContent, 'utf8');
console.log('Successfully written catalog-data.js! Total products:', enrichedProducts.length);
