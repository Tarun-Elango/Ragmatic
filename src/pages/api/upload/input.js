// parse api but for text files
import { middleware } from "../../../middleware/middleware";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import axios from 'axios';

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
import OpenAI from 'openai';
const openaio = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  });
// import { pipeline } from '@xenova/transformers'
// const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small') 
import connectDB from '../../../helper/mongodb';
import Document from '../../../models/Document';
connectDB();
export default async function handler(req, res) {
  // const token =  req.headers.authorization;
  const result = await middleware(req);
  

  if (!result.success) {
    res.status(400).json({ success: false, message: result.message });
  }
  if (req.method === 'POST') {
    try{    // console.log('Request body:', req.body); // Log the entire body to debug
    const headerText = req.body.headerText;
    const bodyText = req.body.bodyText;
    const userid = req.body.userId
    const customNamespace =`${userid}${headerText.replace("-", "").replace(/\s/g, "_")}`;;
    let mongoResponse= null


    try {
    //add doc to mongodb directly
    const existingUserDocu = await Document.findOne({  
      userRefID: userid,
      docuName: customNamespace
    });
    if (existingUserDocu) {
        return res.status(200).json({ message:'File already exists' });
    } else {
        try {
            const document = new Document({userRefID:userid, docuName:customNamespace });
            await document.save();
            mongoResponse = document
           // return res.status(201).json({message:'Doc added success',result:document});
        } catch (error) {
            return res.status(500).json({ error: 'Error creating user\'s document' });
        }
    }
      } catch (error) {
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
      let dataemb = null
      try {

        const embeddingsResponse = await openaio.embeddings.create({
          input: test,
          model: 'text-embedding-3-small', // or another suitable engine,
          encoding_format: "float",
        });
        console.log('created embeddings for these many pages',embeddingsResponse.data.length)
      
        // Parse the JSON response
        dataemb = embeddingsResponse;

      }catch(error){
        console.error('Failed to fetch embeddings:', error);
        return res.status(400).json({ error: 'Open ai embedding error', message:'Open ai embedding error' });
      }


    //console.log(dataemb.embeddings[0].embedding)

    const pageArray = []
    for (let i = 0; i < dataemb.data.length; i++) {
      const newPage = {
        document:  mongoResponse.docuId,                // Document ID
        pagenumber: i.toString(),        // Page Number as string
        embedding: dataemb.data[i].embedding, // Embedding ID
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

