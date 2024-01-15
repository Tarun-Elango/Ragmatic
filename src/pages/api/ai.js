// used to call the open ai gpt model 
// use prompts, agents, memory and langchain

// retrive pinecone embeddings for query, fetch corresponding pages and make query to openai

import { middleware } from "../../middleware/middleware";
import OpenAI from 'openai';
import { pipeline } from '@xenova/transformers'
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENVIRONMENT,
});

export default async function handler(req, res) {
    const result = await middleware(req);

    if (!result.success) {
        res.status(400).json({ success: false, message: result.message });
      } else {
    if (req.method !== 'POST') {
        res.status(405).end(`Method ${req.method} Not Allowed`);
        return;
      }
    
      // const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      // if (!OPENAI_API_KEY) {
      //   res.status(500).json({ error: 'OpenAI API key not configured' });
      //   return;
      // }
    
      // const openai = new OpenAI(OPENAI_API_KEY);
      
      // //get embeddings for req.body.prompt, get embedding search, convert back to text, sned to openai 
      // const userQuery = req.body.prompt
      // const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small');
     try {
      //   const embeddingResult = await generateEmbedding(userQuery, {
      //       pooling: 'mean',
      //       normalize: true,
      //   });
    
      //   // Ensure that the output is an array
      //   const embedding = Array.from(embeddingResult.data);
    
      //   const customNamespace = "auth0|64f945e00f1413519a6c863azurichmasters";
      //   const index = pinecone.index('jotdown').namespace(customNamespace);
      //   const queryRequest = {
      //       vector: embedding,
      //       topK: 5,
      //       includeValues: false,
      //       includeMetadata: true
      //   };
      //   const response = await index.query(queryRequest); // Corrected this line
      //   let mainString = "";

      //   // Assuming you have a function `getOriginalTextOrData` that takes an ID and returns the original text
      //   for (let match of response) {
      //       let originalText = getOriginalTextOrData(match.id);
      //       mainString += originalText + " "; // Concatenating with a space for separation
      //   }

      //   console.log(mainString);

        //convert embedding back to string

        // const chatCompletion = await openai.chat.completions.create({
        //     messages: [ {"role": "system", "content": "Answer to the best of your ability. Always keep response in 1 line."},
        //     {"role": "user", "content": req.body.prompt}],
        //     model: 'gpt-3.5-turbo',
        //   });

        //   const messageContent = chatCompletion.choices[0].message.content;
        const messageContent = "hi there"

        // always return a string, message or no response 
        res.status(200).json(messageContent);
    } catch (err) {
        console.error(err);
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

