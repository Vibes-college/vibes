/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { places, animals } from './data.js';
import { housingBuildings, housingReferences, housingContacts } from './housing-data.js';
import { events } from './events.js';
import { travelRoutes } from './travel-data.js';
const clone = value => JSON.parse(JSON.stringify(value));
const catalogs = { housing: housingBuildings, food: places, pets: animals, events, travel: travelRoutes };
const pristine = Object.fromEntries(Object.entries(catalogs).map(([type, items]) => [type, clone(items)]));
const referenceSeed = clone(housingReferences), contactSeed = clone(housingContacts);

// Only a known entity's existing display schema is accepted here. Creating new
// schemas and footprints remains a separate content-curation operation.
function mergeShape(base, update) {
 if (update === undefined) return clone(base);
 if (base !== null && (update === null || typeof base !== typeof update || Array.isArray(base) !== Array.isArray(update))) return clone(base);
 if (typeof update === 'number') return Number.isFinite(update) ? update : base;
 if (typeof update === 'string') {
  // The preserved templates contain both text and attributes. Catalog display
  // fields do not accept markup or quotes that could introduce new attributes.
  if (/[<>"\u0000]/u.test(update) || update.length > 20000) return base;
  if (/^(?:javascript|data|vbscript):/iu.test(update.trim())) return base;
  return update.replace(/^\/(assets|icons)\//u, '/lojo-assets/$1/');
 }
 if (typeof update === 'boolean' || update === null) return update;
 if (Array.isArray(base)) {
  if (!Array.isArray(update)) return clone(base);
  if (!base.length) return [];
  return update.slice(0, 200).map((item, index) => mergeShape(base[index] ?? base[0], item));
 }
 if (base && typeof base === 'object' && update && typeof update === 'object' && !Array.isArray(update)) {
  return Object.fromEntries(Object.keys(base).map(key => [key, mergeShape(base[key], update[key])]));
 }
 return clone(base);
}

function validEntity(entity) {
 return entity && ['demo', 'curated'].includes(entity.status) &&
  Number.isFinite(entity.lat) && Math.abs(entity.lat) <= 90 && Number.isFinite(entity.lng) && Math.abs(entity.lng) <= 180 &&
  entity.data && typeof entity.data === 'object';
}

export function hydrateCatalog(entities) {
 const authoritative = Array.isArray(entities);
 const byId = new Map((entities || []).filter(validEntity).map(entity => [entity.id, entity]));
 for (const [type, target] of Object.entries(catalogs)) {
  const next = pristine[type].flatMap(seed => {
   const entry = byId.get(type + ':' + seed.id);
   if (!entry) return authoritative ? [] : [clone(seed)];
   const merged = mergeShape(seed, entry.data);
   merged.id = seed.id; merged.coord = [entry.lng, entry.lat];
   if (type === 'food')merged.dish = mergeShape(seed.dish, entry.title);
   else merged.name = mergeShape(seed.name, entry.title);
   if (type === 'housing') {merged.geometry = clone(seed.geometry); merged.geometryId = seed.geometryId;}
   return [merged];
  });
  target.splice(0, target.length, ...next);
 }
 const buildings = new Set(housingBuildings.map(item => item.id));
 const references = referenceSeed.filter(item => buildings.has(item.buildingId)).map(seed => {
  const update = byId.get('housing:' + seed.buildingId)?.data?.references?.find?.(item => item.id === seed.id);
  return { ...mergeShape(seed, update), id: seed.id, buildingId: seed.buildingId };
 });
 housingReferences.splice(0, housingReferences.length, ...references);
 const contacts = contactSeed.map(seed => {
  const update = [...byId.values()].filter(item => item.type === 'housing').flatMap(item => Array.isArray(item.data.contacts) ? item.data.contacts : []).find(item => item.id === seed.id);
  return { ...mergeShape(seed, update), id: seed.id };
 });
 housingContacts.splice(0, housingContacts.length, ...contacts);
 return Object.fromEntries(Object.entries(catalogs).map(([type, items]) => [type, items.length]));
}
