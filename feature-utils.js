export function geometryLabel(type) {
  if (type?.includes('Polygon')) return 'Area';
  if (type?.includes('LineString')) return 'Garis';
  return 'Titik';
}

export function filterFeatures(records, dataset, query) {
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('id-ID');
  const search = normalize(query.trim());
  return [...records].filter(({ feature }) =>
    (dataset === 'all' || feature.properties.dataset === dataset) &&
    normalize(feature.properties.Nama || 'Tanpa nama').includes(search)
  ).sort((a, b) => String(a.feature.properties.Nama || '').localeCompare(String(b.feature.properties.Nama || ''), 'id-ID') || a.feature.id - b.feature.id);
}

export function featureBounds(geometry) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  function visit(coordinates) {
    if (typeof coordinates[0] === 'number') {
      bounds[0] = Math.min(bounds[0], coordinates[0]); bounds[1] = Math.min(bounds[1], coordinates[1]);
      bounds[2] = Math.max(bounds[2], coordinates[0]); bounds[3] = Math.max(bounds[3], coordinates[1]);
    } else coordinates.forEach(visit);
  }
  visit(geometry.coordinates);
  return bounds.every(Number.isFinite) ? bounds : null;
}
