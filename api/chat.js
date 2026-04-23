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
}
