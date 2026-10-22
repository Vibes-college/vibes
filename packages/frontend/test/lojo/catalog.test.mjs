/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {hydrateCatalog} from '../../src/lojo/runtime/catalog.js';
import {places} from '../../src/lojo/runtime/data.js';
import {housingBuildings,housingReferences} from '../../src/lojo/runtime/housing-data.js';
const entity=(type,id,data,extra={})=>({id:type+':'+id,type,title:data.name||data.dish,status:'demo',lng:114,lat:22,data,...extra});
test('server catalog controls existing map records and removed entries do not reappear',()=>{
 hydrateCatalog();const seed=structuredClone(places.find(p=>p.id==='coffee'));
 const result=hydrateCatalog([entity('food','coffee',{...seed,price:32},{title:'新桂花拿铁'})]);
 assert.equal(result.food,1);assert.equal(places[0].dish,'新桂花拿铁');assert.equal(places[0].price,32);assert.equal(housingBuildings.length,0);
 hydrateCatalog([]);assert.equal(places.length,0);
 hydrateCatalog();assert.equal(places.length,12);assert.equal(places.find(p=>p.id==='coffee').price,28);
});
test('catalog rejects invalid coordinates and untrusted display shapes',()=>{
 hydrateCatalog();const seed=structuredClone(places[0]);
 hydrateCatalog([entity('food',seed.id,{...seed,price:'free',name:'<img src=x onerror=alert(1)>'},{title:'安全菜名'})]);
 assert.equal(places[0].price,seed.price);assert.equal(places[0].name,seed.name);
 hydrateCatalog([entity('food',seed.id,seed,{lat:Infinity})]);assert.equal(places.length,0);hydrateCatalog();
});
test('building references are updated from its entity while stable geometry is retained',()=>{
 hydrateCatalog();const seed=structuredClone(housingBuildings[0]),reference=structuredClone(housingReferences[0]);
 hydrateCatalog([entity('housing',seed.id,{...seed,geometry:{height:9000},references:[{...reference,rent:2100}]})]);
 assert.equal(housingBuildings[0].geometry.height,seed.geometry.height);assert.equal(housingReferences[0].rent,2100);
 assert.ok(housingReferences.every(item=>item.buildingId===seed.id));hydrateCatalog();
});
