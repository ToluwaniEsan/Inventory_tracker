export function getZoneByMarkerId(zonesData, markerId) {
  if (!zonesData?.zones || markerId == null) return null;
  return (
    zonesData.zones.find((z) => Number(z.markerId) === Number(markerId)) ?? null
  );
}

export function getZoneById(zonesData, zoneId) {
  if (!zonesData?.zones || !zoneId) return null;
  return zonesData.zones.find((z) => z.id === zoneId) ?? null;
}

export function pickPrimaryMarker(detections) {
  if (!detections?.length) return null;
  return detections.reduce((best, cur) => {
    if (!best) return cur;
    const bestArea = polygonArea(best.corners);
    const curArea = polygonArea(cur.corners);
    return curArea > bestArea ? cur : best;
  }, null);
}

function polygonArea(corners) {
  if (!corners?.length) return 0;
  let area = 0;
  for (let i = 0; i < corners.length; i++) {
    const j = (i + 1) % corners.length;
    area += corners[i].x * corners[j].y;
    area -= corners[j].x * corners[i].y;
  }
  return Math.abs(area / 2);
}

export function floorPlanUrl(filename) {
  if (!filename) return null;
  return `/api/room?file=${encodeURIComponent(filename)}`;
}

export function createZoneId(label) {
  const slug = String(label || "zone")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `zone-${slug || "new"}-${Date.now().toString(36)}`;
}
