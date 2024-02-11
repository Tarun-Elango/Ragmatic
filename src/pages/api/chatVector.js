const { createClient } = require('@supabase/supabase-js');
import { pipeline } from '@xenova/transformers'
import { middleware } from "../../middleware/middleware";
import axios from 'axios';
// import { env } from '@xenova/transformers'
// env.cacheDir = '../../cache';
function dotProduct(vec1, vec2) {
    let product = 0;
    for (let i = 0; i < vec1.length; i++) {
        product += vec1[i] * vec2[i];
    }
    return product;
}

function magnitude(vec) {
    let sum = 0;
    for (let i = 0; i < vec.length; i++) {
        sum += vec[i] ** 2;
    }
    return Math.sqrt(sum);
}

function cosineSimilarity(vec1, vec2) {
    return dotProduct(vec1, vec2) / (magnitude(vec1) * magnitude(vec2));
}

function cosineDistance(vec1, vec2) {
    return 1 - cosineSimilarity(vec1, vec2);
}

// Create a single Supabase client for interacting with your database
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function insertVectorEmbedding(chatId, textString, vectorEmbedding) {
    const { data, error } = await supabase
        .from('vector_embeddings')
        .insert([
            { chat_id: chatId, text_string: textString, vector_embedding: vectorEmbedding }
        ]);

    if (error) {
        console.error('Error inserting vector embedding:', error);
        return null;
    }

    return data;
}

async function fetchRowsByChatId(chatId) {
    try {
        const { data, error } = await supabase
            .from('vector_embeddings') // Replace with your actual table name
            .select('*') // Selects all columns
            .eq('chat_id', chatId); // Ensure 'chat_id' matches your column name

        if (error) {
            console.error('Error fetching rows:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error in fetchRowsByChatId:', error);
        return null; // Or handle the error as needed
    }
}
export default async function handler(req, res) {

    const result = await middleware(req);

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
    } else {
        const { chatId, userQuery, combinedMessage } = req.body;
        const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small');
        //////////////////////////get client accesstoken from auth0
            const postData = `{"client_id":"${process.env.AUTH0_CLIENT_ID}","client_secret":"${process.env.AUTH0_CLIENT_SECRET}","audience":"${process.env.AUTH0_AUD}","grant_type":"client_credentials"}`
            const headers = {
                'Content-Type': 'application/json',
            }
            const response = await axios.post(process.env.AUTH0_TOKEN, postData, { headers });
            // Extract the data from the response
            const data = response.data;
            const accessToken = data.access_token // this has the accesstoken
        //////////////////////////////
        
            // Check if the request method is POST
            if (req.method !== 'POST') {
            return res.status(405).json({ message: 'Only POST requests are allowed' });
            }
        
            // Handle request with just a chat ID
            if (!combinedMessage) {
                let startTime = process.hrtime();
                // retrive most relevant vector embedding
            
                // get the embdedding of userquery
                
                const embeddingResultUser = await generateEmbedding(userQuery, {
                    pooling: 'mean',
                    normalize: true,
                });
                const embeddingUserQuery = Array.from(embeddingResultUser.data);


                // get all chat messages by current chat id
                const rows = await fetchRowsByChatId(chatId);

                if (rows) {
                    //console.log('Retrieved rows:', rows);
                    // Further processing with rows
                } else {
                    console.log('No rows retrieved or an error occurred');
                }
                
                    // find the closest chat between the list from supabase(rows) and the embedding of the user query(embeddingUserQuery)

                    let closestVec = rows[0].vector_embedding;
                    // TODO: add all user queries
                    let closestVecIndex = 0
                    // closest vector from chatemblist to user query
                    if (!rows.length) {
                        console.log('no messages returned')
                    }
                    else{
                        // closest rpevious message to current user query
                        let minDistance = cosineDistance(embeddingUserQuery, closestVec);
            
                        for (let i = 1; i < rows.length; i++) {
                            let distance = cosineDistance(embeddingUserQuery, rows[i].vector_embedding);
                            if (distance < minDistance) {
                                minDistance = distance;
                                closestVec = rows[i].vector_embedding;
                                closestVecIndex=i
                            }
                        }
                    }
                    //console.log( rows[closestVecIndex]) // get the message from the row eqivalent and sent as reponse
                    let diff = process.hrtime(startTime);
                    let seconds = diff[0] + diff[1] / 1e9; // Convert nanoseconds to seconds
                    console.log(`Execution time for supabase find closest embeddings: ${seconds} seconds`);
                    return res.status(200).json({ message: `${rows[closestVecIndex].text_string}` });
            }
        
            // Handle request with both a chat ID and a message
            if (!userQuery) {
            // store the combiendmessage vector embedding

            // get the embeddings of the combined message
            //get the combined message embeddings

            const embeddingResult = await generateEmbedding(combinedMessage, {
                pooling: 'mean',
                normalize: true,
            });
            const embedding = Array.from(embeddingResult.data);

            // add to db
            const response =  insertVectorEmbedding(chatId, combinedMessage, embedding)
            .then(data => console.log('Inserted data:', data))
            .catch(err => console.error(err));
            return res.status(200).json({ message: `Stored the most recent user+ai message to vector db using combined message ${response}` });
            }
        
            // If neither condition is met, return an error
            return res.status(400).json({ message: 'Invalid request' });

}
  }
  