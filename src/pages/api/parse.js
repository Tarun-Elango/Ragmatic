import multer from 'multer';
import { createRouter } from 'next-connect';
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
const PDFParser = require('pdf-parse');
import axios from 'axios';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers'
import Pages from '../../models/Pages'
import { middleware } from "../../middleware/middleware";

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
    if (uploadedFile.mimetype != 'application/pdf'){
      // check if its a pdf
      return res.status(400).json({ error: 'Currently only pdf file type is supported', message:'Currently only pdf file type is supported' });
    }
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file provided', message:'No file provided' });
    }
    
    const userId = req.body.userId
    const filepath = uploadedFile.originalname
    const buffer = uploadedFile.buffer;
    
    const data = await PDFParser(buffer);
    const pdfText = data.text;// Convert buffer to text using pdf-parse
    console.log('File received:', uploadedFile.originalname);

    // get the current docs namespace
    const customNamespace =`${userId}${filepath.replace("-", "").replace(/\s/g, "_")}`;;
    const index = pinecone.index('jotdown').namespace(customNamespace)
    let check = false
    const stats = await pinecone.index('jotdown').describeIndexStats();
    const namespaces = stats.namespaces;

    //check if namespace exists
    for (const namespace in namespaces) {
        if (namespace === customNamespace) {
            console.log(`Namespace '${customNamespace}' exists.`);
            check = true
            break
        }
    }

    // if it does not exist
    if (!check){
     let mongoResponse
      // add to mongodb

        // get client accesstoken from auth0
        const postData = `{"client_id":"${process.env.AUTH0_CLIENT_ID}","client_secret":"${process.env.AUTH0_CLIENT_SECRET}","audience":"${process.env.AUTH0_AUD}","grant_type":"client_credentials"}`
        const headers = {
            'Content-Type': 'application/json',
        }

        const response = await axios.post(process.env.AUTH0_TOKEN, postData, { headers });

        // Extract the data from the response
        const data = response.data;
        const accessToken = data.access_token // this has the accesstoken


      try {
        const userRefID = userId
        const docuName = customNamespace
        console.log('here')
        const response = await fetch('http://localhost:3000/api/document', { // Use a full URL if necessary
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

      const loader = new PDFLoader(uploadedFile, {
        // you may need to add `.then(m => m.default)` to the end of the import
        pdfjs: () => import("pdfjs-dist/legacy/build/pdf.js").then(m => m.default),
      });


      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 400,//500
        chunkOverlap: 60,//70
      });

      const docOutput = await splitter.splitDocuments([
        new Document({ pageContent: pdfText }),
      ]);

      // get embeddings list
      const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small') 
      let embeddingsList = [];
      for (const [index, body] of docOutput.entries()) {

        // add page to mongodb
        const newPage = new Pages({
          document: mongoResponse.docuId,
          userID: userId,
          PageNumber: index.toString(),
          PageText: body.pageContent,
          embeddingsID: `doc-${index}`, // Assuming this is your embeddings ID
          createdAt: new Date(),
          updatedAt: new Date()
        });

        newPage.save()

        const output = await generateEmbedding(body.pageContent, {
            pooling: 'mean',
            normalize: true,
        });
        const embedding = Array.from(output.data);
        embeddingsList.push({ id: `doc-${index}`, embedding }); // Use index as part of the ID
      }
      
      // // this is the processed embeddings list for pinecone 
      // // TODO: add metadata to relate the vector to the actual text
      const vectors = embeddingsList.map(({ id, embedding }) => {
          return { id: id, values: embedding };
      });
      
      // add to pinecone
      try {
        // insert to custom namesapce
          await index.upsert(vectors);
          console.log('Embeddings added to the namespace successfully');
      } catch (error) {
          console.error('Error during upsert:', error);
          return res.status(400).json({ error: 'pinecone Error', message:'pinecone error' });
      }
    // once all upload complete
      res.status(200).json({
        message: 'File uploaded successfully',
      //   fileName: uploadedFile.originalname,
      //   fileSize: uploadedFile.size,
      });
    } 
    
    // if file already exists
    else if (check){
      res.status(200).json({
        message: 'File already exists',
      //   fileName: uploadedFile.originalname,
      //   fileSize: uploadedFile.size,
      });
    }
    
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal server error', message:'Internal Server error' });
  }}


});

export default apiRoute.handler();
