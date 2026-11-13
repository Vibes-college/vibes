# Vibes

**app.vibes.college 的代码：一个学东西的社区。**

[vibes.college](https://vibes.college) · [English](#english)

多巴胺是刷到新东西的快乐，内啡肽是闯过一关的满足。Vibes 把两种快乐都用在学东西上。

第一个场景是英语：雅思、托福、成人英语。现在是内测，只能用邀请码注册。

## 有什么

- **线路图**：一门课一张地铁图，一站一个考点。有的站带视频、检票题和 AI 问答，不同的课之间可以换乘。
- **攻略**：一篇一篇的学习指南。
- **英语助手**：
  - 英文帖子一键翻译讲解，挑出值得学的说法；
  - 朗读，有 9 种音色；
  - 用中文写的帖子可以变成英文，有三种风格；
  - 回复别人时给回复思路；
  - 生词本。
- **私信里的 AI tutor**：记得住你的目标，回复里有语音条，每天最多主动找你一次。
- **内地访问提速**：空闲时预加载常用页面；回应和关注先在界面上生效；首页存在手机上，打开不用等。
- 以后的 mini app 也放在这里。

每一处改动见提交历史。和 Misskey 2026.10.0 原版的全部差别：[对比](https://github.com/Vibes-college/vibes/compare/misskey-2026.10.0...main)。

**2026-11-13 的同步**：社区里的小程序全部搬出去，各自是一个独立小程序，代码在 `miniapps/`（机考打字、生词本、听写、词汇线、语法课、同义词连连看，拍照单词的入口改到 `/apps/photo/`），地址统一是 `/apps/<名字>/`，旧地址 301 跳过去；小程序目录和每练完一组的一行学习摘要；闯关第二到四章和第四章的沙漏计时器，题目和答案搬进数据库、代码里不再带；Vibi（原来的 Mia）改名「学搭子」，回话服务放进 `services/vibi/`（等模型最多 60 秒，超时会说一声并放开队列），按人额度和全站保险丝，用量按 DeepSeek 回报的真实 token 记；私信在手机上贴着键盘、深色模式发送键压暗；时间线顶部换成「关注」「全站」「频道」三个标签。听写的录音是我们用 Kokoro-82M（Apache-2.0）在本机合成的。

**2026-11-11 的同步**：闯关先打一关不用注册，注册后地图直接出来；注册弹窗换成《公会守则》，密码至少 8 位；Mia 暂时不在时有兜底话，按玩家所在章节读知识稿；闯关数据换到 ch1-2026-11-11a，玩家看得到的字按品牌审校改过；第二章门口卡（第一章免费，心不卖）；定级测试的代码已经在（正式站入口先关着，录音换成真人录音再开）；同义词连连看 v0.4.2 接进 `/synonym/`（音效是 Kenney 的 CC0 素材，许可证在 `sounds/` 里）；每天第一次打开记一行，用来数日活。

**2026-11-10 深夜的同步**：路线图下线，`/map` 和旧的站号链接跳到闯关（对得上某一关就直接打开那一关），手机底栏改成一行 5 格、闯关在正中间；闯关页玩的时候底栏收起、留一道小横条叫回来，开打上面贴「本周名次」，去掉说明小字，Mia 气泡最多两行。

**2026-11-10 晚些时候的同步**：打开 `/quest` 不再等整套社区前端下载完——服务器在页面最前面放一小段脚本，马上摆出闯关地图（登录）或闯关门面（没登录），社区前端起来后接手同一个框，不重新加载；闯关的文件按内容加版本号长期缓存，社区的大块脚本等闯关第一屏画完再下。图标字体也拆小了，iPhone Safari 第一次打开不再先下 831 KB 的完整字体。

**2026-11-10 这次同步新增**：「闯关」第一章（`/quest`）：关卡地图、每天 5 颗心、答错扣心、练小程序或读锦囊补心、书屋、情报站、公会榜和 Boss，心和进度由服务器记账；没过关可以「问 Mia」，她带着错题在私信里先开口；听写、机考打字、词汇线、生词本练完一组能补心；第一次打开更快（启动文件合并、帖子提前要），加了匿名的启动测速记录。音效来自 Kenney（CC0），动画用 GSAP。

**2026-11-08 这次同步新增**：新人先走的机考打字线（0 号线）、词汇线（5 号线）、语法线（6 号线）；听写练习；生词本按记忆曲线安排复习；时间线里能「召唤 Agent」，调用你电脑上的 Claude Code / Codex 帮你写帖子和攻略；线路图每一站能看到最近闯关的同路人；断线提示、新用户设置弹窗等体验细节修了一批。

## 基于 Misskey

Vibes 的底座是开源社交软件 [Misskey](https://github.com/misskey-dev/misskey)。我们从 2026-10 起在 Misskey 2026.10.0 上开发。感谢 syuilo 和 Misskey 的所有贡献者。

- 仓库的第一个提交就是 Misskey 2026.10.0 原版，没有改动，标签是 `misskey-2026.10.0`。后面的提交都是我们的。
- Misskey 原来的说明改名留着：[README.misskey.md](README.misskey.md)、[CONTRIBUTING.misskey.md](CONTRIBUTING.misskey.md)。
- Misskey 本身的问题，请报给上游 [misskey-dev/misskey](https://github.com/misskey-dev/misskey)。

## 跑起来

构建、部署和自检脚本在 [Vibes-college/vibes-college](https://github.com/Vibes-college/vibes-college) 的 `apps/community/`。课程内容也在那里，用 `sync-course.mjs` 同步进来。

- 代码里的 `lojo` 是旧代号。
- 视频和第三方照片不在仓库里。本地跑起来，线路图的视频和 LOJO 旧页面的部分图片会是空的。

## 许可证

AGPL-3.0，和 Misskey 一样，见 [LICENSE](LICENSE) 和 [COPYING](COPYING)。Vibes 的名字和 logo 不在许可里。

## 参与和反馈

- 社区的问题和想法，在这里的 [Issues](https://github.com/Vibes-college/vibes/issues) 提；代码的 PR 也提到这里。课程内容和视频的问题，在 [Vibes-college/vibes-college](https://github.com/Vibes-college/vibes-college/issues) 提。
- 参与前先看 [CONTRIBUTING.md](CONTRIBUTING.md) 和[行为准则](CODE_OF_CONDUCT.md)。
- 安全问题不要公开，按 [SECURITY.md](SECURITY.md) 私下告诉我们。

## English

**The code behind app.vibes.college, a community for learning anything.** Dopamine is the joy of finding something new; endorphins are the satisfaction of clearing a level. Vibes puts both to work on learning. The first scene is English (IELTS, TOEFL, everyday English). The community is in invite-only beta.

What's here:

- subway-style route maps: one station per exam topic, some with videos, check questions and AI Q&A, and transfers between courses;
- guides;
- an English helper: explanations, read-aloud in 9 voices, turning Chinese drafts into English, reply ideas, and a wordbook;
- an AI tutor in direct messages that remembers your goals;
- faster loading over slow cross-border links.

Our mini apps will live here too.

Built on [Misskey](https://github.com/misskey-dev/misskey). The first commit is Misskey 2026.10.0, unchanged (tag `misskey-2026.10.0`); every commit after it is ours. [See all our changes](https://github.com/Vibes-college/vibes/compare/misskey-2026.10.0...main). Thanks to syuilo and all Misskey contributors.

Issues and pull requests are welcome here; see [CONTRIBUTING.md](CONTRIBUTING.md). License: AGPL-3.0, same as Misskey. The Vibes name and logo are not licensed. Build and deploy scripts live in [Vibes-college/vibes-college](https://github.com/Vibes-college/vibes-college).
