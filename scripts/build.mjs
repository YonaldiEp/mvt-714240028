import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';

const minzoom = 12;
const maxzoom = 18;
const datasets = JSON.parse(await readFile('datasets.json', 'utf8'));
const features = [];
const catalog = [];
const bounds = [180, 90, -180, -90];
function positions(coordinates, visit) {
  if (typeof coordinates[0] === 'number') visit(coordinates);
  else coordinates.forEach(value => positions(value, visit));
}
for (const dataset of datasets) {
  if (!/^[a-z0-9-]+$/.test(dataset.id) || catalog.some(item => item.id === dataset.id)) {
    throw new Error(`ID dataset tidak valid atau duplikat: ${dataset.id}`);
  }
  const data = JSON.parse(await readFile(dataset.file, 'utf8'));
  if (data.type !== 'FeatureCollection' || !data.features?.length) throw new Error(`Dataset kosong: ${dataset.file}`);
  const extent = [180, 90, -180, -90];
  for (const [index, feature] of data.features.entries()) {
    if (!['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) {
      throw new Error(`Geometri tidak didukung: ${dataset.file}, fitur ${index + 1}`);
    }
    positions(feature.geometry.coordinates, point => {
      const [lon, lat] = point;
      if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 85.05112878) {
        throw new Error(`Koordinat tidak valid: ${dataset.file}`);
      }
      extent[0] = Math.min(extent[0], lon); extent[1] = Math.min(extent[1], lat);
      extent[2] = Math.max(extent[2], lon); extent[3] = Math.max(extent[3], lat);
    });
    features.push({ ...feature, id: features.length + 1, properties: {
      ...feature.properties, dataset: dataset.id, geometry_type: feature.geometry.type
    }});
  }
  bounds[0] = Math.min(bounds[0], extent[0]); bounds[1] = Math.min(bounds[1], extent[1]);
  bounds[2] = Math.max(bounds[2], extent[2]); bounds[3] = Math.max(bounds[3], extent[3]);
  catalog.push({ ...dataset, bounds: extent, count: data.features.length });
}
const index = geojsonvt({ type: 'FeatureCollection', features }, { maxZoom: maxzoom, tolerance: 1, extent: 4096 });
function tileXY(lon, lat, z) {
  const size = 2 ** z;
  const rad = lat * Math.PI / 180;
  return [Math.floor((lon + 180) / 360 * size), Math.floor((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2 * size)];
}
await rm('dist', { recursive: true, force: true });
await mkdir('dist/vendor', { recursive: true });
for (const file of ['index.html', 'index.js', 'style.css']) await cp(file, `dist/${file}`);
for (const dataset of datasets) await cp(dataset.file, `dist/${dataset.file}`);
for (const file of ['maplibre-gl.mjs', 'maplibre-gl-shared.mjs', 'maplibre-gl-worker.mjs', 'maplibre-gl.css']) {
  await cp(`node_modules/maplibre-gl/dist/${file}`, `dist/vendor/${file}`);
}
await cp('node_modules/maplibre-gl/LICENSE.txt', 'dist/vendor/maplibre-LICENSE.txt');
let count = 0;
for (let z = minzoom; z <= maxzoom; z++) {
  const [west, south] = tileXY(bounds[0], bounds[1], z);
  const [east, north] = tileXY(bounds[2], bounds[3], z);
  for (let x = west; x <= east; x++) {
    await mkdir(`dist/tiles/${z}/${x}`, { recursive: true });
    for (let y = north; y <= south; y++) {
      const tile = index.getTile(z, x, y) ?? { features: [] };
      await writeFile(`dist/tiles/${z}/${x}/${y}.pbf`, vtpbf.fromGeojsonVt({ features: tile }, { version: 2 }));
      count++;
    }
  }
}
await writeFile('dist/tiles.json', JSON.stringify({ tilejson: '3.0.0', name: 'GeoTiles', scheme: 'xyz',
  tiles: ['tiles/{z}/{x}/{y}.pbf'], minzoom, maxzoom, bounds,
  vector_layers: [{ id: 'features', fields: { Nama: 'String', dataset: 'String', geometry_type: 'String' } }]
}, null, 2));
await writeFile('dist/catalog.json', JSON.stringify({ datasets: catalog, bounds, minzoom, maxzoom, tileCount: count }, null, 2));
await writeFile('dist/.nojekyll', '');
console.log(`GeoTiles: ${features.length} fitur, ${catalog.length} dataset, ${count} tile (z${minzoom}-${maxzoom}) → dist/`);
