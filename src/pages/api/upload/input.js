// parse api but for text files
import { middleware } from "../../../middleware/middleware";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import OpenAI from 'openai';
import connectDB from '../../../helper/mongodb';
import Document from '../../../models/Document';
connectDB();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const { createClient } = require('@supabase/supabase-js');
const openaio = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  });

export default async function handler(req, res) {
  // const token =  req.headers.authorization;
  const result = await middleware(req);
  

  if (!result.success) {
    res.status(400).json({ success: false, message: result.message });
  }
  if (req.method === 'POST') {
    try{ 

    console.log('starting input api route')
    const headerText = req.body.headerText;
    const bodyText = req.body.bodyText;
    const userid = req.body.userId

    if (!headerText || !bodyText || !userid) {
      console.log("all fields not present input api route")
      return res.status(400).json({ error: 'headerText or bodyText or userid is not present in request', message:'headerText or bodyText or userid is not present in request' })
    }
    
    const customNamespace =`${userid}${headerText.replace("-", "").replace(/\s/g, "_")}`;;
    console.log('name of the doc: ',customNamespace)
    let mongoResponse= null

    /////////////////////////////////////////////////////////////////adding name to mongo
    try {
      const existingUserDocu = await Document.findOne({  
        userRefID: userid,
        docuName: customNamespace
      });
      if (existingUserDocu) {
          console.log('Document already exists in mongo db')
          return res.status(200).json({ message:'File already exists' });
      } 
      const document = new Document({userRefID:userid, docuName:customNamespace });
      await document.save();
      console.log('document saved to mongo')
      mongoResponse = document
        // return res.status(201).json({message:'Doc added success',result:document});
    } catch (error) {
      console.log("mongo error: ", error)
      return res.status(400).json({ error: 'MongoDb error', message:'MongoDb error' });
    }


      /////////////////////////////////////////////////////////////// splitting doc
      let textForSplit = ""
      textForSplit = bodyText.replace(/\r?\n/g, ' ');
      // The rest of the code remains the same since it operates on text.
      const chunk_size = 500
      const chunk_overlap = 40
      console.log(`splitting the doc chunk size ${chunk_size} and chunk overlap ${chunk_overlap}`)
      const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: chunk_size, // Adjust chunk size as needed
          chunkOverlap: chunk_overlap, // Adjust chunk overlap as needed
      });
      let test = await splitter.splitText(textForSplit)
      // const docOutput = await splitter.splitDocuments([
      //   new Document({ pageContent: textForSplit }),
      // ]);
      
      console.log(`Document split in ${test.length} pages`);



      /////////////////////////////////////////////////////////////// get the embeddings of pages
      let dataemb = null
      try {
        console.log('getting embedding for all pages')
        const embeddingsResponse = await openaio.embeddings.create({
          input: test,
          model: 'text-embedding-3-small', // or another suitable engine,
          encoding_format: "float",
        });
        console.log('created embeddings for these many pages',embeddingsResponse.data.length)
      
        // Parse the JSON response
        dataemb = embeddingsResponse;
        console.log('got embedding for all pages')
      }catch(error){
        console.error('Failed to fetch embeddings:', error);
        // TODO: delete the document from mongo
        return res.status(400).json({ error: 'Open ai embedding error', message:'Open ai embedding error' });
      }


    //console.log(dataemb.embeddings[0].embedding)
    

    /////////////////////////////////////////////////////////////// storing pages to supabase
    console.log('creating array of pages, to be stored in supabase')
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
        console.error('Error inserting pages to supabase:', error);
        // TODO: delete the document from mongo
        return res.status(400).json({ error: 'Supabase error', message:'Error storing your file' });
    } 

    console.log('pages stored in supabase, of size', pageArray.length)
    console.log('Inserted pages:', pagesdata);
  
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

