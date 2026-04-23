// 文件位置: api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, lang } = req.body;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 自动读取你在 Vercel 后台填写的 DEEPSEEK_API_KEY
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { 
            role: "system", 
            content: `You are Michael Ma's AI assistant. Respond in ${lang === 'zh' ? 'Chinese' : 'English'}. Michael is a robotics engineer and combat sports photographer at UCL. Keep answers concise, professional, and tech-savvy.` 
          },
          { role: "user", content: message }
        ]
      })
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json({ reply: data.choices[0].message.content });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'AI 引擎暂时离线，请稍后再试。' });
  }
  // ...前面的代码保持不变...

  // 在你的知识库末尾增加这段指令
  const aiUiInstructions = `
    【网页操控指令库】
    当用户表达以下意图时，请在你的回答末尾加上对应的指令标签：
    1. 想看工程项目/实验室：[ACTION: GOTO_LAB]
    2. 想看摄影作品/影像：[ACTION: GOTO_GALLERY]
    3. 想联系你：[ACTION: GOTO_CONTACT]
    4. 觉得太刺眼/想换个心情：[ACTION: DARK_MODE]
    5. 觉得太暗了：[ACTION: LIGHT_MODE]
    
    注意：这些标签对用户不可见，但必须严格按照格式书写。
  `;

  // 修改 messages 部分
  const messages = [
    { role: "system", content: michaelKnowledgeBase + aiUiInstructions },
    { role: "user", content: message }
  ];

// ...后面的 fetch 逻辑保持不变...
}
