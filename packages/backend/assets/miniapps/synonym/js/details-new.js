/* 同义替换消消乐 · 新话题学习详情（2026-11-11）
   给 data.js 里 2026-11-11 新加的 6 个话题（教育、科技、环境、健康、媒体、社会与政府）每一对词和每个陷阱配的详情：
   pa / pb = 词性，za / zb = 各自的中文，ex = 两个例句（第一句用 a，第二句用 b），diff = 区别，col = 常见搭配。
   例句全部由 Vibes College 原创（B1–B2，20 词以内），不取自剑桥雅思真题或任何书。
   键名和 data.js 一致：'a|b'，陷阱是 'trap:a|b'。 */

export const DETAILS_NEW = {
	// ───────── education 教育 ─────────
	'acquire|pick up': { pa: 'v.', pb: 'phr. v.', za: '获得、习得', zb: '（不经意地）学会', ex: [
		{ en: 'Young children acquire a second language more easily than adults.', zh: '小孩子比成年人更容易习得第二语言。', t: '教育' },
		{ en: 'She picked up some basic Spanish while working in Madrid.', zh: '她在马德里工作时学会了一点基础西班牙语。', t: '教育' },
	], diff: 'acquire 书面，常配 knowledge / skills / a language；pick up 口语，带「顺便、不费力学会」的意思。', col: 'acquire new skills' },
	'memorise|learn by heart': { pa: 'v.', pb: 'phr. v.', za: '记住、背下', zb: '背熟', ex: [
		{ en: 'Students often memorise facts without really understanding them.', zh: '学生常常把知识点背下来，却没真正理解。', t: '教育' },
		{ en: 'We had to learn the poem by heart for the school concert.', zh: '为了学校演出，我们得把这首诗背熟。', t: '教育' },
	], diff: 'memorise 英式拼法，美式写 memorize；learn by heart 口语，宾语常插在中间：learn sth by heart。', col: 'memorise vocabulary' },
	'comprehend|understand': { pa: 'v.', pb: 'v.', za: '理解', zb: '懂、理解', ex: [
		{ en: 'Some pupils struggle to comprehend long scientific texts.', zh: '有些学生很难读懂长篇的科学文章。', t: '教育' },
		{ en: 'Teachers should check that everyone understands the task.', zh: '老师应该确认每个人都明白任务是什么。', t: '教育' },
	], diff: 'comprehend 很书面，多用在否定或 fail to 后面；understand 什么场合都能用。', col: 'fully comprehend' },
	'concentrate|focus': { pa: 'v.', pb: 'v.', za: '集中精力', zb: '集中、聚焦', ex: [
		{ en: 'It is hard to concentrate in a noisy classroom.', zh: '在吵闹的教室里很难集中注意力。', t: '教育' },
		{ en: 'The new course focuses on practical writing skills.', zh: '这门新课侧重实用写作技能。', t: '教育' },
	], diff: '两个都接 on。concentrate 多说人的注意力；focus 还能说课程、研究「侧重」什么。', col: 'concentrate on / focus on' },
	'pupils|schoolchildren': { pa: 'n.', pb: 'n.', za: '（中小学）学生', zb: '学童', ex: [
		{ en: 'Pupils at the school wear a uniform every day.', zh: '这所学校的学生每天都穿校服。', t: '教育' },
		{ en: 'Many schoolchildren now walk to school in groups.', zh: '现在很多小学生结伴走路上学。', t: '教育' },
	], diff: 'pupils 是英式说法，只指中小学生；schoolchildren 一样，都不能用来说大学生（university students）。', col: 'primary school pupils' },
	'primary school|elementary school': { pa: 'n.', pb: 'n.', za: '小学', zb: '小学（美）', ex: [
		{ en: 'Children in the UK start primary school at the age of four or five.', zh: '英国孩子四五岁开始上小学。', t: '教育' },
		{ en: 'Most elementary schools in the US now teach basic coding.', zh: '现在美国大多数小学都教基础编程。', t: '教育' },
	], diff: '英式 primary school，美式 elementary school。听力里两种口音都会出现。', col: 'go to primary school' },
	'higher education|university study': { pa: 'n.', pb: 'n.', za: '高等教育', zb: '大学学习', ex: [
		{ en: 'More young people now continue into higher education than in the past.', zh: '现在继续读大学的年轻人比过去多。', t: '教育' },
		{ en: 'University study can be expensive for families on low incomes.', zh: '对低收入家庭来说，上大学可能很贵。', t: '教育' },
	], diff: 'higher education 是正式的统称，也包括学院；university study 更具体，说的就是读大学。', col: 'access to higher education' },
	'gifted|talented': { pa: 'adj.', pb: 'adj.', za: '有天赋的', zb: '有才华的', ex: [
		{ en: 'Some schools offer extra classes for gifted children.', zh: '有些学校给有天赋的孩子开加课。', t: '教育' },
		{ en: 'He is a talented musician who also does well in science.', zh: '他是个有才华的音乐人，理科也学得好。', t: '教育' },
	], diff: 'gifted 在教育文章里多指整体智力超常；talented 常说某一方面有才华：talented at drawing。', col: 'gifted students' },
	'instruct|teach': { pa: 'v.', pb: 'v.', za: '教授、指导', zb: '教', ex: [
		{ en: 'Trained staff instruct visitors on how to use the equipment.', zh: '受过培训的员工教参观者怎么用这些设备。', t: '教育' },
		{ en: 'She teaches maths at a local secondary school.', zh: '她在本地一所中学教数学。', t: '教育' },
	], diff: 'instruct 偏正式，多指教操作、技能，也有「命令、指示」的意思；teach 最通用，teach sb sth / teach sb to do。', col: 'instruct sb in sth' },
	'assess|evaluate': { pa: 'v.', pb: 'v.', za: '评估、考核', zb: '评价、评估', ex: [
		{ en: 'Students are assessed on both coursework and final exams.', zh: '学生的成绩看平时作业和期末考试两部分。', t: '教育' },
		{ en: 'The study evaluated the effects of online learning.', zh: '这项研究评估了网课的效果。', t: '教育' },
	], diff: '基本可换。assess 在教育里常指「考核学生」；evaluate 常说评估项目、方法的效果。', col: 'assess progress' },
	'grade|mark': { pa: 'n.', pb: 'n.', za: '分数、等级', zb: '分数', ex: [
		{ en: 'She got the highest grade in her class for history.', zh: '她历史拿了全班最高分。', t: '教育' },
		{ en: 'You lose marks if you go over the word limit.', zh: '超过字数限制会扣分。', t: '教育' },
	], diff: '英式多说 mark，美式多说 grade；grade 在英式里也常指 A、B、C 这种等级。', col: 'get good marks / grades' },
	'literacy|reading & writing': { pa: 'n.', pb: 'n.', za: '读写能力、识字', zb: '读和写', ex: [
		{ en: 'Adult literacy has improved greatly in the last fifty years.', zh: '过去五十年，成人识字率大大提高了。', t: '教育' },
		{ en: 'Reading and writing are taught together in the first year.', zh: '第一年读和写是一起教的。', t: '教育' },
	], diff: 'literacy 是不可数名词，指读写能力；现在也引申出 digital literacy（数字素养）这类说法。', col: 'literacy rate' },
	'numeracy|basic maths': { pa: 'n.', pb: 'n.', za: '计算能力', zb: '基础数学', ex: [
		{ en: 'Employers complain that some school leavers have poor numeracy.', zh: '雇主抱怨有些毕业生算术能力差。', t: '教育' },
		{ en: 'Many adults struggle with basic maths such as percentages.', zh: '很多成年人连百分比这样的基础数学都搞不定。', t: '教育' },
	], diff: 'numeracy 是正式说法，常和 literacy 成对出现；美式说 basic math，不加 s。', col: 'literacy and numeracy' },
	'drop out|quit school': { pa: 'phr. v.', pb: 'phr. v.', za: '退学、辍学', zb: '不上学了', ex: [
		{ en: 'Students who fall behind are more likely to drop out.', zh: '跟不上的学生更容易辍学。', t: '教育' },
		{ en: 'He quit school at sixteen to work in his father\'s shop.', zh: '他十六岁就不上学了，去他爸的店里干活。', t: '教育' },
	], diff: 'drop out 后面接 of：drop out of university；quit school 口语，美式多见。', col: 'drop out of school' },
	'play truant|skip school': { pa: 'phr.', pb: 'phr.', za: '逃学', zb: '逃学、翘课', ex: [
		{ en: 'Pupils who play truant often have problems at home.', zh: '逃学的学生往往家里有问题。', t: '教育' },
		{ en: 'Some teenagers skip school to play video games.', zh: '有些青少年逃学去打游戏。', t: '教育' },
	], diff: 'play truant 英式、偏书面；skip school 口语，美式常说，也说 cut class。名词 truancy = 逃学现象。', col: 'truancy rate' },
	'trap:lesson|lessen': { pa: 'n.', pb: 'v.', za: '一节课、教训', zb: '减轻、减少', ex: [
		{ en: 'Each lesson lasts forty-five minutes.', zh: '每节课四十五分钟。', t: '教育' },
		{ en: 'Smaller classes may lessen pressure on teachers.', zh: '小班也许能减轻老师的压力。', t: '教育' },
	], diff: '读音完全一样，听写时看词性：前面有 a / the 是 lesson，前面有 can / may 是 lessen。' },
	'trap:aloud|allowed': { pa: 'adv.', pb: 'adj.', za: '出声地', zb: '被允许的', ex: [
		{ en: 'The teacher asked each pupil to read a paragraph aloud.', zh: '老师让每个学生大声读一段。', t: '教育' },
		{ en: 'Phones are not allowed in the exam room.', zh: '考场里不准带手机。', t: '教育' },
	], diff: '读音完全一样。aloud 多跟 read / think / say 连用；allowed 前面常有 be：be allowed to do。' },
	'trap:literal|literate': { pa: 'adj.', pb: 'adj.', za: '字面的', zb: '识字的、有读写能力的', ex: [
		{ en: 'A literal translation often sounds strange to native speakers.', zh: '直译常常让母语者觉得别扭。', t: '教育' },
		{ en: 'Almost all adults in the country are now literate.', zh: '这个国家现在几乎所有成年人都识字。', t: '教育' },
	], diff: 'literal 说的是「按字面」；literate 说的是人会读会写，名词 literacy。' },

	// ───────── technology 科技 ─────────
	'cutting-edge|state-of-the-art': { pa: 'adj.', pb: 'adj.', za: '尖端的', zb: '最先进的', ex: [
		{ en: 'The hospital uses cutting-edge equipment to scan patients.', zh: '这家医院用尖端设备给病人做扫描。', t: '科技' },
		{ en: 'The new library has a state-of-the-art computer room.', zh: '新图书馆有一间设备最先进的机房。', t: '科技' },
	], diff: '都放名词前。state-of-the-art 常说设备、设施；cutting-edge 也常说研究、技术。', col: 'cutting-edge technology' },
	'pioneering|groundbreaking': { pa: 'adj.', pb: 'adj.', za: '开创性的', zb: '突破性的', ex: [
		{ en: 'Her pioneering work led to the first mobile phone batteries.', zh: '她的开创性工作带来了第一批手机电池。', t: '科技' },
		{ en: 'The team published a groundbreaking study on artificial intelligence.', zh: '这个团队发表了一项人工智能方面的突破性研究。', t: '科技' },
	], diff: 'pioneering 强调「最早做」；groundbreaking 强调「打破常规」。说研究、发明时基本可换。', col: 'groundbreaking research' },
	'outdated|obsolete': { pa: 'adj.', pb: 'adj.', za: '过时的', zb: '淘汰的、废弃的', ex: [
		{ en: 'Many schools still use outdated computers.', zh: '很多学校还在用过时的电脑。', t: '科技' },
		{ en: 'Video tapes became obsolete when DVDs arrived.', zh: 'DVD 出来后，录像带就被淘汰了。', t: '科技' },
	], diff: 'obsolete 程度更重，指已经没人用；outdated 只是旧了、不够新，还在用。', col: 'become obsolete' },
	'operate|run': { pa: 'v.', pb: 'v.', za: '操作、运转', zb: '运行、开动', ex: [
		{ en: 'Only trained staff are allowed to operate this machine.', zh: '只有受过培训的员工可以操作这台机器。', t: '科技' },
		{ en: 'The program runs on both phones and laptops.', zh: '这个程序手机和笔记本都能运行。', t: '科技' },
	], diff: 'operate 偏正式，多说人操作机器；run 口语，说机器、软件自己在运行。', col: 'operate a machine' },
	'user-friendly|easy to use': { pa: 'adj.', pb: 'phr.', za: '用户友好的', zb: '容易用的', ex: [
		{ en: 'The app has a user-friendly design that suits older people.', zh: '这个应用设计得很好上手，适合老年人。', t: '科技' },
		{ en: 'The new ticket machines are easy to use.', zh: '新的售票机很好用。', t: '科技' },
	], diff: 'user-friendly 能放名词前；easy to use 多放 be 后面。题目和原文常这样一换。', col: 'user-friendly interface' },
	'manual|by hand': { pa: 'adj.', pb: 'phr.', za: '手工的、体力的', zb: '用手', ex: [
		{ en: 'Robots now do much of the manual work in factories.', zh: '现在工厂里很多体力活都由机器人干。', t: '科技' },
		{ en: 'In the past, every letter was written by hand.', zh: '过去每封信都是手写的。', t: '科技' },
	], diff: 'manual 放名词前（manual labour）；by hand 放动词后。manual 作名词还是「说明书」。', col: 'manual labour' },
	'portable|easy to carry': { pa: 'adj.', pb: 'phr.', za: '便携的', zb: '方便携带', ex: [
		{ en: 'Portable devices let students study anywhere.', zh: '便携设备让学生随时随地都能学习。', t: '科技' },
		{ en: 'Modern laptops are light and easy to carry.', zh: '现在的笔记本电脑又轻又好带。', t: '科技' },
	], diff: 'portable 放名词前；easy to carry 放 be 后。题目里 portable 常被原文解释成 easy to carry around。', col: 'portable charger' },
	'store|save': { pa: 'v.', pb: 'v.', za: '存储', zb: '保存', ex: [
		{ en: 'Most companies now store customer data online.', zh: '现在大多数公司都把客户数据存在网上。', t: '科技' },
		{ en: 'Remember to save your work before closing the file.', zh: '关文件前记得保存。', t: '科技' },
	], diff: 'store 说长期存放大量数据；save 多指点一下「保存」。save 还有「省下、救」的意思。', col: 'store data' },
	'delete|erase': { pa: 'v.', pb: 'v.', za: '删除', zb: '抹掉、清除', ex: [
		{ en: 'Users can delete their accounts at any time.', zh: '用户随时可以注销账号。', t: '科技' },
		{ en: 'The virus erased all the files on the hard drive.', zh: '病毒把硬盘上的文件全清空了。', t: '科技' },
	], diff: 'delete 多说文件、信息、账号；erase 更彻底，也能说擦掉字迹、抹去记忆。', col: 'delete a file' },
	'browse|surf': { pa: 'v.', pb: 'v.', za: '浏览', zb: '（上网）冲浪', ex: [
		{ en: 'Many teenagers browse social media before bed.', zh: '很多青少年睡前刷社交媒体。', t: '科技' },
		{ en: 'He spends hours surfing the internet every evening.', zh: '他每天晚上上网好几个小时。', t: '科技' },
	], diff: '说上网时可换。browse 还能说在店里随便看看；surf 只跟 the internet / the web 配才是上网。', col: 'browse the web' },
	'repair|fix': { pa: 'v.', pb: 'v.', za: '修理', zb: '修好', ex: [
		{ en: 'It is often cheaper to replace a phone than to repair it.', zh: '换个新手机往往比修旧的还便宜。', t: '科技' },
		{ en: 'A technician came to fix the broken printer.', zh: '一个技术员来修坏掉的打印机。', t: '科技' },
	], diff: 'repair 偏正式，也能当名词（under repair）；fix 口语，还能说「解决问题、定下时间」。', col: 'repair costs' },
	'malfunction|break down': { pa: 'v.', pb: 'phr. v.', za: '出故障', zb: '坏掉', ex: [
		{ en: 'The flight was delayed because a sensor malfunctioned.', zh: '航班延误是因为一个传感器出了故障。', t: '科技' },
		{ en: 'Our washing machine broke down after only a year.', zh: '我们的洗衣机才用一年就坏了。', t: '科技' },
	], diff: 'malfunction 偏技术报告，常说部件「运行不正常」；break down 口语，多说车、机器整个停了。', col: 'equipment malfunction' },
	'install|set up': { pa: 'v.', pb: 'phr. v.', za: '安装', zb: '安装、设置', ex: [
		{ en: 'The council plans to install solar panels on schools.', zh: '市政部门打算在学校装太阳能板。', t: '科技' },
		{ en: 'It took me an hour to set up the new laptop.', zh: '我花了一个小时把新电脑设置好。', t: '科技' },
	], diff: 'install 说装软件、装设备；set up 更口语，包括装好后调好设置，还能说「建立」组织。', col: 'install software' },
	'rely on|depend on': { pa: 'phr. v.', pb: 'phr. v.', za: '依靠', zb: '依赖', ex: [
		{ en: 'Many students rely on their phones to check spelling.', zh: '很多学生靠手机查拼写。', t: '科技' },
		{ en: 'Modern hospitals depend on computers for almost everything.', zh: '现代医院几乎什么都离不开电脑。', t: '科技' },
	], diff: '基本可换。depend on 还能说「取决于」：It depends on the weather，这时不能换成 rely on。', col: 'rely heavily on' },
	'addicted to|hooked on': { pa: 'adj. phr.', pb: 'adj. phr.', za: '对……上瘾', zb: '迷上', ex: [
		{ en: 'Some children become addicted to online games.', zh: '有些孩子会沉迷网络游戏。', t: '科技' },
		{ en: 'My brother is completely hooked on his new phone.', zh: '我弟弟完全迷上了他的新手机。', t: '科技' },
	], diff: 'addicted to 正式，也说毒品、烟酒；hooked on 口语。to 是介词，后面接名词或 doing。', col: 'addicted to social media' },
	'trap:device|devise': { pa: 'n.', pb: 'v.', za: '设备、装置', zb: '想出、设计', ex: [
		{ en: 'Every student needs a device such as a tablet.', zh: '每个学生都需要一台平板之类的设备。', t: '科技' },
		{ en: 'Engineers devised a cheaper way to clean water.', zh: '工程师想出了一个更便宜的净水办法。', t: '科技' },
	], diff: 'device 结尾读 /s/，是名词；devise 结尾读 /z/，是动词。' },
	'trap:access|excess': { pa: 'n.', pb: 'n.', za: '使用的机会、接入', zb: '过量', ex: [
		{ en: 'Rural areas still lack access to fast internet.', zh: '农村地区还用不上快速网络。', t: '科技' },
		{ en: 'An excess of screen time can harm children\'s sleep.', zh: '看屏幕太多会影响孩子睡眠。', t: '科技' },
	], diff: 'access to 是「能用上」；excess 是「太多」，形容词 excessive。重音和开头元音都不同。' },
	'trap:technique|technology': { pa: 'n.', pb: 'n.', za: '技巧、方法', zb: '技术、科技', ex: [
		{ en: 'The coach taught us a new breathing technique.', zh: '教练教了我们一种新的呼吸方法。', t: '科技' },
		{ en: 'Technology has changed the way we shop.', zh: '科技改变了我们购物的方式。', t: '科技' },
	], diff: 'technique 是做某件事的具体手法，可数；technology 是整体的技术、设备。' },

	// ───────── environment 环境 ─────────
	'contaminate|pollute': { pa: 'v.', pb: 'v.', za: '污染、弄脏', zb: '污染', ex: [
		{ en: 'Chemicals from the factory contaminated the local water supply.', zh: '工厂的化学品污染了当地的供水。', t: '环境' },
		{ en: 'Traffic pollutes the air in most big cities.', zh: '大多数大城市的空气都被车流污染了。', t: '环境' },
	], diff: 'contaminate 多说水、食物、土壤混进有害东西；pollute 常说空气、河流、海洋。', col: 'contaminated water' },
	'emit|give off': { pa: 'v.', pb: 'phr. v.', za: '排放', zb: '散发出', ex: [
		{ en: 'Old cars emit more carbon dioxide than new ones.', zh: '旧车比新车排放更多二氧化碳。', t: '环境' },
		{ en: 'Burning plastic gives off toxic smoke.', zh: '烧塑料会冒出有毒的烟。', t: '环境' },
	], diff: 'emit 书面，名词 emissions 是环境文章高频词；give off 口语，也说气味、热量、光。', col: 'emit greenhouse gases' },
	'harmful|damaging': { pa: 'adj.', pb: 'adj.', za: '有害的', zb: '有破坏性的', ex: [
		{ en: 'Some cleaning products are harmful to fish.', zh: '有些清洁剂对鱼有害。', t: '环境' },
		{ en: 'Mass tourism can be damaging to coral reefs.', zh: '大规模旅游可能会破坏珊瑚礁。', t: '环境' },
	], diff: '都配 to。harmful 更常说健康；damaging 多说对环境、名声造成的破坏。', col: 'harmful to the environment' },
	'conserve|preserve': { pa: 'v.', pb: 'v.', za: '保护、节约', zb: '保护、保存', ex: [
		{ en: 'Farmers are learning new ways to conserve water.', zh: '农民在学新的节水方法。', t: '环境' },
		{ en: 'The park was created to preserve ancient forests.', zh: '建这个公园是为了保护古老的森林。', t: '环境' },
	], diff: 'conserve 还有「节约用」的意思（conserve energy）；preserve 强调保持原样，也说保存食物。', col: 'conserve energy' },
	'safeguard|protect': { pa: 'v.', pb: 'v.', za: '保障、保护', zb: '保护', ex: [
		{ en: 'New laws aim to safeguard rare birds and their nests.', zh: '新法律旨在保护珍稀鸟类和它们的巢。', t: '环境' },
		{ en: 'Wetlands protect coastal towns from flooding.', zh: '湿地保护沿海城镇不被水淹。', t: '环境' },
	], diff: 'safeguard 偏正式，多见于政策、法律；protect 最通用，protect A from B。', col: 'safeguard the environment' },
	'endangered|under threat': { pa: 'adj.', pb: 'phr.', za: '濒危的', zb: '受到威胁的', ex: [
		{ en: 'The snow leopard is an endangered species.', zh: '雪豹是濒危物种。', t: '环境' },
		{ en: 'Many island birds are now under threat from rats.', zh: '许多海岛鸟类现在受到老鼠的威胁。', t: '环境' },
	], diff: 'endangered 是专门说物种快灭绝；under threat 更宽，放 be 后面，后面常接 from。', col: 'endangered species' },
	'die out|become extinct': { pa: 'phr. v.', pb: 'phr.', za: '灭绝、消失', zb: '灭绝', ex: [
		{ en: 'Some frog species may die out within twenty years.', zh: '有些蛙类可能二十年内就会灭绝。', t: '环境' },
		{ en: 'The dodo became extinct in the seventeenth century.', zh: '渡渡鸟在十七世纪灭绝了。', t: '环境' },
	], diff: 'become extinct 更正式，只说物种；die out 口语，也能说语言、习俗渐渐消失。', col: 'be in danger of dying out' },
	'deforestation|forest loss': { pa: 'n.', pb: 'n.', za: '毁林、砍伐森林', zb: '森林减少', ex: [
		{ en: 'Deforestation is a major cause of climate change.', zh: '砍伐森林是气候变化的一大原因。', t: '环境' },
		{ en: 'Satellite images show rapid forest loss in the region.', zh: '卫星图片显示这个地区的森林在快速减少。', t: '环境' },
	], diff: 'deforestation 强调人为砍伐；forest loss 更中性，火灾造成的也算。题目里常互换。', col: 'tackle deforestation' },
	'deteriorate|worsen': { pa: 'v.', pb: 'v.', za: '恶化', zb: '变得更糟', ex: [
		{ en: 'Air quality deteriorates sharply in winter.', zh: '冬天空气质量急剧恶化。', t: '环境' },
		{ en: 'The drought worsened after another month without rain.', zh: '又一个月不下雨，旱情更严重了。', t: '环境' },
	], diff: 'deteriorate 书面，多说质量、健康、关系；worsen 中性。两个都可以不带宾语。', col: 'deteriorating conditions' },
	'rubbish|garbage': { pa: 'n.', pb: 'n.', za: '垃圾', zb: '垃圾（美）', ex: [
		{ en: 'Volunteers collected bags of rubbish from the beach.', zh: '志愿者从海滩上捡了好几袋垃圾。', t: '环境' },
		{ en: 'The city collects garbage twice a week.', zh: '这座城市每周收两次垃圾。', t: '环境' },
	], diff: '英式 rubbish，美式 garbage / trash，都不可数；书面统称 waste。', col: 'rubbish bin / garbage truck' },
	'dispose of|get rid of': { pa: 'phr. v.', pb: 'phr. v.', za: '处理、丢弃', zb: '扔掉、摆脱', ex: [
		{ en: 'Batteries must be disposed of safely.', zh: '电池必须安全处理。', t: '环境' },
		{ en: 'It is hard to get rid of plastic once it is in the sea.', zh: '塑料一进海里就很难清除。', t: '环境' },
	], diff: 'dispose of 正式，of 不能丢，名词 disposal；get rid of 口语，也能说摆脱坏习惯。', col: 'waste disposal' },
	'consume|use up': { pa: 'v.', pb: 'phr. v.', za: '消耗', zb: '用完', ex: [
		{ en: 'Data centres consume huge amounts of electricity.', zh: '数据中心耗电量巨大。', t: '环境' },
		{ en: 'We are using up the planet\'s resources too quickly.', zh: '我们把地球的资源用得太快了。', t: '环境' },
	], diff: 'consume 书面，名词 consumption；use up 强调「用光」。consume 还能说「吃、喝」。', col: 'energy consumption' },
	'fossil fuels|coal, oil and gas': { pa: 'n.', pb: 'n.', za: '化石燃料', zb: '煤、石油和天然气', ex: [
		{ en: 'Most countries still depend heavily on fossil fuels.', zh: '大多数国家还很依赖化石燃料。', t: '环境' },
		{ en: 'Power stations that burn coal, oil and gas release carbon.', zh: '烧煤、油、气的发电站会排放碳。', t: '环境' },
	], diff: '听力和阅读里常不直接说 fossil fuels，而是把三样列出来，要能认出是同一回事。', col: 'burn fossil fuels' },
	'wildlife|wild animals': { pa: 'n.', pb: 'n.', za: '野生动植物', zb: '野生动物', ex: [
		{ en: 'The new motorway will affect local wildlife.', zh: '新高速公路会影响当地的野生动物。', t: '环境' },
		{ en: 'Wild animals often move into cities to find food.', zh: '野生动物常常跑进城市找吃的。', t: '环境' },
	], diff: 'wildlife 不可数，不加 s；wild animals 是复数。', col: 'wildlife conservation' },
	'habitat|natural home': { pa: 'n.', pb: 'n.', za: '栖息地', zb: '天然家园', ex: [
		{ en: 'Building on wetlands destroys the habitat of many birds.', zh: '在湿地上盖房子会毁掉很多鸟的栖息地。', t: '环境' },
		{ en: 'Pandas are being returned to their natural home in the mountains.', zh: '大熊猫正被放回山里的天然家园。', t: '环境' },
	], diff: 'habitat 是生物学用词；natural home 是给普通读者的解释说法，题目常拿它替换 habitat。', col: 'habitat loss' },
	'trap:weather|whether': { pa: 'n.', pb: 'conj.', za: '天气', zb: '是否', ex: [
		{ en: 'Extreme weather is becoming more common.', zh: '极端天气越来越常见了。', t: '环境' },
		{ en: 'Scientists are unsure whether the ice will recover.', zh: '科学家不确定冰层会不会恢复。', t: '环境' },
	], diff: '读音一样。听写时看后面：whether 后面跟一个句子或 or not。' },
	'trap:waste|waist': { pa: 'n./v.', pb: 'n.', za: '垃圾、浪费', zb: '腰', ex: [
		{ en: 'Food waste is a serious problem in rich countries.', zh: '在富裕国家，浪费食物是个严重问题。', t: '环境' },
		{ en: 'The river water came up to my waist.', zh: '河水没到了我的腰。', t: '环境' },
	], diff: '读音一样，环境题里几乎都是 waste；拼写题别写成 waist。' },
	'trap:flora|fauna': { pa: 'n.', pb: 'n.', za: '（某地的）植物群', zb: '（某地的）动物群', ex: [
		{ en: 'The island\'s flora includes many rare orchids.', zh: '岛上的植物有很多珍稀兰花。', t: '环境' },
		{ en: 'Scientists recorded the local fauna, from insects to deer.', zh: '科学家记录了当地的动物，从昆虫到鹿都有。', t: '环境' },
	], diff: '常连用 flora and fauna（动植物）。flora 是植物，fauna 是动物，记法：f-l-o-r 像 flower。' },

	// ───────── health 健康 ─────────
	'unwell|ill': { pa: 'adj.', pb: 'adj.', za: '不舒服的', zb: '生病的', ex: [
		{ en: 'If you feel unwell, please tell the teacher.', zh: '要是觉得不舒服，请告诉老师。', t: '健康' },
		{ en: 'She was ill for two weeks with the flu.', zh: '她得流感病了两周。', t: '健康' },
	], diff: 'unwell 语气轻，多说一时不舒服；ill 可以很严重（seriously ill）。英式 ill，美式多说 sick。', col: 'feel unwell / fall ill' },
	'infectious|contagious': { pa: 'adj.', pb: 'adj.', za: '传染性的', zb: '接触传染的', ex: [
		{ en: 'Measles is a highly infectious disease.', zh: '麻疹是传染性很强的疾病。', t: '健康' },
		{ en: 'Patients are contagious for several days after symptoms appear.', zh: '症状出现后几天内病人都有传染性。', t: '健康' },
	], diff: '雅思里基本可换。严格说 contagious 指接触传染；contagious 还能比喻笑声、情绪会传染。', col: 'infectious disease' },
	'chronic|long-term': { pa: 'adj.', pb: 'adj.', za: '慢性的', zb: '长期的', ex: [
		{ en: 'Diabetes is a chronic condition that needs daily care.', zh: '糖尿病是需要天天照顾的慢性病。', t: '健康' },
		{ en: 'Long-term illness can make it hard to keep a job.', zh: '长期患病会让人很难保住工作。', t: '健康' },
	], diff: 'chronic 是医学说法，反义 acute（急性的）；long-term 更通俗，也能说长期计划。', col: 'chronic disease' },
	'recover|get better': { pa: 'v.', pb: 'phr. v.', za: '康复、恢复', zb: '好起来', ex: [
		{ en: 'Most people recover from a cold within a week.', zh: '大多数人感冒一周内就好了。', t: '健康' },
		{ en: 'He got better quickly after taking the medicine.', zh: '他吃了药很快就好了。', t: '健康' },
	], diff: 'recover 正式，后面接 from；get better 口语，也可以说技能变好。名词 recovery。', col: 'make a full recovery' },
	'medicine|medication': { pa: 'n.', pb: 'n.', za: '药、医学', zb: '药物', ex: [
		{ en: 'Keep all medicine out of the reach of children.', zh: '所有药都要放在孩子够不到的地方。', t: '健康' },
		{ en: 'She has been on medication for high blood pressure.', zh: '她一直在吃降血压的药。', t: '健康' },
	], diff: 'medication 偏医疗用语，be on medication = 在服药；medicine 还指「医学」这门学科。', col: 'take medicine' },
	'treatment|therapy': { pa: 'n.', pb: 'n.', za: '治疗', zb: '疗法', ex: [
		{ en: 'Early treatment can save many lives.', zh: '早治疗能救很多人的命。', t: '健康' },
		{ en: 'Music therapy helps some patients relax.', zh: '音乐疗法能帮一些病人放松。', t: '健康' },
	], diff: 'treatment 最通用；therapy 多指一种疗法或一段疗程，单说 therapy 常指心理治疗。', col: 'receive treatment' },
	'GP|family doctor': { pa: 'n.', pb: 'n.', za: '全科医生', zb: '家庭医生', ex: [
		{ en: 'You need to see your GP before visiting a specialist.', zh: '看专科医生前要先找全科医生。', t: '健康' },
		{ en: 'Our family doctor has known us for twenty years.', zh: '我们的家庭医生认识我们二十年了。', t: '健康' },
	], diff: 'GP 是英式常用说法（general practitioner）；family doctor 更通俗，美式常说。', col: 'register with a GP' },
	'exercise|physical activity': { pa: 'n.', pb: 'n.', za: '锻炼', zb: '身体活动', ex: [
		{ en: 'Regular exercise lowers the risk of heart disease.', zh: '经常锻炼能降低心脏病风险。', t: '健康' },
		{ en: 'Children need at least an hour of physical activity a day.', zh: '孩子每天至少需要活动一小时。', t: '健康' },
	], diff: 'physical activity 更宽，走路、做家务都算，研究报告爱用；exercise 多指专门锻炼。', col: 'do exercise' },
	'sedentary|inactive': { pa: 'adj.', pb: 'adj.', za: '久坐的', zb: '不活动的', ex: [
		{ en: 'Office workers often have a sedentary lifestyle.', zh: '上班族的生活方式常常是久坐不动。', t: '健康' },
		{ en: 'Inactive people are more likely to gain weight.', zh: '不爱动的人更容易长胖。', t: '健康' },
	], diff: 'sedentary 书面，多配 lifestyle / job；inactive 更通俗，physically inactive 很常见。', col: 'sedentary lifestyle' },
	'prevent|ward off': { pa: 'v.', pb: 'phr. v.', za: '预防、阻止', zb: '防止、抵御', ex: [
		{ en: 'Washing your hands helps prevent the spread of disease.', zh: '洗手有助于防止疾病传播。', t: '健康' },
		{ en: 'Some people take vitamin C to ward off colds.', zh: '有人吃维生素 C 来防感冒。', t: '健康' },
	], diff: 'prevent 最通用，prevent sb from doing；ward off 口语，多说防病、防危险。', col: 'prevent disease' },
	'nutritious|nourishing': { pa: 'adj.', pb: 'adj.', za: '有营养的', zb: '滋补的、有营养的', ex: [
		{ en: 'Schools should serve cheap but nutritious meals.', zh: '学校应该提供便宜又有营养的饭菜。', t: '健康' },
		{ en: 'A bowl of soup is a nourishing meal in winter.', zh: '冬天一碗汤是很滋补的一顿。', t: '健康' },
	], diff: '基本可换。nutritious 更常见于健康报告；nourishing 带一点「吃了暖身、补身体」的感觉。', col: 'nutritious food' },
	'portion|serving': { pa: 'n.', pb: 'n.', za: '一份', zb: '一份（食物）', ex: [
		{ en: 'Restaurant portions have grown larger over the years.', zh: '这些年餐厅的份量越来越大。', t: '健康' },
		{ en: 'Try to eat five servings of fruit and vegetables a day.', zh: '每天尽量吃五份蔬果。', t: '健康' },
	], diff: 'portion 常说份量大小（portion size）；serving 常见于营养建议和包装上的「每份」。', col: 'portion size' },
	'anxious|worried': { pa: 'adj.', pb: 'adj.', za: '焦虑的', zb: '担心的', ex: [
		{ en: 'Many students feel anxious before exams.', zh: '很多学生考前很焦虑。', t: '健康' },
		{ en: 'Parents are worried about how much time children spend online.', zh: '家长担心孩子上网时间太长。', t: '健康' },
	], diff: '都配 about。anxious 程度更重，健康文章里也指焦虑症状；worried 日常说法。', col: 'feel anxious about' },
	'stress|pressure': { pa: 'n.', pb: 'n.', za: '压力、紧张', zb: '压力', ex: [
		{ en: 'Long working hours can cause stress and poor sleep.', zh: '长时间工作会造成压力和睡眠差。', t: '健康' },
		{ en: 'Teenagers face pressure to look perfect online.', zh: '青少年面临在网上要显得完美的压力。', t: '健康' },
	], diff: 'pressure 多指外界给的压力（pressure to do）；stress 偏人身心的紧张反应。under stress / under pressure 都行。', col: 'reduce stress' },
	'fatigue|tiredness': { pa: 'n.', pb: 'n.', za: '疲劳', zb: '疲倦', ex: [
		{ en: 'Driver fatigue causes many road accidents.', zh: '司机疲劳驾驶导致很多交通事故。', t: '健康' },
		{ en: 'Tiredness during the day may be a sign of poor sleep.', zh: '白天犯困可能说明睡得不好。', t: '健康' },
	], diff: 'fatigue 书面、医学用词，常指长期或严重的累；tiredness 日常说法。', col: 'suffer from fatigue' },
	'trap:diary|dairy': { pa: 'n.', pb: 'n.', za: '日记', zb: '奶制品', ex: [
		{ en: 'Keeping a food diary can help you eat better.', zh: '记饮食日记能帮你吃得更健康。', t: '健康' },
		{ en: 'Dairy products such as milk are rich in calcium.', zh: '牛奶这类奶制品含钙丰富。', t: '健康' },
	], diff: '拼写题高频。diary 读 /ˈdaɪəri/，dairy 读 /ˈdeəri/。' },
	'trap:breath|breathe': { pa: 'n.', pb: 'v.', za: '呼吸、一口气', zb: '呼吸', ex: [
		{ en: 'Take a deep breath before you start speaking.', zh: '开口前先深吸一口气。', t: '健康' },
		{ en: 'People in the city breathe dirty air every day.', zh: '城里的人每天都在呼吸脏空气。', t: '健康' },
	], diff: 'breath 读短音 /breθ/，名词；breathe 读 /briːð/，动词。' },
	'trap:prescription|description': { pa: 'n.', pb: 'n.', za: '处方', zb: '描述', ex: [
		{ en: 'You need a prescription to buy this medicine.', zh: '买这种药需要处方。', t: '健康' },
		{ en: 'The doctor asked for a description of the pain.', zh: '医生让病人描述一下疼的感觉。', t: '健康' },
	], diff: '只差开头。prescription 动词 prescribe（开药）；description 动词 describe（描述）。' },

	// ───────── media 媒体 ─────────
	'journalist|reporter': { pa: 'n.', pb: 'n.', za: '记者、新闻工作者', zb: '记者', ex: [
		{ en: 'The journalist spent months investigating the story.', zh: '这位记者花了好几个月调查这件事。', t: '媒体' },
		{ en: 'A reporter interviewed people outside the stadium.', zh: '一名记者在体育场外采访了大家。', t: '媒体' },
	], diff: 'reporter 多指采访、报道新闻的；journalist 范围更大，写评论、做编辑的也算。', col: 'investigative journalist' },
	'celebrity|star': { pa: 'n.', pb: 'n.', za: '名人', zb: '明星', ex: [
		{ en: 'Celebrity news attracts millions of readers online.', zh: '名人新闻在网上吸引了几百万读者。', t: '媒体' },
		{ en: 'Film stars often appear in adverts for luxury goods.', zh: '电影明星常出现在奢侈品广告里。', t: '媒体' },
	], diff: 'celebrity 范围大，网红、主持人也算；star 多指演员、歌手、运动员。', col: 'celebrity culture' },
	'broadcast|air': { pa: 'v.', pb: 'v.', za: '播出、广播', zb: '播放', ex: [
		{ en: 'The match will be broadcast live around the world.', zh: '比赛将向全世界直播。', t: '媒体' },
		{ en: 'The documentary aired on national television last night.', zh: '这部纪录片昨晚在国家电视台播出了。', t: '媒体' },
	], diff: 'broadcast 过去式、过去分词都不变；air 作动词偏美式口语，也常用被动。', col: 'broadcast live' },
	'publish|bring out': { pa: 'v.', pb: 'phr. v.', za: '出版、发表', zb: '推出、出版', ex: [
		{ en: 'The magazine publishes a special issue every summer.', zh: '这本杂志每年夏天出一期特刊。', t: '媒体' },
		{ en: 'The author is bringing out a new book next month.', zh: '作者下个月要出新书。', t: '媒体' },
	], diff: 'publish 正式，也说发表论文、公布数据；bring out 口语，还能说推出新产品。', col: 'publish an article' },
	'the press|newspapers': { pa: 'n.', pb: 'n.', za: '新闻界、报刊', zb: '报纸', ex: [
		{ en: 'The minister refused to speak to the press.', zh: '部长拒绝接受媒体采访。', t: '媒体' },
		{ en: 'Fewer young people read newspapers every day.', zh: '每天看报的年轻人越来越少。', t: '媒体' },
	], diff: 'the press 指报刊和记者整体，动词单复数都可；newspapers 只是报纸本身。', col: 'freedom of the press' },
	'advertise|promote': { pa: 'v.', pb: 'v.', za: '做广告', zb: '推广、宣传', ex: [
		{ en: 'Companies advertise heavily on social media.', zh: '公司在社交媒体上大量投放广告。', t: '媒体' },
		{ en: 'The campaign promotes healthy eating in schools.', zh: '这个活动在学校推广健康饮食。', t: '媒体' },
	], diff: 'advertise 专指做广告；promote 更宽，打折、活动、宣传理念都算，还有「升职」的意思。', col: 'advertise a product' },
	'commercial|TV ad': { pa: 'n.', pb: 'n.', za: '（电视/电台）广告', zb: '电视广告', ex: [
		{ en: 'Some countries ban commercials for junk food during children\'s shows.', zh: '有些国家在儿童节目时段禁播垃圾食品广告。', t: '媒体' },
		{ en: 'A thirty-second TV ad can cost a fortune.', zh: '一条三十秒的电视广告可能花一大笔钱。', t: '媒体' },
	], diff: 'commercial 作名词专指电视、电台里的广告；ad 是 advertisement 的口语缩写，英式也说 advert。', col: 'TV commercial' },
	'persuade|convince': { pa: 'v.', pb: 'v.', za: '劝说、说服', zb: '使相信、说服', ex: [
		{ en: 'Adverts try to persuade us to buy things we don\'t need.', zh: '广告想说服我们买用不着的东西。', t: '媒体' },
		{ en: 'The report convinced many readers that the plan was wrong.', zh: '这篇报道让很多读者相信这个计划不对。', t: '媒体' },
	], diff: 'persuade 偏「劝人去做」（persuade sb to do）；convince 偏「让人相信」（convince sb that）。', col: 'persuade sb to do' },
	'accurate|correct': { pa: 'adj.', pb: 'adj.', za: '准确的', zb: '正确的', ex: [
		{ en: 'News reports should give accurate figures.', zh: '新闻报道应该给出准确的数字。', t: '媒体' },
		{ en: 'Please check that your personal details are correct.', zh: '请核对你的个人信息是否正确。', t: '媒体' },
	], diff: 'accurate 强调细节精确、跟事实一致；correct 是「对的、没错」，更日常。', col: 'accurate information' },
	'biased|one-sided': { pa: 'adj.', pb: 'adj.', za: '有偏见的', zb: '片面的', ex: [
		{ en: 'Some newspapers are biased towards one political party.', zh: '有些报纸偏向某一个政党。', t: '媒体' },
		{ en: 'The programme gave a one-sided view of the issue.', zh: '这个节目对这件事的看法很片面。', t: '媒体' },
	], diff: 'biased 后面可接 towards / against；one-sided 多放名词前：a one-sided argument。反义都是 balanced。', col: 'biased reporting' },
	'reliable|trustworthy': { pa: 'adj.', pb: 'adj.', za: '可靠的', zb: '值得信赖的', ex: [
		{ en: 'Students should use reliable sources in their essays.', zh: '学生写论文要用可靠的资料来源。', t: '媒体' },
		{ en: 'Many people find local news more trustworthy than national news.', zh: '很多人觉得本地新闻比全国新闻更可信。', t: '媒体' },
	], diff: 'reliable 也说机器、车靠得住；trustworthy 多说人或信息「值得信任」。', col: 'a reliable source' },
	'misleading|deceptive': { pa: 'adj.', pb: 'adj.', za: '误导的', zb: '骗人的', ex: [
		{ en: 'The headline was misleading and did not match the story.', zh: '标题有误导性，跟内容对不上。', t: '媒体' },
		{ en: 'Deceptive adverts can be removed by the regulator.', zh: '骗人的广告会被监管机构撤下。', t: '媒体' },
	], diff: 'misleading 不一定是故意的；deceptive 带「故意骗人」的意思，更重。', col: 'misleading information' },
	'circulate|spread': { pa: 'v.', pb: 'v.', za: '流传、传播', zb: '传播、扩散', ex: [
		{ en: 'Rumours circulated online within minutes of the event.', zh: '事件发生几分钟后谣言就在网上流传开了。', t: '媒体' },
		{ en: 'False stories spread faster than true ones.', zh: '假消息比真消息传得快。', t: '媒体' },
	], diff: 'circulate 偏书面，多说消息、文件流传；spread 更通用，也说疾病、火势蔓延。', col: 'spread rumours' },
	'go viral|be widely shared': { pa: 'phr.', pb: 'phr.', za: '走红、疯传', zb: '被广泛转发', ex: [
		{ en: 'Her video about recycling went viral overnight.', zh: '她那条讲回收的视频一夜之间火了。', t: '媒体' },
		{ en: 'The photo was widely shared on social media.', zh: '这张照片在社交媒体上被大量转发。', t: '媒体' },
	], diff: 'go viral 口语，只说网上内容；be widely shared 是更中性的书面说法。', col: 'go viral online' },
	'fake news|false information': { pa: 'n.', pb: 'n.', za: '假新闻', zb: '虚假信息', ex: [
		{ en: 'Schools now teach pupils how to spot fake news.', zh: '现在学校教学生怎么识别假新闻。', t: '媒体' },
		{ en: 'Sharing false information can cause real harm.', zh: '传播虚假信息可能造成实际伤害。', t: '媒体' },
	], diff: 'fake news 多指故意编的假新闻；false information 更宽，学术写作也用 misinformation。', col: 'spot fake news' },
	'trap:censor|sensor': { pa: 'v./n.', pb: 'n.', za: '审查（者）', zb: '传感器', ex: [
		{ en: 'Some governments censor news about protests.', zh: '有些政府审查有关抗议的新闻。', t: '媒体' },
		{ en: 'The light turns on when the sensor detects movement.', zh: '传感器一感应到动静，灯就亮了。', t: '媒体' },
	], diff: '读音一样。censor 名词 censorship（审查制度）；sensor 是装置。' },
	'trap:critic|critique': { pa: 'n.', pb: 'n.', za: '评论家、批评者', zb: '评论、评析', ex: [
		{ en: 'The film critic gave the movie two stars.', zh: '那位影评人给这部电影打了两星。', t: '媒体' },
		{ en: 'The article offers a sharp critique of online advertising.', zh: '这篇文章尖锐地批评了网络广告。', t: '媒体' },
	], diff: 'critic 是人；critique 是一篇评论或一番批评。形容词 critical。' },
	'trap:personal|personnel': { pa: 'adj.', pb: 'n.', za: '个人的', zb: '全体人员、人事部门', ex: [
		{ en: 'Apps often collect personal data without users noticing.', zh: '应用常常在用户没注意时收集个人数据。', t: '媒体' },
		{ en: 'Only authorised personnel may enter the studio.', zh: '只有授权人员可以进入演播室。', t: '媒体' },
	], diff: 'personal 重音在前 /ˈpɜːsənl/；personnel 重音在后 /ˌpɜːsəˈnel/，作名词。' },

	// ───────── society 社会与政府 ─────────
	'ban|prohibit': { pa: 'v.', pb: 'v.', za: '禁止', zb: '（正式）禁止', ex: [
		{ en: 'Several cities have banned plastic bags.', zh: '好几个城市已经禁用塑料袋。', t: '社会' },
		{ en: 'Smoking is prohibited in all public buildings.', zh: '所有公共建筑内禁止吸烟。', t: '社会' },
	], diff: 'prohibit 更正式，多用被动，prohibit sb from doing；ban 新闻里常用，还能当名词 a ban on。', col: 'a ban on sth' },
	'allow|permit': { pa: 'v.', pb: 'v.', za: '允许', zb: '（正式）允许', ex: [
		{ en: 'The new law allows young people to vote at sixteen.', zh: '新法律允许年轻人十六岁投票。', t: '社会' },
		{ en: 'Dogs are not permitted in the playground.', zh: '游乐场内不准带狗。', t: '社会' },
	], diff: 'permit 更正式，告示和规定爱用；permit 作名词是「许可证」。', col: 'be permitted to do' },
	'mandatory|obligatory': { pa: 'adj.', pb: 'adj.', za: '强制的', zb: '必须的、义务的', ex: [
		{ en: 'Wearing a seat belt is mandatory in most countries.', zh: '在大多数国家，系安全带是强制的。', t: '社会' },
		{ en: 'Military service is obligatory for young men in some countries.', zh: '在有些国家，年轻男性必须服兵役。', t: '社会' },
	], diff: '都很正式。mandatory 更常见于法律、政策；obligatory 也能说「按习俗必须的」。', col: 'mandatory for all' },
	'legislation|laws': { pa: 'n.', pb: 'n.', za: '法律、立法', zb: '法律', ex: [
		{ en: 'New legislation will protect workers in the gig economy.', zh: '新法律将保护零工经济中的劳动者。', t: '社会' },
		{ en: 'Stricter laws on drink-driving have saved lives.', zh: '更严的酒驾法规救了很多人。', t: '社会' },
	], diff: 'legislation 不可数，是一批法律的统称；laws 可数。introduce legislation = 出台法律。', col: 'introduce legislation' },
	'fund|finance': { pa: 'v.', pb: 'v.', za: '资助', zb: '提供资金', ex: [
		{ en: 'The project is funded by local businesses.', zh: '这个项目由本地企业资助。', t: '社会' },
		{ en: 'The government will finance the new hospital.', zh: '政府将出钱建新医院。', t: '社会' },
	], diff: '作动词基本可换。fund 常说长期资助公共服务；finance 常说为一个具体项目出钱。', col: 'publicly funded' },
	'unemployed|out of work': { pa: 'adj.', pb: 'phr.', za: '失业的', zb: '没工作的', ex: [
		{ en: 'Young people are more likely to be unemployed.', zh: '年轻人更容易失业。', t: '社会' },
		{ en: 'Thousands were out of work after the factory closed.', zh: '工厂关门后，几千人没了工作。', t: '社会' },
	], diff: 'unemployed 正式，the unemployed 指失业人群；out of work 口语，放 be 后面。', col: 'long-term unemployed' },
	'public spending|state spending': { pa: 'n.', pb: 'n.', za: '公共开支', zb: '政府开支', ex: [
		{ en: 'Public spending on health has risen every year.', zh: '公共医疗开支每年都在增加。', t: '社会' },
		{ en: 'State spending on education varies between countries.', zh: '各国政府的教育开支各不相同。', t: '社会' },
	], diff: '都指政府花的钱，也常写 government spending。cut public spending = 削减公共开支。', col: 'cuts in public spending' },
	'offender|lawbreaker': { pa: 'n.', pb: 'n.', za: '罪犯、违法者', zb: '违法者', ex: [
		{ en: 'Young offenders may do community work instead of prison.', zh: '少年犯可以做社区服务代替坐牢。', t: '社会' },
		{ en: 'Cameras help police identify lawbreakers on the roads.', zh: '摄像头帮警察认出路上的违法者。', t: '社会' },
	], diff: 'offender 是法律和报告里的常用词；lawbreaker 更通俗。repeat offender = 惯犯。', col: 'young offenders' },
	'prison|jail': { pa: 'n.', pb: 'n.', za: '监狱', zb: '监狱、看守所', ex: [
		{ en: 'Some argue that prison does not stop people committing crimes.', zh: '有人认为坐牢并不能让人不再犯罪。', t: '社会' },
		{ en: 'He spent three months in jail for theft.', zh: '他因偷窃坐了三个月牢。', t: '社会' },
	], diff: '英式 prison 更常用；美式 jail 多指短期关押的地方。go to prison / jail 都不加 the。', col: 'be sent to prison' },
	'penalty|punishment': { pa: 'n.', pb: 'n.', za: '处罚、罚款', zb: '惩罚', ex: [
		{ en: 'The penalty for littering is a fine of fifty pounds.', zh: '乱扔垃圾罚款五十英镑。', t: '社会' },
		{ en: 'Some people believe harsher punishment reduces crime.', zh: '有人认为更重的惩罚能减少犯罪。', t: '社会' },
	], diff: 'penalty 多指规定好的具体处罚，如罚款；punishment 更宽，也说家长、老师的惩罚。', col: 'a heavy penalty' },
	'the elderly|older people': { pa: 'n.', pb: 'n.', za: '老年人', zb: '年纪大的人', ex: [
		{ en: 'The elderly are often the most affected by heatwaves.', zh: '热浪来时受影响最大的往往是老年人。', t: '社会' },
		{ en: 'Many older people live alone in big cities.', zh: '大城市里很多老人独居。', t: '社会' },
	], diff: 'the elderly 后面动词用复数；作文里 older people 听起来更礼貌，也可说 senior citizens。', col: 'care for the elderly' },
	'deprived|disadvantaged': { pa: 'adj.', pb: 'adj.', za: '贫困的', zb: '弱势的、处境不利的', ex: [
		{ en: 'Children from deprived areas often leave school earlier.', zh: '贫困地区的孩子往往更早离开学校。', t: '社会' },
		{ en: 'The scheme gives free laptops to disadvantaged students.', zh: '这个计划给弱势学生免费发笔记本电脑。', t: '社会' },
	], diff: 'deprived 多说地区、家庭缺基本生活条件；disadvantaged 更宽，也说机会少的群体。', col: 'deprived areas' },
	'tackle|deal with': { pa: 'v.', pb: 'phr. v.', za: '着手解决', zb: '处理', ex: [
		{ en: 'The council is trying to tackle youth unemployment.', zh: '市政部门在设法解决青年失业问题。', t: '社会' },
		{ en: 'Governments must deal with the rising cost of housing.', zh: '政府必须应对不断上涨的房价。', t: '社会' },
	], diff: 'tackle 语气积极，带「下决心去解决」；deal with 更中性，也指日常处理事情。', col: 'tackle a problem' },
	'implement|carry out': { pa: 'v.', pb: 'phr. v.', za: '实施、执行', zb: '执行、开展', ex: [
		{ en: 'The new policy will be implemented next year.', zh: '新政策将于明年实施。', t: '社会' },
		{ en: 'The city carried out a survey of local residents.', zh: '市里对当地居民做了一次调查。', t: '社会' },
	], diff: 'implement 多配 policy / plan / changes；carry out 范围大，调查、实验、任务都能说。', col: 'implement a policy' },
	'combat|fight': { pa: 'v.', pb: 'v.', za: '打击、对抗', zb: '与……斗争', ex: [
		{ en: 'Police are using new methods to combat online crime.', zh: '警察在用新方法打击网络犯罪。', t: '社会' },
		{ en: 'The charity fights poverty in rural communities.', zh: '这个慈善机构在农村地区扶贫。', t: '社会' },
	], diff: 'combat 偏书面，新闻和政策文件常用；fight 更通用，也能作名词：the fight against crime。', col: 'combat crime' },
	'trap:council|counsel': { pa: 'n.', pb: 'n./v.', za: '市政会、委员会', zb: '建议、律师；提供咨询', ex: [
		{ en: 'The local council voted to build a new library.', zh: '地方议会投票决定建一座新图书馆。', t: '社会' },
		{ en: 'Students can get free counsel on their career choices.', zh: '学生可以在择业方面得到免费指导。', t: '社会' },
	], diff: '读音一样。council 是机构；counsel 是建议或律师，counselling 指心理咨询。' },
	'trap:policy|politics': { pa: 'n.', pb: 'n.', za: '政策', zb: '政治', ex: [
		{ en: 'The government changed its policy on immigration.', zh: '政府改变了移民政策。', t: '社会' },
		{ en: 'Many young people are not interested in politics.', zh: '很多年轻人对政治不感兴趣。', t: '社会' },
	], diff: 'policy 是一项具体的政策，可数；politics 是政治这件事整体，形容词 political。' },
	'trap:immigrate|emigrate': { pa: 'v.', pb: 'v.', za: '移入（别国）', zb: '移出（本国）', ex: [
		{ en: 'His grandparents immigrated to Canada in the 1960s.', zh: '他的祖父母在六十年代移民到加拿大。', t: '社会' },
		{ en: 'Many nurses emigrate from the Philippines to find work.', zh: '很多护士从菲律宾移民出国找工作。', t: '社会' },
	], diff: 'immigrate to 某国（进来）；emigrate from 某国（出去）。im- 进，e- 出。' },
};
