import { middleware } from "../../middleware/middleware";
import Pages from '../../models/Pages'
import { pipeline } from '@xenova/transformers'
// import { env } from '@xenova/transformers'
// env.cacheDir = '../../cache';
import getTopSimilarSentences from '../../utils/crossEncoder'
import { Pinecone } from '@pinecone-database/pinecone';
import axios from 'axios';

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
      const userQuery = req.body.prompt
      const docId = req.body.docId
      const docName = req.body.docName 
      const pastMessage = req.body.pMessage  

  try {
        const startTime = performance.now();

        //get the users embeddings
        const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small');
        const embeddingResult = await generateEmbedding(userQuery, {
            pooling: 'mean',
            normalize: true,
        });
        // Ensure that the output is an array
        const embedding = Array.from(embeddingResult.data);
    
        // pinecone query results
        const customNamespace = docName;
        const index = pinecone.index('jotdown').namespace(customNamespace)
        const stats = await index.describeIndexStats()
        const namespaceVectorLength = stats.namespaces[customNamespace].recordCount     

        let queryRequest={}

        // Check if the namespace size > 15, and form query accordingly
        if (namespaceVectorLength > 15) {
            // get the 2 closet vector
            queryRequest = {
                vector: embedding,
                topK: 15,
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

        // get the pages from mongo with given docid and pinecone emb id, 
        let queryContent = [] //store in list
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
        
        // reranking step
        let startTimeRerank = process.hrtime();
        let rankedContent=""

        try {
            rankedContent = await getTopSimilarSentences(userQuery, queryContent); // Await the result of getTopSimilarSentences
            // console.log("Top 5 similar sentences:", rankedContent);
        } catch (error) {
            console.error(error); // Handle any errors that occur during getTopSimilarSentences
        }

        let diffRe = process.hrtime(startTimeRerank);
        let secondsre = diffRe[0] + diffRe[1] / 1e9; // Convert nanoseconds to seconds
        console.log(`Execution time rerank: ${secondsre} seconds`);

        //create a final query for llm
        const pmt = `- User Query: ${userQuery}.- Context from Uploaded Document:${rankedContent}.-previousRelevantMessage:${pastMessage}.- Instruction to LLM: - Answer users Query, by thinking through the problem step by step. - Use the information from the uploaded document, supplemented with your own knowledge, to accurately and comprehensively answer the user's query. - If the document lacks sufficient or relevant details, rely on your knowledge base to provide an appropriate response, and if you cant come up with an answer say i dont know.- Additional Requirements: Keep the response concise, within 200 words. Refer to the previous relevant message only for context, and if no such message is found, ignore previous relevant message.`
        console.log(pmt.length)

        res.status(200).json(pmt);

    } catch (err) {
        console.error(err);
        res.status(500).json({ err });
    }
    
    }
}