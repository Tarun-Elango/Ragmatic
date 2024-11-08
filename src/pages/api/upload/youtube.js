import { YoutubeTranscript } from 'youtube-transcript';
import { middleware } from "../../../middleware/middleware";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
import Document from '../../../models/Document';
import OpenAI from 'openai';
const openaio = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  });

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const result = await middleware(req);

        if (!result.success) {
        res.status(400).json({ success: false, message: result.message });
        }

    else{
      console.log('starting youtube api route')
    // Handle the POST request here
    const inputURL = req.body.url;
    const inputURLHeader = req.body.name;
    const userid = req.body.userId
    // Perform any necessary operations with the data
    // ...
    // Get the YouTube video ID from the inputURL
    const videoId = inputURL.split('v=')[1];

    console.log('Youtube video id: ',videoId);
    try {
        const config = {
            lang: "en" // Set the language to English
        };
        const subtitles = await YoutubeTranscript.fetchTranscript(videoId, config)
        const combinedText = subtitles.map(segment => segment.text).join(' ');
        //console.log(combinedText);

        /////////////////////////////////////////////////////////////// splitting doc
        const chunk_size = 500
        const chunk_overlap = 40
        console.log(`splitting the doc chunk size ${chunk_size} and chunk overlap ${chunk_overlap}`)
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: chunk_size, // Adjust chunk size as needed
            chunkOverlap: chunk_overlap, // Adjust chunk overlap as needed
          });
          let test = await splitter.splitText(combinedText)
        //   const docOutput = await splitter.splitDocuments([
        //     new Document({ pageContent: combinedText }),
        //   ]);
          
        console.log(`Document split in ${test.length} pages`);

          const customNamespace =`${userid}${inputURLHeader.replace("-", "").replace(/\s/g, "_")}`;;
      
          let mongoResponse

          try {
/////////////////////////////////////////////////////////////////adding name to mongo

            //add doc to mongodb directly
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
    return res.status(400).json({ error: 'Open ai embedding error', message:'Open ai embedding error' });
  }


//console.log(dataemb.embeddings[0].embedding)

/////////////////////////////////////////////////////////////// storing pages to supabase
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
    //TODO: remove doc from mongo
    return res.status(400).json({ error: 'Supabase error', message:'Error storing your file' });
    } 

    console.log('pages stored in supabase, of size', pageArray.length)
    console.log('Inserted pages:', pagesdata);

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
