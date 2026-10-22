/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { housingGeometry } from './housing-geometry.js';

// Only building geometry is real. Housing history, living experience and contacts
// below are fictional scenarios, never live inventory or verified endorsements.
export const housingAreas = [
 { id: 'xiasha', name: '下沙', selection: 'sample', sample: true, coord: [114.020, 22.529], image: '/lojo-assets/assets/street.jpg', focus: '通勤与日常生活的平衡', priorities: ['生活成本与居住体验一起看', '步行范围内的日常生活', '有来源、有日期的居住记录'], checks: ['主干道与巷内噪音差异', '楼间距与实际采光', '管理维护与出租方资质'], context: '下沙位于福田西南部，北靠滨河大道，东邻上沙。' },
 { id: 'shangsha', name: '上沙', selection: 'sample', sample: true, coord: [114.025, 22.5255], image: '/lojo-assets/assets/park.jpg', focus: '找到适合长期住下来的地方', priorities: ['整租与合租经验分开看', '公共空间与维护水平', '养宠与长期居住条件'], checks: ['通勤路径与晚间环境', '固定费用与押金条款', '电梯与公共区域维护'], context: '上沙与下沙相邻，居住楼栋类型不同，需逐栋评估。' }
];
const scenarios = [
 ['h1', 'xiasha', 'A', '紧凑独住', false, null, ['控制固定月费', '独住与通勤的平衡'], ['楼间距与低层采光要实看', '步梯搬运大件不方便'], ['重视预算的独住者', '能接受步梯'], ['真实采光、噪音和楼道维护', '出租方身份与当前费用']],
 ['h2', 'xiasha', 'B', '两人合住', null, true, ['两人共同分担居住成本', '历史参考包含整租与合租'], ['临街与朝向会影响体验', '养宠限制需要写入合同'], ['两人共同生活', '需要核实养宠条件'], ['电梯与公共区域实际情况', '晚间噪音和养宠条款']],
 ['h3', 'xiasha', 'C', '步梯生活', false, false, ['比较同一栋不同楼层的经历', '先了解长期居住成本'], ['高楼层搬家与上下楼的负担', '部分历史固定费用缺失'], ['愿意以步梯换取预算空间', '希望逐层比较采光'], ['实际水电和固定收费', '窗外遮挡、漏水与潮湿']],
 ['h4', 'xiasha', 'D', '小区合租', true, null, ['把公共空间与管理纳入比较', '合租经验与整租经验分开看'], ['合租人数与访客规则影响体验', '固定管理费需纳入月支出'], ['重视公共区域的合租者', '需要电梯'], ['维修响应与公共区域维护', '合租规则及出租方资格']],
 ['h5', 'shangsha', 'E', '第一间独居', false, true, ['独住入门的生活成本参考', '记录养宠与租住的相处经验'], ['步梯与楼层需要权衡', '不能只用白天看房判断噪音'], ['首次独居', '希望了解养宠限制'], ['白天与晚间的居住差异', '实际费用和养宠条款']],
 ['h6', 'shangsha', 'F', '两人整租', true, null, ['空间、通勤与预算一起考虑', '一室和两室历史经验可比较'], ['更大面积也增加日常开销', '实际使用面积可能不同于描述'], ['两人整租', '希望较长期居住'], ['电梯运行与维护', '面积、朝向及续租条件']],
 ['h7', 'shangsha', 'G', '空间与管理', true, true, ['把公共环境与服务放在一起看', '分别理解合租和整租成本'], ['服务与管理可能增加固定费用', '宠物可养不代表没有限制'], ['重视公共空间维护', '愿意为可验证的服务付费'], ['收费明细与维修响应', '宠物体型、数量和公共区域规则']],
 ['h8', 'shangsha', 'H', '长期居住', true, null, ['保留过去的户型与成本参考', '重视续租、维护与生活便利'], ['一条历史记录不能代表整栋楼', '历史租金不能当作当前报价'], ['打算长期安顿下来', '重视维护与续租稳定性'], ['当前合同与收费条件', '住户持续反馈与实际维护']]
];
export const housingBuildings = scenarios.map(([id, areaId, letter, scenario, elevator, pet, strengths, tradeoffs, fit, unknowns], index) => {
 const geometry = housingGeometry.features[index], p = geometry.properties;
 return { id, areaId, name: `${areaId === 'xiasha' ? '下沙' : '上沙'} · 样板楼 ${letter}`, shortName: `样板楼 ${letter}`, letter, scenario, selection: 'sample', sample: true, geometryId: p.id, coord: p.center, elevator, pet,
  experience: { strengths, tradeoffs, fit, unknowns, recordType: 'scenario', sample: true },
  priorities: strengths, checks: unknowns, geometry: p, updatedAt: '2026-10-02' };
});
const rows = [
 ['r1', 'h1', 'studio', 'whole', 1850, 80, 25, 3, '东', '2026-06', 'tenant'], ['r2', 'h1', 'one', 'whole', 2350, 100, 35, 5, '南', '2026-08', 'visit'],
 ['r3', 'h2', 'two', 'whole', 3600, 120, 56, 4, '南', '2026-05', 'owner'], ['r4', 'h2', 'one', 'shared', 1550, 80, 16, 4, '北', '2026-07', 'tenant'],
 ['r5', 'h3', 'studio', 'whole', 1700, 80, 23, 6, '东南', '2026-08', 'tenant'], ['r6', 'h3', 'one', 'whole', 2100, null, 32, 4, '西', '2026-04', 'visit'],
 ['r7', 'h4', 'one', 'shared', 2450, 180, 18, 12, '南', '2026-07', 'tenant'], ['r8', 'h4', 'two', 'whole', 5900, 260, 71, 18, '东', '2026-06', 'owner'],
 ['r9', 'h5', 'studio', 'whole', 1650, 80, 22, 3, '东', '2026-08', 'tenant'], ['r10', 'h5', 'one', 'whole', 2250, 100, 34, 5, '南', '2026-09', 'visit'],
 ['r11', 'h6', 'two', 'whole', 3400, 120, 52, 5, '东南', '2026-07', 'owner'], ['r12', 'h6', 'one', 'whole', 2650, 100, 38, 6, '东', '2026-05', 'tenant'],
 ['r13', 'h7', 'one', 'shared', 2800, 200, 20, 16, '南', '2026-06', 'tenant'], ['r14', 'h7', 'two', 'whole', 6200, 280, 76, 20, '东南', '2026-09', 'visit'],
 ['r15', 'h8', 'one', 'whole', 4900, 200, 46, 23, '南', '2025-12', 'tenant'], ['r16', 'h3', 'studio', 'whole', 1600, 80, 21, 2, '北', '2025-11', 'tenant']
];
const sourceLabels = { tenant: '住户记录示例', owner: '房东资料示例', visit: '看房记录示例' };
export const housingReferences = rows.map(([id, buildingId, layout, mode, rent, management, area, floor, orientation, referenceDate, sourceKind], i) => ({
 id, buildingId, layout, mode, rent, monthlyFees: [{ label: '管理费', amount: management, mandatory: true }, { label: '网络费', amount: i % 3 === 0 ? 50 : 0, mandatory: true }], area, floor, orientation,
 referenceDate, sourceKind, sourceLabel: sourceLabels[sourceKind], recordType: 'historical', sample: true,
 deposit: rent * (i % 2 === 0 ? 2 : 1), depositMonths: i % 2 === 0 ? 2 : 1, payCycle: '月付',
 usageFees: '当时水电按用量另计，单价未记录', minimumMonths: i % 3 === 0 ? 6 : 12, furnished: i % 2 === 0 ? '床、衣柜、空调' : '空调、热水器',
 title: mode === 'shared' ? '合租 · 独立卧室' : ({ studio: '整租 · 开间', one: '整租 · 一室一厅', two: '整租 · 两室一厅' })[layout],
 updatedAt: '2026-10-02', checks: ['历史资料的时间与来源', '与现在房屋条件的差异', '出租权、合同与费用重新确认']
}));
// Compatibility for saved notes and older imports: all entries are historical.
export const housingListings = housingReferences;

export const housingContacts = [
 { id: 'owner-a', name: 'A 楼房东 · 样板', role: 'landlord', buildingIds: ['h1'], areaIds: [], sample: true, status: 'sample',
  serviceScope: ['说明楼栋与房屋条件', '沟通当前出租情况', '确认合同、费用与维修责任'],
  commitments: ['直接与出租方沟通', '提供出租权与合同主体资料', '费用和维修责任书面说明'], reviewScope: ['身份及出租权', '合同主体与收款方', '费用、押金与维修约定'], contact: null },
 { id: 'owner-bc', name: 'B / C 楼房东 · 样板', role: 'landlord', buildingIds: ['h2', 'h3'], areaIds: [], sample: true, status: 'sample',
  serviceScope: ['说明楼栋及房型', '确认养宠与合租规则', '沟通看房安排'],
  commitments: ['直接与出租方沟通', '如实说明收费和居住限制', '书面明确维修责任'], reviewScope: ['身份及出租权', '养宠和合租规则', '收费与押金退款条件'], contact: null },
 { id: 'owner-ef', name: 'E / F 楼房东 · 样板', role: 'landlord', buildingIds: ['h5', 'h6'], areaIds: [], sample: true, status: 'sample',
  serviceScope: ['说明房屋条件', '沟通当前出租情况', '确认续租与维修条款'],
  commitments: ['提供出租权资料', '完整说明固定与用量收费', '书面明确续租和押金条款'], reviewScope: ['身份及出租权', '费用明细', '续租及维修责任'], contact: null },
 { id: 'guide-xiasha', name: '下沙带看中介 · 样板', role: 'agent', buildingIds: [], areaIds: ['xiasha'], sample: true, status: 'sample', tenantAgencyFee: 0, payerDisclosure: '费用承担方待核实',
  serviceScope: ['了解预算与居住需求', '陪同看房和比较楼栋', '核对费用、合同主体与房屋状况'],
  commitments: ['不向租客收取中介费', '不以带看费、服务费等名目替代中介费', '事先披露合作关系与费用承担方', '不强推、不隐瞒明显缺点'], reviewScope: ['从业主体及身份', '租客免中介费的书面承诺', '合作关系与费用承担方', '投诉与纠纷处理方式'], contact: null },
 { id: 'guide-shangsha', name: '上沙带看中介 · 样板', role: 'agent', buildingIds: [], areaIds: ['shangsha'], sample: true, status: 'sample', tenantAgencyFee: 0, payerDisclosure: '费用承担方待核实',
  serviceScope: ['沟通居住偏好与通勤需求', '陪同看房和检查关键条件', '解释费用、合同与维修约定'],
  commitments: ['不向租客收取中介费', '不以带看费、服务费等名目替代中介费', '事先披露合作关系与费用承担方', '尊重选择，不催促付定金'], reviewScope: ['从业主体及身份', '租客免中介费的书面承诺', '合作关系与费用承担方', '带看服务和投诉处理记录'], contact: null }
];

const discussionRows = [
 ['h1', 'experience', '2026-08-08', '选开间时，我会把管理费和网络费一起写进每月预算。还想补一次傍晚的看房记录，看看开窗后的声音和楼道照明。'],
 ['h2', 'question', '2026-08-12', '两个人一起住，这种布局做饭和居家办公会互相影响吗？也想知道养宠规则会不会限制宠物数量和公共区域通行。'],
 ['h3', 'experience', '2026-08-16', '看步梯房时我会先走一遍楼梯，再看楼层和窗外。低层搬家方便、高层可能开阔一些，具体采光还是需要按时段记录。'],
 ['h4', 'question', '2026-08-19', '合租除了房间本身，公共厨房怎么分工、访客能否留宿、坏了东西谁处理，这些有没有写进合租约定？'],
 ['h5', 'experience', '2026-08-22', '第一次独居，我会在白天和晚上各走一遍回家路线。房内噪音、楼道灯和门禁都希望放进同一份看房记录里。'],
 ['h6', 'question', '2026-08-24', '准备两人长期整租，除了当时的租金，续租涨幅、空调维修和提前搬走的押金规则，哪些条款最需要提前确认？'],
 ['h7', 'experience', '2026-08-27', '比较有管理服务的住处，我会单独记下每项收费，再问清楚哪些维修由谁负责。服务好不好要有持续记录，不能只看介绍。'],
 ['h8', 'question', '2026-08-30', '这里目前只有一份较早的住房参考。想继续补充公共区域维护、夜间环境，以及长期住户对续租和维修的经历。']
];
export const housingDiscussions = discussionRows.map(([buildingId, kind, date, text]) => ({ id: `housing-seed-${buildingId}`, buildingId, kind, date, text, author: '住户记录示例', sample: true }));

export const housingSelectionCriteria = [
 ['性价比', '结合有日期的历史成本、通勤与房屋条件，不靠最低价格吸引点击。'],
 ['居住体验', '记录采光、噪音、潮湿、楼道和公共区域，也保留不适合谁、有什么缺点。'],
 ['直接找到人', '连接房东与不向租客收中介费的带看中介，核实身份、服务范围和费用安排。'],
 ['持续负责', '记录核实时间、来源与问题处理；条件变化或问题未解决时重新评估推荐。']
];
