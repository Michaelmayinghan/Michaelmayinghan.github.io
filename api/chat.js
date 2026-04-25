/**
 * api/chat.js
 * --------------------------------------------------------------
 * Vercel Serverless Function — RAG 流水线入口
 *
 * 流程:
 *   1. 接收 { message, lang, history? }
 *   2. 调 DeepSeek embedding 把问题向量化
 *   3. 与 data/kb.json 中所有片段算余弦相似度
 *   4. 取 top-K 作为上下文，拼装 prompt
 *   5. 调 DeepSeek chat (v4-flash) 流式返回
 *   6. 在 reply 末尾附带 [SOURCES:id1,id2] 元信息
 *
 * 部署后入口: https://yinghanma.com/api/chat
 * --------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';

// ⚠️ 注意:Vercel 每次冷启动会重新加载,但 Node 模块作用域会被复用,
// 所以这个变量只在第一次调用时读盘,后续调用复用内存,几乎零开销。
let CACHED_KB = null;

function loadKB() {
  if (CACHED_KB) return CACHED_KB;
  const kbPath = path.join(process.cwd(), 'data', 'kb.json');
  CACHED_KB = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
  return CACHED_KB;
}

/**
 * 余弦相似度
 */
function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

/**
 * 调 DeepSeek embedding API
 */
async function embed(text) {
  const res = await fetch('https://api.deepseek.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-embedding-v2',
      input: text,
      encoding_format: 'float',
    }),
  });

  if (!res.ok) throw new Error(`Embedding API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.data[0].embedding;
}

/**
 * 检索:返回 top-K 最相关的片段
 * 同时按语言加权——优先返回与用户语言一致的片段
 */
function retrieve(queryVector, lang, k = 4) {
  const kb = loadKB();
  const scored = kb.chunks.map(c => {
    const sim = cosineSim(queryVector, c.embedding);
    // 语言匹配的片段加 0.05 的权重(轻微偏好,但不强制)
    const langBoost = c.lang === lang ? 0.05 : 0;
    return { ...c, score: sim + langBoost };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

/**
 * 系统 prompt — 这是这个 AI 助理的"灵魂"
 * 写得越具体,跑题率越低
 */
function buildSystemPrompt(lang) {
  const ZH = `你是 Yinghan Ma（马英涵）个人主页 yinghanma.com 的智能策展助理。

你的人设:
- 第三人称介绍 Yinghan,不要假装自己是 Yinghan 本人。
- 语气直白、克制、带一点工程师的精确感和摄影师的诗意。简短,不啰嗦。
- 不要过度热情,不要堆砌赞美形容词。事实优先。

你的工作规则:
1. 严格基于下方提供的"参考资料"作答。如果资料中没有相关信息,直接说"这个问题我没有可靠资料,建议直接联系 Yinghan 本人:yinghan.ma.mike@gmail.com"。绝不编造细节、数字、奖项、公司名。
2. 回答涉及具体数据(R²、精度、频率、时间常数等)时必须引用资料原文,不要四舍五入也不要换算单位。
3. 如果用户提到要"看项目"、"看作品"、"看简历"、"联系方式",在回答末尾追加合适的指令标签:
   - 跳转工程项目区: [ACTION:GOTO_LAB]
   - 跳转影像作品区: [ACTION:GOTO_GALLERY]
   - 跳转简介与 CV: [ACTION:GOTO_ABOUT]
   - 跳转联系方式: [ACTION:GOTO_CONTACT]
   - 切换深色模式: [ACTION:DARK_MODE]
   - 切换浅色模式: [ACTION:LIGHT_MODE]
4. 所有指令标签必须严格按 [ACTION:XXX] 格式,放在回答的最末尾,前面用空格隔开,不要解释。

回答必须用中文。`;

  const EN = `You are the curator assistant for Yinghan Ma's personal site yinghanma.com.

Persona:
- Refer to Yinghan in third person. Do NOT pretend to be Yinghan himself.
- Tone: direct, restrained, with the precision of an engineer and a touch of a photographer's poetry. Keep it short. No fluff.
- Don't be overly enthusiastic. Don't pile on flattering adjectives. Facts first.

Rules:
1. Answer strictly based on the "Reference" section below. If the references don't cover something, say "I don't have reliable info on that — best to contact Yinghan directly: yinghan.ma.mike@gmail.com." Never invent details, numbers, awards, or company names.
2. When citing concrete data (R², precision, frequency, time constants, etc.), quote the reference verbatim. Do not round, do not convert units.
3. If the user wants to "see projects", "see work", "see CV", "contact", append the appropriate action tag at the end of your reply:
   - Jump to engineering: [ACTION:GOTO_LAB]
   - Jump to gallery: [ACTION:GOTO_GALLERY]
   - Jump to About/CV: [ACTION:GOTO_ABOUT]
   - Jump to contact: [ACTION:GOTO_CONTACT]
   - Switch to dark mode: [ACTION:DARK_MODE]
   - Switch to light mode: [ACTION:LIGHT_MODE]
4. Action tags must follow the strict [ACTION:XXX] format, placed at the very end of the reply, separated by a space. Do not explain them.

Respond in English.`;

  return lang === 'zh' ? ZH : EN;
}

/**
 * 把检索到的片段格式化成 prompt 上下文
 */
function formatContext(chunks, lang) {
  const header = lang === 'zh' ? '【参考资料】' : '[Reference]';
  return header + '\n\n' + chunks.map((c, i) =>
    `--- 片段 ${i + 1} (id: ${c.id}, 相关度: ${c.score.toFixed(3)}) ---\n${c.title}\n\n${c.content}`
  ).join('\n\n');
}

// ============================================
//  Vercel Function 入口
// ============================================
export default async function handler(req, res) {
  // CORS — 同域部署其实不需要,留着方便调试
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, lang = 'zh', history = [] } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    // 1. 把用户问题向量化
    const queryVec = await embed(message);

    // 2. 检索 top-4 片段
    const topChunks = retrieve(queryVec, lang, 4);

    // 3. 构造 messages
    const systemPrompt = buildSystemPrompt(lang);
    const contextBlock = formatContext(topChunks, lang);

    const messages = [
      { role: 'system', content: systemPrompt },
      // 历史对话(最多保留最近 4 轮,避免 token 爆炸)
      ...history.slice(-4),
      {
        role: 'user',
        content: `${contextBlock}\n\n---\n\n${lang === 'zh' ? '用户问题' : 'User question'}: ${message}`,
      },
    ];

    // 4. 调 DeepSeek chat 生成回答
    const chatRes = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages,
        temperature: 0.3, // 低温度——这是个事实性问答,不需要发挥
        max_tokens: 600,
        stream: false,
      }),
    });

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      throw new Error(`Chat API ${chatRes.status}: ${errText}`);
    }

    const chatData = await chatRes.json();
    const reply = chatData.choices[0].message.content;

    // 5. 返回:reply + 引用的 source ids(用于前端显示来源)
    return res.status(200).json({
      reply,
      sources: topChunks.map(c => ({
        id: c.id,
        title: c.title,
        lang: c.lang,
        score: Number(c.score.toFixed(3)),
      })),
    });

  } catch (e) {
    console.error('[/api/chat] error:', e);
    return res.status(500).json({
      error: 'internal_error',
      message: e.message,
    });
  }
}
