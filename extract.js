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

const enrichedProducts = raw.products.map((p, idx) => {
  let theme = 'black';
  let category = '600×1200 Standard';
  
  if (idx >= 62 && idx <= 67) {
    theme = 'peach';
    category = '600×1200 Full Body';
  } else if (idx >= 68 && idx <= 83) {
    theme = 'blue';
    category = '600×600 Tag & Waterproof';
  } else if (idx >= 84 && idx <= 91) {
    theme = 'pink';
    category = '600×600 Blue Art Fullbody';
  } else if (idx >= 92) {
    theme = 'green';
    category = '600×300 Cladding Elevation';
  }

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
