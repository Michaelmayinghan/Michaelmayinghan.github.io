# 补充片段:RAG 助理 + 拳击摄影

## section: project_rag_assistant_zh
## title: 项目:本网站的 RAG 智能策展助理

时间:2026 年 4 月。
技术栈:Vercel Serverless Functions、DeepSeek API、TF-IDF 关键词检索、JavaScript ES Modules。

构建了一个轻量级 RAG(检索增强生成)系统,作为 yinghanma.com 的内置 AI 助理。访客可以用自然语言询问 Yinghan 的项目、研究、技能,系统会从结构化知识库中检索最相关的片段,再由 DeepSeek Chat 模型基于片段生成回答。

知识库由 22 个语义片段构成,中英文双语,涵盖个人简介、教育背景、工程项目、技能与摄影实践。每次查询通过 TF-IDF(词频-逆文档频率)算法 + 长度归一化进行检索,语言匹配片段额外加 10% 权重。

后端部署在 Vercel Serverless,知识库以 JSON 文件形式直接打包进代码仓库,无需依赖外部向量数据库。整体月成本接近零。

特别设计的 system prompt 严格约束模型只基于检索到的片段作答,避免编造邮箱、奖项等关键信息。同时支持前端动作指令([ACTION:GOTO_LAB] 等),AI 可以驱动网页滚动、切换深浅色模式。

这个系统本身就是访客在 yinghanma.com 右下角看到的那个 AI 助理 —— 看到此回复的过程本身就是它的一次成功调用。

---

## section: photography_combat_zh
## title: 摄影:伦敦搏击摄影档案


自 2025 年起常驻伦敦,承接拳击与综合格斗(MMA)赛事的现场拍摄。这是一份从工程之外延伸的、关于身体与意志的长期观察。


风格上倾向于黑白胶片质感与高对比度数码处理,关注拳手在比赛间隙的呼吸、汗水与凝视瞬间——而不是单纯的击打动作。承接的项目包括拳馆品牌内容、赛事新闻摄影、运动员个人形象。

完整作品档案见 /combat-gallery 页面。
