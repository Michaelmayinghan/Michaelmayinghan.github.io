/**
 * scripts/build-kb.js (v2 — 关键词版,不依赖 embedding API)
 * --------------------------------------------------------------
 * 把 data/sources/*.md 切成片段,提取关键词和词频,
 * 输出到 data/kb.json。运行时 api/chat.js 用关键词匹配 + TF-IDF 检索。
 *
 * 用法:
 *   node scripts/build-kb.js
 *
 * 不需要 API key,纯本地计算,几秒钟搞定。
 * --------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCES_DIR = path.join(ROOT, 'data', 'sources');
const OUTPUT_FILE = path.join(ROOT, 'data', 'kb.json');

/**
 * 把 markdown 切成 chunks(同 v1)
 */
function parseMarkdownToChunks(filePath, lang) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');
  const chunks = [];
  let current = null;

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s*section:\s*(\S+)/);
    const titleMatch = line.match(/^##\s*title:\s*(.+)$/);

    if (sectionMatch) {
      if (current && current.content.trim()) chunks.push(current);
      current = { id: sectionMatch[1].trim(), title: '', content: '', lang };
    } else if (titleMatch && current) {
      current.title = titleMatch[1].trim();
    } else if (current) {
      if (line.trim() === '---') continue;
      current.content += line + '\n';
    }
  }
  if (current && current.content.trim()) chunks.push(current);

  return chunks.map(c => ({
    ...c,
    content: c.content.trim().replace(/\n{3,}/g, '\n\n'),
  }));
}

/**
 * 文本 → 词元列表
 * 中英文混合策略:
 *   - 英文按空格 + 大小写 + 标点分词
 *   - 中文按 1~3 字滑窗(简化版 N-gram,不依赖中文分词器)
 */
function tokenize(text) {
  const tokens = [];
  const lower = text.toLowerCase();

  // 1. 英文/数字 token (含连字符如 kd-tree, savitzky-golay)
  const enMatches = lower.match(/[a-z0-9][a-z0-9\-]*[a-z0-9]/g) || [];
  tokens.push(...enMatches);

  // 2. 中文 N-gram (2-字 和 3-字)
  const chineseChars = text.match(/[\u4e00-\u9fff]+/g) || [];
  for (const seq of chineseChars) {
    // 2-gram
    for (let i = 0; i + 2 <= seq.length; i++) {
      tokens.push(seq.slice(i, i + 2));
    }
    // 3-gram
    for (let i = 0; i + 3 <= seq.length; i++) {
      tokens.push(seq.slice(i, i + 3));
    }
    // 单字也保留(短查询用)
    for (const ch of seq) tokens.push(ch);
  }

  return tokens;
}

/**
 * 词频统计
 */
function termFreq(tokens) {
  const tf = {};
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }
  return tf;
}

async function main() {
  console.log('📂 读取源文件...');
  const allChunks = [];

  const files = fs.readdirSync(SOURCES_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const lang = file.includes('-zh') ? 'zh' : 'en';
    const filePath = path.join(SOURCES_DIR, file);
    const chunks = parseMarkdownToChunks(filePath, lang);
    console.log(`   ${file}: ${chunks.length} 个片段`);
    allChunks.push(...chunks);
  }

  console.log(`\n🔍 总共 ${allChunks.length} 个片段,开始构建关键词索引...\n`);

  // 1. 统计每个 chunk 的 term frequency
  const enrichedChunks = allChunks.map((c, i) => {
    const fullText = `${c.title} ${c.content}`;
    const tokens = tokenize(fullText);
    const tf = termFreq(tokens);
    const totalTokens = tokens.length;
    process.stdout.write(`   [${i + 1}/${allChunks.length}] ${c.lang} | ${c.id} ... ✓ (${Object.keys(tf).length} 唯一词)\n`);
    return {
      ...c,
      tokenCount: totalTokens,
      tf, // term -> count
    };
  });

  // 2. 计算 document frequency:每个 term 出现在多少个 chunk 里
  const df = {};
  for (const c of enrichedChunks) {
    for (const term of Object.keys(c.tf)) {
      df[term] = (df[term] || 0) + 1;
    }
  }

  // 3. 写入文件
  const output = {
    builtAt: new Date().toISOString(),
    method: 'keyword-tfidf',
    totalChunks: enrichedChunks.length,
    df, // 所有词的全局频率
    chunks: enrichedChunks,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output));
  const sizeKB = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1);
  console.log(`\n✅ 完成!知识库已写入 ${OUTPUT_FILE} (${sizeKB} KB)`);
  console.log(`   总词汇量: ${Object.keys(df).length}`);
  console.log(`   把这个文件 commit 到 git,部署到 Vercel 后即可使用。`);
}

main().catch(err => {
  console.error('\n❌ 构建失败:', err.message);
  process.exit(1);
});
