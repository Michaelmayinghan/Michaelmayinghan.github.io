# Supplemental: RAG Assistant + Combat Photography + Personal Taste

## section: project_rag_assistant_en
## title: Project: This Site's RAG Curator Assistant

Year: April 2026.
Stack: Vercel Serverless Functions, DeepSeek API, TF-IDF keyword retrieval, JavaScript ES Modules.

Built a lightweight RAG (Retrieval-Augmented Generation) system as the in-site AI assistant for yinghanma.com. Visitors can ask natural-language questions about Yinghan's projects, research, and skills; the system retrieves the most relevant chunks from a structured knowledge base and lets DeepSeek Chat generate the answer grounded in those chunks.

The knowledge base contains 24 semantic chunks in both Chinese and English, covering profile, education, engineering projects, skills, photography practice, and personal taste (favourite writers and music). Each query uses TF-IDF (term frequency–inverse document frequency) with length normalisation; chunks matching the query language get a 10% boost.

Backend runs on Vercel Serverless. The knowledge base ships as a JSON file inside the repo — no external vector database required. Monthly cost: near zero.

A carefully tuned system prompt strictly grounds the model in retrieved chunks, preventing fabrication of emails, awards, or other critical facts. The assistant also emits frontend action instructions ([ACTION:GOTO_LAB], etc.) that let the AI drive the page — scrolling between sections, toggling dark mode.

This system is the assistant visible at the bottom-right of yinghanma.com. The fact that you're reading this reply means it just made one successful call.

---

## section: photography_combat_en
## title: Photography: London Combat Sports Archive

Based in London since 2025, shooting boxing and MMA events on-site.

The aesthetic leans toward black-and-white film grain and high-contrast digital processing, focused less on the punch itself and more on the breath, sweat, and gaze between exchanges. Commissioned work includes gym brand content, event press, and athlete portraits.

Full archive at the /combat-gallery page.

---

## section: taste_books_en
## title: Personal Taste: Literature

Yinghan reads four writers most often: Dostoevsky, Yu Hua, Haruki Murakami, and Albert Camus.

The book he most often recommends is Dostoevsky's *Crime and Punishment* — because no one writes the inside of a conscience more honestly. Centuries later, the psychology still doesn't feel dated. If you want to understand what "moral dilemma from the inside" looks like, start there.

Yu Hua's *To Live* is the one he keeps returning to. Yinghan thinks the strength of that book is using the simplest possible language to carry the heaviest possible weight — almost no stylistic flourishes, and yet you can't shake it for days.

For Murakami, he recommends *Kafka on the Shore*. Dual narrative, lots of symbolism — what Yinghan likes most is that it tells you "loneliness can be gentle." Murakami is, for him, a different rhythm of thinking, the one outside engineering.

Camus is who he goes back to when he's questioning why to keep building things at all. *The Stranger* and *The Myth of Sisyphus* — that one can still choose, even after the absurd. The site's tagline "Contemplate the Absurd" comes from Camus.

If any of these interest you, Yinghan welcomes a quick email about books: yinghan.ma.mike@gmail.com.

---

## section: taste_music_en
## title: Personal Taste: Music

The two artists Yinghan keeps in heavy rotation are John Mayer and Ronghao Li.

John Mayer essentials: "Slow Dancing in a Burning Room", "Daughters", "Neon", "Covered in Rain". What Yinghan likes is the storytelling in his guitar — there's narrative beneath the technique, which makes it good code-at-3am music.

Ronghao Li (李荣浩) essentials: "Free Soul", "Lover", "Mountain". Yinghan thinks he's one of the few Chinese-language artists who handles arrangement, lyrics and vocals all by himself and stays internally consistent. Most of his albums quietly carry the same theme: keep living, with eyes open.

If you listen to either of them, you can tell the assistant which song is your favourite — Yinghan might reply with one of his own deeper cuts.
