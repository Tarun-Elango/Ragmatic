/**

 */

import { middleware } from "../../middleware/middleware";
import Pages from '../../models/Pages'
// import { pipeline } from '@xenova/transformers'
import { Pinecone } from '@pinecone-database/pinecone';
import axios from 'axios';
import OpenAI from 'openai';
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const openaio = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    });

// const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small');

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

  try {//////////////////////////get client accesstoken from auth0
    const postData = `{"client_id":"${process.env.AUTH0_CLIENT_ID}","client_secret":"${process.env.AUTH0_CLIENT_SECRET}","audience":"${process.env.AUTH0_AUD}","grant_type":"client_credentials"}`
    const headers = {
        'Content-Type': 'application/json',
    }

    const response = await axios.post(process.env.AUTH0_TOKEN, postData, { headers });

    // Extract the data from the response
    const data = response.data;
    const accessToken = data.access_token // this has the accesstoken
    const startTime = performance.now();
    let responsePineConeList=[]

        for (let i = 0; i < docListUserSelected.length; i++){
            // Generate a one-time embedding for the query itself
            const embeddingResponse = await openaio.embeddings.create({
                model: 'text-embedding-3-small',
                input: userQuery,
            })
            const [{ embedding }] = embeddingResponse.data;
            const { data: documents } = await supabase.rpc('match_documents', {
                query_embedding: embedding,
                match_threshold: 0, // Choose the number of matches
                match_count:10,
                document_filter:docListUserSelected[i].docuId
                })
            // console.log(documents)
            responsePineConeList.push(documents)
    }

    const queryContent = responsePineConeList.flat().map(item => item.content);

    console.log(queryContent);

        const endTime = performance.now();
          // Calculate the elapsed time
        const elapsedTime = endTime - startTime;
        const elapsedTimeInSeconds = elapsedTime / 1000;
        console.log(`Execution time getting pinecone: ${elapsedTimeInSeconds} seconds`);
        // let responsePineConeList=[]
        // // for loop pine cone to get all selected docs, store responses in an array
        // for (let i = 0; i < docListUserSelected.length; i++){
        //     // pinecone query results
        //     const customNamespace = docListUserSelected[i].docuName;
        //     const index = pinecone.index('jotdown').namespace(customNamespace)
        //     const stats = await index.describeIndexStats()
        //     const namespaceVectorLength = stats.namespaces[customNamespace].recordCount    

        //     // Form the query request
        //     let queryRequest={}
        //     // Check if the namespace size > 15, and form query accordingly
        //     let topKValue = Math.min(namespaceVectorLength, 20);
        //     // Form the query request
        //     queryRequest = {
        //         vector: embeddingArray,
        //         topK: topKValue,
        //         includeValues: false,
        //         includeMetadata: true
        //     };

        //     const response = await index.query(queryRequest);


            


        //     responsePineConeList.push(response);
        // }
        // console.log('xxxxxxxx')
        // console.log(responsePineConeList)
        // console.log('pinecone response length', responsePineConeList)
         
        // const endTime = performance.now();
        
        // let startMongo = process.hrtime();



        // // get the pages from mongo with given docid and pinecone emb id, 
        // let queryContent = [] //store in list
        // try{

        //     // we have a list of response from pinecone, for each response get its pages and combine all he pages into querycontent
        // for (let i=0; i<responsePineConeList.length; i++){
        //     for (const match of responsePineConeList[i].matches){
        //         console.log(match)
        //         //values.id has the page id
        //         // and use docid to searh mongo
        //         const pageContent = await Pages.find({ document:docListUserSelected[i].docuId, embeddingsID: match.id })
        //         // console.log(counter)
        //         // add to queryLust 
        //         //queryContent = queryContent + pageContent.PageText
        //         const pageObject = pageContent[0];

        //         // Extracting the PageText
        //         const pageTextString = pageObject.PageText;
        //         const combinedTextString = pageTextString.replace(/\n/g, ' ');
                
        //         queryContent.push(combinedTextString);
                
        //     }
        //     console.log(docListUserSelected[i].docuId )
        //     //console.log('mongo response length', queryContent)
        // }
            
        //  }
        // catch(e){
        //     console.log(e)
        //     res.status(500).json("Could not load your document, please try again.");
        // }





        // let diff = process.hrtime(startMongo);
        // let seconds = diff[0] + diff[1] / 1e9; // Convert nanoseconds to seconds
        // console.log(`Execution time mongo: ${seconds} seconds`);
        
        // // reranking step
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
                'Authorization': `Bearer ${accessToken}`
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

        // //create a final query for llm
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
        
        console.log(pmt)

        res.status(200).json(pmt);

    } catch (err) {
        console.error(err);
        res.status(500).json({ err });
    }
    
    }
}