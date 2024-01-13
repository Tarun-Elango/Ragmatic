import multer from 'multer';
import { createRouter } from 'next-connect';
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
const PDFParser = require('pdf-parse');
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers'
const axios = require('axios');

//TODO: retrive pinecone embeddings search, delete namespace/mongo

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENVIRONMENT,
});

// const openai = new OpenAI({
// apiKey: process.env.OPENAI_API_KEY,
// });

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
  try {
    const uploadedFile = req.file;
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
    const customNamespace =`${userId}${filepath.slice(0, -4).replace("-", "")}`;;
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

      const loader = new PDFLoader(uploadedFile, {
        // you may need to add `.then(m => m.default)` to the end of the import
        pdfjs: () => import("pdfjs-dist/legacy/build/pdf.js").then(m => m.default),
      });


      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 0,
      });

      const docOutput = await splitter.splitDocuments([
        new Document({ pageContent: pdfText }),
      ]);

      // get embeddings list
      const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small') 
      let embeddingsList = [];
      for (const [index, body] of docOutput.entries()) {
          const output = await generateEmbedding(body.pageContent, {
              pooling: 'mean',
              normalize: true,
          });
          const embedding = Array.from(output.data);
          embeddingsList.push({ id: `doc-${index}`, embedding }); // Use index as part of the ID
      }
      
      // this is the processed embeddings list for pinecone 
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

      // add to mongodb
      try {
        const userRefID = userId
        const docuName = customNamespace
        console.log('here')
        const response = await fetch('http://localhost:3000/api/document', { // Use a full URL if necessary
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
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
  
      const data = await response.json();
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
  }
});

export default apiRoute.handler();
