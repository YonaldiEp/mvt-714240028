import * as maplibregl from './vendor/maplibre-gl.mjs';
import { geometryLabel, filterFeatures, featureBounds } from './feature-utils.js';

const byId = id => document.getElementById(id);
const layerIds = ['areas', 'outlines', 'lines', 'points'];
const features = new Map();
const selectedPaint = ['boolean', ['feature-state', 'selected'], false];
let map;
let catalog;
let popup;
let selectedId = null;
let currentDataset = 'all';
let listSignature = '';
let refreshPending = false;
let vectorError = false;

function setStatus(message, ready = false) {
  byId('status').textContent = message;
  byId('status-dot').classList.toggle('ready', ready);
}
function announceError(message) {
  byId('map-notice').hidden = false;
  byId('notice-text').textContent = message;
}
function fit(bounds, maxZoom = 18) {
  if (!bounds) return;
  map.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], {
    padding: window.innerWidth < 760 ? { top: 120, bottom: 45, left: 25, right: 45 } : 70,
    maxZoom, duration: 0
  });
}
function updateContext() {
  const dataset = catalog.datasets.find(item => item.id === currentDataset);
  const count = dataset?.count ?? catalog.datasets.reduce((sum, item) => sum + item.count, 0);
  byId('map-title').textContent = dataset?.name || 'Semua data';
  byId('map-summary').textContent = `${count} fitur sumber`;
  byId('dataset-summary').textContent = `${count} fitur sumber${dataset ? '' : ` dalam ${catalog.datasets.length} dataset`}`;
  byId('dataset-download').hidden = !dataset || selectedId !== null;
  if (dataset) byId('dataset-download').href = dataset.file;
}
function setSelection(id) {
  if (selectedId !== null) map.setFeatureState({ source: 'geodata', sourceLayer: 'features', id: selectedId }, { selected: false });
  selectedId = id;
  popup?.remove();
  const record = features.get(String(id));
  byId('selection-hint').hidden = !!record;
  byId('selected-content').hidden = !record;
  byId('clear-selection').hidden = !record;
  updateContext();
  if (!record) { renderFeatures(); return; }
  const { feature } = record;
  const dataset = catalog.datasets.find(item => item.id === feature.properties.dataset);
  map.setFeatureState({ source: 'geodata', sourceLayer: 'features', id }, { selected: true });
  byId('selected-name').textContent = feature.properties.Nama || 'Tanpa nama';
  const detail = byId('feature-detail');
  detail.replaceChildren();
  for (const [label, value] of [['Geometri', feature.properties.geometry_type], ['Dataset', dataset.name]]) {
    const group = document.createElement('div');
    const dt = document.createElement('dt'); dt.textContent = label;
    const dd = document.createElement('dd'); dd.textContent = value;
    group.append(dt, dd); detail.append(group);
  }
  byId('download').href = dataset.file;
  byId('focus-feature').disabled = !record.bounds;
  renderFeatures();
}
function renderFeatures() {
  const query = byId('search').value;
  const available = filterFeatures(features.values(), currentDataset, '');
  const matches = filterFeatures(available, currentDataset, query);
  byId('clear-search').hidden = !query;
  byId('feature-count').textContent = query ? `${matches.length} dari ${available.length}` : `${available.length} dimuat`;
  const signature = JSON.stringify([matches.map(({ feature }) => feature.id), selectedId, currentDataset, query]);
  if (signature === listSignature) return;
  listSignature = signature;
  const focusedId = document.activeElement?.dataset.featureId;
  const list = byId('feature-list');
  list.replaceChildren();
  for (const { feature } of matches) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'feature-row'; button.dataset.featureId = feature.id;
    button.setAttribute('aria-pressed', String(feature.id === selectedId));
    const name = document.createElement('strong'); name.textContent = feature.properties.Nama || 'Tanpa nama';
    const type = document.createElement('span');
    const dataset = catalog.datasets.find(item => item.id === feature.properties.dataset);
    type.textContent = `${geometryLabel(feature.properties.geometry_type)} · ${dataset.name}`;
    button.append(name, type); button.addEventListener('click', () => setSelection(feature.id));
    item.append(button); list.append(item);
    if (focusedId === String(feature.id)) button.focus({ preventScroll: true });
  }
  const empty = byId('list-empty');
  empty.hidden = matches.length > 0;
  empty.textContent = query ? `Tidak ada fitur bernama “${query}”. Coba nama lain atau hapus pencarian.` : 'Belum ada fitur yang dimuat. Perbesar peta atau pilih dataset untuk melihat detailnya.';
}
function refreshLoadedFeatures() {
  if (!map.getSource('geodata')) return;
  for (const feature of map.querySourceFeatures('geodata', { sourceLayer: 'features' })) {
    const id = String(feature.id);
    const previous = features.get(id);
    const bounds = featureBounds(feature.geometry);
    if (bounds && previous?.bounds) {
      bounds[0] = Math.min(bounds[0], previous.bounds[0]); bounds[1] = Math.min(bounds[1], previous.bounds[1]);
      bounds[2] = Math.max(bounds[2], previous.bounds[2]); bounds[3] = Math.max(bounds[3], previous.bounds[3]);
    }
    features.set(id, { feature, bounds: bounds || previous?.bounds });
  }
  renderFeatures();
  if (!vectorError && map.isSourceLoaded('geodata')) setStatus('Tile vektor siap', true);
}
function scheduleRefresh() {
  if (refreshPending) return;
  refreshPending = true;
  requestAnimationFrame(() => { refreshPending = false; refreshLoadedFeatures(); });
}
async function start() {
  const response = await fetch('catalog.json');
  if (!response.ok) throw new Error('Daftar data gagal dimuat. Periksa koneksi lalu muat ulang halaman.');
  catalog = await response.json();
  updateContext();
  byId('dataset-total').textContent = `${catalog.datasets.length} dataset`;
  const tileURL = new URL('tiles/{z}/{x}/{y}.pbf', location.href).href.replaceAll('%7B', '{').replaceAll('%7D', '}');
  map = new maplibregl.Map({ container: 'peta', center: [107.556, -6.88], zoom: 13,
    minZoom: catalog.minzoom, maxZoom: 20, renderWorldCopies: false,
    style: { version: 8, sources: {
      basemap: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256,
        maxzoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' },
      geodata: { type: 'vector', tiles: [tileURL], bounds: catalog.bounds, minzoom: catalog.minzoom, maxzoom: catalog.maxzoom }
    }, layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#e8eee8' } },
      { id: 'basemap', type: 'raster', source: 'basemap' },
      { id: 'areas', type: 'fill', source: 'geodata', 'source-layer': 'features', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': '#12643e', 'fill-opacity': ['case', selectedPaint, .65, .18] } },
      { id: 'outlines', type: 'line', source: 'geodata', 'source-layer': 'features', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'line-color': ['case', selectedPaint, '#073d24', '#12643e'], 'line-width': ['case', selectedPaint, 3, 1.8] } },
      { id: 'lines', type: 'line', source: 'geodata', 'source-layer': 'features', filter: ['==', ['geometry-type'], 'LineString'], paint: { 'line-color': ['case', selectedPaint, '#073d24', '#12643e'], 'line-width': ['case', selectedPaint, 7, 3.5] } },
      { id: 'points', type: 'circle', source: 'geodata', 'source-layer': 'features', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-color': '#12643e', 'circle-radius': ['case', selectedPaint, 9, 6], 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 } }
    ] }
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
  map.on('error', event => {
    console.error(event.error);
    if (event.sourceId === 'basemap') announceError('Basemap gagal dimuat. Data vektor masih dapat dijelajahi. Periksa koneksi untuk memuat basemap.');
    else { vectorError = true; setStatus('Sebagian data belum tersedia'); announceError('Sebagian data peta gagal dimuat. Periksa koneksi lalu muat ulang halaman.'); }
  });
  map.on('sourcedataloading', event => { if (event.sourceId === 'geodata') setStatus('Memuat tile vektor…'); });
  map.on('sourcedata', event => {
    if (event.sourceId !== 'geodata' || !event.coord) return;
    const { z, x, y } = event.coord.canonical;
    const link = byId('tile-request');
    link.href = `tiles/${z}/${x}/${y}.pbf`; link.textContent = `tiles/${z}/${x}/${y}.pbf`; link.hidden = false;
    scheduleRefresh();
  });
  map.on('idle', refreshLoadedFeatures);
  map.on('click', event => {
    const feature = map.queryRenderedFeatures(event.point, { layers: layerIds })[0];
    if (!feature) return;
    refreshLoadedFeatures();
    setSelection(feature.id);
    const content = document.createElement('div');
    const title = document.createElement('h3'); title.textContent = feature.properties.Nama || 'Tanpa nama';
    const description = document.createElement('p'); description.textContent = `${geometryLabel(feature.properties.geometry_type)} · ${catalog.datasets.find(item => item.id === feature.properties.dataset).name}`;
    content.append(title, description);
    popup = new maplibregl.Popup({ maxWidth: '260px' }).setLngLat(event.lngLat).setDOMContent(content).addTo(map);
  });
  map.on('mousemove', event => { map.getCanvas().style.cursor = map.queryRenderedFeatures(event.point, { layers: layerIds }).length ? 'pointer' : ''; });
  map.on('style.load', () => {
    const select = byId('dataset');
    select.replaceChildren(new Option('Semua data', 'all'));
    for (const dataset of catalog.datasets) select.add(new Option(dataset.name, dataset.id));
    select.disabled = false;
    for (const id of ['reset', 'search', 'tile-grid']) byId(id).disabled = false;
    byId('tile-summary').textContent = `${catalog.tileCount} file MVT pada zoom ${catalog.minzoom}–${catalog.maxzoom}. Zoom lebih dekat menggunakan tile level tertinggi.`;
    fit(catalog.bounds);
  });
  byId('dataset').addEventListener('change', event => {
    currentDataset = event.target.value;
    setSelection(null); byId('search').value = ''; updateContext();
    const dataset = catalog.datasets.find(item => item.id === currentDataset);
    for (const id of layerIds) {
      const geometry = ['==', ['geometry-type'], id === 'points' ? 'Point' : id === 'lines' ? 'LineString' : 'Polygon'];
      map.setFilter(id, dataset ? ['all', geometry, ['==', ['get', 'dataset'], dataset.id]] : geometry);
    }
    setStatus('Memuat tile vektor…'); fit(dataset?.bounds || catalog.bounds); renderFeatures();
  });
  byId('search').addEventListener('input', renderFeatures);
  byId('search').addEventListener('keydown', event => { if (event.key === 'Escape') { byId('search').value = ''; renderFeatures(); } });
  byId('clear-search').addEventListener('click', () => { byId('search').value = ''; renderFeatures(); byId('search').focus(); });
  byId('clear-selection').addEventListener('click', () => { setSelection(null); byId('search').focus(); });
  byId('reset').addEventListener('click', () => fit(catalog.datasets.find(item => item.id === currentDataset)?.bounds || catalog.bounds));
  byId('tile-grid').addEventListener('change', event => { map.showTileBoundaries = event.target.checked; });
  byId('focus-feature').addEventListener('click', () => {
    fit(features.get(String(selectedId))?.bounds);
    if (window.innerWidth < 760) byId('peta').scrollIntoView({ block: 'start', behavior: 'instant' });
  });
}
byId('retry').addEventListener('click', () => location.reload());
start().catch(error => {
  console.error(error);
  setStatus('Peta tidak dapat dimuat');
  byId('dataset-total').textContent = 'Data belum tersedia';
  byId('dataset-summary').textContent = 'Data belum tersedia';
  byId('dataset').replaceChildren(new Option('Data belum tersedia', ''));
  byId('list-empty').textContent = 'Daftar fitur belum tersedia. Muat ulang halaman untuk mencoba lagi.';
  announceError(error.message);
});
