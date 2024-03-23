import { YoutubeTranscript } from 'youtube-transcript';
import { middleware } from "../../middleware/middleware";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import axios from 'axios';
import { Pinecone } from '@pinecone-database/pinecone';
import Pages from '../../models/Pages'
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
  });
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const result = await middleware(req);

        if (!result.success) {
        res.status(400).json({ success: false, message: result.message });
        }

    else{
    // Handle the POST request here
    const inputURL = req.body.url;
    const inputURLHeader = req.body.name;
    const userid = req.body.userId
    // Perform any necessary operations with the data
    // ...
    // Get the YouTube video ID from the inputURL
    const videoId = inputURL.split('v=')[1];

    console.log(videoId);
    try {
        const config = {
            lang: "en" // Set the language to English
        };
        const subtitles = await YoutubeTranscript.fetchTranscript(videoId, config)
        const combinedText = subtitles.map(segment => segment.text).join(' ');
        //console.log(combinedText);
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500, // Adjust chunk size as needed
            chunkOverlap: 40, // Adjust chunk overlap as needed
          });
          
          const docOutput = await splitter.splitDocuments([
            new Document({ pageContent: combinedText }),
          ]);
          
          console.log(docOutput.length, 'length of doc');

          const customNamespace =`${userid}${inputURLHeader.replace("-", "").replace(/\s/g, "_")}`;;
          const index = pinecone.index('jotdown').namespace(customNamespace)
      
      
          //////////////////////////get client accesstoken from auth0
          const postData = `{"client_id":"${process.env.AUTH0_CLIENT_ID}","client_secret":"${process.env.AUTH0_CLIENT_SECRET}","audience":"${process.env.AUTH0_AUD}","grant_type":"client_credentials"}`
          const headers = {
              'Content-Type': 'application/json',
          }
      
          const response = await axios.post(process.env.AUTH0_TOKEN, postData, { headers });
      
          // Extract the data from the response
          const data = response.data;
          const accessToken = data.access_token // this has the accesstoken
          let mongoResponse
            try {

            // create a new doc in mongo, just the doc details
            const response = await fetch(`${process.env.BASEURL}/api/document`, { // Use a full URL if necessary
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    userRefID: userid,
                    docuName: customNamespace,
                    type: "add"
                })
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            mongoResponse = await response.json();
            if (mongoResponse.message && mongoResponse.message.includes('document already exists')) {
                // Handle the case where the document already exists
                return res.status(200).json({
                message: 'File already exists',
                //   fileName: uploadedFile.originalname,
                //   fileSize: uploadedFile.size,
                });
            } 
            // Process the response data as needed
            } catch (error) {
                if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error Response:', error);
                } else if (error.request) {
                // The request was made but no response was received
                console.error('Error Request:');
                } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error Message:', error);
                }
                return res.status(400).json({ error: 'MongoDb error', message:'MongoDb error' });
            }

            // for each page add to mongo and generate embeddings
            let openAIEmbed = []
            const pagesForBulkInsert = [];
            for (const [index, body] of docOutput.entries()) {
                // add page to mongodb
                const newPage = {
                document: mongoResponse.result.docuId,
                userID: userid,
                PageNumber: index.toString(),
                PageText: body.pageContent,
                embeddingsID: `doc-${index}`, // Assuming this is your embeddings ID
                createdAt: new Date(),
                updatedAt: new Date()
                }
                pagesForBulkInsert.push(newPage);
                openAIEmbed.push(body.pageContent)
                // // get the embedding of the page
                // const output = await generateEmbedding(body.pageContent, {
                //   pooling: 'mean',
                //   normalize: true,
                // });
                // const embedding = Array.from(output.data);
                // // store in this list
                // embeddingsList.push({ id: `doc-${index}`, embedding }); // Use index as part of the ID
            }


            let formattedEmbeddings=[]
            // get the embeddings
            const requestBody ={
                "sentences":openAIEmbed
            }
            console.log(openAIEmbed.length)
            try {
                // Make a POST request to the server endpoint
                const response = await fetch(`${process.env.BASEURL}/api/ebd`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(requestBody)
                });
            
                // Check if the request was successful
                if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
                }
            
                // Parse the JSON response
                const dataemb = await response.json();
                formattedEmbeddings = dataemb.embeddings.map((item, index) => ({
                id: `doc-${index}`,
                embedding: item.embedding
                }));
            
            } catch (error) {
                console.error('Failed to fetch embeddings:', error);
                return res.status(400).json({ error: 'Open ai embedding error', message:'Open ai embedding error' });
            }

            await Pages.insertMany(pagesForBulkInsert);

            // add the entire embedding list to pinecone
            try {
                // this is the processed embeddings list for pinecone 
                // TODO: add metadata to relate the vector to the actual text
                const vectors = formattedEmbeddings.map(({ id, embedding }) => {
                    return { id: id, values: embedding };
                });
                await index.upsert(vectors);
                console.log('Embeddings added to the namespace successfully');
            } catch (error) {
                console.error('Error during upsert:', error);
                return res.status(400).json({ error: 'pinecone Error', message:'pinecone error' });
            }
            // Send a response
            res.status(200).json({ message: 'Yotube video processed.' });
        
      } catch (error) {
        console.error('Failed to fetch transcript:', error);
        res.status(405).json({ message: 'Failed to fetch transcript:' });
      }


    }   
    
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
