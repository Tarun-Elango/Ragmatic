/**
 * 1. add doc name to mongo (check if it exists)
 * 2. split pdf 
 * 3. each page -> add to mongo and get embed
 * 4. add vector embed to pinecone
 */
import multer from 'multer';
import { createRouter } from 'next-connect';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
const PDFParser = require('pdf-parse');
const mammoth = require("mammoth");
import axios from 'axios';
import { Pinecone } from '@pinecone-database/pinecone';
// import { pipeline } from '@xenova/transformers'
import Pages from '../../models/Pages'
import { middleware } from "../../middleware/middleware";


// const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small') 

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENVIRONMENT,
});

const upload = multer({
  storage: multer.memoryStorage(),
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const apiRoute = createRouter();

apiRoute.use(upload.single('file'));

apiRoute.post(async (req, res) => {
  const result = await middleware(req);

  if (!result.success) {
    res.status(400).json({ success: false, message: result.message });
  } else {
  try {
    const uploadedFile = req.file;
    console.log(uploadedFile.mimetype)
    if (uploadedFile.mimetype != 'application/pdf'  &&  uploadedFile.mimetype != 'text/plain'  && uploadedFile.mimetype != 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'){
      return res.status(400).json({ error: 'Currently only .pdf, .docx, .txt files type is supported', message:'Currently only .pdf, .docx, .txt files type is supported' });
    }
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file provided', message:'No file provided' });
    }
    
    const userId = req.body.userId
    console.log('File received:', uploadedFile);
    const filepath = uploadedFile.originalname
    const buffer = uploadedFile.buffer;
    let textForSplit = ""

    if (uploadedFile.mimetype == 'application/pdf'){
      const pdfData = await PDFParser(buffer);
      textForSplit = pdfData.text;// Convert buffer to text using pdf-parse
      textForSplit = textForSplit.replace(/\r?\n/g, ' ');
    }
    if (uploadedFile.mimetype == 'text/plain'){
      textForSplit = buffer.toString('utf8'); // Convert buffer to string
      textForSplit = textForSplit.replace(/\r?\n/g, ' ');
    }
    if (uploadedFile.mimetype == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'){
      const wordData = await mammoth.convertToHtml({ buffer }); // Pass the buffer directly
      textForSplit = wordData.value;
      textForSplit = textForSplit.replace(/\r?\n/g, ' ');
      textForSplit = textForSplit.replace(/<[^>]*>/g, "");
      textForSplit = textForSplit.replace(/\r?\n/g, ' ');
    }
    // The rest of the code remains the same since it operates on text.
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500, // Adjust chunk size as needed
      chunkOverlap: 40, // Adjust chunk overlap as needed
    });
    
    const docOutput = await splitter.splitDocuments([
      new Document({ pageContent: textForSplit }),
    ]);
    
    console.log(docOutput.length, 'length of doc');
    

    //get the current docs namespace
   const customNamespace =`${userId}${filepath.replace("-", "").replace(/\s/g, "_")}`;;
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

    //add the doc to mongodb
    let mongoResponse
    try {

      // create a new doc in mongo, just the doc details
      const userRefID = userId
      const docuName = customNamespace
      //console.log('here')
      const response = await fetch(`${process.env.BASEURL}/api/document`, { // Use a full URL if necessary
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            userRefID: userRefID,
            docuName: docuName,
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
    let embeddingsList = [];
    let openAIEmbed = []
    const pagesForBulkInsert = [];
    for (const [index, body] of docOutput.entries()) {
      // console.log(body.pageContent)
      // console.log("-----------------------------------------------------------------")
      //add page to mongodb
      const newPage = {
        document: mongoResponse.result.docuId,
        userID: userId,
        PageNumber: index.toString(),
        PageText: body.pageContent,
        embeddingsID: `doc-${index}`, // Assuming this is your embeddings ID
        createdAt: new Date(),
        updatedAt: new Date()
      }
      pagesForBulkInsert.push(newPage);
      openAIEmbed.push(body.pageContent)
      // get the embedding of the page
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
      const data = await response.json();
      formattedEmbeddings = data.embeddings.map((item, index) => ({
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

    // // once all upload complete
    res.status(200).json({
      message: 'File uploaded successfully',
    //   fileName: uploadedFile.originalname,
    //   fileSize: uploadedFile.size,
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal server error', message:'Internal Server error' });
  }}


});

export default apiRoute.handler();
