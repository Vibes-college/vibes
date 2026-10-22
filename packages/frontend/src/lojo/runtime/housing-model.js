/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { housingAreas, housingBuildings, housingReferences, housingContacts } from './housing-data.js';
import { validDateRange } from './event-dates.js';

const catalogDefault = { areas: housingAreas, buildings: housingBuildings, references: housingReferences, contacts: housingContacts };
const visible = entry => entry?.selection === 'sample' || entry?.selection === 'selected';
const contactVisible = entry => entry?.status === 'sample' || entry?.status === 'active';
const amountKnown = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const text = value => String(value ?? '').trim();
const uniqueIds = values => [...new Set((Array.isArray(values) ? values : []).filter(value => typeof value === 'string' && value.trim()))];
const referencesOf = catalog => catalog.references ?? catalog.listings ?? [];

export const areaById = (id, areas = housingAreas) => areas.find(area => area.id === id);
export const buildingById = (id, buildings = housingBuildings) => buildings.find(building => building.id === id);
export const referenceById = (id, references = housingReferences) => references.find(reference => reference.id === id);
// Kept for previously saved notes and legacy routes. It never implies inventory.
export const listingById = referenceById;
export const contactById = (id, contacts = housingContacts) => contacts.find(contact => contact.id === id);

export function contactsForBuilding(id, role = 'all', catalog = catalogDefault) {
 const building = buildingById(id, catalog.buildings);
 if (!building || !visible(building) || !visible(areaById(building.areaId, catalog.areas))) return [];
 return (catalog.contacts ?? []).filter(contact => contactVisible(contact)
  && (!role || role === 'all' || contact.role === role)
  && ((contact.buildingIds ?? []).includes(id) || (contact.areaIds ?? []).includes(building.areaId)));
}

// Historical rent and required fixed monthly charges belong in this number.
// Deposits, optional services and metered usage remain separate. No current quote
// or availability is inferred from a historical amount.
export function monthlyCost(reference) {
 let cents = 0;
 const unknownLabels = [];
 if (amountKnown(reference?.rent))cents += Math.round(reference.rent * 100);
 else unknownLabels.push('租金');
 if (!Array.isArray(reference?.monthlyFees))unknownLabels.push('每月固定费用');
 else for (const fee of reference.monthlyFees) {
  if (fee?.mandatory === false) continue;
  const label = text(fee?.label) || '固定费用';
  if (amountKnown(fee?.amount))cents += Math.round(fee.amount * 100);
  else unknownLabels.push(label);
 }
 return { knownTotal: cents / 100, complete: unknownLabels.length === 0, unknownLabels: [...new Set(unknownLabels)] };
}

// The map is a collection of building histories. A building remains visible even
// without historical references. Explicit rent/layout/mode filters describe only
// matching historical records, and never consult an availability field.
export function selectHousing(filter = {}, state = {}, catalog = catalogDefault) {
 const rawBudget = filter.budgetMax;
 const budgetSet = rawBudget !== null && rawBudget !== undefined && rawBudget !== '' && rawBudget !== 'all';
 const budget = budgetSet ? Number(rawBudget) : null;
 if (budgetSet && (!Number.isFinite(budget) || budget < 0)) return [];
 const saved = new Set(Array.isArray(state.housingSaved) ? state.housingSaved : []);
 const mode = filter.mode === '整租' ? 'whole' : filter.mode === '合租' ? 'shared' : filter.mode;
 const layoutSet = filter.layout && filter.layout !== 'all', modeSet = mode && mode !== 'all';
 const hasReferenceFilter = budgetSet || layoutSet || modeSet;
 return catalog.buildings.flatMap(building => {
  const area = areaById(building.areaId, catalog.areas);
  if (!visible(building) || !visible(area)) return [];
  if (filter.area && filter.area !== 'all' && building.areaId !== filter.area) return [];
  if (filter.elevator && building.elevator !== true) return [];
  if (filter.pet && building.pet !== true) return [];
  if (filter.saved && !saved.has(building.id)) return [];
  const contacts = contactsForBuilding(building.id, 'all', catalog);
  if (filter.contact && filter.contact !== 'all' && !contacts.some(contact => contact.role === filter.contact)) return [];
  const references = referencesOf(catalog).filter(reference => {
   if (reference.buildingId !== building.id) return false;
   if (layoutSet && reference.layout !== filter.layout) return false;
   if (modeSet && reference.mode !== mode) return false;
   if (budgetSet) {const cost = monthlyCost(reference); if (!cost.complete || cost.knownTotal > budget) return false;}
   return true;
  });
  if (hasReferenceFilter && !references.length) return [];
  return [{ building, area, references, listings: references, contacts, costs: references.map(reference => ({ referenceId: reference.id, listingId: reference.id, ...monthlyCost(reference) })) }];
 });
}

function toggleId(ids, id, max) {
 const value = text(id);
 if (!value) throw new Error('请选择楼栋');
 const next = uniqueIds(ids);
 if (next.includes(value)) return next.filter(item => item !== value);
 if (max && next.length >= max) throw new Error('最多比较 3 栋楼，请先移除一栋');
 return [...next, value];
}

export const toggleHousingSaved = (ids, id) => toggleId(ids, id);
export const toggleHousingCompare = (ids, id) => toggleId(ids, id, 3);

export const HOUSING_CHECKLIST = Object.freeze([
 { id: 'light', label: '采光' },
 { id: 'noise', label: '噪音' },
 { id: 'leaks', label: '漏水与潮湿' },
 { id: 'utilities', label: '水电及固定费用' },
 { id: 'deposit', label: '押金与退款条件' },
 { id: 'contract', label: '合同与出租方' },
 { id: 'internet', label: '网络' },
 { id: 'elevator', label: '电梯' },
 { id: 'common', label: '公共环境' },
].map(item => Object.freeze(item)));

function bounded(value, max, label) {const result = text(value); if (result.length > max) throw new Error(`${label}不能超过 ${max} 字`); return result;}

function timestamp(now) {const date = new Date(now); if (!Number.isFinite(+date)) throw new Error('时间无效'); return date.toISOString();}

function validatedReference(values, building, catalog) {
 const referenceId = text(Object.hasOwn(values, 'referenceId') ? values.referenceId : values.listingId) || null;
 if (referenceId) {const reference = referenceById(referenceId, referencesOf(catalog)); if (!reference || reference.buildingId !== building.id) throw new Error('历史参考与楼栋不匹配');}
 return referenceId;
}

export function makeHousingNote(values = {}, { now = new Date(), catalog = catalogDefault } = {}) {
 const building = buildingById(values.buildingId, catalog.buildings);
 if (!building || !visible(building)) throw new Error('请选择楼栋');
 const referenceId = validatedReference(values, building, catalog);
 const date = text(values.date);
 if (date && !validDateRange(date, date)) throw new Error('请选择有效的看房日期');
 const allowed = new Set(HOUSING_CHECKLIST.map(item => item.id));
 const updatedAt = timestamp(now);
 return {
  id: bounded(values.id, 120, '记录编号') || `housing-note-${building.id}-${new Date(now).getTime()}`,
  buildingId: building.id, referenceId, listingId: referenceId, date,
  note: bounded(values.note, 2000, '看房记录'),
  checkedIds: uniqueIds(values.checkedIds).filter(id => allowed.has(id)),
  status: 'private', local: true, updatedAt,
 };
}

export function makeContactDraft(values = {}, { now = new Date(), catalog = catalogDefault } = {}) {
 const building = buildingById(values.buildingId, catalog.buildings);
 if (!building || !visible(building)) throw new Error('请选择楼栋');
 const contactId = text(values.contactId);
 const contact = contactsForBuilding(building.id, 'all', catalog).find(entry => entry.id === contactId);
 if (!contact) throw new Error('联系人与楼栋不匹配');
 const referenceId = validatedReference(values, building, catalog);
 const updatedAt = timestamp(now);
 return {
  id: bounded(values.id, 120, '草稿编号') || `housing-contact-${building.id}-${contactId}-${new Date(now).getTime()}`,
  buildingId: building.id, referenceId, contactId, message: bounded(values.message, 2000, '联系内容'),
  status: 'draft', local: true, updatedAt,
 };
}

export function makeHousingLead(values = {}, { now = new Date(), catalog = catalogDefault } = {}) {
 const name = bounded(values.name, 80, '名称');
 const address = bounded(values.address, 200, '地址');
 const reason = bounded(values.reason, 1000, '线索理由');
 if (!name) throw new Error('请填写名称');
 if (!address) throw new Error('请填写地址');
 if (!reason) throw new Error('请写下值得了解的原因');
 // Old private drafts may still use "listing"; normalize them into history.
 const type = values.type === 'listing' ? 'history' : values.type || 'building';
 if (!['building', 'area', 'history'].includes(type)) throw new Error('请选择有效的线索类型');
 const areaId = text(values.areaId) || null;
 if (areaId && !areaById(areaId, catalog.areas)) throw new Error('请选择有效的街区');
 return {
  id: bounded(values.id, 120, '草稿编号') || `housing-lead-${new Date(now).getTime()}`,
  name, address, type, reason, areaId,
  status: 'draft', selection: 'candidate', verified: false, local: true, updatedAt: timestamp(now),
 };
}
