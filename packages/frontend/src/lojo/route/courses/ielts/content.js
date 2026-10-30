/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* 雅思线路图 · 站点数据（闯关版，2026-10-26）。设计见 docs/ielts-route-map.md。
   四条线按官方考试顺序：1 听力、2 阅读、3 写作、4 口语。每条线 9 站，4.0 到 8.0，每半分一站。
   每一站是一道关。题目在 gates/，同步时只编进社区的服务器代码，不发到浏览器。
   站点编号和标签前缀（#IELTS_1_5）上线后不要改。 */
export const META = {
 id: 'ielts', kind: 'gates', tag: 'IELTS', storeKey: 'ielts',
 group: { zh: '雅思', en: 'IELTS' }, // 同行小组频道名的前缀，如「雅思 1 号线同行小组」
};

/* live:false 的线还没有题，站点显示"即将开放"。听力的站点说明照设计文档第四节，阅读照第十节；写作、口语线做到时再补。 */
export const LINES = [
 { n: 1, id: 'listening', zh: '听力', en: 'Listening', live: true, stations: [
  { id: '1.1', band: 4.0, part: { zh: '第 1 部分，简单版', en: 'Part 1, easy' },
   focus: { zh: '个人信息：拼写名字、电话、地址、日期、价格', en: 'Personal details: spelling names, phone numbers, addresses, dates and prices' },
   types: { zh: '表格填空', en: 'Form completion' }, pace: { zh: '偏慢；英音、美音', en: 'A little slow; British and American accents' } },
  { id: '1.2', band: 4.5, part: { zh: '第 1 部分', en: 'Part 1' },
   focus: { zh: '日常安排：时间、价格、星期；开始出现改口', en: 'Everyday plans: times, prices and days; speakers start to correct themselves' },
   types: { zh: '笔记填空', en: 'Note completion' }, pace: { zh: '偏慢', en: 'A little slow' } },
  { id: '1.3', band: 5.0, part: { zh: '第 1 部分，完整版', en: 'Part 1, full' },
   focus: { zh: '干扰项、单复数、字数限制', en: 'Distractors, singular and plural, word limits' },
   types: { zh: '表格和笔记填空', en: 'Form and note completion' }, pace: { zh: '正常', en: 'Normal' } },
  { id: '1.4', band: 5.5, part: { zh: '第 2 部分，换乘站', en: 'Part 2, interchange' },
   focus: { zh: '独白；题目换了说法', en: 'One speaker; the questions say it in other words' },
   types: { zh: '选择题、笔记填空', en: 'Multiple choice, note completion' }, pace: { zh: '正常；加入澳音', en: 'Normal; an Australian accent joins' } },
  { id: '1.5', band: 6.0, part: { zh: '第 2 部分', en: 'Part 2' },
   focus: { zh: '地图和平面图，跟着方位描述走', en: 'Maps and plans: follow the directions' },
   types: { zh: '地图标注、配对', en: 'Map labelling, matching' }, pace: { zh: '正常', en: 'Normal' } },
  { id: '1.6', band: 6.5, part: { zh: '第 3 部分', en: 'Part 3' },
   focus: { zh: '学习场景的讨论，分清谁说了什么', en: 'A discussion about study: who said what' },
   types: { zh: '选择题、配对', en: 'Multiple choice, matching' }, pace: { zh: '正常偏快；三种口音', en: 'Normal to fast; three accents' } },
  { id: '1.7', band: 7.0, part: { zh: '第 3 部分，换乘站', en: 'Part 3, interchange' },
   focus: { zh: '观点、同意和反对', en: 'Opinions, agreeing and disagreeing' },
   types: { zh: '多选、配对', en: 'Multiple choice (two answers), matching' }, pace: { zh: '偏快', en: 'Fast' } },
  { id: '1.8', band: 7.5, part: { zh: '第 4 部分', en: 'Part 4' },
   focus: { zh: '学术讲座，靠结构跟上，中间没有对话', en: 'An academic lecture: follow its structure, with no dialogue' },
   types: { zh: '笔记填空', en: 'Note completion' }, pace: { zh: '正常偏快', en: 'Normal to fast' } },
  { id: '1.9', band: 8.0, part: { zh: '第 4 部分，难版', en: 'Part 4, hard' },
   focus: { zh: '信息密，学术词要拼对，几乎不能错', en: 'Dense information; academic words must be spelled right; almost no room for mistakes' },
   types: { zh: '笔记、句子填空', en: 'Note and sentence completion' }, pace: { zh: '快', en: 'Fast' } },
 ] },
 { n: 2, id: 'reading', zh: '阅读', en: 'Reading', live: true, stations: [
  { id: '2.1', band: 4.0, part: { zh: '日常短文，像培训类第 1 节', en: 'Everyday texts, like General Training Section 1' },
   focus: { zh: '通知、价目表、时刻表：找到具体信息', en: 'Notices, price lists and timetables: find specific information' },
   types: { zh: '笔记填空、选择题', en: 'Note completion, multiple choice' }, length: { zh: '约 250 词，限时 10 分钟', en: 'About 250 words, 10 minutes' } },
  { id: '2.2', band: 4.5, part: { zh: '几则日常短文', en: 'Several short everyday texts' },
   focus: { zh: '比较几则广告或通知，找出信息在哪一则', en: 'Compare several adverts or notices and find which one says what' },
   types: { zh: '信息配对、笔记填空', en: 'Matching information, note completion' }, length: { zh: '约 350 词，限时 12 分钟', en: 'About 350 words, 12 minutes' } },
  { id: '2.3', band: 5.0, part: { zh: '学术类第 1 篇，简单版', en: 'Academic Passage 1, easy' },
   focus: { zh: '结构清楚的科普短文；分清"文章没说"和"文章说的相反"', en: 'A clearly organised popular-science text: tell "not given" from "false"' },
   types: { zh: '判断信息、句子填空', en: 'True/False/Not given, sentence completion' }, length: { zh: '约 450 词，限时 14 分钟', en: 'About 450 words, 14 minutes' } },
  { id: '2.4', band: 5.5, part: { zh: '学术类第 1 篇，换乘站', en: 'Academic Passage 1, interchange' },
   focus: { zh: '题目全部换了说法，要认出是同一个意思', en: 'Every question says it in other words: recognise the same meaning' },
   types: { zh: '判断信息、摘要填空', en: 'True/False/Not given, summary completion' }, length: { zh: '约 500 词，限时 15 分钟', en: 'About 500 words, 15 minutes' } },
  { id: '2.5', band: 6.0, part: { zh: '学术类第 2 篇，换乘站', en: 'Academic Passage 2, interchange' },
   focus: { zh: '读懂每段的主旨和一张图表', en: 'The main idea of each paragraph, and a chart or diagram' },
   types: { zh: '段落标题配对、图表填空', en: 'Matching headings, diagram completion' }, length: { zh: '约 600 词，限时 16 分钟', en: 'About 600 words, 16 minutes' } },
  { id: '2.6', band: 6.5, part: { zh: '学术类第 2 篇', en: 'Academic Passage 2' },
   focus: { zh: '学术说明文：快速定位细节在哪一段', en: 'An academic explanation: locate details quickly' },
   types: { zh: '信息在哪一段、选择题、句子填空', en: 'Which paragraph, multiple choice, sentence completion' }, length: { zh: '约 700 词，限时 18 分钟', en: 'About 700 words, 18 minutes' } },
  { id: '2.7', band: 7.0, part: { zh: '学术类第 3 篇，议论文', en: 'Academic Passage 3, argument' },
   focus: { zh: '分清作者自己的观点和他转述的别人的观点', en: "Tell the writer's own views from the views the writer reports" },
   types: { zh: '判断作者观点、选择题', en: 'Yes/No/Not given, multiple choice' }, length: { zh: '约 750 词，限时 18 分钟', en: 'About 750 words, 18 minutes' } },
  { id: '2.8', band: 7.5, part: { zh: '学术类第 3 篇', en: 'Academic Passage 3' },
   focus: { zh: '几位研究者各说了什么', en: 'Which researcher said what' },
   types: { zh: '观点和人物配对、句子结尾配对', en: 'Matching features, matching sentence endings' }, length: { zh: '约 800 词，限时 20 分钟', en: 'About 800 words, 20 minutes' } },
  { id: '2.9', band: 8.0, part: { zh: '学术类第 3 篇，难版', en: 'Academic Passage 3, hard' },
   focus: { zh: '抽象话题、长句多，干扰选项很像正确答案', en: 'Abstract ideas and long sentences; the wrong options look right' },
   types: { zh: '选词填摘要、判断作者观点、选两项', en: 'Summary with a word list, Yes/No/Not given, choose two' }, length: { zh: '约 900 词，限时 20 分钟', en: 'About 900 words, 20 minutes' } },
 ] },
 { n: 3, id: 'writing', zh: '写作', en: 'Writing', live: false, stations: [
  { id: '3.1', band: 4.0 }, { id: '3.2', band: 4.5 }, { id: '3.3', band: 5.0 }, { id: '3.4', band: 5.5 }, { id: '3.5', band: 6.0 },
  { id: '3.6', band: 6.5 }, { id: '3.7', band: 7.0 }, { id: '3.8', band: 7.5 }, { id: '3.9', band: 8.0 },
 ] },
 { n: 4, id: 'speaking', zh: '口语', en: 'Speaking', live: false, stations: [
  { id: '4.1', band: 4.0 }, { id: '4.2', band: 4.5 }, { id: '4.3', band: 5.0 }, { id: '4.4', band: 5.5 }, { id: '4.5', band: 6.0 },
  { id: '4.6', band: 6.5 }, { id: '4.7', band: 7.0 }, { id: '4.8', band: 7.5 }, { id: '4.9', band: 8.0 },
 ] },
];

/* 换乘站：一道关在两条线上。题目文件按第一个编号命名（1.4-A.js）。
   只考一科的套题只算它自己那条线；两科各半的套题写 lines: [1, 2]，两条线都算。 */
export const INTERCHANGES = [
 { ids: ['1.4', '2.4'], zh: '同义替换', en: 'Paraphrase',
  dzh: '题目和原文换了说法，能认出是同一个意思。', den: 'The questions and the text say the same thing in different words, and you can tell.',
  why: { zh: '两科都靠这个拿分；填空题的字数和拼写规则也一样。', en: 'Both papers reward it, and their gap-fill rules on word limits and spelling are the same.' } },
 { ids: ['2.5', '3.5'], zh: '图表和结构', en: 'Charts and structure',
  dzh: '读懂图表和段落主旨；写小作文、分好段。', den: 'Read charts and the main idea of each paragraph; write Task 1 and paragraph well.',
  why: { zh: '一个是输入，一个是输出。', en: 'One is input, the other is output.' } },
 { ids: ['3.6', '4.6'], zh: '用词和句式', en: 'Range and accuracy',
  dzh: '用词和句式够不够丰富、用得准不准。', den: 'Whether your words and sentences are varied enough, and used accurately.',
  why: { zh: '两科的评分标准里都有"词汇""语法"这两项。', en: 'Both band descriptors score vocabulary and grammar.' } },
 { ids: ['1.7', '4.7'], zh: '学术讨论', en: 'Academic discussion',
  dzh: '听懂谁持什么观点；自己展开观点。', den: 'Follow who holds which view, and develop your own.',
  why: { zh: '两科的第三部分都是讨论。', en: 'Part 3 of both papers is a discussion.' } },
];

/* 题型标签：每道题至少一个，用来诊断错在哪、推荐去哪练（research/english-exams.md 第四节）。 */
export const TAGS = {
 spelling: { zh: '拼写', en: 'Spelling' },
 numbers: { zh: '数字和日期', en: 'Numbers and dates' },
 form: { zh: '表格和笔记填空', en: 'Form and note completion' },
 sentence: { zh: '句子填空', en: 'Sentence completion' },
 'short-answer': { zh: '简答', en: 'Short answers' },
 choice: { zh: '选择题', en: 'Multiple choice' },
 matching: { zh: '配对', en: 'Matching' },
 map: { zh: '地图和平面图', en: 'Maps and plans' },
 discussion: { zh: '分清说话人', en: 'Who said what' },
 lecture: { zh: '学术讲座', en: 'Academic talks' },
 paraphrase: { zh: '同义替换', en: 'Paraphrase' },
 'word-limit': { zh: '字数限制', en: 'Word limits' },
 distractor: { zh: '干扰项和改口', en: 'Distractors and corrections' },
 plural: { zh: '单复数', en: 'Singular and plural' },
 // 阅读（设计文档第十节）
 tfng: { zh: '判断信息', en: 'True / False / Not Given' },
 ynng: { zh: '判断作者观点', en: 'Yes / No / Not Given' },
 headings: { zh: '段落标题配对', en: 'Matching headings' },
 summary: { zh: '摘要填空', en: 'Summary completion' },
 diagram: { zh: '图表和流程图', en: 'Diagrams and flow charts' },
 features: { zh: '观点和人物配对', en: 'Matching features' },
 endings: { zh: '句子结尾配对', en: 'Sentence endings' },
};

/* 没过关去哪练：按错题最多的标签推荐（设计文档第五节）。只显示已经有的东西：
   guide 是攻略的 slug（courses/english/ielts/guides/<slug>.js），写好、上了正式站再填；app 是社区里的页面；topics 是时间线话题；tutor 都推荐。
   攻略在 courses/english/ielts/guides/：听力 8 篇，阅读 6 篇。选题见 docs/research/english-guides.md。 */
export const PRACTICE = {
 // 听力和阅读都用的标签，按线分别指定；键是 LINES 里线的 id，写一个值就是两条线都用。
 spelling: { guide: { listening: 'ielts-listening-gaps', reading: 'ielts-reading-completion' }, app: { path: '/dictation', zh: '听写', en: 'Dictation' }, topics: { listening: ['雅思听力'], reading: ['雅思阅读'] } },
 numbers: { guide: { listening: 'ielts-listening-gaps', reading: 'ielts-reading-completion' }, app: { path: '/dictation', zh: '听写', en: 'Dictation' }, topics: { listening: ['雅思听力'], reading: ['雅思阅读'] } },
 'word-limit': { guide: { listening: 'ielts-listening-gaps', reading: 'ielts-reading-completion' }, app: null, topics: { listening: ['雅思听力'], reading: ['雅思阅读'] } },
 plural: { guide: { listening: 'ielts-listening-gaps', reading: 'ielts-reading-completion' }, app: { path: '/dictation', zh: '听写', en: 'Dictation' }, topics: { listening: ['雅思听力'], reading: ['雅思阅读'] } },
 form: { guide: { listening: 'ielts-listening-predict', reading: 'ielts-reading-completion' }, app: null, topics: { listening: ['雅思听力'], reading: ['雅思阅读'] } },
 sentence: { guide: { reading: 'ielts-reading-completion' }, app: null, topics: { reading: ['雅思阅读'] } },
 choice: { guide: { listening: 'ielts-listening-choice', reading: 'ielts-reading-choice' }, app: null, topics: { listening: ['雅思听力'], reading: ['雅思阅读'] } },
 distractor: { guide: { listening: 'ielts-listening-choice', reading: 'ielts-reading-choice' }, app: null, topics: { listening: ['雅思听力'], reading: ['雅思阅读'] } },
 matching: { guide: { listening: 'ielts-listening-discussion', reading: 'ielts-reading-matching' }, app: null, topics: { listening: ['雅思听力'], reading: ['雅思阅读'] } },
 paraphrase: { guide: 'ielts-paraphrase', app: { path: '/wordbook', zh: '生词本', en: 'Wordbook' }, topics: { listening: ['雅思听力'], reading: ['雅思阅读'] } },
 // 只有听力用的标签
 map: { guide: 'ielts-listening-maps', app: null, topics: ['雅思听力'] },
 discussion: { guide: 'ielts-listening-discussion', app: null, topics: ['雅思听力'] },
 lecture: { guide: 'ielts-listening-lecture', app: null, topics: ['雅思听力'] },
 // 只有阅读用的标签
 tfng: { guide: 'ielts-reading-judge', app: null, topics: ['雅思阅读'] },
 ynng: { guide: 'ielts-reading-judge', app: null, topics: ['雅思阅读'] },
 headings: { guide: 'ielts-reading-headings', app: null, topics: ['雅思阅读'] },
 summary: { guide: 'ielts-reading-completion', app: null, topics: ['雅思阅读'] },
 diagram: { guide: 'ielts-reading-completion', app: null, topics: ['雅思阅读'] },
 features: { guide: 'ielts-reading-matching', app: null, topics: ['雅思阅读'] },
 endings: { guide: 'ielts-reading-matching', app: null, topics: ['雅思阅读'] },
};
