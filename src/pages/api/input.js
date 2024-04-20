// parse api but for text files
import { middleware } from "../../middleware/middleware";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import axios from 'axios';
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
// import { pipeline } from '@xenova/transformers'
// const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small') 

export default async function handler(req, res) {
  // const token =  req.headers.authorization;
  const result = await middleware(req);
  

  if (!result.success) {
    res.status(400).json({ success: false, message: result.message });
  }
  if (req.method === 'POST') {
    try{
          //////////////////////////get client accesstoken from auth0
    const postData = `{"client_id":"${process.env.AUTH0_CLIENT_ID}","client_secret":"${process.env.AUTH0_CLIENT_SECRET}","audience":"${process.env.AUTH0_AUD}","grant_type":"client_credentials"}`
    const headers = {
        'Content-Type': 'application/json',
    }

    const response = await axios.post(process.env.AUTH0_TOKEN, postData, { headers });

    // Extract the data from the response
    const data = response.data;
    const accessToken = data.access_token // this has the accesstoken



    // console.log('Request body:', req.body); // Log the entire body to debug
    const headerText = req.body.headerText;
    const bodyText = req.body.bodyText;
    const userid = req.body.userId
    const customNamespace =`${userid}${headerText.replace("-", "").replace(/\s/g, "_")}`;;
let mongoResponse= null

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



    let textForSplit = ""
    textForSplit = bodyText.replace(/\r?\n/g, ' ');
    // The rest of the code remains the same since it operates on text.
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500, // Adjust chunk size as needed
        chunkOverlap: 40, // Adjust chunk overlap as needed
      });
      let test = await splitter.splitText(textForSplit)
      // const docOutput = await splitter.splitDocuments([
      //   new Document({ pageContent: textForSplit }),
      // ]);
      
      console.log(test.length, 'length of doc');

      // get the embeddings
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
    res.status(200).json({
        message: 'File uploaded successfully',
      //   fileName: uploadedFile.originalname,
      //   fileSize: uploadedFile.size,
      });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Internal server error', message:'Internal Server error' });
      }

  } else {
    // Handle any non-POST requests
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

