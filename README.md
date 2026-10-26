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

- 问题和建议在 [Vibes-college/vibes-college](https://github.com/Vibes-college/vibes-college/issues) 提。
- 参与前先看 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [行为准则](CODE_OF_CONDUCT.md)。
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

License: AGPL-3.0, same as Misskey. The Vibes name and logo are not licensed. Build and deploy scripts live in [Vibes-college/vibes-college](https://github.com/Vibes-college/vibes-college).
