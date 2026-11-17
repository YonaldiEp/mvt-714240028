import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { VectorTile } from '@mapbox/vector-tile';
import Pbf from 'pbf';

test('MVT dapat didekode, seluruh fitur sumber tersedia, dan katalog sesuai', async () => {
  const catalog = JSON.parse(await readFile('dist/catalog.json', 'utf8'));
  const metadata = JSON.parse(await readFile('dist/tiles.json', 'utf8'));
  assert.deepEqual(metadata.bounds, catalog.bounds);
  assert.deepEqual(metadata.tiles, ['tiles/{z}/{x}/{y}.pbf']);
  const found = new Map();
  let count = 0;
  for (let z = catalog.minzoom; z <= catalog.maxzoom; z++) {
    for (const x of await readdir(`dist/tiles/${z}`)) {
      for (const filename of await readdir(`dist/tiles/${z}/${x}`)) {
        const tile = new VectorTile(new Pbf(await readFile(`dist/tiles/${z}/${x}/${filename}`)));
        const layer = tile.layers.features;
        count++;
        if (!layer) continue;
        assert.equal(layer.version, 2);
        assert.equal(layer.extent, 4096);
        for (let i = 0; i < layer.length; i++) {
          const feature = layer.feature(i);
          assert.ok([1, 2, 3].includes(feature.type));
          assert.ok(feature.properties.dataset);
          assert.ok(feature.loadGeometry().length);
          if (z === catalog.maxzoom) found.set(feature.id, feature);
        }
      }
    }
  }
  assert.equal(count, catalog.tileCount);
  let expected = 0;
  for (const dataset of catalog.datasets) {
    const source = JSON.parse(await readFile(dataset.file, 'utf8'));
    assert.equal(dataset.count, source.features.length);
    for (const feature of source.features) {
      const decoded = found.get(++expected);
      assert.ok(decoded, `Fitur sumber ${expected} harus tersedia pada zoom maksimum`);
      assert.equal(decoded.properties.Nama, feature.properties.Nama);
      assert.equal(decoded.properties.dataset, dataset.id);
      assert.equal(decoded.properties.geometry_type, feature.geometry.type);
      const expectedType = /Polygon$/.test(feature.geometry.type) ? 3 : /LineString$/.test(feature.geometry.type) ? 2 : 1;
      assert.equal(decoded.type, expectedType);
    }
  }
  assert.equal(found.size, expected);
});
