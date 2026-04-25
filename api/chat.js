/**
 * api/chat.js (v2 — 关键词检索版,不依赖 embedding API)
 * --------------------------------------------------------------
 * 流程:
 *   1. 接收 { message, lang, history? }
 *   2. 把问题分词,用 TF-IDF 算每个 chunk 的相关度
 *   3. 取 top-K,拼装 prompt
 *   4. 调 DeepSeek chat 生成回答
 *   5. 返回 reply + sources
 *
 * 没有 embedding API 调用,纯本地计算,几毫秒。
 * --------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';

let CACHED_KB = null;

function loadKB() {
  if (CACHED_KB) return CACHED_KB;
  const kbPath = path.join(process.cwd(), 'data', 'kb.json');
  CACHED_KB = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
  return CACHED_KB;
}

/**
 * 文本 → 词元(必须和 build-kb.js 完全一致)
 */
function tokenize(text) {
  const tokens = [];
  const lower = text.toLowerCase();

  const enMatches = lower.match(/[a-z0-9][a-z0-9\-]*[a-z0-9]/g) || [];
  tokens.push(...enMatches);

  const chineseChars = text.match(/[\u4e00-\u9fff]+/g) || [];
  for (const seq of chineseChars) {
    for (let i = 0; i + 2 <= seq.length; i++) tokens.push(seq.slice(i, i + 2));
    for (let i = 0; i + 3 <= seq.length; i++) tokens.push(seq.slice(i, i + 3));
    for (const ch of seq) tokens.push(ch);
  }

  return tokens;
}

/**
 * TF-IDF 相关度评分
 * 对于查询 Q 和文档 D:
 *   score(D|Q) = Σ_{t in Q} tf(t,D) * idf(t)
 * idf(t) = log((N+1) / (df(t)+1)) + 1   (平滑版,防止罕见词权重爆炸)
 */
function scoreChunk(queryTokens, chunk, df, N) {
  let score = 0;
  for (const t of queryTokens) {
    const tf = chunk.tf[t];
    if (!tf) continue;
    const idf = Math.log((N + 1) / ((df[t] || 0) + 1)) + 1;
    score += tf * idf;
  }
  // 长度归一化:防止长 chunk 因为词多而占便宜
  return score / Math.sqrt(chunk.tokenCount);
}

function retrieve(query, lang, k = 4) {
  const kb = loadKB();
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  // 去重(避免同一个词重复加权)
  const uniqueQueryTokens = [...new Set(queryTokens)];

  const scored = kb.chunks.map(c => {
    let score = scoreChunk(uniqueQueryTokens, c, kb.df, kb.totalChunks);
    // 语言匹配的片段加 10% 权重
    if (c.lang === lang) score *= 1.1;
    return { ...c, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // 如果最高分都是 0(完全没匹配),做兜底:返回与语言匹配的前 K 个简介类片段
  if (scored[0].score === 0) {
    const fallback = kb.chunks.filter(c => c.lang === lang && c.id.includes('profile')).slice(0, 1);
    const others = kb.chunks.filter(c => c.lang === lang).slice(0, k - fallback.length);
    return [...fallback, ...others].map(c => ({ ...c, score: 0 }));
  }

  return scored.slice(0, k);
}

function buildSystemPrompt(lang) {
  const ZH = `你是 Yinghan Ma(马英涵)个人主页 yinghanma.com 的智能策展助理。

人设:
- 第三人称介绍 Yinghan,不要假装自己是 Yinghan 本人。
- 语气直白、克制,带一点工程师的精确感和摄影师的诗意。简短,不啰嗦。
- 不要过度热情,不要堆砌赞美形容词。事实优先。

规则:
1. 严格基于下方"参考资料"作答。资料中没有的,直接说"这个我没有可靠资料,建议直接联系 Yinghan:yinghan.ma.mike@gmail.com"。绝不编造细节、数字、奖项、公司名、邮箱。
2. 回答涉及具体数据(R²、精度、频率、时间常数等)时引用资料原文,不要四舍五入。
3. 如果用户提到要"看项目"、"看作品"、"看简历"、"联系方式",在回答末尾追加合适的指令标签:
   - 跳转工程项目: [ACTION:GOTO_LAB]
   - 跳转影像作品: [ACTION:GOTO_GALLERY]
   - 跳转简介与 CV: [ACTION:GOTO_ABOUT]
   - 跳转联系方式: [ACTION:GOTO_CONTACT]
   - 切换深色模式: [ACTION:DARK_MODE]
   - 切换浅色模式: [ACTION:LIGHT_MODE]
4. 指令标签严格按 [ACTION:XXX] 格式,放在回答末尾,前面用空格隔开,不要解释。

用中文回答。`;

  const EN = `You are the curator assistant for Yinghan Ma's site yinghanma.com.

Persona:
- Refer to Yinghan in third person. Do NOT pretend to be Yinghan.
- Tone: direct, restrained, with the precision of an engineer and a touch of a photographer's poetry. Short. No fluff.
- No flattery, no piling up adjectives. Facts first.

Rules:
1. Answer strictly based on the "Reference" section. If not covered, say "I don't have reliable info on that — best to contact Yinghan: yinghan.ma.mike@gmail.com." Never invent details, numbers, awards, company names, or emails.
2. When citing data (R², precision, frequency, etc.), quote the reference verbatim. No rounding.
3. If the user wants to "see projects", "see work", "see CV", "contact", append the appropriate tag at the end:
   - Engineering: [ACTION:GOTO_LAB]
   - Gallery: [ACTION:GOTO_GALLERY]
   - About/CV: [ACTION:GOTO_ABOUT]
   - Contact: [ACTION:GOTO_CONTACT]
   - Dark mode: [ACTION:DARK_MODE]
   - Light mode: [ACTION:LIGHT_MODE]
4. Tags follow the strict [ACTION:XXX] format, at the very end, separated by a space.

Respond in English.`;

  return lang === 'zh' ? ZH : EN;
}

function formatContext(chunks, lang) {
  const header = lang === 'zh' ? '【参考资料】' : '[Reference]';
  return header + '\n\n' + chunks.map((c, i) =>
    `--- 片段 ${i + 1} (id: ${c.id}, 相关度: ${c.score.toFixed(3)}) ---\n${c.title}\n\n${c.content}`
  ).join('\n\n');
}

export default async function handler(req, res) {
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

    // 检索 top-4
    const topChunks = retrieve(message, lang, 4);

    const systemPrompt = buildSystemPrompt(lang);
    const contextBlock = formatContext(topChunks, lang);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-4),
      {
        role: 'user',
        content: `${contextBlock}\n\n---\n\n${lang === 'zh' ? '用户问题' : 'User question'}: ${message}`,
      },
    ];

    const chatRes = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.3,
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
