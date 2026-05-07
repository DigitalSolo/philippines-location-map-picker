export function normalizeBounds(bounds) {
  if (!bounds) return null;
  if (Array.isArray(bounds) && bounds.length >= 4) {
    return { south: Number(bounds[0]), west: Number(bounds[1]), north: Number(bounds[2]), east: Number(bounds[3]) };
  }
  if (typeof bounds === 'object') {
    return { south: Number(bounds.south), west: Number(bounds.west), north: Number(bounds.north), east: Number(bounds.east) };
  }
  return null;
}

export function boundsCenter(bounds) {
  const b = normalizeBounds(bounds);
  if (!b) return null;
  return { lat: (b.south + b.north) / 2, lng: (b.west + b.east) / 2 };
}

export function boundsContains(bounds, lat, lng) {
  const b = normalizeBounds(bounds);
  return !!b && lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;
}
