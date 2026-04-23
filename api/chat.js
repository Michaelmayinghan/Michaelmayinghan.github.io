// 文件位置: api/chat.js

export default async function handler(req, res) {
  // 1. 安全检查
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, lang } = req.body;

  // 2. 构建你的私人知识库 (Knowledge Base)
  const michaelKnowledgeBase = `
    你现在是 Michael Ma (马英汉) 的官方 AI 助理。
    你的任务是根据以下【真实数据】回答问题，【禁止任何形式的猜测或编造】。
  
    【真实联系方式 - 仅限使用以下信息】
    - 官方邮箱：mayinghan070110@gmail.com (这是唯一指定的联系邮箱)
    - Instagram：@michaelmm0000 (个人及摄影作品展示)
    - LinkedIn：yinghan-ma-a54a69280
    - GitHub: Michaelmayinghan
    - Wechat: MMyh0110
  
    - 身份：UCL (伦敦大学学院) 机器人与人工智能本硕连读生,现在大一,2007年出生，性别男。
    - 技能：深耕 AI、机器学习、机器人控制理论和全栈开发。
    - 爱好：专业拳击摄影师，常驻伦敦。风格为“直视荒诞”。
    【工程项目】
    - 房价预测模型 (DAML 2024)、风机控制系统、LiDAR 安防系统、全自动羽毛球发射器、Happy Popcorn 物理仿真。

      【回复准则】
    1. 如果用户询问联系方式，必须完整准确地提供上述 Gmail 和社交账号，严禁编造 ucl.ac.uk 等后缀的邮箱。
    2. 语气要像 Michael 本人一样：极客、简洁、务实。
    3. 如果用户问到你不知道的信息，请回答：“关于这一点我不太确定，建议你直接通过邮箱联系 Michael。”
  `;

  // 3. 构建网页操控指令集 (AI UI Instructions)
  const aiUiInstructions = `
    【网页操控指令库】
    当用户表达以下意图时，请在你的回答末尾加上对应的指令标签：
    1. 想看工程项目/实验室：[ACTION: GOTO_LAB]
    2. 想看摄影作品/影像：[ACTION: GOTO_GALLERY]
    3. 想联系你：[ACTION: GOTO_CONTACT]
    4. 觉得太刺眼/想切换深色模式：[ACTION: DARK_MODE]
    5. 觉得太暗了/想切换浅色模式：[ACTION: LIGHT_MODE]
    
    注意：这些标签必须严格按照格式书写在回答的最后。
  `;

  try {
    // 4. 发起云端调用
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { 
            role: "system", 
            content: michaelKnowledgeBase + aiUiInstructions + ` Respond in ${lang === 'zh' ? 'Chinese' : 'English'}.` 
          },
          { role: "user", content: message }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // 5. 将结果返回给前端
    res.status(200).json({ reply: data.choices[0].message.content });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'AI 暂时进入深度思考，请稍后再试。' });
  }
}
