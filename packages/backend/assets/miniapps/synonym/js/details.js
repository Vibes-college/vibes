/* 详情页内容：每对词的词性、各自意思、例句、差在哪。例句全部原创（英语mini app 2026-11-11 写），不摘自任何书或真题。
   键名：词对用 `${a}|${b}`，易混词用 `trap:${a}|${b}`，和 data.js 里一字不差。
   目前覆盖 general、trends、city、study-work、leisure、academic 六组。 */
export const DETAILS = {
  /* ───────── general ───────── */
  'purchase|buy': {
    pa: 'v.', pb: 'v.', za: '购买（正式）', zb: '买',
    ex: [
      { en: 'Tickets can be purchased online or at the station.', zh: '车票可以在网上或车站购买。', t: '出行' },
      { en: 'More young people now buy clothes second-hand.', zh: '现在更多年轻人买二手衣服。', t: '消费' },
    ],
    diff: 'purchase 也能当名词：a purchase 指「买的东西」。buy 当名词多指「划算的买卖」：a good buy。',
    col: 'purchase tickets / goods online',
  },
  'assist|help': {
    pa: 'v.', pb: 'v.', za: '协助', zb: '帮助',
    ex: [
      { en: 'Volunteers will assist visitors with their luggage.', zh: '志愿者会帮游客拿行李。', t: '旅行' },
      { en: 'Online videos help students understand difficult topics.', zh: '网上的视频帮学生理解难的内容。', t: '教育' },
    ],
    diff: 'assist 听着像「打下手」，主要的活还是别人干。help 最常用，口语书面都行。',
    col: 'assist sb with sth',
  },
  'support|back up': {
    pa: 'v.', pb: 'phr. v.', za: '支持；支撑', zb: '支持；备份',
    ex: [
      { en: 'Most residents support the plan for a new park.', zh: '大多数居民支持建新公园的计划。', t: '城市' },
      { en: 'Her friends backed her up when she complained to the manager.', zh: '她向经理投诉时，朋友们都站在她这边。', t: '社会' },
    ],
    diff: 'back up 还常说「用证据支撑说法」：back up your argument with examples。support 还能指「养活、资助」。',
    col: 'back up a claim with evidence',
  },
  'obtain|get': {
    pa: 'v.', pb: 'v.', za: '获得（书面）', zb: '得到；变得',
    ex: [
      { en: 'Students must obtain a visa before they travel.', zh: '学生出行前必须办好签证。', t: '留学' },
      { en: 'You can get a free map at the information desk.', zh: '你可以在问讯处拿一张免费地图。', t: '旅行' },
    ],
    diff: 'obtain 常说「费了点手续才拿到」。get 意思很多，还能表示「变得」「到达」，obtain 没有这些用法。',
    col: 'obtain permission / information',
  },
  'receive|be given': {
    pa: 'v.', pb: 'phr.', za: '收到', zb: '被给予',
    ex: [
      { en: 'All participants will receive a certificate at the end.', zh: '所有参加者最后都会收到一张证书。', t: '活动' },
      { en: 'New staff are given a laptop on their first day.', zh: '新员工第一天会领到一台笔记本电脑。', t: '工作' },
    ],
    diff: 'receive 主语是收东西的人，主动说法。be given 是被动，强调「有人发给你」。',
    col: 'receive / be given a certificate',
  },
  'attempt|try': {
    pa: 'v. / n.', pb: 'v. / n.', za: '尝试（正式）', zb: '试；尝试',
    ex: [
      { en: 'The city attempted to reduce traffic by raising parking fees.', zh: '市里试图靠提高停车费来减少车流。', t: '城市' },
      { en: 'Try to drink more water when you exercise.', zh: '运动时尽量多喝水。', t: '健康' },
    ],
    diff: 'attempt 常带「不一定成功」的意思，书面多。try 还能说「试吃、试穿」：try the soup，attempt 不行。',
    col: 'attempt / try to do sth',
  },
  'postpone|put off': {
    pa: 'v.', pb: 'phr. v.', za: '延期', zb: '推迟；拖延',
    ex: [
      { en: 'The football match was postponed because of heavy rain.', zh: '足球赛因为大雨延期了。', t: '体育' },
      { en: 'Many students put off their essays until the last minute.', zh: '很多学生把论文拖到最后一刻。', t: '教育' },
    ],
    diff: 'postpone 多指正式改期，通知里常见。put off 还带「拖着不做」的意思，常说个人习惯。',
    col: 'postpone sth until next week',
  },
  'delay|hold up': {
    pa: 'v. / n.', pb: 'phr. v.', za: '延误；耽搁', zb: '拖住；耽误',
    ex: [
      { en: 'Several flights were delayed by the storm.', zh: '好几趟航班因为暴风雨延误了。', t: '出行' },
      { en: 'Sorry I am late, I was held up at work.', zh: '抱歉来晚了，工作上被拖住了。', t: '工作' },
    ],
    diff: 'delay 能当名词：a delay of two hours。hold up 还能指「抢劫」，名词写成 a hold-up。',
    col: 'be delayed / held up by traffic',
  },
  'sufficient|enough': {
    pa: 'adj.', pb: 'adj. / adv.', za: '足够的（正式）', zb: '足够的；足够地',
    ex: [
      { en: 'Many families lack sufficient money for healthy food.', zh: '很多家庭没有足够的钱买健康食品。', t: '社会' },
      { en: 'Children today do not get enough sleep.', zh: '现在的孩子睡眠不够。', t: '健康' },
    ],
    diff: 'enough 还能当副词放形容词后：old enough。sufficient 不能这样用，只是形容词。',
    col: 'sufficient / enough time to do sth',
  },
  'approximately|about': {
    pa: 'adv.', pb: 'adv. / prep.', za: '大约（书面）', zb: '大约；关于',
    ex: [
      { en: 'Approximately 30% of the city is covered by green space.', zh: '这座城市大约 30% 的面积是绿地。', t: '图表' },
      { en: 'The bus ride takes about forty minutes.', zh: '坐公交大约要四十分钟。', t: '出行' },
    ],
    diff: 'about 还是介词「关于」，要看语境分清。写图表作文用 approximately 更正式。',
    col: 'approximately / about + 数字',
  },
  'roughly|around': {
    pa: 'adv.', pb: 'adv. / prep.', za: '大约；粗略地', zb: '大约；在周围',
    ex: [
      { en: 'Roughly half of the students walk to school.', zh: '大约一半的学生走路上学。', t: '教育' },
      { en: 'The museum gets around 2,000 visitors a day.', zh: '博物馆每天大约有两千名游客。', t: '旅游' },
    ],
    diff: 'roughly 还有「粗鲁地」的意思：treat sb roughly。around 还能指「在周围」「到处」。',
    col: 'roughly / around half of…',
  },
  'major|main': {
    pa: 'adj.', pb: 'adj.', za: '重大的；主要的', zb: '主要的',
    ex: [
      { en: 'Air pollution is a major problem in many cities.', zh: '空气污染是很多城市的一大问题。', t: '环境' },
      { en: 'The main reason people move is to find work.', zh: '人们搬家的主要原因是找工作。', t: '社会' },
    ],
    diff: 'main 通常只有一个「最主要的」。major 可以有好几个：several major problems。',
    col: 'a major / main reason',
  },
  'require|need': {
    pa: 'v.', pb: 'v. / n.', za: '需要；要求', zb: '需要',
    ex: [
      { en: 'All visitors are required to show photo ID.', zh: '所有访客都必须出示带照片的证件。', t: '规定' },
      { en: 'Older people need regular exercise to stay healthy.', zh: '老年人需要经常锻炼才能保持健康。', t: '健康' },
    ],
    diff: 'require 有「规定要」的味道，常出现在规章里。need 更日常，也能当名词：a need for…',
    col: 'be required to do sth',
  },
  'essential|necessary': {
    pa: 'adj.', pb: 'adj.', za: '必不可少的', zb: '必要的',
    ex: [
      { en: 'Clean water is essential for good health.', zh: '干净的水对健康必不可少。', t: '健康' },
      { en: 'It is not necessary to book in advance.', zh: '不需要提前预订。', t: '旅游' },
    ],
    diff: 'essential 还能指「最基本、核心的」：the essential points。necessary 常用于 It is necessary to…句型。',
    col: 'essential / necessary for sth',
  },
  'inform|tell': {
    pa: 'v.', pb: 'v.', za: '通知', zb: '告诉；讲',
    ex: [
      { en: 'Please inform the office if you change your address.', zh: '如果地址变了，请通知办公室。', t: '学校' },
      { en: 'The guide told us about the history of the bridge.', zh: '导游给我们讲了这座桥的历史。', t: '旅游' },
    ],
    diff: 'inform 多用于正式通知。tell 还能「讲故事」「分辨」：tell the difference，inform 不行。',
    col: 'inform sb of sth / tell sb about sth',
  },
  'commence|start': {
    pa: 'v.', pb: 'v. / n.', za: '开始（很正式）', zb: '开始',
    ex: [
      { en: 'Building work will commence in early March.', zh: '施工将于三月初开始。', t: '城市' },
      { en: 'The film starts at half past seven.', zh: '电影七点半开始。', t: '娱乐' },
    ],
    diff: 'commence 平时说话几乎不用，听着很官方。start 还能指「发动」：start the car。',
    col: 'commence / start on + 日期',
  },
  'initially|at first': {
    pa: 'adv.', pb: 'phr.', za: '起初（书面）', zb: '一开始',
    ex: [
      { en: 'Initially, the app was only available in English.', zh: '这个应用起初只有英文版。', t: '科技' },
      { en: 'At first I hated online classes, but now I like them.', zh: '一开始我讨厌网课，现在挺喜欢。', t: '教育' },
    ],
    diff: 'initially 能放句中：was initially designed for…。at first 多放句首，后面暗示「后来变了」。',
    col: 'Initially / At first, …, but later…',
  },
  'complete|finish': {
    pa: 'v. / adj.', pb: 'v. / n.', za: '完成；完整的', zb: '完成；结束',
    ex: [
      { en: 'Please complete the form and return it by Friday.', zh: '请填好表格，周五前交回。', t: '学校' },
      { en: 'Most workers finish at five in this company.', zh: '这家公司大部分员工五点下班。', t: '工作' },
    ],
    diff: 'complete a form 是「填表」，这里一般不用 finish。finish 后面可接 -ing：finish reading。',
    col: 'complete a form / course',
  },
  'select|choose': {
    pa: 'v.', pb: 'v.', za: '挑选（正式）', zb: '选择',
    ex: [
      { en: 'Ten students were selected to join the summer programme.', zh: '有十名学生被选去参加暑期项目。', t: '教育' },
      { en: 'Many people choose to work from home now.', zh: '现在很多人选择在家办公。', t: '工作' },
    ],
    diff: 'select 多指从很多里仔细挑出来。choose 后面能接 to do，表示「决定要」，select 一般不这样用。',
    col: 'be selected for / choose to do',
  },
  'provide|give': {
    pa: 'v.', pb: 'v.', za: '提供', zb: '给',
    ex: [
      { en: 'The hotel provides free breakfast for all guests.', zh: '酒店给所有客人提供免费早餐。', t: '旅游' },
      { en: 'Teachers should give students clear feedback.', zh: '老师应该给学生清楚的反馈。', t: '教育' },
    ],
    diff: 'provide 多说「持续供应、配备」。give 是一次性给，可以直接接两个宾语：give sb sth。',
    col: 'provide sb with sth',
  },
  'trap:affect|effect': {
    pa: 'v.', pb: 'n.', za: '影响（动词）', zb: '效果、影响（名词）',
    ex: [
      { en: 'Lack of sleep can affect your memory.', zh: '缺觉会影响记忆力。', t: '健康' },
      { en: 'The new law had a positive effect on air quality.', zh: '新法规对空气质量有积极影响。', t: '环境' },
    ],
    diff: '记法：动作用 affect，结果用 effect。常见搭配是 have an effect on。',
  },
  'trap:quiet|quite': {
    pa: 'adj.', pb: 'adv.', za: '安静的', zb: '相当；挺',
    ex: [
      { en: 'The library is a quiet place to study.', zh: '图书馆是个安静的学习地方。', t: '学校' },
      { en: 'The rent in this area is quite high.', zh: '这一带的房租相当高。', t: '城市' },
    ],
    diff: 'quiet 两个音节，结尾 -et；quite 一个音节，结尾 -te。写作时最容易手滑拼反。',
  },
  'trap:lose|loose': {
    pa: 'v.', pb: 'adj.', za: '丢失；输', zb: '松的',
    ex: [
      { en: 'Many people lose their keys at least once a year.', zh: '很多人一年至少丢一次钥匙。', t: '生活' },
      { en: 'Wear loose clothes when you do yoga.', zh: '做瑜伽时穿宽松的衣服。', t: '健康' },
    ],
    diff: 'lose 读 /luːz/，loose 读 /luːs/，结尾一个浊一个清。丢东西只用一个 o。',
  },

  /* ───────── trends ───────── */
  'rise|increase': {
    pa: 'v. / n.', pb: 'v. / n.', za: '上升', zb: '增加',
    ex: [
      { en: 'House prices rose by 10% between 2015 and 2020.', zh: '2015 到 2020 年房价涨了 10%。', t: '图表' },
      { en: 'The number of online shoppers increased steadily.', zh: '网购人数稳步增加。', t: '图表' },
    ],
    diff: 'rise 不带宾语，只能「自己涨」。increase 两种都行：prices increased / they increased prices。',
    col: 'a rise / an increase in + 名词',
  },
  'go up|grow': {
    pa: 'phr. v.', pb: 'v.', za: '上涨', zb: '增长；生长',
    ex: [
      { en: 'Bus fares went up again last year.', zh: '去年车费又涨了。', t: '城市' },
      { en: 'The city\'s population grew quickly in the 1990s.', zh: '这座城市的人口在九十年代增长很快。', t: '图表' },
    ],
    diff: 'go up 口语，作文里少用。grow 常说慢慢变大，还能说「种植」：grow vegetables。',
    col: 'grow rapidly / steadily',
  },
  'decline|fall': {
    pa: 'v. / n.', pb: 'v. / n.', za: '下降；衰退', zb: '下降；落下',
    ex: [
      { en: 'Newspaper sales declined sharply after 2010.', zh: '2010 年后报纸销量急剧下降。', t: '媒体' },
      { en: 'Unemployment fell to 4% in 2019.', zh: '2019 年失业率降到了 4%。', t: '图表' },
    ],
    diff: 'decline 常带「慢慢变差」的意思。decline 还能指「婉拒」：decline an offer，fall 没这个用法。',
    col: 'decline / fall to + 数字',
  },
  'drop|decrease': {
    pa: 'v. / n.', pb: 'v. / n.', za: '下降；落下', zb: '减少',
    ex: [
      { en: 'Visitor numbers dropped suddenly in March.', zh: '三月游客人数突然下降。', t: '图表' },
      { en: 'The use of coal decreased over the period.', zh: '这段时期煤的用量减少了。', t: '环境' },
    ],
    diff: 'drop 口语一点，常配 sudden、sharp。decrease 中性书面，适合描述平稳下降。',
    col: 'a drop / decrease in + 名词',
  },
  'double|twice as many': {
    pa: 'v.', pb: 'phr.', za: '翻倍', zb: '两倍那么多',
    ex: [
      { en: 'The number of electric cars doubled in five years.', zh: '电动车数量五年内翻了一番。', t: '图表' },
      { en: 'Twice as many women as men use the gym in the morning.', zh: '早上去健身房的女性是男性的两倍。', t: '健康' },
    ],
    diff: 'double 是动词，说「变成原来两倍」。twice as many as 是拿两样东西比。',
    col: 'twice as many A as B',
  },
  'half|50 per cent': {
    pa: 'n.', pb: 'phr.', za: '一半', zb: '百分之五十',
    ex: [
      { en: 'Half of the students live in university housing.', zh: '一半的学生住在学校宿舍。', t: '教育' },
      { en: 'Exactly 50 per cent of the budget goes on staff.', zh: '预算正好一半花在员工身上。', t: '图表' },
    ],
    diff: 'per cent 是英式写法，美式常写 percent。half of 后面动词跟着名词走单复数。',
    col: 'half of / 50 per cent of + 名词',
  },
  'a quarter|25 per cent': {
    pa: 'n.', pb: 'phr.', za: '四分之一', zb: '百分之二十五',
    ex: [
      { en: 'A quarter of households own more than one car.', zh: '四分之一的家庭有不止一辆车。', t: '图表' },
      { en: 'Around 25 per cent of waste is recycled.', zh: '大约 25% 的垃圾被回收。', t: '环境' },
    ],
    diff: 'a quarter 也能说时间：a quarter past six（六点一刻）。作文里两种说法交替用，免得重复。',
    col: 'a quarter of + 名词',
  },
  'most|the majority': {
    pa: 'det. / pron.', pb: 'n.', za: '大多数', zb: '多数',
    ex: [
      { en: 'Most teenagers own a smartphone.', zh: '大多数青少年有智能手机。', t: '科技' },
      { en: 'The majority of workers travel by car.', zh: '大多数上班族开车通勤。', t: '图表' },
    ],
    diff: 'most 可直接接名词：most people。the majority 后面要加 of，听起来更正式。',
    col: 'the majority of + 复数名词',
  },
  'minority|fewer than half': {
    pa: 'n.', pb: 'phr.', za: '少数', zb: '不到一半',
    ex: [
      { en: 'Only a minority of people cycle to work.', zh: '只有少数人骑车上班。', t: '图表' },
      { en: 'Fewer than half of the residents voted.', zh: '投票的居民不到一半。', t: '社会' },
    ],
    diff: 'minority 也指「少数群体」，比如少数民族。fewer than half 是说数字，48% 也算。',
    col: 'a small minority of + 名词',
  },
  'slightly|a little': {
    pa: 'adv.', pb: 'phr.', za: '稍微', zb: '一点点',
    ex: [
      { en: 'Sales rose slightly in the final quarter.', zh: '最后一个季度销量略有上升。', t: '图表' },
      { en: 'The new library is a little bigger than the old one.', zh: '新图书馆比旧的大一点。', t: '城市' },
    ],
    diff: 'slightly 更书面，图表作文首选。a little 后面也能接不可数名词，意思变成「一点儿东西」。',
    col: 'rise / fall slightly',
  },
  'sharp|sudden': {
    pa: 'adj.', pb: 'adj.', za: '急剧的；锋利的', zb: '突然的',
    ex: [
      { en: 'There was a sharp fall in tourist numbers in 2020.', zh: '2020 年游客人数急剧下降。', t: '图表' },
      { en: 'A sudden storm closed the airport for hours.', zh: '一场突然的风暴让机场关了几个小时。', t: '出行' },
    ],
    diff: 'sharp 副词是 sharply：rose sharply。sudden 也能修饰很多非数字的事，比如 a sudden change of plan。',
    col: 'a sharp / sudden rise',
  },
  'significant|considerable': {
    pa: 'adj.', pb: 'adj.', za: '显著的；重要的', zb: '相当大的',
    ex: [
      { en: 'There was a significant increase in online learning.', zh: '网上学习显著增加了。', t: '教育' },
      { en: 'The project cost a considerable amount of money.', zh: '这个项目花了相当多的钱。', t: '城市' },
    ],
    diff: 'significant 还有「重要、有意义」的意思。considerable 只说「多、大」，不说重要。',
    col: 'a significant / considerable number of',
  },
  'gradual|slow': {
    pa: 'adj.', pb: 'adj.', za: '逐渐的', zb: '慢的',
    ex: [
      { en: 'There was a gradual rise in temperatures.', zh: '气温逐渐上升。', t: '环境' },
      { en: 'Internet speeds in rural areas are still slow.', zh: '农村的网速仍然很慢。', t: '科技' },
    ],
    diff: 'slow 可以说任何东西速度慢。gradual 只说「变化」一步步来，通常配 rise、change、decline。',
    col: 'a gradual increase / decline',
  },
  'peak|highest point': {
    pa: 'n. / v.', pb: 'phr.', za: '顶峰；达到高峰', zb: '最高点',
    ex: [
      { en: 'Sales peaked at 5 million in 2018.', zh: '销量在 2018 年达到峰值五百万。', t: '图表' },
      { en: 'Prices reached their highest point in July.', zh: '价格在七月达到最高点。', t: '图表' },
    ],
    diff: 'peak 能直接当动词：peaked at…，写图表很省字。highest point 只能当名词用。',
    col: 'peak at + 数字 / reach a peak',
  },
  'remain|stay': {
    pa: 'v.', pb: 'v.', za: '保持；剩下', zb: '保持；停留',
    ex: [
      { en: 'The unemployment rate remained stable at 5%.', zh: '失业率稳定在 5%。', t: '图表' },
      { en: 'Many graduates stay in the city where they studied.', zh: '很多毕业生留在读书的城市。', t: '社会' },
    ],
    diff: 'remain 更书面，还能表示「剩下」：the remaining 20%。stay 还常指「住、待」：stay at a hotel。',
    col: 'remain / stay the same',
  },
  'fluctuate|go up and down': {
    pa: 'v.', pb: 'phr. v.', za: '波动', zb: '上上下下',
    ex: [
      { en: 'Oil prices fluctuated throughout the decade.', zh: '这十年里油价一直波动。', t: '图表' },
      { en: 'My weight goes up and down with the seasons.', zh: '我的体重随季节上下浮动。', t: '健康' },
    ],
    diff: 'fluctuate 是正式说法，名词是 fluctuation。go up and down 太口语，写作里少用。',
    col: 'fluctuate between A and B',
  },
  'overall|in general': {
    pa: 'adv. / adj.', pb: 'phr.', za: '总体上；全面的', zb: '总的来说',
    ex: [
      { en: 'Overall, car use fell while cycling became more popular.', zh: '总体来看，开车的少了，骑车的多了。', t: '图表' },
      { en: 'In general, people in cities live longer.', zh: '一般来说，城里人更长寿。', t: '健康' },
    ],
    diff: 'overall 还能当形容词放名词前：the overall trend。in general 多说普遍情况，不专门总结图表。',
    col: 'Overall, … / the overall trend',
  },
  'trap:rise|raise': {
    pa: 'v.', pb: 'v.', za: '上升（不及物）', zb: '提高；举起（及物）',
    ex: [
      { en: 'Sea levels are rising every year.', zh: '海平面每年都在上升。', t: '环境' },
      { en: 'The government plans to raise taxes on sugar.', zh: '政府打算提高糖税。', t: '健康' },
    ],
    diff: 'rise 过去式 rose；raise 过去式 raised。raise 还能说「养育」「筹钱」：raise money。',
  },
  'trap:peak|peek': {
    pa: 'n. / v.', pb: 'v. / n.', za: '顶峰', zb: '偷看',
    ex: [
      { en: 'Traffic reaches its peak at 8 a.m.', zh: '早上八点交通达到高峰。', t: '城市' },
      { en: 'The child peeked at the presents before his birthday.', zh: '孩子在生日前偷看了礼物。', t: '生活' },
    ],
    diff: '记法：peak 里的 a 像山尖；peek 两个 e 像两只眼睛。还有个 pique（激起），也同音。',
  },
  'trap:fall|fail': {
    pa: 'v. / n.', pb: 'v.', za: '下降；落下', zb: '失败；不及格',
    ex: [
      { en: 'The birth rate fell to a record low.', zh: '出生率降到了历史最低。', t: '图表' },
      { en: 'Many new businesses fail in their first year.', zh: '很多新公司第一年就倒闭了。', t: '经济' },
    ],
    diff: 'fall 过去式 fell；fail 过去式 failed。fail 还能接 to do，表示「没能做到」。',
  },

  /* ───────── city ───────── */
  'residents|locals': {
    pa: 'n.', pb: 'n.', za: '居民；住户', zb: '本地人',
    ex: [
      { en: 'Residents complained about the noise from the new airport.', zh: '居民投诉新机场的噪音。', t: '城市' },
      { en: 'Ask the locals for the best places to eat.', zh: '问问本地人哪里最好吃。', t: '旅行' },
    ],
    diff: 'residents 也指住在某栋楼、养老院里的人。locals 带「本地人和外地游客相对」的意思。',
    col: 'local residents',
  },
  'pedestrians|people on foot': {
    pa: 'n.', pb: 'phr.', za: '行人', zb: '步行的人',
    ex: [
      { en: 'The bridge is open to pedestrians only.', zh: '这座桥只允许行人通过。', t: '城市' },
      { en: 'The old town is best explored by people on foot.', zh: '老城区最适合步行游览。', t: '旅游' },
    ],
    diff: 'pedestrian 还能当形容词：a pedestrian crossing（人行横道）。people on foot 是解释性说法。',
    col: 'pedestrian zone / crossing',
  },
  'journey|trip': {
    pa: 'n.', pb: 'n.', za: '路程；旅程', zb: '一趟（出行）',
    ex: [
      { en: 'The train journey from London takes three hours.', zh: '从伦敦坐火车要三小时。', t: '出行' },
      { en: 'We went on a school trip to the science museum.', zh: '我们学校组织去了科学博物馆。', t: '教育' },
    ],
    diff: 'journey 常说路上花多久、多辛苦。trip 常配 business、day、school，指短途有目的的出行。',
    col: 'a long journey / a day trip',
  },
  'commute|travel to work': {
    pa: 'v. / n.', pb: 'phr.', za: '通勤', zb: '上班路上',
    ex: [
      { en: 'Many people commute over an hour each way.', zh: '很多人单程通勤一个多小时。', t: '工作' },
      { en: 'Half of the staff travel to work by bus.', zh: '一半员工坐公交上班。', t: '图表' },
    ],
    diff: 'commute 包括来回，也可指上学。通勤的人叫 commuter。',
    col: 'commute to work / a daily commute',
  },
  'cancel|call off': {
    pa: 'v.', pb: 'phr. v.', za: '取消', zb: '叫停；取消',
    ex: [
      { en: 'Your booking can be cancelled up to 24 hours before.', zh: '预订最晚可以提前 24 小时取消。', t: '旅游' },
      { en: 'The concert was called off because of the storm.', zh: '音乐会因风暴取消了。', t: '娱乐' },
    ],
    diff: 'cancel 还能说取消订阅、订单：cancel a subscription。call off 多用于活动、罢工、搜救。',
    col: 'cancel a booking / call off a match',
  },
  'cut|reduce': {
    pa: 'v. / n.', pb: 'v.', za: '削减；剪', zb: '减少',
    ex: [
      { en: 'The council plans to cut funding for libraries.', zh: '市政府打算削减图书馆经费。', t: '城市' },
      { en: 'Planting trees can reduce noise from busy roads.', zh: '种树能减少主干道的噪音。', t: '环境' },
    ],
    diff: 'cut 语气重，常说一下子砍掉；名词 cuts 常指「预算削减」。reduce 中性，作文更稳妥。',
    col: 'cut / reduce costs',
  },
  'replace|substitute': {
    pa: 'v.', pb: 'v. / n.', za: '取代；更换', zb: '代替；替代品',
    ex: [
      { en: 'Old buses will be replaced with electric ones.', zh: '旧公交车会换成电动的。', t: '城市' },
      { en: 'You can substitute honey for sugar in this recipe.', zh: '这道菜里可以用蜂蜜代替糖。', t: '饮食' },
    ],
    diff: 'substitute 还能当名词：替补队员、代课老师。replace 更常用，也可以只说「换掉」不提新的。',
    col: 'replace A with B / substitute B for A',
  },
  'council|local government': {
    pa: 'n.', pb: 'phr.', za: '市政会；委员会', zb: '地方政府',
    ex: [
      { en: 'The council has approved a new cycle lane.', zh: '市政会批准了一条新自行车道。', t: '城市' },
      { en: 'Local government is responsible for rubbish collection.', zh: '收垃圾由地方政府负责。', t: '社会' },
    ],
    diff: 'council 英式常用，也能指学生会等团体：student council。和 counsel（建议）同音，别拼错。',
    col: 'the city / local council',
  },
  'public transport|public transit': {
    pa: 'n.', pb: 'n.', za: '公共交通（英）', zb: '公共交通（美）',
    ex: [
      { en: 'Cheaper public transport could reduce traffic jams.', zh: '更便宜的公共交通能减少堵车。', t: '城市' },
      { en: 'Most New Yorkers rely on public transit.', zh: '多数纽约人靠公共交通出行。', t: '城市' },
    ],
    diff: '雅思用英式更多，写作选 public transport 就好，同一篇里别混着用。',
    col: 'use / rely on public transport',
  },
  'fare|ticket price': {
    pa: 'n.', pb: 'phr.', za: '车费；船费', zb: '票价',
    ex: [
      { en: 'Students pay half fare on city buses.', zh: '学生坐市内公交半价。', t: '城市' },
      { en: 'The ticket price includes a guided tour.', zh: '票价包含讲解导览。', t: '旅游' },
    ],
    diff: 'ticket price 什么票都能说，演出、展览都行。fare 只说交通，不说门票。',
    col: 'bus / train fare',
  },
  'route|way': {
    pa: 'n.', pb: 'n.', za: '路线', zb: '路；方式',
    ex: [
      { en: 'The new bus route links the university to the city centre.', zh: '新公交线连通大学和市中心。', t: '城市' },
      { en: 'Can you tell me the way to the station?', zh: '能告诉我去车站怎么走吗？', t: '出行' },
    ],
    diff: 'route 是固定或规划好的路线。way 更宽泛，还能指「方法」：a way to save money。',
    col: 'a bus route / the way to…',
  },
  'crowded|busy': {
    pa: 'adj.', pb: 'adj.', za: '拥挤的', zb: '繁忙的；人多的',
    ex: [
      { en: 'Trains are very crowded during rush hour.', zh: '高峰时段火车非常挤。', t: '出行' },
      { en: 'The market is busiest on Saturday mornings.', zh: '集市周六早上人最多。', t: '城市' },
    ],
    diff: 'crowded 强调挤得难受。busy 只是热闹、人多，也能说电话占线、人很忙。',
    col: 'crowded with people / a busy street',
  },
  'nearby|close by': {
    pa: 'adj. / adv.', pb: 'phr.', za: '附近的', zb: '在附近',
    ex: [
      { en: 'Students can park at a nearby shopping centre.', zh: '学生可以在附近的购物中心停车。', t: '学校' },
      { en: 'There is a good café close by.', zh: '附近有家不错的咖啡店。', t: '生活' },
    ],
    diff: 'close by 一般不放名词前，不说 a close by park。nearby 两个位置都行。',
    col: 'a nearby park / live close by',
  },
  'construct|build': {
    pa: 'v.', pb: 'v.', za: '建造（正式）', zb: '建；建立',
    ex: [
      { en: 'A new hospital will be constructed next to the river.', zh: '河边将建一座新医院。', t: '城市' },
      { en: 'Parents help children build confidence.', zh: '父母帮孩子建立自信。', t: '教育' },
    ],
    diff: 'build 还能说抽象的东西：build trust、build skills。construct 多说房子、桥、句子这类有结构的东西。',
    col: 'be constructed / built in + 年份',
  },
  'renovate|do up': {
    pa: 'v.', pb: 'phr. v.', za: '翻新', zb: '装修（英口语）',
    ex: [
      { en: 'The old cinema was renovated and reopened last year.', zh: '老电影院翻新后去年重新开张。', t: '城市' },
      { en: 'They bought an old house and did it up.', zh: '他们买了栋老房子，自己装修了。', t: '生活' },
    ],
    diff: 'renovate 名词是 renovation，常见 closed for renovation。do up 还有「系扣子」的意思。',
    col: 'closed for renovation',
  },
  'timetable|schedule': {
    pa: 'n.', pb: 'n. / v.', za: '时刻表；课表', zb: '日程；安排',
    ex: [
      { en: 'Check the timetable before you go to the station.', zh: '去车站前先看看时刻表。', t: '出行' },
      { en: 'The meeting is scheduled for Monday morning.', zh: '会议安排在周一上午。', t: '工作' },
    ],
    diff: 'schedule 能当动词「安排」，timetable 很少这样用。schedule 英式读音常带 /ʃ/，美式是 /sk/。',
    col: 'on schedule / a bus timetable',
  },
  'facilities|amenities': {
    pa: 'n.', pb: 'n.', za: '设施；场所', zb: '便利设施',
    ex: [
      { en: 'The university has excellent sports facilities.', zh: '这所大学的体育设施很好。', t: '教育' },
      { en: 'The flat is close to shops and other amenities.', zh: '公寓离商店和其他生活设施很近。', t: '城市' },
    ],
    diff: 'facilities 范围大，实验室、体育馆都算。两个词平时都用复数。',
    col: 'sports facilities / local amenities',
  },
  'trap:fair|fare': {
    pa: 'adj. / n.', pb: 'n.', za: '公平的；集市', zb: '车费',
    ex: [
      { en: 'It is not fair that women earn less for the same job.', zh: '同样的工作女性挣得少，这不公平。', t: '社会' },
      { en: 'Train fares have risen faster than wages.', zh: '火车票价涨得比工资快。', t: '城市' },
    ],
    diff: 'fair 当名词指「集市、展会」：a job fair。听力填空看前后文：说坐车花钱就是 fare。',
  },
  'trap:stationary|stationery': {
    pa: 'adj.', pb: 'n.', za: '静止的', zb: '文具',
    ex: [
      { en: 'The traffic was stationary for twenty minutes.', zh: '车流停了二十分钟没动。', t: '城市' },
      { en: 'The school gives free stationery to new pupils.', zh: '学校给新生免费发文具。', t: '教育' },
    ],
    diff: '记法：stationery 的 e 对应 envelope（信封），是文具。a 结尾那个是「停着」。',
  },
  'trap:route|root': {
    pa: 'n.', pb: 'n.', za: '路线', zb: '根；根源',
    ex: [
      { en: 'The cycling route follows the river.', zh: '这条骑行路线沿着河走。', t: '旅游' },
      { en: 'Poverty is often the root of crime.', zh: '贫穷往往是犯罪的根源。', t: '社会' },
    ],
    diff: 'route 英式读 /ruːt/，和 root 同音；美式也常读 /raʊt/。root cause 是「根本原因」。',
  },

  /* ───────── study-work ───────── */
  'employees|staff': {
    pa: 'n.', pb: 'n.', za: '雇员', zb: '全体员工',
    ex: [
      { en: 'The company has over 500 employees.', zh: '公司有五百多名员工。', t: '工作' },
      { en: 'The library staff are very helpful.', zh: '图书馆的工作人员很热心。', t: '学校' },
    ],
    diff: 'employees 能数个数：three employees。staff 指一整群人，说个数要说 three staff members。',
    col: 'members of staff',
  },
  'colleague|co-worker': {
    pa: 'n.', pb: 'n.', za: '同事', zb: '同事（美式多）',
    ex: [
      { en: 'I often have lunch with my colleagues.', zh: '我常和同事一起吃午饭。', t: '工作' },
      { en: 'Friendly co-workers make a job more enjoyable.', zh: '友好的同事让工作更开心。', t: '工作' },
    ],
    diff: 'colleague 常指同行、职位相近的人，医生、老师间也用。co-worker 更偏同一个地方一起干活的人。',
    col: 'a former colleague',
  },
  'applicant|candidate': {
    pa: 'n.', pb: 'n.', za: '申请人', zb: '候选人；考生',
    ex: [
      { en: 'Applicants must send a CV by 30 June.', zh: '申请人须在 6 月 30 日前寄简历。', t: '工作' },
      { en: 'The strongest candidate will be invited to an interview.', zh: '最强的候选人会被邀请面试。', t: '工作' },
    ],
    diff: 'applicant 只要投了申请就算。candidate 还能指选举候选人和考生，常是进入考虑范围的人。',
    col: 'a successful applicant / candidate',
  },
  'tutor|teacher': {
    pa: 'n.', pb: 'n.', za: '导师；家教', zb: '老师',
    ex: [
      { en: 'Each student meets their tutor once a week.', zh: '每个学生每周见一次导师。', t: '教育' },
      { en: 'Good teachers make students want to learn.', zh: '好老师让学生想学。', t: '教育' },
    ],
    diff: 'tutor 还指一对一的家教：a private tutor。teacher 多指中小学课堂上的老师。',
    col: 'a personal / private tutor',
  },
  'course|class': {
    pa: 'n.', pb: 'n.', za: '课程；一门课', zb: '一节课；班级',
    ex: [
      { en: 'She is taking a three-month cooking course.', zh: '她在上三个月的烹饪课程。', t: '教育' },
      { en: 'There are thirty students in each class.', zh: '每个班有三十个学生。', t: '教育' },
    ],
    diff: 'class 还能指「班级」和「阶层」：middle class。course 还能指「一道菜」：main course。',
    col: 'take a course / attend a class',
  },
  'lecture|talk': {
    pa: 'n. / v.', pb: 'n. / v.', za: '讲座；大课', zb: '讲话；演讲',
    ex: [
      { en: 'The first-year lectures are held in the main hall.', zh: '一年级的大课在主礼堂上。', t: '教育' },
      { en: 'A local farmer will give a talk on food waste.', zh: '一位本地农民会讲讲食物浪费。', t: '环境' },
    ],
    diff: 'lecture 当动词还有「训人、说教」的意思。talk 时间短、更随便，任何人都能 give a talk。',
    col: 'give / attend a lecture',
  },
  'attend|go to': {
    pa: 'v.', pb: 'phr. v.', za: '出席；上（学）', zb: '去',
    ex: [
      { en: 'Over 200 people attended the conference.', zh: '有两百多人参加了会议。', t: '工作' },
      { en: 'Most children go to school at the age of five.', zh: '多数孩子五岁上学。', t: '教育' },
    ],
    diff: 'attend 更正式，名词 attendance 是「出勤率」。go to 什么场合都能说。',
    col: 'attend a meeting / school',
  },
  'enrol|sign up': {
    pa: 'v.', pb: 'phr. v.', za: '注册；入学', zb: '报名',
    ex: [
      { en: 'More adults are enrolling on online courses.', zh: '越来越多成年人报读网课。', t: '教育' },
      { en: 'Sign up for the newsletter to get updates.', zh: '订阅简讯就能收到最新消息。', t: '媒体' },
    ],
    diff: 'enrol 多指正式入学、注册课程，名词 enrolment。sign up 更口语，报活动、注册账号都行。',
    col: 'sign up for sth',
  },
  'compulsory|required': {
    pa: 'adj.', pb: 'adj.', za: '义务的；必修的', zb: '必需的',
    ex: [
      { en: 'Education is compulsory until the age of sixteen.', zh: '十六岁前是义务教育。', t: '教育' },
      { en: 'A passport is required for international travel.', zh: '出国旅行需要护照。', t: '旅行' },
    ],
    diff: 'compulsory 强调法律、规定逼你做。required 也可能只是条件要求，语气轻一点。',
    col: 'compulsory education',
  },
  'previous|earlier': {
    pa: 'adj.', pb: 'adj. / adv.', za: '以前的；上一个', zb: '更早的',
    ex: [
      { en: 'No previous experience is necessary for this job.', zh: '这份工作不需要以往经验。', t: '工作' },
      { en: 'Earlier studies found similar results.', zh: '更早的研究得出过类似结果。', t: '学术' },
    ],
    diff: 'previous 常指紧挨着的上一个：the previous day。earlier 还能当副词：I arrived earlier。',
    col: 'previous experience',
  },
  'voluntary work|unpaid work': {
    pa: 'n.', pb: 'n.', za: '义工', zb: '无报酬工作',
    ex: [
      { en: 'Many students do voluntary work in the summer.', zh: '很多学生暑假做义工。', t: '社会' },
      { en: 'Housework is a type of unpaid work.', zh: '家务是一种无报酬的劳动。', t: '社会' },
    ],
    diff: 'voluntary work 强调自愿做好事。unpaid work 只说没钱拿，可能不是自愿的，比如家务、实习。',
    col: 'do voluntary work',
  },
  'salary|pay': {
    pa: 'n.', pb: 'n. / v.', za: '薪水（月薪年薪）', zb: '工资；报酬',
    ex: [
      { en: 'Teachers\' salaries vary widely between countries.', zh: '各国教师薪资差别很大。', t: '工作' },
      { en: 'Nurses are asking for better pay.', zh: '护士们在要求提高工资。', t: '工作' },
    ],
    diff: 'pay 当名词不可数，泛指拿到的钱。salary 可数，常说 a high salary、an annual salary。',
    col: 'a high salary / equal pay',
  },
  'qualified|certified': {
    pa: 'adj.', pb: 'adj.', za: '有资格的', zb: '经认证的',
    ex: [
      { en: 'All our swimming coaches are fully qualified.', zh: '我们所有游泳教练都有资格证。', t: '体育' },
      { en: 'The coffee is certified organic.', zh: '这咖啡有有机认证。', t: '环境' },
    ],
    diff: 'qualified 还能指「够格、有能力」：qualified for the job。certified 也说产品，强调有官方证书。',
    col: 'qualified to do sth',
  },
  'skills|abilities': {
    pa: 'n.', pb: 'n.', za: '技能', zb: '能力',
    ex: [
      { en: 'Employers value good communication skills.', zh: '雇主看重良好的沟通技能。', t: '工作' },
      { en: 'Tests do not show all of a child\'s abilities.', zh: '考试不能体现孩子的全部能力。', t: '教育' },
    ],
    diff: 'skills 常配具体领域：computer skills、language skills。ability 单数常接 to do：the ability to learn。',
    col: 'develop skills / the ability to do',
  },
  'deadline|due date': {
    pa: 'n.', pb: 'n.', za: '截止期限', zb: '到期日',
    ex: [
      { en: 'The deadline for applications is 5 May.', zh: '申请截止日是 5 月 5 日。', t: '教育' },
      { en: 'Library books must be returned by the due date.', zh: '图书馆的书须在到期日前还。', t: '学校' },
    ],
    diff: 'deadline 带压力感：meet a deadline。due date 还常指「预产期」和账单到期日。',
    col: 'meet / miss a deadline',
  },
  'assignment|coursework': {
    pa: 'n.', pb: 'n.', za: '作业；任务', zb: '平时作业',
    ex: [
      { en: 'The first assignment is a 2,000-word essay.', zh: '第一份作业是两千字的论文。', t: '教育' },
      { en: 'Coursework makes up 40% of the final grade.', zh: '平时作业占总成绩的 40%。', t: '教育' },
    ],
    diff: 'assignment 可数，一份一份交；也能指工作派的任务。coursework 不可数，是一学期所有作业的总称。',
    col: 'hand in an assignment',
  },
  'workplace|place of work': {
    pa: 'n.', pb: 'phr.', za: '工作场所', zb: '上班的地方',
    ex: [
      { en: 'Stress in the workplace is a growing problem.', zh: '职场压力问题越来越严重。', t: '工作' },
      { en: 'Smoking is banned in all places of work.', zh: '所有工作场所都禁止吸烟。', t: '健康' },
    ],
    diff: 'workplace 常和 in the 连用，泛指职场环境。place of work 偏法律、表格里的写法。',
    col: 'in the workplace',
  },
  'trap:employer|employee': {
    pa: 'n.', pb: 'n.', za: '雇主', zb: '雇员',
    ex: [
      { en: 'Employers should offer flexible working hours.', zh: '雇主应该提供弹性工作时间。', t: '工作' },
      { en: 'Each employee gets 25 days of holiday.', zh: '每个员工有 25 天假。', t: '工作' },
    ],
    diff: '-er 是发工资的一方，-ee 是被雇的一方。同样的规律：trainer 和 trainee。',
  },
  'trap:principal|principle': {
    pa: 'n. / adj.', pb: 'n.', za: '校长；主要的', zb: '原则；原理',
    ex: [
      { en: 'The principal reason for the change is cost.', zh: '变动的主要原因是成本。', t: '工作' },
      { en: 'The plan is based on the principle of equal pay.', zh: '这个方案基于同工同酬的原则。', t: '社会' },
    ],
    diff: '记法：principle 和 rule 都以 le 结尾，是规则。形容词「主要的」只能用 principal。',
  },
  'trap:advice|advise': {
    pa: 'n.', pb: 'v.', za: '建议（名词）', zb: '建议（动词）',
    ex: [
      { en: 'Students can get free advice on writing CVs.', zh: '学生可以免费获得写简历的建议。', t: '工作' },
      { en: 'Doctors advise people to walk every day.', zh: '医生建议人们每天走路。', t: '健康' },
    ],
    diff: 'advice 不可数，不说 an advice，要说 a piece of advice。读音也不同：-ice 读 /s/，-ise 读 /z/。',
  },

  /* ───────── leisure ───────── */
  'free entry|no charge': {
    pa: 'phr.', pb: 'phr.', za: '免费入场', zb: '不收费',
    ex: [
      { en: 'There is free entry to the museum on Sundays.', zh: '博物馆周日免费入场。', t: '旅游' },
      { en: 'Car parking is available at no charge.', zh: '停车不收费。', t: '城市' },
    ],
    diff: 'free entry 只说进门。no charge 什么服务都能用，常见 at no charge、no extra charge。',
    col: 'at no (extra) charge',
  },
  'discount|reduced price': {
    pa: 'n. / v.', pb: 'phr.', za: '折扣', zb: '降价后的价格',
    ex: [
      { en: 'Students get a 20% discount on gym membership.', zh: '学生办健身卡打八折。', t: '健康' },
      { en: 'Tickets are available at a reduced price after 6 p.m.', zh: '晚上六点后门票降价。', t: '娱乐' },
    ],
    diff: 'discount 说「便宜了多少」，常配 on 和百分比。reduced price 说「便宜后的那个价」。',
    col: 'a discount on sth',
  },
  'admission|entry': {
    pa: 'n.', pb: 'n.', za: '入场；录取', zb: '进入；入口',
    ex: [
      { en: 'Admission is free for children under five.', zh: '五岁以下儿童免费入场。', t: '旅游' },
      { en: 'Entry to the park closes at 5 p.m.', zh: '公园五点停止入园。', t: '旅游' },
    ],
    diff: 'admission 还指大学「录取」和医院「入院」。entry 还能指比赛的参赛作品、词典的词条。',
    col: 'admission fee / no entry',
  },
  'visitors|guests': {
    pa: 'n.', pb: 'n.', za: '游客；访客', zb: '客人；房客',
    ex: [
      { en: 'The castle attracts thousands of visitors each summer.', zh: '这座城堡每年夏天吸引数千游客。', t: '旅游' },
      { en: 'Hotel guests can use the pool for free.', zh: '酒店住客可免费用泳池。', t: '旅游' },
    ],
    diff: 'visitors 指来参观的人，不一定被请。guests 多是受邀或付钱住下的人，也指节目嘉宾。',
    col: 'hotel guests / visitor centre',
  },
  'spectators|audience': {
    pa: 'n.', pb: 'n.', za: '（比赛）观众', zb: '观众；听众',
    ex: [
      { en: 'The stadium can hold 60,000 spectators.', zh: '体育场能容纳六万名观众。', t: '体育' },
      { en: 'The audience laughed throughout the show.', zh: '观众从头笑到尾。', t: '娱乐' },
    ],
    diff: 'audience 是集体名词，一群人算一个：a large audience。spectators 是一个个人，能数。',
    col: 'a large audience',
  },
  'popular|well-liked': {
    pa: 'adj.', pb: 'adj.', za: '受欢迎的；流行的', zb: '招人喜欢的',
    ex: [
      { en: 'Cycling holidays are becoming more popular.', zh: '骑行度假越来越受欢迎。', t: '旅游' },
      { en: 'Mr Lee was a well-liked teacher at the school.', zh: '李老师在学校很受喜欢。', t: '教育' },
    ],
    diff: 'well-liked 多说人。popular 人、地方、活动都能说，还有「大众的」意思：popular culture。',
    col: 'popular with / among + 人群',
  },
  'exhibition|show': {
    pa: 'n.', pb: 'n. / v.', za: '展览', zb: '展；演出；节目',
    ex: [
      { en: 'The gallery is holding an exhibition of local art.', zh: '美术馆在办本地艺术展。', t: '文化' },
      { en: 'The flower show takes place every May.', zh: '花展每年五月举办。', t: '休闲' },
    ],
    diff: 'show 意思宽，演出、电视节目都算。exhibition 只说展品摆出来让人看，更正式。',
    col: 'hold an exhibition',
  },
  'display|show': {
    pa: 'v. / n.', pb: 'v. / n.', za: '陈列；显示', zb: '给…看；展示',
    ex: [
      { en: 'Old photos of the town are displayed in the hall.', zh: '大厅里陈列着小镇的老照片。', t: '文化' },
      { en: 'The map shows where the new stations will be.', zh: '地图显示了新车站的位置。', t: '图表' },
    ],
    diff: 'display 强调摆出来、放屏幕上让人看。show 更通用，还能说「表明」：results show that…',
    col: 'on display / on show',
  },
  'open|available': {
    pa: 'adj. / v.', pb: 'adj.', za: '开着的；开放的', zb: '可用的；有空的',
    ex: [
      { en: 'The swimming pool is open from 7 a.m. to 9 p.m.', zh: '泳池早七点到晚九点开放。', t: '休闲' },
      { en: 'There are still a few seats available.', zh: '还有几个座位。', t: '娱乐' },
    ],
    diff: 'available 常放名词后：rooms available。说人有空也用 available，不用 open。',
    col: 'open to the public',
  },
  'reserve|book': {
    pa: 'v.', pb: 'v. / n.', za: '预订；保留', zb: '预订',
    ex: [
      { en: 'These seats are reserved for elderly passengers.', zh: '这些座位留给老年乘客。', t: '出行' },
      { en: 'We booked a table for six at eight o\'clock.', zh: '我们订了八点六人的桌。', t: '生活' },
    ],
    diff: 'book 英式口语最常用，名词是 booking。reserve 还能指「留着不给别人用」，名词是 reservation。',
    col: 'book in advance',
  },
  'refreshments|snacks and drinks': {
    pa: 'n.', pb: 'phr.', za: '茶点', zb: '零食和饮料',
    ex: [
      { en: 'Light refreshments will be served after the talk.', zh: '讲座后有简单茶点。', t: '活动' },
      { en: 'You can buy snacks and drinks at the kiosk.', zh: '你可以在小卖亭买零食饮料。', t: '休闲' },
    ],
    diff: 'refreshments 总是复数，正式通知用语。snacks and drinks 是日常大白话。',
    col: 'light refreshments',
  },
  'venue|location': {
    pa: 'n.', pb: 'n.', za: '举办地点', zb: '位置；地点',
    ex: [
      { en: 'The venue for the final has not been decided.', zh: '决赛场地还没定。', t: '体育' },
      { en: 'The hotel is in a quiet location near the beach.', zh: '酒店位置安静，靠近海滩。', t: '旅游' },
    ],
    diff: 'location 任何地方都能说，还能指拍摄外景：on location。venue 一定和活动有关。',
    col: 'a concert venue / a central location',
  },
  'guided tour|tour with a guide': {
    pa: 'n.', pb: 'phr.', za: '导览', zb: '有导游的参观',
    ex: [
      { en: 'Guided tours of the factory run every hour.', zh: '工厂每小时有一场导览。', t: '旅游' },
      { en: 'A tour with a guide costs an extra five pounds.', zh: '跟导游参观要多付五英镑。', t: '旅游' },
    ],
    diff: 'guided tour 是固定说法，通知里都这么写。另一个是拆开解释，听力里可能这样换说。',
    col: 'take / go on a guided tour',
  },
  'outdoor|open-air': {
    pa: 'adj.', pb: 'adj.', za: '户外的', zb: '露天的',
    ex: [
      { en: 'Outdoor activities are good for children\'s health.', zh: '户外活动对孩子健康有好处。', t: '健康' },
      { en: 'The town has an open-air pool.', zh: '镇上有个露天泳池。', t: '休闲' },
    ],
    diff: '两个都只放名词前。副词「在户外」要用 outdoors 或 in the open air。',
    col: 'outdoor activities / an open-air market',
  },
  'souvenir|keepsake': {
    pa: 'n.', pb: 'n.', za: '纪念品', zb: '纪念物',
    ex: [
      { en: 'Many tourists buy souvenirs at the airport.', zh: '很多游客在机场买纪念品。', t: '旅游' },
      { en: 'She kept the ticket as a keepsake.', zh: '她把那张票留作纪念。', t: '生活' },
    ],
    diff: 'souvenir 多指旅游时买的。keepsake 常是别人送的、有感情的小东西，不一定买来。',
    col: 'a souvenir shop',
  },
  'entertainment|amusement': {
    pa: 'n.', pb: 'n.', za: '娱乐；演出', zb: '娱乐；好笑',
    ex: [
      { en: 'Television is the main form of entertainment for many.', zh: '对很多人来说电视是主要娱乐。', t: '媒体' },
      { en: 'The kids watched the clown with amusement.', zh: '孩子们看小丑看得很开心。', t: '生活' },
    ],
    diff: 'amusement 还指「被逗乐的感觉」，常见 amusement park。entertainment 更常说娱乐行业和节目。',
    col: 'entertainment industry / amusement park',
  },
  'accessible|easy to reach': {
    pa: 'adj.', pb: 'phr.', za: '可到达的；易获得的', zb: '容易到达',
    ex: [
      { en: 'All stations should be accessible to wheelchair users.', zh: '所有车站都应方便轮椅使用者进出。', t: '城市' },
      { en: 'The beach is easy to reach by bus.', zh: '坐公交去海滩很方便。', t: '旅游' },
    ],
    diff: 'accessible 还能说信息、服务好获得、好理解：accessible to everyone。easy to reach 只说地方好去。',
    col: 'accessible to + 人 / by + 交通',
  },
  'trap:dessert|desert': {
    pa: 'n.', pb: 'n. / v.', za: '甜点', zb: '沙漠；抛弃',
    ex: [
      { en: 'The set menu includes a starter, main course and dessert.', zh: '套餐含前菜、主菜和甜点。', t: '饮食' },
      { en: 'Rain rarely falls in the desert.', zh: '沙漠里很少下雨。', t: '环境' },
    ],
    diff: '记法：甜点人人想多要一份，所以多一个 s。读音也不同：dessert 重音在后，desert（沙漠）重音在前。',
  },
  'trap:historic|historical': {
    pa: 'adj.', pb: 'adj.', za: '有历史意义的', zb: '历史上的',
    ex: [
      { en: 'The historic town centre attracts many tourists.', zh: '历史悠久的老城区吸引很多游客。', t: '旅游' },
      { en: 'The museum keeps historical records of the city.', zh: '博物馆保存着这座城市的历史档案。', t: '文化' },
    ],
    diff: 'historic 带「重要、值得纪念」的意思：a historic moment。historical 只是说「属于过去、关于历史」。',
  },
  'trap:bored|boring': {
    pa: 'adj.', pb: 'adj.', za: '（人）感到无聊', zb: '无聊的、乏味的',
    ex: [
      { en: 'Children get bored if lessons are too long.', zh: '课太长孩子会觉得无聊。', t: '教育' },
      { en: 'Some people find museums boring.', zh: '有些人觉得博物馆没意思。', t: '旅游' },
    ],
    diff: '同样的规律：interested / interesting，tired / tiring。-ed 说感受，-ing 说原因。',
  },

  /* ───────── academic ───────── */
  'suggest|indicate': {
    pa: 'v.', pb: 'v.', za: '表明；建议', zb: '表明；指出',
    ex: [
      { en: 'Recent studies suggest that city cyclists live longer.', zh: '最近的研究表明，城里骑车的人更长寿。', t: '健康' },
      { en: 'The figures indicate a steady rise in online sales.', zh: '数据显示网购销量稳步上升。', t: '图表' },
    ],
    diff: 'suggest 语气最弱，像「看起来是这样」；indicate 稍有把握一点。suggest 还能当「建议」，indicate 不行。',
    col: 'The data suggest / indicate that…',
  },
  'demonstrate|show': {
    pa: 'v.', pb: 'v.', za: '证明；演示', zb: '显示；给…看',
    ex: [
      { en: 'The experiment demonstrated that plants grow faster with music.', zh: '实验证明植物听音乐长得更快。', t: '科学' },
      { en: 'The chart shows how people spend their free time.', zh: '图表显示人们怎么度过空闲时间。', t: '图表' },
    ],
    diff: 'demonstrate 语气比 show 强，像拿出证据。它还能指「示威游行」，名词 demonstration。',
    col: 'demonstrate that… / show how…',
  },
  'reveal|bring to light': {
    pa: 'v.', pb: 'phr.', za: '揭示；透露', zb: '使曝光',
    ex: [
      { en: 'The survey revealed that most teenagers sleep too little.', zh: '调查揭示大多数青少年睡眠不足。', t: '健康' },
      { en: 'The report brought to light serious safety problems.', zh: '这份报告让严重的安全问题曝光。', t: '社会' },
    ],
    diff: 'bring to light 多指问题、真相被翻出来，有点「原来藏着」的意思。reveal 中性，好结果也能用。',
    col: 'The study revealed that…',
  },
  'approximately|roughly': {
    pa: 'adv.', pb: 'adv.', za: '大约（书面）', zb: '大致；粗略地',
    ex: [
      { en: 'The survey included approximately 1,200 adults.', zh: '调查覆盖了大约 1200 名成年人。', t: '学术' },
      { en: 'Prices roughly doubled over ten years.', zh: '十年间价格大致翻了一倍。', t: '图表' },
    ],
    diff: 'roughly 能修饰动词和形容词：roughly equal、roughly doubled。approximately 主要放在数字前。',
    col: 'roughly equal / approximately + 数字',
  },
  'a decline|a reduction': {
    pa: 'n.', pb: 'n.', za: '下降；衰退', zb: '削减；降低',
    ex: [
      { en: 'There has been a decline in the number of bees.', zh: '蜜蜂数量在减少。', t: '环境' },
      { en: 'The plan aims for a 30% reduction in emissions.', zh: '这项计划目标是减排 30%。', t: '环境' },
    ],
    diff: 'a decline 常带「越来越差」的感觉。a reduction 多和人为措施连在一起，比如减排、降价。',
    col: 'a decline / reduction in + 名词',
  },
  'considerable|substantial': {
    pa: 'adj.', pb: 'adj.', za: '相当大的', zb: '大量的；实质的',
    ex: [
      { en: 'Learning a language takes considerable effort.', zh: '学一门语言要花很大功夫。', t: '教育' },
      { en: 'The town received substantial funding for new schools.', zh: '镇上得到了一大笔建新学校的资金。', t: '教育' },
    ],
    diff: 'substantial 还有「结实、实在」的意思：a substantial meal（一顿管饱的饭）。considerable 常配 effort、time。',
    col: 'a substantial amount of',
  },
  'research|study': {
    pa: 'n. / v.', pb: 'n. / v.', za: '研究（总称）', zb: '一项研究；学习',
    ex: [
      { en: 'More research is needed on the effects of social media.', zh: '社交媒体的影响还需要更多研究。', t: '媒体' },
      { en: 'A recent study looked at sleep and exam results.', zh: '一项新研究考察了睡眠和考试成绩。', t: '教育' },
    ],
    diff: 'study 还能指「学习」和「书房」。说「做研究」：do / carry out research。',
    col: 'carry out research / a study',
  },
  'investigate|look into': {
    pa: 'v.', pb: 'phr. v.', za: '调查；研究', zb: '调查；查一查',
    ex: [
      { en: 'Scientists are investigating the causes of the disease.', zh: '科学家在调查这种病的病因。', t: '健康' },
      { en: 'The manager promised to look into the complaint.', zh: '经理答应会查一查这个投诉。', t: '工作' },
    ],
    diff: 'investigate 常指警方、科学家系统地查，名词 investigation。look into 多是「我去了解一下」。',
    col: 'investigate the cause of…',
  },
  'analyse|examine': {
    pa: 'v.', pb: 'v.', za: '分析', zb: '检查；仔细研究',
    ex: [
      { en: 'Researchers analysed data from 50 schools.', zh: '研究人员分析了五十所学校的数据。', t: '教育' },
      { en: 'The doctor examined the patient carefully.', zh: '医生仔细给病人做了检查。', t: '健康' },
    ],
    diff: 'analyse 是拆开来看规律，多说数据。examine 还能指「体检」和「考试」，名词 exam 就是从这来的。',
    col: 'analyse data / examine evidence',
  },
  'evidence|proof': {
    pa: 'n.', pb: 'n.', za: '证据', zb: '证明；凭证',
    ex: [
      { en: 'There is growing evidence that exercise improves mood.', zh: '越来越多证据表明运动能改善心情。', t: '健康' },
      { en: 'You need proof of address to open an account.', zh: '开户要提供住址证明。', t: '生活' },
    ],
    diff: 'proof 还指办事要的凭证：proof of age、proof of address。evidence 说一点要 a piece of evidence。',
    col: 'evidence of / proof of sth',
  },
  'researchers|scientists': {
    pa: 'n.', pb: 'n.', za: '研究人员', zb: '科学家',
    ex: [
      { en: 'Researchers interviewed over 500 parents.', zh: '研究人员访谈了五百多位家长。', t: '学术' },
      { en: 'Scientists warn that sea levels will keep rising.', zh: '科学家警告海平面会继续上升。', t: '环境' },
    ],
    diff: 'researchers 范围大，搞社会、教育研究的也算。scientists 多指做自然科学的人。',
    col: 'a team of researchers',
  },
  'claim|argue': {
    pa: 'v. / n.', pb: 'v.', za: '声称', zb: '主张；争论',
    ex: [
      { en: 'The company claims its product is completely safe.', zh: '公司声称产品完全安全。', t: '消费' },
      { en: 'Some experts argue that homework should be banned.', zh: '有些专家主张取消家庭作业。', t: '教育' },
    ],
    diff: 'argue 通常会给出理由。claim 还能指「索要」：claim money back。argue 也有「吵架」的意思。',
    col: 'claim / argue that…',
  },
  'result in|lead to': {
    pa: 'phr. v.', pb: 'phr. v.', za: '导致', zb: '导致；通向',
    ex: [
      { en: 'Heavy rain resulted in flooding across the region.', zh: '大雨导致整个地区发洪水。', t: '环境' },
      { en: 'Too much screen time can lead to poor sleep.', zh: '看屏幕太久会导致睡不好。', t: '健康' },
    ],
    diff: 'lead to 还能说路「通往」某处：This road leads to the beach。result in 只说结果。',
    col: 'lead to / result in + 名词',
  },
  'consequence|result': {
    pa: 'n.', pb: 'n. / v.', za: '后果', zb: '结果；成绩',
    ex: [
      { en: 'Climate change has serious consequences for farmers.', zh: '气候变化对农民有严重后果。', t: '环境' },
      { en: 'The exam results will be published in August.', zh: '考试成绩八月公布。', t: '教育' },
    ],
    diff: 'result 复数常指「考试成绩」「研究结果」。as a consequence 和 as a result 都能当连接词。',
    col: 'serious consequences / as a result of',
  },
  'consequently|as a result': {
    pa: 'adv.', pb: 'phr.', za: '因此（书面）', zb: '结果；因此',
    ex: [
      { en: 'Fewer people drive. Consequently, the air is cleaner.', zh: '开车的人少了，因此空气更干净。', t: '环境' },
      { en: 'Prices rose. As a result, sales fell.', zh: '价格上涨，结果销量下降。', t: '图表' },
    ],
    diff: 'as a result 能加 of 接名词：as a result of the rain。consequently 不能这样接。',
    col: 'As a result of + 名词',
  },
  'benefit|advantage': {
    pa: 'n. / v.', pb: 'n.', za: '好处；福利', zb: '优势；有利条件',
    ex: [
      { en: 'Regular exercise has many health benefits.', zh: '经常运动对健康有很多好处。', t: '健康' },
      { en: 'Speaking two languages is an advantage in many jobs.', zh: '会两种语言在很多工作中是优势。', t: '工作' },
    ],
    diff: 'advantage 带比较的意思，比别人强一点。benefit 还能当动词：benefit from…，也指社会福利金。',
    col: 'benefit from / have an advantage over',
  },
  'drawback|disadvantage': {
    pa: 'n.', pb: 'n.', za: '缺点；弊端', zb: '不利条件；劣势',
    ex: [
      { en: 'The main drawback of online courses is the lack of contact.', zh: '网课的主要缺点是缺少交流。', t: '教育' },
      { en: 'Children from poor families are at a disadvantage.', zh: '穷人家的孩子处于劣势。', t: '社会' },
    ],
    diff: 'drawback 多说一件事本身的毛病。disadvantage 还能说人处境不利：at a disadvantage。',
    col: 'the main drawback of… / at a disadvantage',
  },
  'furthermore|in addition': {
    pa: 'adv.', pb: 'phr.', za: '而且；此外', zb: '另外',
    ex: [
      { en: 'Cycling is cheap. Furthermore, it keeps you fit.', zh: '骑车便宜，而且能保持健康。', t: '健康' },
      { en: 'In addition to lectures, students attend weekly seminars.', zh: '除了大课，学生每周还上研讨课。', t: '教育' },
    ],
    diff: 'in addition 能加 to 接名词或 -ing。furthermore 只放句首，语气更强，一篇里别反复用。',
    col: 'In addition to + 名词 / -ing',
  },
  'subsequently|later': {
    pa: 'adv.', pb: 'adv. / adj.', za: '随后（书面）', zb: '后来；以后',
    ex: [
      { en: 'The leaves are dried and subsequently packed.', zh: '叶子先被晾干，随后打包。', t: '流程图' },
      { en: 'I will call you back later.', zh: '我晚点给你回电话。', t: '生活' },
    ],
    diff: 'subsequently 多接在前一步之后，流程图作文常用。later 能说未来：see you later，subsequently 只说过去或流程。',
    col: 'and subsequently + 动词',
  },
  'primarily|mainly': {
    pa: 'adv.', pb: 'adv.', za: '主要地；首先', zb: '主要地',
    ex: [
      { en: 'The app is primarily designed for older users.', zh: '这个应用主要为老年用户设计。', t: '科技' },
      { en: 'The money was spent mainly on new books.', zh: '钱主要花在买新书上。', t: '教育' },
    ],
    diff: 'primarily 更书面，还带「首要」的意思。mainly 常用在说比例时：mainly young people。',
    col: 'be primarily / mainly used for',
  },
  'trap:nearly|about': {
    pa: 'adv.', pb: 'adv.', za: '差不多；几乎', zb: '大约',
    ex: [
      { en: 'Nearly 40% of students work part-time.', zh: '将近 40% 的学生做兼职。', t: '图表' },
      { en: 'About 40% of students live with their parents.', zh: '大约 40% 的学生和父母同住。', t: '图表' },
    ],
    diff: 'nearly 40% 可能是 38%，不会是 41%。原文写 41% 时，题目说 nearly 40% 就不对。',
  },
  'trap:imply|infer': {
    pa: 'v.', pb: 'v.', za: '暗示；意味着', zb: '推断',
    ex: [
      { en: 'The writer implies that cities are unsafe at night.', zh: '作者暗示城市夜里不安全。', t: '阅读' },
      { en: 'From the data, we can infer that costs will rise.', zh: '从数据可以推断成本会上升。', t: '图表' },
    ],
    diff: 'imply 主语是说话人或文字；infer 主语是听的人，常接 from。',
  },
  'trap:economic|economical': {
    pa: 'adj.', pb: 'adj.', za: '经济的；经济学的', zb: '省钱的；节约的',
    ex: [
      { en: 'Tourism brings economic benefits to small towns.', zh: '旅游给小镇带来经济收益。', t: '经济' },
      { en: 'Small cars are more economical to run.', zh: '小车开起来更省钱。', t: '出行' },
    ],
    diff: 'economic growth 是「经济增长」，不能写 economical growth。economical 常说车、做法省钱省料。',
  },
};
