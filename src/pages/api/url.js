import { middleware } from "../../middleware/middleware";
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
import axios from 'axios';
export default async function handler(req, res) {
    if (req.method === 'POST') {

        const result = await middleware(req);

        if (!result.success) {
        res.status(400).json({ success: false, message: result.message });
        } else {
            try {

                const inputURLHeader = req.body.headerText;
                const inputURL = req.body.bodyText;
                const userid = req.body.userId
                const responseUrl = await fetch(inputURL);
                const dataurl = await responseUrl.text();
                // Create a JSDOM window object
                const window = new JSDOM('').window;

                // Create a DOMPurify instance with the window object
                const DOMPurify = createDOMPurify(window);
        
                // Use DOMPurify with the window object to sanitize the data
                const sanitizedContent = DOMPurify.sanitize(dataurl);

                // Remove HTML tags
                let textContent = sanitizedContent.replace(/<[^>]*>/g, '');

                // Remove newline characters, tabs, and reduce multiple spaces to a single space
                textContent = textContent.replace(/\n/g, ' ') // Remove newline characters
                                        .replace(/\t/g, ' ') // Remove tabs
                                        .replace(/\s\s+/g, ' ') // Replace multiple spaces with a single space
                                        .trim(); // Trim leading and trailing whitespace
                // console.log(inputURLHeader)
                // console.log(textContent);
                // do the processing
                const splitter = new RecursiveCharacterTextSplitter({
                    chunkSize: 500, // Adjust chunk size as needed
                    chunkOverlap: 40, // Adjust chunk overlap as needed
                  });
                  let test = await splitter.splitText(textForSplit)
                //   const docOutput = await splitter.splitDocuments([
                //     new Document({ pageContent: textContent }),
                //   ]);
                  
                  console.log(test.length, 'length of doc');
                  // get the current docs namespace
                    const customNamespace =`${userid}${inputURLHeader.replace("-", "").replace(/\s/g, "_")}`;;
                

                    //////////////////////////get client accesstoken from auth0
                    const postData = `{"client_id":"${process.env.AUTH0_CLIENT_ID}","client_secret":"${process.env.AUTH0_CLIENT_SECRET}","audience":"${process.env.AUTH0_AUD}","grant_type":"client_credentials"}`
                    const headers = {
                        'Content-Type': 'application/json',
                    }

                    const response = await axios.post(process.env.AUTH0_TOKEN, postData, { headers });

                    // Extract the data from the response
                    const data = response.data;
                    const accessToken = data.access_token // this has the accesstoken
            
                    // add the doc to mongodb
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
                    const requestBody ={
                        "sentences":test
                      }
                let dataemb = null
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
                        dataemb = await response.json();
                        console.log(dataemb.embeddings.length)
                      }catch(error){
                        console.error('Failed to fetch embeddings:', error);
                        return res.status(400).json({ error: 'Open ai embedding error', message:'Open ai embedding error' });
                      }
                
                
                    //console.log(dataemb.embeddings[0].embedding)
                
                    const pageArray = []
                    for (let i = 0; i < dataemb.embeddings.length; i++) {
                      const newPage = {
                        document:  mongoResponse.result.docuId,                // Document ID
                        pagenumber: i.toString(),        // Page Number as string
                        embedding: dataemb.embeddings[i].embedding, // Embedding ID
                        userid: userid ,                  // User ID
                        content: test[i],               // Page Text
                       };
                    pageArray.push(newPage);
                    }
                
                    const { data: pagesdata, error } = await supabase
                        .from('pages')
                        .insert(pageArray);
                
                    if (error) {
                        console.error('Error inserting pages:', error);
                    } else {
                        console.log('Inserted pages:', pagesdata);
                    }





                        // for each page add to mongo and generate embeddings
                        // let openAIEmbed = []
                        // const pagesForBulkInsert = [];
                        // for (const [index, body] of docOutput.entries()) {
                        // // add page to mongodb
                        // const newPage = {
                        //     document: mongoResponse.result.docuId,
                        //     userID: userid,
                        //     PageNumber: index.toString(),
                        //     PageText: body.pageContent,
                        //     embeddingsID: `doc-${index}`, // Assuming this is your embeddings ID
                        //     createdAt: new Date(),
                        //     updatedAt: new Date()
                        // }
                        // pagesForBulkInsert.push(newPage);
                        // openAIEmbed.push(body.pageContent)
                        // // // get the embedding of the page
                        // // const output = await generateEmbedding(body.pageContent, {
                        // //   pooling: 'mean',
                        // //   normalize: true,
                        // // });
                        // // const embedding = Array.from(output.data);
                        // // // store in this list
                        // // embeddingsList.push({ id: `doc-${index}`, embedding }); // Use index as part of the ID
                        // }


                        // let formattedEmbeddings=[]
                        // // get the embeddings
                        // const requestBody ={
                        // "sentences":openAIEmbed
                        // }
                        // console.log(openAIEmbed.length)
                        // try {
                        // // Make a POST request to the server endpoint
                        // const response = await fetch(`${process.env.BASEURL}/api/ebd`, {
                        //     method: 'POST',
                        //     headers: {
                        //     'Content-Type': 'application/json',
                        //     'Authorization': `Bearer ${accessToken}`
                        //     },
                        //     body: JSON.stringify(requestBody)
                        // });
                        
                        // // Check if the request was successful
                        // if (!response.ok) {
                        //     throw new Error(`Error: ${response.statusText}`);
                        // }
                        
                        // // Parse the JSON response
                        // const dataemb = await response.json();
                        // formattedEmbeddings = dataemb.embeddings.map((item, index) => ({
                        //     id: `doc-${index}`,
                        //     embedding: item.embedding
                        // }));
                        
                        // } catch (error) {
                        // console.error('Failed to fetch embeddings:', error);
                        // return res.status(400).json({ error: 'Open ai embedding error', message:'Open ai embedding error' });
                        // }

                        // await Pages.insertMany(pagesForBulkInsert);

                        // // add the entire embedding list to pinecone
                        // try {
                        //     // this is the processed embeddings list for pinecone 
                        //     // TODO: add metadata to relate the vector to the actual text
                        //     const vectors = formattedEmbeddings.map(({ id, embedding }) => {
                        //         return { id: id, values: embedding };
                        //     });
                        //     await index.upsert(vectors);
                        //     console.log('Embeddings added to the namespace successfully');
                        // } catch (error) {
                        //     console.error('Error during upsert:', error);
                        //     return res.status(400).json({ error: 'pinecone Error', message:'pinecone error' });
                        // }
                // Your protected API logic goes here
                res.status(200).json({
                    message: 'Website content processed',
                    });
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({
                    message: 'an error occured',
                    });
            }
        }
    } else {
        // Handle any non-POST requests
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

