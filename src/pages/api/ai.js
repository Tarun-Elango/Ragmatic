import { middleware } from "../../middleware/middleware";

import axios from 'axios';
import OpenAI from 'openai';
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const openaio = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
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
      const userQuery = req.body.prompt
      const pastMessage = req.body.pMessage  
      const docListUserSelected = req.body.selectedDocList
      console.log(docListUserSelected)

    try {
        // get the closest vectors from supabase
        const startTime = performance.now();
        let responsePineConeList=[]
        let embeddingUserQuery = null;
       try { // Generate a one-time embedding for the query itself
            const embeddingResponse = await openaio.embeddings.create({
                model: 'text-embedding-3-small',
                input: userQuery,
            })
            const [{ embedding }] = embeddingResponse.data;
            embeddingUserQuery = embedding
        }
        catch(error){
            console.error('Failed to fetch embeddings:', error);
            return res.status(400).json({ error: 'Open ai embedding error', message:'Open ai embedding error' });
        }

        for (let i = 0; i < docListUserSelected.length; i++){
            // for each selected doc, get 20 closest vector to the user query
                const { data: documents } = await supabase.rpc('match_documents', {
                    query_embedding: embeddingUserQuery,
                    match_threshold: 0, // Choose the number of matches
                    match_count:20,
                    document_filter:docListUserSelected[i].docuId
                    })
                // console.log(documents)
                responsePineConeList.push(documents)
        }
        const queryContent = responsePineConeList.flat().map(item => item.content); // format the user query
        // console.log(queryContent);
        const endTime = performance.now();
        // Calculate the elapsed time
        const elapsedTime = endTime - startTime;
        const elapsedTimeInSeconds = elapsedTime / 1000;
        console.log(`Execution time getting closest vectors: ${elapsedTimeInSeconds} seconds`);            
       
        // reranking step for the closest vectors
        let startTimeRerank = process.hrtime();
        let rankedContent=""
        if (docListUserSelected.length>0){
        try {
            const rerankData = {
                "main_sentence": userQuery,
                "queries": queryContent
            }
            const rerankResponse = await fetch(`${process.env.PYTHONURL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SECRET}`
            },
            body: JSON.stringify(rerankData),
            });

            if (!rerankResponse.ok) {
            throw new Error(`Error: ${rerankResponse.status}`);
            }

            rankedContent = await rerankResponse.json();
        } catch (error) {
            res.status(500).json({ error })
            console.log(error)
            //res.status(500).json({ message: error.message });
        }
        }
        let diffRe = process.hrtime(startTimeRerank);
        let secondsre = diffRe[0] + diffRe[1] / 1e9; // Convert nanoseconds to seconds
        console.log(`Execution time rerank: ${secondsre} seconds`);

        //create a final query for llm
        const pmt = `- User Query: ${userQuery}
        - Context from Uploaded Document: ${rankedContent}
        - Previous Relevant Message: ${pastMessage}
        - Instruction to LLM:
            - Answer the user's query by thinking through the problem step by step.
            - If provided, use the information from the uploaded document, supplemented with your own knowledge, to accurately and comprehensively answer the user's query.
            - If the document lacks sufficient or relevant details, rely on your knowledge base to provide an appropriate response.
            - If you can't come up with an answer, say "I don't know."
        - Additional Requirements:
            - Refer to the previous relevant message only for context.
            - If no such message is found, ignore the previous relevant message.`;
        
        console.log(pmt.length)
        //console.log(pmt)
        res.status(200).json(pmt);
    } catch (err) {
        console.error(err);
        res.status(500).json({ err });
    }
    
    }
}