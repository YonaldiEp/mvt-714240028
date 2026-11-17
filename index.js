import * as maplibregl from './vendor/maplibre-gl.mjs';

const byId = id => document.getElementById(id);
const status = byId('status');
const notice = byId('map-notice');
const layerIds = ['areas', 'outlines', 'lines', 'points'];
let map;
let catalog;
let popup;
let currentDataset = 'all';
const visibleFeatures = new Map();
function announceError(message) { notice.hidden = false; notice.textContent = message; }
function fit(bounds) {
  map.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], { padding: 48, maxZoom: 18, duration: 0 });
}
function showFeature(feature) {
  const props = feature.properties;
  const dataset = catalog.datasets.find(item => item.id === props.dataset);
  byId('selection-hint').hidden = true;
  const detail = byId('feature-detail');
  detail.replaceChildren();
  for (const [label, value] of [['Nama', props.Nama || 'Tanpa nama'], ['Dataset', dataset?.name || props.dataset], ['Geometri', props.geometry_type]]) {
    const dt = document.createElement('dt'); dt.textContent = label;
    const dd = document.createElement('dd'); dd.textContent = value;
    detail.append(dt, dd);
  }
  byId('download').href = dataset.file;
  byId('download').hidden = false;
  byId('feature-list').value = String(feature.id);
  return dataset;
}
function updateFeatureList() {
  for (const feature of map.querySourceFeatures('geodata', { sourceLayer: 'features' })) {
    visibleFeatures.set(String(feature.id), feature);
  }
  const select = byId('feature-list');
  const previous = select.value;
  select.replaceChildren(new Option('Pilih fitur…', ''));
  for (const [id, feature] of visibleFeatures) {
    if (currentDataset === 'all' || feature.properties.dataset === currentDataset) {
      select.add(new Option(feature.properties.Nama || `Fitur ${id}`, id));
    }
  }
  select.value = [...select.options].some(option => option.value === previous) ? previous : '';
  select.disabled = select.options.length <= 1;
  if (select.disabled) select.options[0].textContent = 'Belum ada fitur pada area ini';
}
async function start() {
  const response = await fetch('catalog.json');
  if (!response.ok) throw new Error(`Metadata tidak tersedia (HTTP ${response.status}). Jalankan npm run build.`);
  catalog = await response.json();
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
      { id: 'areas', type: 'fill', source: 'geodata', 'source-layer': 'features', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': '#12643e', 'fill-opacity': .32 } },
      { id: 'outlines', type: 'line', source: 'geodata', 'source-layer': 'features', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'line-color': '#12643e', 'line-width': 2 } },
      { id: 'lines', type: 'line', source: 'geodata', 'source-layer': 'features', filter: ['==', ['geometry-type'], 'LineString'], paint: { 'line-color': '#12643e', 'line-width': 4 } },
      { id: 'points', type: 'circle', source: 'geodata', 'source-layer': 'features', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-color': '#12643e', 'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 } }
    ] }
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
  map.on('error', event => {
    console.error(event.error);
    announceError(event.sourceId === 'basemap' ? 'Basemap gagal dimuat. Data vektor tetap dapat ditampilkan.' : 'Sebagian data peta gagal dimuat. Periksa koneksi lalu muat ulang halaman.');
  });
  map.on('sourcedata', event => {
    if (event.sourceId !== 'geodata' || !event.coord) return;
    const { z, x, y } = event.coord.canonical;
    const link = byId('tile-request');
    link.href = `tiles/${z}/${x}/${y}.pbf`; link.textContent = `tiles/${z}/${x}/${y}.pbf`; link.hidden = false;
  });
  map.on('idle', () => {
    updateFeatureList();
    const selected = catalog.datasets.find(item => item.id === currentDataset);
    const count = selected ? selected.count : catalog.datasets.reduce((sum, item) => sum + item.count, 0);
    status.textContent = `${selected?.name || 'Semua data'} · ${count} fitur sumber. Peta siap dijelajahi.`;
  });
  map.on('click', event => {
    const feature = map.queryRenderedFeatures(event.point, { layers: layerIds })[0];
    if (!feature) return;
    const dataset = showFeature(feature);
    popup?.remove();
    const content = document.createElement('div');
    const title = document.createElement('h3'); title.textContent = feature.properties.Nama || 'Tanpa nama';
    const description = document.createElement('p'); description.textContent = `${dataset.name} · ${feature.properties.geometry_type}`;
    content.append(title, description);
    popup = new maplibregl.Popup().setLngLat(event.lngLat).setDOMContent(content).addTo(map);
  });
  map.on('mousemove', event => { map.getCanvas().style.cursor = map.queryRenderedFeatures(event.point, { layers: layerIds }).length ? 'pointer' : ''; });
  map.on('load', () => {
    const select = byId('dataset');
    select.replaceChildren(new Option('Semua data', 'all'));
    for (const dataset of catalog.datasets) select.add(new Option(dataset.name, dataset.id));
    select.disabled = false; byId('reset').disabled = false;
    byId('tile-summary').textContent = `${catalog.tileCount} file MVT · zoom ${catalog.minzoom}–${catalog.maxzoom}. Zoom lebih dekat menggunakan tile level tertinggi.`;
    fit(catalog.bounds);
  });
  byId('dataset').addEventListener('change', event => {
    currentDataset = event.target.value;
    popup?.remove(); byId('feature-detail').replaceChildren(); byId('selection-hint').hidden = false;
    const selected = catalog.datasets.find(item => item.id === currentDataset);
    status.textContent = `Memuat ${selected?.name || 'semua data'}…`;
    byId('download').hidden = !selected;
    if (selected) byId('download').href = selected.file;
    for (const id of layerIds) {
      const type = id === 'points' ? 'Point' : id === 'lines' ? 'LineString' : 'Polygon';
      const geometry = ['==', ['geometry-type'], type];
      map.setFilter(id, selected ? ['all', geometry, ['==', ['get', 'dataset'], selected.id]] : geometry);
    }
    fit(selected?.bounds || catalog.bounds); updateFeatureList();
  });
  byId('reset').addEventListener('click', () => fit(catalog.datasets.find(item => item.id === currentDataset)?.bounds || catalog.bounds));
  byId('tile-grid').addEventListener('change', event => { map.showTileBoundaries = event.target.checked; });
  byId('feature-list').addEventListener('change', event => {
    const feature = visibleFeatures.get(event.target.value);
    if (feature) { popup?.remove(); showFeature(feature); }
  });
}
start().catch(error => { console.error(error); status.textContent = 'Peta tidak dapat dimuat.'; announceError(error.message); });
