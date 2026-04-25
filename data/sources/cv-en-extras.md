# Supplemental: RAG Assistant + Combat Photography

## section: project_rag_assistant_en
## title: Project: This Site's RAG Curator Assistant

Year: April 2026.
Stack: Vercel Serverless Functions, DeepSeek API, TF-IDF keyword retrieval, JavaScript ES Modules.

Built a lightweight RAG (Retrieval-Augmented Generation) system as the in-site AI assistant for yinghanma.com. Visitors can ask natural-language questions about Yinghan's projects, research, and skills; the system retrieves the most relevant chunks from a structured knowledge base and lets DeepSeek Chat generate the answer grounded in those chunks.

The knowledge base contains 18 semantic chunks in both Chinese and English, covering profile, education, engineering projects, skills, and photography practice. Each query uses TF-IDF (term frequency–inverse document frequency) with length normalisation; chunks matching the query language get a 10% boost.

Backend runs on Vercel Serverless. The knowledge base ships as a JSON file inside the repo — no external vector database required. Monthly cost: near zero.

A carefully tuned system prompt strictly grounds the model in retrieved chunks, preventing fabrication of emails, awards, or other critical facts. The assistant also emits frontend action instructions (`[ACTION:GOTO_LAB]`, etc.) that let the AI drive the page — scrolling between sections, toggling dark mode.

This system is the assistant visible at the bottom-right of yinghanma.com. The fact that you're reading this reply means it just made one successful call.

---

## section: photography_combat_en
## title: Photography: London Combat Sports Archive

Based in London since 2024, shooting boxing and MMA events on-site. A long-form study of body and will, extending beyond the engineering work.

The aesthetic leans toward black-and-white film grain and high-contrast digital processing, focused less on the punch itself and more on the breath, sweat, and gaze between exchanges. Commissioned work includes gym brand content, event press, and athlete portraits.

Full archive at the /combat-gallery page.
