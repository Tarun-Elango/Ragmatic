/**
 * 1. add doc name to mongo (check if it exists)
 * 2. split pdf 
 * 3. each page -> add to mongo and get embed
 * 4. add vector embed to pinecone
 */
import multer from 'multer';
import { createRouter } from 'next-connect';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
const PDFParser = require('pdf-parse');
const mammoth = require("mammoth");
import axios from 'axios';
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
import { middleware } from "../../../middleware/middleware";


// const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small') 
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
    let test = await splitter.splitText(textForSplit)
    // const docOutput = await splitter.splitDocuments([
    //   new Document({ pageContent: textForSplit }),
    // ]);
    
    console.log(test.length, 'length of doc');
    

    //get the current docs namespace
   const customNamespace =`${userId}${filepath.replace("-", "").replace(/\s/g, "_")}`;;

    //add the doc to mongodb
    let mongoResponse
    try {
      //add doc to mongodb directly
      const existingUserDocu = await Document.findOne({
        userRefID: userId,
        docuName: customNamespace
      });
      if (existingUserDocu) {
          return res.status(200).json({ message:'File already exists' });
      } else {
          try {
              const document = new Document({userRefID:userId, docuName:customNamespace });
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


const pageArray = []
for (let i = 0; i < dataemb.data.length; i++) {
  const newPage = {
    document:  mongoResponse.docuId,                // Document ID
    pagenumber: i.toString(),        // Page Number as string
    embedding: dataemb.data[i].embedding, // Embedding ID
    userid: userId ,                  // User ID
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