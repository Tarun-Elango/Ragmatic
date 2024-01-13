// used to call the open ai gpt model 
// use prompts, agents, memory and langchain

// pinecone, retrive embeddings search, delete namespace

import { middleware } from "../../middleware/middleware";
import OpenAI from 'openai';

export default async function handler(req, res) {
    const result = await middleware(req);

    if (!result.success) {
        res.status(400).json({ success: false, message: result.message });
      } else {
    if (req.method !== 'POST') {
        res.status(405).end(`Method ${req.method} Not Allowed`);
        return;
      }
    
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      if (!OPENAI_API_KEY) {
        res.status(500).json({ error: 'OpenAI API key not configured' });
        return;
      }
    
      const openai = new OpenAI(OPENAI_API_KEY);
      
      try {
        // const chatCompletion = await openai.chat.completions.create({
        //     messages: [ {"role": "system", "content": "Answer to the best of your ability. Always keep response in 1 line."},
        //     {"role": "user", "content": req.body.prompt}],
        //     model: 'gpt-3.5-turbo',
        //   });

        //   const messageContent = chatCompletion.choices[0].message.content;
        const messageContent = "hi there"

        // always return a string, message or no response 
        res.status(200).json(messageContent);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
}
/** sample response
 * 
 * {
    "id": "chatcmpl-8gaO8rQK5o8vboIedSpVwjMa6kBgA",
    "object": "chat.completion",
    "created": 1705160344,
    "model": "gpt-3.5-turbo-0613",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "Bonjour, comment ça va ?"
            },
            "logprobs": null,
            "finish_reason": "stop"
        }
    ],
    "usage": {
        "prompt_tokens": 42,
        "completion_tokens": 6,
        "total_tokens": 48
    },
    "system_fingerprint": null
}
 */

