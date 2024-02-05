import { middleware } from "../../middleware/middleware";
import OpenAI from 'openai';
import Pages from '../../models/Pages'
// import { pipeline } from '@xenova/transformers'
// import { env } from '@xenova/transformers'
import { Pinecone } from '@pinecone-database/pinecone';
import axios from 'axios';
// env.cacheDir = '../../cache';
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
  });
  
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENVIRONMENT,
});
//\n4. Use your knowledge for related questions.
// For completely Unrelated queries: respond with 'Sorry, please ask a relevant question'
//.\n5.Refer to past conversations for context.

// create a system for llm to follow using prompt engineering, tools, function calling

//**only if task is big, not needed for small tasks */ prompt chaingin: use llm to break(into several steps using your brain in right order(each task will have its owns topk embeddings)) task into subtasks, llm is prompted with a subtask, and its response is used as for other subtasks until all complete
// almost like think step by step, but do step by step
// combine cot with tool use, see if tool is needed when moving to a next step
//https://www.promptingguide.ai/techniques/prompt_chaining

// tree of thought: each step 3 thoughts take the most sure thought and proceed


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
      const docId = req.body.docId
      const docName = req.body.docName 
      const pastMessage = req.body.pMessage  
      
        //////////////////////////get token // get client accesstoken from auth0
        const postData = `{"client_id":"${process.env.AUTH0_CLIENT_ID}","client_secret":"${process.env.AUTH0_CLIENT_SECRET}","audience":"${process.env.AUTH0_AUD}","grant_type":"client_credentials"}`
        const headers = {
            'Content-Type': 'application/json',
        }

        const response = await axios.post(process.env.AUTH0_TOKEN, postData, { headers });

        // Extract the data from the response
        const data = response.data;
        const accessToken = data.access_token
        ////////////////////////////
  try {
        const startTime = performance.now();

        //get the users embeddings
        let embedding = []
        const dataForEmbed = {sentence: userQuery}
        try {
            const responseEmbed = await fetch(`${process.env.PYTHONURL}/embed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(dataForEmbed),
            });
    
            if (!responseEmbed.ok) {
                throw new Error(`Error: ${responseEmbed.statusText}`);
            }
    
            embedding = await responseEmbed.json();
        } catch (error) {
            console.error('Error fetching embedding:', error);
            throw error;
        }


        // const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small');
        // const embeddingResult = await generateEmbedding(userQuery, {
        //     pooling: 'mean',
        //     normalize: true,
        // });
    
        // // Ensure that the output is an array
        // //const embedding = Array.from(embeddingResult.data);
    
        const customNamespace = docName;
        const index = pinecone.index('jotdown').namespace(customNamespace)
        const stats = await index.describeIndexStats()
        const namespaceVectorLength = stats.namespaces[customNamespace].recordCount     

        let queryRequest={}

        // Check if the namespace size > 15, and form query accordingly
        if (namespaceVectorLength > 20) {
            // get the 2 closet vector
            queryRequest = {
                vector: embedding,
                topK: 20,
                includeValues: false,
                includeMetadata: true
            }
        } else {
            // Return a message or handle the case where the namespace is not found
            // get the 2 closet vector
            queryRequest = {
                vector: embedding,
                topK: namespaceVectorLength,
                includeValues: false,
                includeMetadata: true
            }
        }
        
        const response = await index.query(queryRequest); 
        const endTime = performance.now();

        // Calculate the elapsed time
        const elapsedTime = endTime - startTime;

        const elapsedTimeInSeconds = elapsedTime / 1000;
        console.log(`Execution time getting pinecone: ${elapsedTimeInSeconds} seconds`);

        let startMongo = process.hrtime();
        // get the pages with given docid and id from pinecone, store in list
        let queryContent = []
        try{for (const match of response.matches){
            //values.id has the page id
            // and use docid to searh mongo
            const pageContent = await Pages.find({ document:docId, embeddingsID: match.id })
            // console.log(counter)
            // add to queryLust 
            //queryContent = queryContent + pageContent.PageText
            const pageObject = pageContent[0];

            // Extracting the PageText
            const pageTextString = pageObject.PageText;
            const combinedTextString = pageTextString.replace(/\n/g, ' ');
            
            queryContent.push(combinedTextString);
        }}
        catch(e){
            console.log(e)
            res.status(500).json("Could not load your document, please try again.");
        }
        let diff = process.hrtime(startMongo);
        let seconds = diff[0] + diff[1] / 1e9; // Convert nanoseconds to seconds
        console.log(`Execution time mongo: ${seconds} seconds`);
        //console.log(queryContent)
        
        let startTimeRerank = process.hrtime();
        // reranking step
        let rankedContent=""
        try {
            const rerankData = {
                "main_sentence": userQuery,
                "queries": queryContent
            }
            const rerankResponse = await fetch('http://127.0.0.1:5000/predict', {
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
            // console.log(rerankPythn)
            //res.status(200).json(rerankPythn);
        } catch (error) {
            res.status(500).json({ error })
            console.log(error)
            //res.status(500).json({ message: error.message });
        }
        let diffRe = process.hrtime(startTimeRerank);
        let secondsre = diffRe[0] + diffRe[1] / 1e9; // Convert nanoseconds to seconds
        console.log(`Execution time rerank: ${secondsre} seconds`);

        //create a final query for llm
        const pmt = `- User Query: ${userQuery}.- Context from Uploaded Document:${rankedContent}.-previousRelevantMessage:${pastMessage}.- Instruction to LLM: - Answer users Query, by thinking through the problem step by step. - Use the information from the uploaded document, supplemented with your own knowledge, to accurately and comprehensively answer the user's query. - If the document lacks sufficient or relevant details, rely on your knowledge base to provide an appropriate response, and if you cant come up with an answer say i dont know.- Additional Requirements: Keep the response concise, within 200 words. Refer to the previous relevant message only for context, and if no such message is found, ignore previous relevant message.`
        console.log(pmt)

        res.status(200).json(pmt);

    } catch (err) {
        console.error(err);
        res.status(500).json({ err });
    }
    
    }
}