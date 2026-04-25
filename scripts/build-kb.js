/**
 * scripts/build-kb.js
 * --------------------------------------------------------------
 * 一次性脚本：把 data/sources/*.md 里的所有片段
 *  → 调用 DeepSeek embedding API 生成向量
 *  → 输出到 data/kb.json（提交到 git，前端 / 后端运行时直接读取）
 *
 * 用法:
 *   1. 在项目根目录创建 .env.local，写入 DEEPSEEK_API_KEY=sk-xxx
 *   2. npm install dotenv
 *   3. node scripts/build-kb.js
 *
 * 修改 data/sources/*.md 后重新跑这个脚本即可更新知识库。
 * --------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCES_DIR = path.join(ROOT, 'data', 'sources');
const OUTPUT_FILE = path.join(ROOT, 'data', 'kb.json');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const EMBEDDING_MODEL = 'deepseek-embedding-v2';
const EMBEDDING_ENDPOINT = 'https://api.deepseek.com/v1/embeddings';

if (!DEEPSEEK_API_KEY) {
  console.error('❌ 找不到 DEEPSEEK_API_KEY。请在 .env.local 中设置后再运行。');
  process.exit(1);
}

/**
 * 把一个 markdown 文件按 "## section:" 分隔符切成多个 chunk
 * 每个 chunk 包含: id (section), title, content, lang
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
      // 上一个 chunk 收尾
      if (current && current.content.trim()) chunks.push(current);
      current = { id: sectionMatch[1].trim(), title: '', content: '', lang };
    } else if (titleMatch && current) {
      current.title = titleMatch[1].trim();
    } else if (current) {
      // 跳过纯分隔符
      if (line.trim() === '---') continue;
      current.content += line + '\n';
    }
  }
  if (current && current.content.trim()) chunks.push(current);

  // 清理 content
  return chunks.map(c => ({
    ...c,
    content: c.content.trim().replace(/\n{3,}/g, '\n\n'),
  }));
}

/**
 * 调用 DeepSeek embedding API
 * 返回一个 number[]（768 维向量）
 */
async function getEmbedding(text) {
  const res = await fetch(EMBEDDING_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Embedding API 失败 ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
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

  console.log(`\n🔗 总共 ${allChunks.length} 个片段，开始生成向量...\n`);

  const embedded = [];
  for (let i = 0; i < allChunks.length; i++) {
    const c = allChunks[i];
    // 把 title 和 content 拼起来嵌入，让标题信息也参与语义匹配
    const textToEmbed = `${c.title}\n\n${c.content}`;
    process.stdout.write(`   [${i + 1}/${allChunks.length}] ${c.lang} | ${c.id} ... `);

    try {
      const vector = await getEmbedding(textToEmbed);
      embedded.push({ ...c, embedding: vector });
      console.log(`✓ (${vector.length} 维)`);
    } catch (e) {
      console.log(`✗ 失败: ${e.message}`);
      throw e;
    }

    // 温柔一点，避免触发限流
    await new Promise(r => setTimeout(r, 150));
  }

  const output = {
    model: EMBEDDING_MODEL,
    dimension: embedded[0]?.embedding.length || 0,
    builtAt: new Date().toISOString(),
    chunks: embedded,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output));
  const sizeKB = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1);
  console.log(`\n✅ 完成！知识库已写入 ${OUTPUT_FILE} (${sizeKB} KB)`);
  console.log(`   把这个文件 commit 到 git，部署到 Vercel 后即可使用。`);
}

main().catch(err => {
  console.error('\n❌ 构建失败:', err.message);
  process.exit(1);
});
