# Vibi（社区里的 AI 学搭子）的回话服务

社区私信里的 Vibi，回话由这个小服务来做：社区把学员新发的消息发过来，它用 [Mastra](https://mastra.ai)（记忆 + 工具）调 DeepSeek 想好回复，社区再替 Vibi 发出去。它只在服务器的 Docker 网络里监听，不对外。

- 代码：`server.mjs`（一个文件）。版本见 `VERSION`，每版改了什么见 `CHANGELOG.md`。
- 跑起来要的环境变量写在 `server.mjs` 开头（DeepSeek 的 key、数据库地址、社区地址、和社区共用的密钥），都从服务器上的配置读，不在仓库里。
- 社区那边的接法在 `packages/backend/src/core/LojoTutorService.ts`（哪些学员交给它）和 `packages/backend/src/server/api/endpoints/lojo/tutor/pilot-tool.ts`（它能调的工具）。

许可证和整个仓库一样：AGPL-3.0。
