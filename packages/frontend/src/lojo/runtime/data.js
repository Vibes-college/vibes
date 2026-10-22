/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { activityGuides } from './activity-guides.js';
export const area = { name: '深圳 · 下沙', center: [114.0162, 22.5257], zoom: 14.7 };
const image = name => '/lojo-assets/assets/' + name + '.jpg';
export const places = [
{ id: 'noodles', name: '阿婆的热汤面', kind: '烟火小店', category: '正餐', price: 18, rating: '推荐', image: image('noodles'), coord: [114.0125, 22.527], distance: '步行 6 分钟', tag: '一个人也要好好吃饭', detail: '一碗热汤面，加一颗溏心蛋。下班晚了，也想给自己留一点热乎气。', dish: '招牌热汤面', hours: '11:00—22:00', reviews: 28, note: '面可以选软硬，汤底清淡。小满在这里留下了她的下班晚餐。' },
{ id: 'dumplings', name: '转角手作蒸饺', kind: '烟火小店', category: '正餐', price: 22, rating: '推荐', image: image('dumplings'), coord: [114.0176, 22.5294], distance: '步行 8 分钟', tag: '碳水的快乐，刚刚好', detail: '热气腾腾的一笼饺子，配一碗小米粥。适合给忙了一天的自己放个小假。', dish: '鲜虾蒸饺', hours: '07:00—21:30', reviews: 16, note: '两个人点两笼可以交换口味，辣椒另外放。' },
{ id: 'coffee', name: '日落之前咖啡', kind: '歇一歇', category: '咖啡', price: 28, rating: '推荐', image: image('cafe'), coord: [114.0223, 22.5275], distance: '步行 12 分钟', tag: '窗边的位置，留给发呆', detail: '带一本读到一半的书，坐在窗边等太阳慢慢落下来。这里有适合一个人待着的角落。', dish: '桂花拿铁', hours: '09:00—20:00', reviews: 34, note: '下午的光很好，户外座位在演示里标记为宠物友好。', pet: true },
{ id: 'bakery', name: '一口面包屋', kind: '歇一歇', category: '甜点', price: 16, rating: '推荐', image: image('bakery'), coord: [114.0188, 22.523], distance: '步行 5 分钟', tag: '今天的小确幸，刚出炉', detail: '散步时顺路买一只面包，明天的早餐也有了着落。', dish: '黄油可颂', hours: '08:00—20:30', reviews: 12, note: '推荐趁热吃，口味记录来自虚构邻居。' },
{ id: 'slow', name: '慢慢餐桌', kind: '好好犒劳', category: '正餐', price: 168, rating: '推荐', image: image('fine'), coord: [114.025, 22.531], distance: '步行 18 分钟', tag: '把普通的一天，过成纪念日', detail: '偶尔也可以认真地安排一顿饭。慢慢吃，慢慢聊天，留下一点值得记住的时间。', dish: '当季双人分享餐', hours: '17:30—22:00', reviews: 9, note: '适合纪念日。菜单与价格都是体验数据。' },
{ id: 'sushi', name: '海边的小料理', kind: '好好犒劳', category: '正餐', price: 128, rating: '一般', image: image('sushi'), coord: [114.0256, 22.5245], distance: '步行 15 分钟', tag: '给周五晚上一点期待', detail: '下班后和朋友一起吃一顿，不赶时间。', dish: '主厨寿司拼盘', hours: '12:00—22:00', reviews: 21, note: '示例评价有分歧：摆盘漂亮，但份量偏小。' },
{ id: 'salad', name: '小满食堂', kind: '烟火小店', category: '正餐', price: 26, rating: '推荐', image: image('meal'), coord: [114.0148, 22.5236], distance: '步行 4 分钟', tag: '好好吃饭，也照顾好自己', detail: '蔬菜、主食和一点蛋白质，组成朴素又满足的一餐。', dish: '时蔬能量碗', hours: '10:30—20:30', reviews: 19, note: '份量适中，午间在演示中标记为比较忙。' },
{ id: 'pizza', name: '街角披萨实验室', kind: '烟火小店', category: '正餐', price: 48, rating: '一般', image: image('pizza'), coord: [114.0108, 22.5303], distance: '步行 10 分钟', tag: '找个搭子，分享最后一块', detail: '适合两个人分一张饼，边吃边聊今天的小事。', dish: '玛格丽特披萨', hours: '11:00—23:00', reviews: 14, note: '示例评价：口味不错，但晚间等候比较久。' },
{ id: 'beans', name: '小巷豆子', kind: '歇一歇', category: '咖啡', price: 20, rating: '推荐', image: image('coffee'), coord: [114.021, 22.5323], distance: '步行 14 分钟', tag: '醒来，从一杯香气开始', detail: '一杯不着急喝完的咖啡，一条慢慢走回家的路。', dish: '每日手冲', hours: '08:30—19:00', reviews: 8, note: '支持自带杯的示例小店。', pet: true },
{ id: 'brunch', name: '半日小院', kind: '好好犒劳', category: '咖啡', price: 88, rating: '推荐', image: image('cafe'), coord: [114.029, 22.529], distance: '步行 20 分钟', tag: '周末，把半天留给自己', detail: '迟一点的早餐，久一点的聊天。周末可以有另一种节奏。', dish: '双人早午餐', hours: '09:30—18:00', reviews: 23, note: '院子里有户外桌，可带宠物的设定属于演示。', pet: true },
{ id: 'sweet', name: '云朵甜品', kind: '歇一歇', category: '甜点', price: 36, rating: '避雷', image: image('bakery'), coord: [114.019, 22.535], distance: '步行 17 分钟', tag: '看看大家怎么说，再决定', detail: '喜欢甜食，也值得知道不同的体验。', dish: '当日甜点', hours: '12:00—21:00', reviews: 7, note: '虚构避雷样例：展示图片与份量落差，便于体验评价筛选。' },
{ id: 'bowl', name: '晚归小饭桌', kind: '烟火小店', category: '正餐', price: 24, rating: '推荐', image: image('meal'), coord: [114.0095, 22.524], distance: '步行 11 分钟', tag: '再晚回家，也有一顿热饭', detail: '忙了一整天，把晚饭这件小事照顾好。', dish: '家常双拼饭', hours: '16:00—23:30', reviews: 17, note: '一人食示例，菜单会随着故事变化。' }];
export const animals = [
{ id: 'ju', name: '橘长', aliases: ['店长', '小橘', '便利店老板'], species: '猫咪', photo: image('cat'), sticker: '/lojo-assets/assets/cat-sticker.png', color: 'apricot', coord: [114.0178, 22.5265], place: '下沙 · 便利店附近', mood: '今天有点好奇', traits: ['亲人但慢热', '爱晒太阳', '喜欢纸箱'], neighbors: 12, meetings: 38, story: '它常坐在店门口，认真地看着每一个经过的人。邻居们说，这家店真正的老板其实是它。' },
{ id: 'rice', name: '年糕', aliases: ['小白', '团子'], species: '猫咪', photo: image('cat2'), sticker: '/lojo-assets/assets/rice-sticker.png', color: 'sage', coord: [114.023, 22.53], place: '下沙 · 小院附近', mood: '懒洋洋晒太阳', traits: ['安静', '喜欢窗台'], neighbors: 8, meetings: 21, story: '总是能找到最暖的一束光，睡得比谁都踏实。' },
{ id: 'pepper', name: '胡椒', aliases: ['小黑'], species: '猫咪', photo: image('cat3'), sticker: '/lojo-assets/assets/pepper-sticker.png', color: 'lilac', coord: [114.012, 22.529], place: '下沙 · 花店附近', mood: '认真观察路人', traits: ['独立', '夜晚出没'], neighbors: 6, meetings: 14, story: '花店的安静邻居，靠近时请给它留一点距离。' },
{ id: 'bread', name: '吐司', aliases: ['大金毛', '开心果'], species: '狗狗', photo: image('dog'), sticker: '/lojo-assets/assets/bread-sticker.png', color: 'sand', coord: [114.0206, 22.5237], place: '下沙 · 散步小径', mood: '今天也很开心', traits: ['热情', '散步爱好者'], neighbors: 15, meetings: 29, story: '和主人散步时，总会停下来，认真闻一闻这个世界。' }];
export const observations = [
{ id: 'o1', animal: 'ju', author: '小满', initial: '满', date: '10月1日 17:42', mood: '好奇', text: '今天在门口看我拆快递，歪着头看了好久。先蹲下来等了一会，它才慢慢靠近。', likes: 8 },
{ id: 'o2', animal: 'ju', author: '阿澄', initial: '澄', date: '9月29日 12:10', mood: '放松', text: '我叫它店长。午后喜欢趴在纸箱旁晒太阳，今天没有打扰它。', likes: 12 },
{ id: 'o3', animal: 'ju', author: '路过的栗子', initial: '栗', date: '9月27日 19:06', mood: '警惕', text: '刚下过雨，躲在屋檐下。看到有人经过会抬头，但不太想被摸。', likes: 5 }];
export const posts = [
{ id: 'p1', author: '小满', initial: '满', time: '20 分钟前', topic: '好好吃饭', text: '18 块的一碗面，把今天的疲惫都接住了。喜欢这些不张扬的小店，灯亮着，就觉得日子还不错。', image: image('noodles'), place: 'noodles', likes: 24, replies: 6 },
{ id: 'p2', author: '阿澄', initial: '澄', time: '1 小时前', topic: '街坊图鉴', text: '又碰到橘长了，今天的表情特别认真。原来你们叫它“店长”！下次见到，也来给它补一条记录吧。', image: image('cat'), animal: 'ju', likes: 42, replies: 12 },
{ id: 'p3', author: '周末慢一点', initial: '慢', time: '2 小时前', topic: '一起散步', text: '整理了一条下沙半日散步路线：先吃午饭，再去喝咖啡，最后沿河走一走。全程不用赶时间。', image: image('park'), place: 'coffee', likes: 18, replies: 4 },
{ id: 'p4', author: '栗子', initial: '栗', time: '3 小时前', topic: '好好吃饭', text: '有时候一顿认真做的早餐，就能把一天重新打开。今天尝试带着自己的杯子买咖啡。', image: image('coffee'), place: 'beans', likes: 11, replies: 3 }];
export const guides = [...activityGuides,
{ id: 'walk', title: '把半天，交给下沙', subtitle: '一顿热饭、一杯咖啡、一段不赶时间的散步。', image: image('park'), label: '半日旅行', places: ['noodles', 'coffee', 'bakery'], steps: ['12:00 · 先吃一碗热汤面', '14:00 · 在咖啡店歇一歇', '16:00 · 买面包，慢慢回家'], price: 62 },
{ id: 'budget', title: '30 元内，好好吃饭', subtitle: '工作日的一人食，也值得被认真对待。', image: image('noodles'), label: '吃饭攻略', places: ['noodles', 'dumplings', 'salad', 'bowl'], steps: ['热汤面 · ¥18', '手作蒸饺 · ¥22', '时蔬能量碗 · ¥26', '家常双拼饭 · ¥24'], price: 30 },
{ id: 'pets', title: '和毛茸茸的邻居打个招呼', subtitle: '慢一点靠近，用一次观察认识它。', image: image('cat2'), label: '邻里指南', places: ['coffee', 'brunch'], steps: ['保持距离，先观察动物的反应', '拍下相遇，确认已有的公共档案', '记录当时的行为，不替它定义一辈子的性格'], price: 0 }];
