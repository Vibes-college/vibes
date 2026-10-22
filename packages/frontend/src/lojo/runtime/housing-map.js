/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* global ResizeObserver:readonly */
import { document, window, setTimeout, clearTimeout, requestAnimationFrame, cancelAnimationFrame } from './environment.js';
const SOURCE = 'housing-footprints';
const LAYERS = ['housing-context-fill', 'housing-context-line', 'housing-data-fill',
  'housing-selected-halo', 'housing-data-line', 'housing-mass', 'housing-selected-line'];
const EMPTY = () => ({ type: 'FeatureCollection', features: [] });
const OVERVIEW_ZOOM = 15.4;
const STYLE = `
.housing-marker-leaders{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden}
.housing-marker-leaders line{stroke:#668575;stroke-width:1.25;stroke-opacity:.65}
.housing-marker-leaders circle{fill:#496e58;stroke:#fff;stroke-width:1}
.housing-price-marker,.housing-area-marker{display:flex;align-items:center;gap:7px;width:max-content;max-width:190px;padding:8px 10px;border:1px solid #b7c7b4;border-radius:12px;background:#fffef8;color:#264b39;box-shadow:0 3px 12px #24473420;font-family:inherit;font-size:12px;font-weight:600;line-height:1.15;cursor:pointer;white-space:nowrap;z-index:2;touch-action:manipulation}
.housing-price-marker strong,.housing-area-marker strong{font-size:12px;font-weight:750;max-width:145px;overflow:hidden;text-overflow:ellipsis}
.housing-price-marker{flex-direction:column;align-items:flex-start;gap:4px}
.housing-price-marker strong{font-size:12px;line-height:1.25;min-width:0;max-width:164px;overflow:hidden;text-overflow:ellipsis;text-align:left}
.housing-price-marker small,.housing-area-marker small{font-size:10px;font-weight:550;color:#647562}
.housing-price-marker small{flex-shrink:0;line-height:1.35;white-space:pre-line;text-align:left;font-size:10px}
.housing-price-marker.is-selected{background:#355c47;border-color:#355c47;color:#fff;box-shadow:0 4px 15px #24473438;z-index:5}
.housing-price-marker.is-selected small{color:#e2ecd9}
.housing-price-marker:focus-visible,.housing-area-marker:focus-visible{outline:3px solid #cc9142;outline-offset:3px}
.housing-area-marker{padding:11px 13px;border-radius:15px;gap:9px}
.housing-area-marker strong{font-size:13px}
.housing-area-marker small{border-left:1px solid #d3ddce;padding-left:9px}
.housing-map-error{position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);padding:16px 18px;background:#fffef9;border:1px solid #d2dccf;border-radius:16px;box-shadow:0 8px 30px #283c3820;z-index:9;display:flex;align-items:center;gap:12px;white-space:nowrap;font-size:13px}
.housing-map-error button{border:0;border-radius:9px;padding:8px 10px;background:var(--MI_THEME-cta,#355c47);color:white;cursor:pointer}
@media(max-width:760px){.housing-price-marker{max-width:162px;padding:7px 8px;gap:5px}.housing-price-marker strong{max-width:132px}}
`;

function coord(value) {
  return Array.isArray(value) && value.length >= 2 && Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) && Math.abs(value[0]) <= 180 && Math.abs(value[1]) < 85.052
    ? [value[0], value[1]] : null;
}

function motion(ms) {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : ms;
}

function positive(value) {
  if (value === null || value === '' || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

/** Independent housing map. Sources, markers, and camera survive UI updates. */
export class HousingMap {
  constructor(container, { onSelect, onArea } = {}) {
    this.container = container;
    this.onSelect = onSelect;
    this.onArea = onArea;
    this.buildings = [];
    this.areas = [];
    this.geometry = EMPTY();
    this.selectedId = null;
    this.areaId = null;
    this.view = '2d';
    this.layer = 'history';
    this.surroundings = false;
    this.markers = new Map();
    this.areaMarkers = new Map();
    this.geometryKey = '';
    this.fitPending = true;
    this.loaded = false;
    this.destroyed = false;
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = STYLE;
    this.leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.leaders.classList.add('housing-marker-leaders');
    this.leaders.setAttribute('aria-hidden', 'true');
    this.onLayout = () => this.layout();
    this.onLoad = () => {
      if (this.destroyed) return;
      this.loaded = true;
      clearTimeout(this.loadTimer);
      this.removeError();
      this.styleMap();
      this.render();
      this.applyView(false);
      if (this.pendingFocusId || this.selectedId) {
        const id = this.pendingFocusId || this.selectedId;
        this.pendingFocusId = null;
        requestAnimationFrame(() => this.focus(id));
      } else this.scheduleFit();
    };
    this.onError = () => { if (!this.loaded && !this.destroyed) this.showError(); };
    this.onMapClick = event => {
      if (this.destroyed || !this.loaded || event.originalEvent?.defaultPrevented ||
          event.originalEvent?.target?.closest?.('.housing-price-marker,.housing-area-marker,.maplibregl-ctrl')) return;
      const hit = this.hit(event.point);
      if (hit) this.onSelect?.(hit);
    };
    this.onMouseMove = event => {
      if (!this.loaded || this.destroyed) return;
      this.map.getCanvas().style.cursor = this.hit(event.point) ? 'pointer' : '';
    };
    this.start();
    if (window.ResizeObserver) {
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(container);
    }
  }

  start() {
    if (this.destroyed) return;
    try {
      if (!window.maplibregl) throw new Error('MapLibre unavailable');
      this.map = new window.maplibregl.Map({
        container: this.container,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [114.019, 22.528], zoom: 15.5, pitch: 0, maxPitch: 55,
        attributionControl: false, dragRotate: false, clickTolerance: 4,
      });
      this.map.touchZoomRotate?.disableRotation();
      this.map.touchPitch?.disable();
      this.map.addControl(new window.maplibregl.NavigationControl({ showCompass: true }), 'top-right');
      this.map.addControl(new window.maplibregl.AttributionControl({ compact: true }), 'bottom-right');
      this.map.on('load', this.onLoad);
      this.map.on('error', this.onError);
      this.map.on('click', this.onMapClick);
      this.map.on('mousemove', this.onMouseMove);
      this.map.on('move', this.onLayout);
      this.map.on('resize', this.onLayout);
      this.container.append(this.styleElement, this.leaders);
      this.loadTimer = setTimeout(() => {
        if (!this.loaded && !this.destroyed) this.showError();
      }, 12000);
    } catch {
      this.container.append(this.styleElement);
      this.showError();
    }
  }

  styleMap() {
    for (const layer of this.map.getStyle()?.layers || []) {
      if (layer.id === 'background') this.map.setPaintProperty(layer.id, 'background-color', '#f3f2e8');
      if (layer.id === 'water' && layer.type === 'fill') this.map.setPaintProperty(layer.id, 'fill-color', '#dde8de');
      if (layer.type === 'fill' && /building/i.test(layer.id)) {
        this.map.setPaintProperty(layer.id, 'fill-color', '#d8dcd2');
        this.map.setPaintProperty(layer.id, 'fill-opacity', .24);
      }
      if (layer.type === 'fill-extrusion') this.map.setLayoutProperty(layer.id, 'visibility', 'none');
      if (layer.type === 'symbol' && layer.layout?.['text-field']) this.map.setLayoutProperty(layer.id, 'text-field',
          ['coalesce', ['get', 'name:zh'], ['get', 'name'], ['get', 'name_en'], '']);
    }
    this.map.setLight?.({ anchor: 'viewport', color: '#fff9ec', intensity: .48, position: [1.5, 210, 45] });
  }

  setData({ buildings = [], selectedId = null, geometry = EMPTY(), areas = [],
    areaId = null, view = '2d', surroundings = false, layer = 'history' } = {}) {
    if (this.destroyed) return;
    const changedView = this.view !== view;
    this.buildings = buildings.filter(item => item && item.id != null && coord(item.coord));
    this.areas = areas.filter(item => item && item.id != null);
    if (this.selectedId !== selectedId) this.pendingFocusId = null;
    this.selectedId = selectedId;
    this.geometry = geometry?.type === 'FeatureCollection' ? geometry : EMPTY();
    this.areaId = areaId;
    this.view = view === '3d' ? '3d' : '2d';
    this.surroundings = Boolean(surroundings);
    this.layer = layer === 'records' ? 'records' : 'history';
    const key = JSON.stringify([areaId, this.buildings.map(item => [item.id, item.coord])]);
    const changedScope = key !== this.geometryKey;
    this.geometryKey = key;
    this.render();
    if (changedScope) this.scheduleFit();
    else if (changedView) this.applyView();
  }

  footprintData() {
    const byGeometry = new Map();
    for (const item of this.buildings) {
      if (item.geometryId != null) byGeometry.set(String(item.geometryId), item);
    }
    const features = [];
    for (const feature of this.geometry.features || []) {
      if (!feature?.geometry || !['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) continue;
      const props = feature.properties || {};
      const building = byGeometry.get(String(props.id ?? feature.id)) || byGeometry.get(String(props.osmId));
      const height = positive(props.height);
      features.push({ ...feature, properties: { ...props,
        lojoId: building ? String(building.id) : '',
        lojoData: Boolean(building),
        lojoSelected: Boolean(building && building.id === this.selectedId),
        lojoHeight: height || 0,
        lojoRise: Boolean(height && (building || this.surroundings)),
      } });
    }
    return { type: 'FeatureCollection', features };
  }

  render() {
    if (!this.loaded || !this.map || this.destroyed) return;
    const data = this.footprintData();
    const source = this.map.getSource(SOURCE);
    if (source) source.setData(data);
    else {
      this.map.addSource(SOURCE, { type: 'geojson', data });
      // CARTO interleaves road and label layers. Inserting before its first
      // symbol paints later roads across the facade, so put our geometry above
      // the basemap and keep the solid extrusion last.
      const add = layer => this.map.addLayer({ ...layer, source: SOURCE });
      add({ id: LAYERS[0], type: 'fill', paint: { 'fill-color': '#c9d0c3', 'fill-opacity': .25 } });
      add({ id: LAYERS[1], type: 'line', paint: { 'line-color': '#bac4b6', 'line-width': .7, 'line-opacity': .52 } });
      add({ id: LAYERS[2], type: 'fill', filter: ['==', ['get', 'lojoData'], true], paint: {
        'fill-color': ['case', ['get', 'lojoSelected'], '#708e69', '#a6bba0'], 'fill-opacity': .8,
      } });
      add({ id: LAYERS[3], type: 'line', filter: ['==', ['get', 'lojoSelected'], true], paint: {
        'line-color': '#66885d', 'line-width': 10, 'line-opacity': .17,
      } });
      add({ id: LAYERS[4], type: 'line', filter: ['==', ['get', 'lojoData'], true], paint: {
        'line-color': '#678660', 'line-width': 1.7, 'line-opacity': .95,
      } });
      add({ id: LAYERS[5], type: 'fill-extrusion', filter: ['==', ['get', 'lojoRise'], true], paint: {
        'fill-extrusion-height': ['get', 'lojoHeight'], 'fill-extrusion-base': 0,
        'fill-extrusion-color': ['case', ['get', 'lojoSelected'], '#557c53', ['get', 'lojoData'], '#97b28a', '#d4dacb'],
        'fill-extrusion-opacity': 1, 'fill-extrusion-vertical-gradient': true,
      } });
      add({ id: LAYERS[6], type: 'line', filter: ['==', ['get', 'lojoSelected'], true], paint: {
        'line-color': '#375b3e', 'line-width': 2.5, 'line-opacity': 1,
      } });
      this.map.moveLayer(LAYERS[5]);
    }
    this.map.setLayoutProperty(LAYERS[5], 'visibility', this.view === '3d' ? 'visible' : 'none');
    this.renderMarkers();
    this.layout();
  }

  renderMarkers() {
    const visibleIds = new Set(this.buildings.map(item => item.id));
    for (const [id, entry] of this.markers) {
      if (!visibleIds.has(id)) { entry.marker.remove(); this.markers.delete(id); }
    }
    for (const building of this.buildings) {
      let entry = this.markers.get(building.id);
      if (!entry) {
        entry = this.makeMarker('housing-price-marker', building.id, () => this.onSelect?.(building.id));
        entry.el.dataset.buildingId = building.id;
        this.markers.set(building.id, entry);
      }
      entry.point = building.coord;
      entry.marker.setLngLat(building.coord);
      entry.el.classList.toggle('is-selected', building.id === this.selectedId);
      entry.el.classList.toggle('is-sample', building.selection === 'sample');
      entry.el.setAttribute('aria-pressed', String(building.id === this.selectedId));
      // A building is a lasting community archive, never a live inventory pin.
      // Whole-home and shared-home historical costs remain distinct.
      entry.title.textContent = building.label || building.name;
      const reference = String(building.referenceText || building.priceText || '').trim();
      entry.meta.textContent = this.layer === 'records'
        ? Number.isFinite(building.recordCount) ? `${building.recordCount} 条居住记录` : '居住档案'
        : reference ? (reference.includes('历史') ? reference : `历史 ${reference}`).replace(/\s+\/\s+/g, '\n') : '历史参考待补充';
      entry.meta.hidden = !entry.meta.textContent;
      const referenceCount = Number.isFinite(building.referenceCount) ? `，${building.referenceCount} 份历史参考` : '';
      entry.el.setAttribute('aria-label', `${building.name}，${entry.meta.textContent}${referenceCount}`);
    }
    const groups = this.groups();
    const groupIds = new Set(groups.map(group => group.id));
    for (const [id, entry] of this.areaMarkers) {
      if (!groupIds.has(id)) { entry.marker.remove(); this.areaMarkers.delete(id); }
    }
    for (const group of groups) {
      let entry = this.areaMarkers.get(group.id);
      if (!entry) {
        entry = this.makeMarker('housing-area-marker', group.id, () => {
          const current = this.groups().find(item => item.id === group.id);
          if (!current) return;
          this.onArea?.(group.id);
          this.fitPoints(current.buildings.map(item => item.coord), 17.3);
        });
        entry.el.dataset.areaId = group.id;
        this.areaMarkers.set(group.id, entry);
      }
      entry.point = group.coord;
      entry.marker.setLngLat(group.coord);
      entry.title.textContent = group.name;
      entry.meta.textContent = `${group.buildings.length} 栋`;
      entry.el.setAttribute('aria-label', `${group.name}，查看 ${group.buildings.length} 栋楼`);
    }
  }

  makeMarker(className, id, action) {
    const el = document.createElement('button');
    el.type = 'button';
    el.classList.add(className);
    const title = document.createElement('strong');
    const meta = document.createElement('small');
    el.append(title, meta);
    el.addEventListener('click', event => {
      event.preventDefault(); event.stopPropagation();
      if (!this.destroyed) action(id);
    });
    el.addEventListener('dblclick', event => event.stopPropagation());
    // Never replace className after addTo: MapLibre's positioning classes matter.
    const marker = new window.maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([0, 0]).addTo(this.map);
    return { marker, el, title, meta };
  }

  groups() {
    const groups = new Map();
    for (const building of this.buildings) {
      const id = building.areaId || building.area || this.areaId || 'housing';
      if (!groups.has(id)) {
        const area = this.areas.find(item => item.id === id);
        groups.set(id, { id, name: area?.name || (this.areas.length === 1 ? this.areas[0].name : '精选街区'),
          coord: coord(area?.coord || area?.center), buildings: [] });
      }
      groups.get(id).buildings.push(building);
    }
    return [...groups.values()].map(group => ({ ...group, coord: group.coord || group.buildings.reduce(
      (sum, building) => [sum[0] + building.coord[0] / group.buildings.length,
        sum[1] + building.coord[1] / group.buildings.length], [0, 0]) }));
  }

  hit(point) {
    const layers = [LAYERS[2], LAYERS[5], LAYERS[6]].filter(id => this.map.getLayer(id));
    if (!layers.length) return null;
    return this.map.queryRenderedFeatures(point, { layers }).find(feature => feature.properties?.lojoId)?.properties.lojoId || null;
  }

  viewport() {
    const width = this.container.clientWidth, height = this.container.clientHeight;
    const mobile = window.innerWidth <= 760;
    const bounds = this.container.getBoundingClientRect();
    const root = this.container.closest('.housing-page,.housing-screen') || this.container.parentElement;
    const panel = root?.querySelector('.housing-panel[data-open="true"],.housing-panel.is-open');
    let left = mobile ? 18 : 36, right = mobile ? 18 : 50;
    let top = Math.max(112, 170 - bounds.top), bottom = mobile ? 80 : 42;
    for (const toolbar of root?.querySelectorAll('.housing-toolbar,.housing-map-top') || []) {
      if (toolbar.offsetParent) top = Math.max(top, toolbar.getBoundingClientRect().bottom - bounds.top + 12);
    }
    if (panel && panel.offsetParent) {
      const parentBounds = panel.offsetParent.getBoundingClientRect();
      if (mobile) {
        const panelTop = parentBounds.top + panel.offsetTop - bounds.top;
        bottom = Math.max(bottom, height - panelTop + 16);
      } else {
        left = Math.max(left, parentBounds.left + panel.offsetLeft + panel.offsetWidth - bounds.left + 24);
      }
    }
    // Use the actual sheet boundary: inventing a larger visible map region
    // makes price labels and the selected building slide behind the sheet.
    top = Math.min(top, height * .38);
    bottom = Math.max(20, Math.min(bottom, height - top - 40));
    left = Math.min(left, width - right - 140);
    return { left: Math.max(12, left), right, top, bottom, width, height };
  }

  layout() {
    if (!this.loaded || !this.map || this.destroyed) return;
    const box = this.viewport();
    if (!box.width || !box.height) return;
    const overview = this.map.getZoom() < OVERVIEW_ZOOM && !this.selectedId;
    for (const entry of this.markers.values()) entry.el.style.display = overview ? 'none' : '';
    for (const entry of this.areaMarkers.values()) entry.el.style.display = overview ? '' : 'none';
    const entries = [...(overview ? this.areaMarkers : this.markers).entries()]
      .sort(([a], [b]) => Number(b === this.selectedId) - Number(a === this.selectedId));
    this.leaders.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    this.leaders.setAttribute('width', box.width);
    this.leaders.setAttribute('height', box.height);
    const placed = [], lines = [];
    const origin = this.container.getBoundingClientRect();
    const root = this.container.closest('.housing-page,.housing-screen') || this.container.parentElement;
    const obstacles = [...(root?.querySelectorAll('#housing-map-actions,.maplibregl-ctrl-top-right') || [])]
      .filter(element => element.offsetParent)
      .map(element => {
        const rect = element.getBoundingClientRect();
        return { x: rect.left - origin.left + rect.width / 2, y: rect.top - origin.top + rect.height / 2,
          w: rect.width / 2, h: rect.height / 2 };
      });
    for (const [id, entry] of entries) {
      const position = this.map.project(entry.point);
      // Offscreen homes stay offscreen; do not pin distant homes onto the edge.
      if (position.x < -30 || position.x > box.width + 30 || position.y < -30 || position.y > box.height + 30) {
        entry.el.style.visibility = 'hidden';
        continue;
      }
      entry.el.style.visibility = '';
      const w = (entry.el.offsetWidth || 110) / 2, h = (entry.el.offsetHeight || 32) / 2;
      const minX = box.left + w, maxX = Math.max(minX, box.width - box.right - w);
      const minY = box.top + h, maxY = Math.max(minY, box.height - box.bottom - h);
      let best;
      for (let ring = 0; ring <= 7; ring++) {
        const count = ring ? 12 : 1;
        for (let step = 0; step < count; step++) {
          const angle = step / count * Math.PI * 2;
          const x = Math.max(minX, Math.min(maxX, position.x + Math.cos(angle) * ring * 30));
          const y = Math.max(minY, Math.min(maxY, position.y + Math.sin(angle) * ring * 30 - (overview ? 0 : this.view === '3d' ? 44 : 25)));
          const overlaps = [...placed, ...obstacles].filter(other => Math.abs(x - other.x) < w + other.w + 7 &&
            Math.abs(y - other.y) < h + other.h + 7).length;
          const score = overlaps * 1e8 + (x - position.x) ** 2 + (y - position.y) ** 2;
          if (!best || score < best.score) best = { x, y, w, h, score, overlaps };
        }
        if (!best.overlaps) break;
      }
      if (best.overlaps && id !== this.selectedId) {
        entry.el.style.visibility = 'hidden';
        continue;
      }
      placed.push(best);
      const dx = best.x - position.x, dy = best.y - position.y;
      entry.marker.setOffset([dx, dy]);
      if (Math.abs(dx) > w + 4 || Math.abs(dy) > h + 4) {
        const extent = Math.max(Math.abs(dx) / w, Math.abs(dy) / h);
        const endX = best.x - dx / extent, endY = best.y - dy / extent;
        lines.push(`<line x1="${position.x}" y1="${position.y}" x2="${endX}" y2="${endY}"/><circle cx="${position.x}" cy="${position.y}" r="2.2"/>`);
      }
    }
    this.leaders.innerHTML = lines.join('');
  }

  applyView(animate = true) {
    if (!this.loaded || !this.map || this.destroyed) return;
    const three = this.view === '3d';
    if (three) { this.map.dragRotate?.enable(); this.map.touchZoomRotate?.enableRotation(); this.map.touchPitch?.enable(); } else { this.map.dragRotate?.disable(); this.map.touchZoomRotate?.disableRotation(); this.map.touchPitch?.disable(); }
    if (animate && this.selectedId) { this.focus(this.selectedId); return; }
    this.map.easeTo({ pitch: three ? 45 : 0, bearing: three ? -14 : 0, duration: animate ? motion(420) : 0 });
  }

  scheduleFit() {
    this.fitPending = true;
    cancelAnimationFrame(this.fitFrame);
    this.fitFrame = requestAnimationFrame(() => this.fit());
  }

  fitPoints(points, maxZoom = 17.35) {
    if (!this.loaded || !this.map || this.destroyed || !this.container.clientWidth || !this.container.clientHeight) return;
    const box = this.viewport();
    const extraY = Math.max(0, Math.min(26, (box.height - box.top - box.bottom - 64) / 2));
    const camera = { padding: { top: box.top + extraY, bottom: box.bottom + extraY, left: box.left + 42, right: box.right + 42 },
      pitch: this.view === '3d' ? 45 : 0, bearing: this.view === '3d' ? -14 : 0, duration: motion(440) };
    // fitBounds' padding persists in MapLibre unless cleared explicitly.
    this.map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
    if (!points.length) {
      const area = this.areas.find(item => item.id === this.areaId) || this.areas[0];
      this.map.easeTo({ center: coord(area?.coord || area?.center) || [114.019, 22.528], zoom: 15.5, ...camera });
    } else if (points.length === 1 || points.every(point => point[0] === points[0][0] && point[1] === points[0][1])) {
      this.map.easeTo({ center: points[0], zoom: maxZoom, ...camera });
    } else {
      const bounds = new window.maplibregl.LngLatBounds();
      points.forEach(point => bounds.extend(point));
      this.map.fitBounds(bounds, { ...camera, maxZoom });
    }
  }

  fit() {
    if (!this.loaded || !this.map || this.destroyed || !this.container.clientWidth || !this.container.clientHeight) return;
    this.fitPending = false;
    this.applyView(false);
    this.fitPoints(this.buildings.map(item => item.coord));
  }

  focus(id) {
    const building = this.buildings.find(item => item.id === id);
    if (!building || this.destroyed) return;
    if (!this.loaded || !this.map) { this.pendingFocusId = id; return; }
    cancelAnimationFrame(this.fitFrame);
    this.fitPending = false;
    const box = this.viewport();
    let zoom = Math.max(17.65, Math.min(19.2, this.map.getZoom()));
    let rise = 0;
    if (this.view === '3d') {
      const feature = this.geometry.features.find(item =>
        String(item.properties?.id ?? item.id) === String(building.geometryId) ||
        String(item.properties?.osmId) === String(building.geometryId));
      const height = positive(feature?.properties?.height);
      if (height) {
        // Frame the roof as well as the ground coordinate. MapLibre zoom uses
        // 512 px tiles; this is a camera estimate, never fabricated height data.
        const worldMetres = 78271.51696 * Math.cos(building.coord[1] * Math.PI / 180);
        // Perspective makes the nearer roof larger than a flat projection;
        // reserve additional headroom so tall buildings clear mobile controls.
        const projectedMetres = height * Math.sin(Math.PI / 4) * 1.45;
        const available = Math.max(70, box.height - box.top - box.bottom - 64);
        zoom = Math.min(zoom, Math.max(15.45, Math.log2(worldMetres * available / projectedMetres)));
        rise = Math.min(available, projectedMetres * 2 ** zoom / worldMetres);
      }
    }
    this.map.easeTo({ center: building.coord, zoom,
      pitch: this.view === '3d' ? 45 : 0, bearing: this.view === '3d' ? -14 : 0,
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
      offset: [(box.left - box.right) / 2, (box.top - box.bottom + rise) / 2], duration: motion(440) });
  }

  resize() {
    if (!this.map || this.destroyed) return;
    const width = this.container.clientWidth, height = this.container.clientHeight;
    const changed = width !== this.lastWidth || height !== this.lastHeight;
    this.lastWidth = width; this.lastHeight = height;
    this.map.resize();
    if (width && height && (changed || this.fitPending)) {
      if (this.selectedId && this.loaded) this.focus(this.selectedId);
      else this.scheduleFit();
    } else this.layout();
  }

  showError() {
    if (this.destroyed || this.errorElement) return;
    const error = document.createElement('div');
    error.className = 'housing-map-error';
    error.setAttribute('role', 'status');
    error.append(document.createTextNode('地图暂时无法加载'));
    const retry = document.createElement('button');
    retry.type = 'button'; retry.textContent = '重试';
    retry.onclick = () => { this.removeError(); this.disposeMap(); this.start(); };
    error.append(retry);
    this.container.append(error);
    this.errorElement = error;
  }

  removeError() { this.errorElement?.remove(); this.errorElement = null; }

  disposeMap() {
    clearTimeout(this.loadTimer);
    cancelAnimationFrame(this.fitFrame);
    for (const entry of this.markers.values()) entry.marker.remove();
    for (const entry of this.areaMarkers.values()) entry.marker.remove();
    this.markers.clear(); this.areaMarkers.clear(); this.leaders.innerHTML = '';
    if (this.map) {
      this.map.off('load', this.onLoad); this.map.off('error', this.onError);
      this.map.off('click', this.onMapClick); this.map.off('mousemove', this.onMouseMove);
      this.map.off('move', this.onLayout); this.map.off('resize', this.onLayout);
      this.map.remove();
    }
    this.map = null; this.loaded = false;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.observer?.disconnect(); this.disposeMap();
    this.leaders.remove(); this.styleElement.remove(); this.removeError();
  }
}
