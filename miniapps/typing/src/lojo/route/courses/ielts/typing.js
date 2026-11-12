/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* 雅思 · 0 号线 · 机考打字：5 站，大约 15 分钟。新来的人先点亮这条短线，再去听力线做定级测试。
   打字小程序（社区仓库 miniapps/typing/，地址 /apps/typing/）和社区的路线图读这个文件（同步到社区代码的 lojo/route/courses/ielts/typing.js，不要在那边改；小程序那份是构建时的拷贝）。
   定下来的规矩（docs/decisions.md 2026-10-29，demo 在 prototypes/typing-line/）：
   - 放在定级测试前面；每站开始前写明过关规则，过了这一站就亮；可以越级挑战，过了不会点亮前面的站；
   - 电脑上速度 20 词/分钟以上；准确率 95% 以上（第 4、5 站）；
   - 第 5 站约 100 词、6 分钟，打的时候只显示剩余时间和字数，没有拼写检查，交卷后列出拼错的词；
   - 手机上第 4 站只看准确率，第 5 站只打前两句，限时 4 分 30 秒（按 12 词/分钟算）。
   速度按打字测试的惯例：5 个字符算 1 个词，只算打对的。准确率按交上去的字算：打错了马上改，不扣，只花时间。

   题目都是 Vibes 自己写的：不来自剑桥真题、官方样题、雅思王、179/538、my-ielts、Qwerty Learner，
   也没有用闯关题库（gates/）里的题。电话号码用 Ofcom 留给影视作品的号段（07700 900xxx）。

   每一站：id 存在账号的进度里，上线以后不要改；kind 是练法（copy 照着打、spell 看一遍再盖住打、
   listen 边听边打、mock 限时打一段）；need 是过关要对的条数（第 4 站没有 need，按准确率和速度过关）；
   minutes 是线路页上写的"约几分钟"（第 5 站按限时算）。
   第 4 站的句子不放撇号：手机会把 ' 换成弯引号，照着打就对不上了。 */

export const TYPING = {
 line: { n: 0, zh: '机考打字', en: 'Typing for the computer test', color: '#B4457E' },
 // 电脑上的目标；手机上第 4 站不看速度，第 5 站只打前两句
 goal: { wpm: 20, acc: 95 },
 stops: [
  { id: 'numbers', kind: 'copy', zh: '数字和符号', en: 'Numbers and symbols', short: { zh: '数字', en: 'Numbers' }, minutes: 2, need: 11,
   blurb: { zh: '日期、时间、价格、电话、邮编', en: 'Dates, times, prices, phone numbers, postcodes' },
   // field 是表上的栏目；prefix 是题上已经印好的符号，不用打
   items: [
    { kind: { zh: '日期', en: 'Date' }, field: 'Date of arrival', target: '14 March' },
    { kind: { zh: '日期，数字写法', en: 'Date in numbers' }, field: 'Return date', target: '24/04' },
    { kind: { zh: '时间', en: 'Time' }, field: 'Breakfast until', target: '9:45 am' },
    { kind: { zh: '时间，24 小时制', en: '24-hour time' }, field: 'Last bus', target: '23:10' },
    { kind: { zh: '价格，£ 已经印在题上', en: 'Price, the £ is printed' }, field: 'Price per night', prefix: '£', target: '68.50' },
    { kind: { zh: '价格，$ 要自己打', en: 'Price, type the $' }, field: 'Deposit', target: '$250' },
    { kind: { zh: '金额，带千位逗号', en: 'Amount with a comma' }, field: 'Total cost', target: '$1,240' },
    { kind: { zh: '百分比', en: 'Percentage' }, field: 'Student discount', target: '15%' },
    { kind: { zh: '百分比，带小数', en: 'Percentage with a decimal' }, field: 'Interest rate', target: '2.5%' },
    { kind: { zh: '电话', en: 'Phone number' }, field: 'Mobile', target: '07700 900183' },
    { kind: { zh: '邮编', en: 'Postcode' }, field: 'Postcode', target: 'NW3 7QT' },
    { kind: { zh: '编号', en: 'Reference' }, field: 'Booking reference', target: 'KT4096' },
   ] },

  { id: 'spelling', kind: 'spell', zh: '不靠自动纠正', en: 'No autocorrect', short: { zh: '拼写', en: 'Spelling' }, minutes: 3, need: 8,
   blurb: { zh: '常拼错的词：看一遍，盖住再打', en: 'Words people misspell: look, cover, type' },
   // spell 里方括号括起来的是最容易错的字母，第一遍会用黄线标出来；zh 是盖住以后的提示，sentence 的 ___ 是这个词
   items: [
    { spell: 'a[cc]o[mm]odation', zh: '住宿', tip: '两个 c，两个 m', sentence: 'The price includes ___ for three nights.' },
    { spell: 'ne[c]e[ss]ary', zh: '必要的', tip: '一个 c，两个 s', sentence: 'Is it ___ to book in advance?' },
    { spell: 'enviro[n]ment', zh: '环境', tip: 'en-vi-ron-ment，别漏了 n', sentence: 'Cars are bad for the ___.' },
    { spell: 'gover[n]ment', zh: '政府', tip: 'gov-ern-ment，别漏了 n', sentence: 'The ___ plans to build more homes.' },
    { spell: 'sep[a]rate', zh: '分开的', tip: '中间是 a：sep-a-rate', sentence: 'Keep the two groups in ___ rooms.' },
    { spell: 'defin[ite]ly', zh: '一定', tip: '结尾是 -itely，不是 -ately', sentence: 'I will ___ come to the meeting.' },
    { spell: 'We[d]nesday', zh: '星期三', tip: 'Wed-nes-day，d 不发音', sentence: 'The class is on ___ morning.' },
    { spell: 'lib[r]ary', zh: '图书馆', tip: 'li-brar-y，有两个 r', sentence: 'Please return the books to the ___.' },
    { spell: 're[c]o[mm]end', zh: '推荐', tip: '一个 c，两个 m', sentence: 'Can you ___ a good hotel?' },
    { spell: 'questio[nn]aire', zh: '问卷', tip: '两个 n', sentence: 'Please fill in this short ___.' },
   ] },

  { id: 'listening', kind: 'listen', zh: '边听边打', en: 'Type as you listen', short: { zh: '听打', en: 'Listening' }, minutes: 2, need: 8,
   blurb: { zh: '录音不等人，听到就打', en: 'The recording keeps going: type as you hear it' },
   // 录音用 Fish Audio 合成（服务器每句只合成一次），开始前全部下载好。合成不了就用字幕代替。
   // lookSeconds：开始前看题的时间；gapSeconds：每句放完留的时间，下一句开始，上一空就锁住。
   title: 'POTTERY CLASS', titleZh: '陶艺课报名',
   intro: 'You will hear a receptionist giving information about a pottery class. First, look at the notes.',
   instructions: { en: 'Write ONE WORD AND/OR A NUMBER for each answer.', zh: '每空填一个词或一个数字。' },
   lookSeconds: 5, gapSeconds: { desktop: 6, phone: 8 },
   // say 是录音读的话；note 是题上的笔记，after 是空后面的字；hl 是结果页录音原文里高亮的部分（不写就高亮答案）
   rows: [
    { say: 'The class meets every Thursday evening.', note: 'Day:', after: 'evening', answer: ['Thursday'] },
    { say: 'It starts at seven fifteen and finishes at nine.', note: 'Starts at:', hl: 'seven fifteen',
     answer: ['7:15', '7.15', '19:15', '19.15', '7:15pm', '7.15pm', '7:15 pm', '7.15 pm'] },
    { say: 'Please bring an apron, because the clay is very messy.', note: 'Bring: an', answer: ['apron'] },
    { say: 'The total cost for six weeks is forty-two pounds.', note: 'Cost for 6 weeks: £', hl: 'forty-two pounds', answer: ['42', '42.00'] },
    { say: "Your teacher is Anna Fletcher. That's F, L, E, T, C, H, E, R.", note: "Teacher's surname:", answer: ['Fletcher'] },
    { say: 'You can park for free behind the library.', note: 'Free parking: behind the', answer: ['library'] },
    { say: 'In the first lesson, most people make a small bowl.', note: 'First lesson: make a small', answer: ['bowl'] },
    { say: 'A first piece usually takes about three weeks to finish.', note: 'First piece takes about', after: 'weeks', answer: ['3', 'three'] },
    { say: 'The oven for the clay is in a separate building.', note: 'Oven: in a', after: 'building', answer: ['separate'] },
    { say: 'On the first day, please wear comfortable shoes.', note: 'First day: wear', after: 'shoes', answer: ['comfortable'] },
   ] },

  { id: 'sentences', kind: 'copy', zh: '打句子', en: 'Sentences', short: { zh: '句子', en: 'Sentences' }, minutes: 3,
   blurb: { zh: '5 句写作常用句，又快又准', en: 'Five sentences for writing: fast and accurate' },
   items: [
    { target: 'Many students now prefer to study online at home.' },
    { target: 'The chart shows how water use changed between 1990 and 2020.' },
    { target: 'In my opinion, public transport should be cheaper for everyone.' },
    { target: 'However, this plan would cost the government a lot of money.' },
    { target: 'Overall, the number of visitors rose steadily over the decade.' },
   ] },

  { id: 'mock', kind: 'mock', zh: '机考模拟', en: 'Mock test', short: { zh: '模拟', en: 'Mock' },
   blurb: { zh: '限时打一段话，没有拼写检查', en: 'A timed paragraph with no spellcheck' },
   // 照着原文打（这样才能判拼写），不是自己写作文。seconds：电脑上打全段的限时，按 20 词/分钟算、取整到半分钟；
   // phone：手机上只打前几句和它的限时，按 12 词/分钟算。
   topic: { zh: '政府该不该继续花钱办公共图书馆？', en: 'Should governments keep paying for public libraries?' },
   text: 'Some people believe that the government should spend more money on public libraries, while others think they are no longer necessary. In my opinion, libraries are still important, especially for students who do not have a quiet place to study at home. A library offers free books and a calm environment, which can definitely help young people to concentrate. Although many resources are now online, not every family can afford fast internet. Therefore, I would recommend that local councils keep their libraries open in the evenings. This is a simple way to give every student the same chance.',
   seconds: 360,
   phone: { sentences: 2, seconds: 270 } },
 ],
};
