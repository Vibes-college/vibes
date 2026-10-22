/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createEnvironment, document as mapDocument, window as mapWindow, location as mapLocation, setTimeout as mapTimeout} from '../../src/lojo/runtime/environment.js';

function fixture() {
 class Node extends EventTarget {
  constructor(tag, ownerDocument) { super(); this.tagName=tag; this.ownerDocument=ownerDocument; this.children=[]; this.style={}; }
  append(...nodes) { this.children.push(...nodes); }
  insertBefore(node) { this.children.push(node); if(node.tagName==='link')queueMicrotask(()=>node.onload()); }
  replaceChildren(...nodes) { this.children=nodes; }
  querySelector(selector) { return {scope:'map',selector}; }
  querySelectorAll(selector) { return [{scope:'map',selector}]; }
  getElementById(id) { return {scope:'map',id}; }
  scrollTo(x,y) { this.scrollTop=y; }
 }
 const view=new EventTarget(); view.location={hash:'',pathname:'/lojo',hostname:'localhost'}; view.innerWidth=1000;view.innerHeight=800;
 const real={defaultView:view,body:{className:'misskey'},title:'Community'};
 real.createElement=tag=>new Node(tag,real);
 const root=new Node('shadow-root',real);root.host={clientWidth:700,clientHeight:600};return {root,real,view};
}

test('map DOM, body, scrolling and title are isolated from Misskey',async()=>{
 const {root,real}=fixture(); const env=await createEnvironment(root);
 assert.deepEqual(mapDocument.querySelector('#app'),{scope:'map',selector:'#app'});
 assert.notEqual(mapDocument.body,real.body);
 mapDocument.body.className='is-housing';mapDocument.title='楼栋';mapWindow.scrollTo(0,90);
 assert.equal(real.body.className,'misskey');assert.equal(real.title,'Community');assert.equal(mapWindow.scrollY,90);
 assert.equal(mapWindow.innerWidth,700);assert.equal(mapWindow.innerHeight,600);
 mapLocation.hash='map/pets';assert.equal(real.defaultView.location.hash,'map/pets');
 assert.throws(()=>{mapLocation.pathname='/';});
 env.dispose();assert.equal(root.children.length,0);
});

test('page leave removes listeners and pending work, then permits a clean remount',async()=>{
 const {root,view}=fixture();let clicks=0,resizes=0,timers=0;const env=await createEnvironment(root);
 mapDocument.addEventListener('click',()=>clicks++);mapWindow.addEventListener('resize',()=>resizes++);
 root.dispatchEvent(new Event('click'));view.dispatchEvent(new Event('resize'));assert.equal(clicks,1);assert.equal(resizes,1);
 env.pause();root.dispatchEvent(new Event('click'));assert.equal(clicks,1);env.resume();root.dispatchEvent(new Event('click'));assert.equal(clicks,2);
 mapTimeout(()=>timers++,5);env.dispose();root.dispatchEvent(new Event('click'));view.dispatchEvent(new Event('resize'));
 await new Promise(resolve=>setTimeout(resolve,15));assert.equal(timers,0);assert.equal(clicks,2);assert.equal(resizes,1);
 const next=await createEnvironment(root);mapDocument.addEventListener('click',()=>clicks++);root.dispatchEvent(new Event('click'));assert.equal(clicks,3);next.dispose();
});

test('simultaneous mounts cannot share one user workspace',async()=>{
 const a=fixture(),b=fixture();const env=await createEnvironment(a.root);await assert.rejects(createEnvironment(b.root),/already active/);env.dispose();
 const next=await createEnvironment(b.root);next.dispose();
});

test('native modal portals share scoped events and queries, then detach cleanly',async()=>{
 const {root,real}=fixture();const env=await createEnvironment(root);
 const portal=real.createElement('dialog');portal.id='dialog';portal.matches=selector=>selector==='#dialog';
 const field={id:'dish'};portal.querySelector=selector=>selector==='#dish'?field:null;portal.querySelectorAll=()=>[field];
 root.querySelector=()=>null;root.querySelectorAll=()=>[];root.getElementById=()=>null;
 let events=0;const listener=()=>events++;
 mapDocument.addEventListener('submit',listener);env.registerPortal(portal);
 assert.equal(mapDocument.querySelector('#dialog'),portal);assert.equal(mapDocument.querySelector('#dish'),field);assert.equal(mapDocument.getElementById('dish'),field);
 portal.dispatchEvent(new Event('submit'));assert.equal(events,1);
 mapDocument.removeEventListener('submit',listener);portal.dispatchEvent(new Event('submit'));assert.equal(events,1);
 mapDocument.addEventListener('submit',listener);env.pause();portal.dispatchEvent(new Event('submit'));assert.equal(events,1);env.resume();
 env.unregisterPortal(portal);portal.dispatchEvent(new Event('submit'));assert.equal(events,1);assert.equal(mapDocument.querySelector('#dish'),null);
 env.registerPortal(portal);env.dispose();portal.dispatchEvent(new Event('submit'));assert.equal(events,1);
});
