/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* global performance:readonly, ResizeObserver:readonly */
import { document, window, setTimeout, clearTimeout, requestAnimationFrame, cancelAnimationFrame } from './environment.js';
const DAY_COLORS = ['#2340A3', '#E8603F', '#B8871B', '#3F8F86', '#8A5BB0'];
const POOL_COLOR = '#8a908d';
const EMPTY_GEOJSON = () => ({ type: 'FeatureCollection', features: [] });
const CITY_CENTERS = {
  深圳: [114.0579, 22.5431], 广州: [113.2644, 23.1291],
  惠州: [114.4162, 23.1118], 汕尾: [115.3753, 22.7862],
  香港: [114.1694, 22.3193], 珠海: [113.5767, 22.2707],
  佛山: [113.1214, 23.0215], 东莞: [113.7518, 23.0207],
  中山: [113.3928, 22.5176], 江门: [113.0819, 22.5787],
  清远: [113.056, 23.6818], 厦门: [118.0894, 24.4798],
  长沙: [112.9388, 28.2282], 杭州: [120.1551, 30.2741],
  上海: [121.4737, 31.2304], 北京: [116.4074, 39.9042],
  成都: [104.0665, 30.5723], 重庆: [106.5516, 29.5630],
};

function coordinate(value) {
  return Array.isArray(value) && value.length >= 2 &&
    Number.isFinite(value[0]) && Number.isFinite(value[1]) &&
    Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 85.051129
    ? [value[0], value[1]] : null;
}

function destinationCenter(trip) {
  const explicit = coordinate(trip?.destination?.coord) ||
    coordinate(trip?.destinationCoord) || coordinate(trip?.coord);
  if (explicit) return explicit;
  const name = typeof trip?.destination === 'string' ? trip.destination :
    trip?.destination?.name || trip?.city || '';
  const city = Object.keys(CITY_CENTERS).find(key => name.includes(key));
  return CITY_CENTERS[city] || CITY_CENTERS.深圳;
}

function duration(ms) {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : ms;
}

/** An isolated map for the editable itinerary; it never changes ExploreMap. */
export class PlannerMap {
  constructor(container, { onSelect, onPick } = {}) {
    this.container = container;
    this.onSelect = onSelect;
    this.onPick = onPick;
    this.map = null;
    this.trip = null;
    this.target = 'all';
    this.selectedId = null;
    this.loaded = false;
    this.destroyed = false;
    this.picking = false;
    this.markers = new Map();
    this.points = [];
    this.geometryKey = '';
    this.fitPending = true;
    this.suppressPickUntil = 0;
    this.leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.leaders.classList.add('planner-marker-leaders');
    this.leaders.setAttribute('aria-hidden', 'true');
    this.onLayout = () => this.layout();
    this.onLoad = () => {
      if (this.destroyed) return;
      this.loaded = true;
      clearTimeout(this.loadTimer);
      this.removeError();
      this.styleMap();
      this.render();
      this.scheduleFit();
    };
    this.onError = () => {
      if (!this.loaded && !this.destroyed) this.showError();
    };
    this.onDragStart = () => { this.dragging = true; };
    this.onDragEnd = () => {
      this.dragging = false;
      this.suppressPickUntil = performance.now() + 120;
    };
    this.onMapClick = event => {
      if (!this.picking || this.dragging || this.destroyed ||
          performance.now() < this.suppressPickUntil ||
          event.originalEvent?.defaultPrevented ||
          event.originalEvent?.target?.closest?.('.planner-pin, .maplibregl-ctrl')) return;
      const coord = coordinate([event.lngLat.lng, event.lngLat.lat]);
      if (coord) this.onPick?.(coord);
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
      const map = this.map = new window.maplibregl.Map({
        container: this.container,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: destinationCenter(this.trip), zoom: 11,
        attributionControl: false, dragRotate: false, pitch: 0,
        clickTolerance: 4,
      });
      map.touchZoomRotate?.disableRotation();
      map.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new window.maplibregl.AttributionControl({ compact: true }), 'bottom-right');
      map.on('load', this.onLoad);
      map.on('error', this.onError);
      map.on('click', this.onMapClick);
      map.on('dragstart', this.onDragStart);
      map.on('dragend', this.onDragEnd);
      map.on('move', this.onLayout);
      map.on('resize', this.onLayout);
      this.container.append(this.leaders);
      this.setPicking(this.picking);
      this.loadTimer = setTimeout(() => {
        if (!this.loaded && !this.destroyed) this.showError();
      }, 12000);
    } catch {
      this.showError();
    }
  }

  styleMap() {
    for (const layer of this.map.getStyle()?.layers || []) {
      if (layer.type === 'fill' && layer.id === 'water') this.map.setPaintProperty(layer.id, 'fill-color', '#dce9df');
      if (layer.id === 'background') this.map.setPaintProperty(layer.id, 'background-color', '#f5f4e9');
      if (layer.type === 'symbol' && layer.layout?.['text-field']) this.map.setLayoutProperty(layer.id, 'text-field',
          ['coalesce', ['get', 'name:zh'], ['get', 'name'], ['get', 'name_en'], '']);
    }
  }

  setTrip(trip, target = 'all', selectedId = null) {
    if (this.destroyed) return;
    this.trip = trip;
    this.target = target;
    this.selectedId = selectedId;
    const points = [];
    const lines = [];
    const seen = new Set();
    const add = (id, dayIndex, number, color, pool = false) => {
      const stop = trip?.stops?.[id];
      const coord = coordinate(stop?.coord);
      if (!stop || !coord || seen.has(id)) return null;
      seen.add(id);
      points.push({ id, name: stop.name || '未命名地点', coord, dayIndex, number, color, pool });
      return coord;
    };
    for (const [dayIndex, day] of (trip?.days || []).entries()) {
      if (target !== 'all' && target !== day.id) continue;
      const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
      const coords = [];
      for (const [index, id] of (day.stopIds || []).entries()) {
        const point = add(id, dayIndex, index + 1, color);
        if (point) coords.push(point);
      }
      if (coords.length >= 2) lines.push({
        type: 'Feature', properties: { color, dayId: day.id },
        geometry: { type: 'LineString', coordinates: coords },
      });
    }
    if (target === 'all' || target === 'pool') for (const id of trip?.pool || []) add(id, -1, null, POOL_COLOR, true);
    this.points = points;
    this.lineData = { type: 'FeatureCollection', features: lines };
    // Selection, notes, cost, and place-name edits do not reset the camera.
    const key = JSON.stringify([
      trip?.id, target, destinationCenter(trip),
      points.map(point => [point.id, point.coord]),
    ]);
    const geometryChanged = key !== this.geometryKey;
    this.geometryKey = key;
    this.render();
    if (geometryChanged) this.scheduleFit();
  }

  render() {
    if (!this.loaded || !this.map || this.destroyed) return;
    const visibleIds = new Set(this.points.map(point => point.id));
    for (const [id, entry] of this.markers) {
      if (visibleIds.has(id)) continue;
      entry.marker.remove();
      this.markers.delete(id);
    }
    for (const point of this.points) {
      let entry = this.markers.get(point.id);
      if (!entry) {
        const el = document.createElement('button');
        el.type = 'button';
        el.dataset.stopId = point.id;
        const number = document.createElement('span');
        const name = document.createElement('strong');
        el.append(number, name);
        el.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          if (this.destroyed) return;
          if (this.picking) {
            const current = this.points.find(item => item.id === point.id);
            if (current) this.onPick?.([...current.coord]);
          } else this.onSelect?.(point.id);
        });
        el.addEventListener('dblclick', event => event.stopPropagation());
        const marker = new window.maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(point.coord).addTo(this.map);
        entry = { marker, el, number, name };
        this.markers.set(point.id, entry);
      }
      const selected = point.id === this.selectedId;
      // MapLibre adds its own absolute-positioning and anchor classes. Keep them:
      // replacing className puts pins back into normal flow before translation.
      entry.el.classList.add('planner-pin');
      entry.el.classList.toggle('is-selected', selected);
      entry.el.classList.toggle('is-pool', point.pool);
      entry.el.style.setProperty('--day-color', point.color);
      entry.el.setAttribute('aria-label', point.pool ? '想去：' + point.name :
        `第 ${point.dayIndex + 1} 天，第 ${point.number} 站：${point.name}`);
      entry.el.setAttribute('aria-pressed', String(selected));
      entry.number.textContent = point.pool ? '•' : String(point.number);
      entry.name.textContent = point.name;
      entry.name.hidden = !selected;
      entry.marker.setLngLat(point.coord);
    }
    const data = this.lineData || EMPTY_GEOJSON();
    const source = this.map.getSource('planner-route');
    if (source) source.setData(data);
    else {
      this.map.addSource('planner-route', { type: 'geojson', data });
      this.map.addLayer({
        id: 'planner-route-halo', type: 'line', source: 'planner-route',
        paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.85 },
      });
      this.map.addLayer({
        id: 'planner-route-line', type: 'line', source: 'planner-route',
        paint: { 'line-color': ['get', 'color'], 'line-width': 3, 'line-dasharray': [1.5, 1.5] },
      });
    }
    this.layout();
  }

  layout() {
    if (!this.map || this.destroyed || !this.loaded) return;
    const width = this.container.clientWidth, height = this.container.clientHeight;
    if (!width || !height) return;
    this.leaders.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.leaders.setAttribute('width', width);
    this.leaders.setAttribute('height', height);
    const mobile = window.innerWidth <= 760;
    const tabs = this.container.closest('.planner-workspace')?.querySelector('.planner-day-tabs');
    const tabsBottom = mobile && tabs?.offsetParent
      ? tabs.getBoundingClientRect().bottom - this.container.getBoundingClientRect().top : 0;
    const placed = [], lines = [];
    for (const point of this.points) {
      const entry = this.markers.get(point.id);
      if (!entry) continue;
      const position = this.map.project(point.coord);
      // Panning off the itinerary should not pin distant places to the viewport edge.
      if (position.x < 0 || position.x > width || position.y < 0 || position.y > height) {
        entry.el.style.visibility = 'hidden';
        continue;
      }
      entry.el.style.visibility = '';
      const radius = (entry.el.offsetWidth || 33) / 2;
      const minX = radius + 8, maxX = width - radius - 8;
      const minY = Math.max(radius + 8, tabsBottom + radius + 5);
      const maxY = Math.max(minY, height - radius - (mobile ? 68 : 25));
      let best = null;
      for (let ring = 0; ring <= 6; ring++) {
        const count = ring ? ring * 8 : 1;
        for (let step = 0; step < count; step++) {
          const angle = step / count * Math.PI * 2;
          const x = Math.max(minX, Math.min(maxX, position.x + Math.cos(angle) * ring * 38));
          const y = Math.max(minY, Math.min(maxY, position.y + Math.sin(angle) * ring * 38));
          const overlaps = placed.filter(other =>
            Math.hypot(x - other.x, y - other.y) < Math.max(38, radius + other.radius + 4) - .01).length;
          const score = overlaps * 1e7 + (x - position.x) ** 2 + (y - position.y) ** 2;
          if (!best || score < best.score) best = { x, y, radius, overlaps, score };
        }
        if (best?.overlaps === 0) break;
      }
      placed.push(best);
      const dx = best.x - position.x, dy = best.y - position.y;
      entry.marker.setOffset([dx, dy]);
      const distance = Math.hypot(dx, dy);
      if (distance > radius + 3) {
        const endX = best.x - dx / distance * radius;
        const endY = best.y - dy / distance * radius;
        lines.push(`<line x1="${position.x}" y1="${position.y}" x2="${endX}" y2="${endY}"/><circle cx="${position.x}" cy="${position.y}" r="2.5"/>`);
      }
    }
    this.leaders.innerHTML = lines.join('');
  }

  scheduleFit() {
    this.fitPending = true;
    cancelAnimationFrame(this.fitFrame);
    this.fitFrame = requestAnimationFrame(() => this.fit());
  }

  fit() {
    if (!this.loaded || !this.map || this.destroyed ||
        !this.container.clientWidth || !this.container.clientHeight) return;
    this.fitPending = false;
    const padding = Math.min(72, Math.max(36, this.container.clientWidth * 0.14), this.container.clientHeight * 0.2);
    const mobile = window.innerWidth <= 760;
    const camera = { padding: mobile
      ? { top: Math.min(150, this.container.clientHeight * .4), bottom: Math.min(82, this.container.clientHeight * .2), left: 42, right: 42 }
      : { top: padding, bottom: padding, left: padding, right: padding }, duration: duration(420) };
    this.map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
    if (!this.points.length) {
      this.map.easeTo({ center: destinationCenter(this.trip), zoom: 11, ...camera });
    } else if (this.points.length === 1 || this.points.every(point =>
      point.coord[0] === this.points[0].coord[0] && point.coord[1] === this.points[0].coord[1])) {
      this.map.easeTo({ center: this.points[0].coord, zoom: 14.5, ...camera });
    } else {
      const bounds = new window.maplibregl.LngLatBounds();
      this.points.forEach(point => bounds.extend(point.coord));
      this.map.fitBounds(bounds, { ...camera, maxZoom: 15.5 });
    }
  }

  focus(id) {
    const point = this.points.find(item => item.id === id);
    if (!point || !this.loaded || !this.map || this.destroyed) return;
    cancelAnimationFrame(this.fitFrame);
    this.fitPending = false;
    this.map.easeTo({ center: point.coord, zoom: Math.max(this.map.getZoom(), 14.5),
      padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: duration(350) });
  }

  setPicking(value) {
    this.picking = Boolean(value);
    this.container.classList.toggle('planner-map-picking', this.picking);
    if (this.map) this.map.getCanvas().style.cursor = this.picking ? 'crosshair' : '';
  }

  resize() {
    if (!this.map || this.destroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const changed = width !== this.lastWidth || height !== this.lastHeight;
    this.lastWidth = width;
    this.lastHeight = height;
    this.map.resize();
    if (width && height && (changed || this.fitPending)) this.scheduleFit();
  }

  showError() {
    if (this.destroyed || this.errorElement) return;
    const error = document.createElement('div');
    error.className = 'planner-map-error';
    error.setAttribute('role', 'status');
    error.append(document.createTextNode('地图暂时无法加载'));
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = '重试';
    retry.onclick = () => {
      this.removeError();
      this.disposeMap();
      this.start();
    };
    error.append(retry);
    this.container.append(error);
    this.errorElement = error;
  }

  removeError() {
    this.errorElement?.remove();
    this.errorElement = null;
  }

  disposeMap() {
    clearTimeout(this.loadTimer);
    cancelAnimationFrame(this.fitFrame);
    for (const entry of this.markers.values()) entry.marker.remove();
    this.markers.clear();
    this.leaders.innerHTML = '';
    if (this.map) {
      this.map.off('load', this.onLoad);
      this.map.off('error', this.onError);
      this.map.off('click', this.onMapClick);
      this.map.off('dragstart', this.onDragStart);
      this.map.off('dragend', this.onDragEnd);
      this.map.off('move', this.onLayout);
      this.map.off('resize', this.onLayout);
      this.map.remove();
    }
    this.map = null;
    this.loaded = false;
    this.dragging = false;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.observer?.disconnect();
    this.disposeMap();
    this.leaders.remove();
    this.removeError();
    this.container.classList.remove('planner-map-picking');
  }
}
