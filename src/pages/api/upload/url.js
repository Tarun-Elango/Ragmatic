import { middleware } from "../../../middleware/middleware";
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
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
        } else {
            try {
                console.log('staring url api route')
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

                /////////////////////////////////////////////////////////////// splitting doc
                const chunk_size = 500
                const chunk_overlap = 40
                console.log(`splitting the doc chunk size ${chunk_size} and chunk overlap ${chunk_overlap}`)
                const splitter = new RecursiveCharacterTextSplitter({
                    chunkSize: chunk_size, // Adjust chunk size as needed
                    chunkOverlap: chunk_overlap, // Adjust chunk overlap as needed
                  });
                  let test = await splitter.splitText(textContent)
                //   const docOutput = await splitter.splitDocuments([
                //     new Document({ pageContent: textContent }),
                //   ]);
                  
                console.log(`Document split in ${test.length} pages`);

                  // get the current docs namespace
                    const customNamespace =`${userid}${inputURLHeader.replace("-", "").replace(/\s/g, "_")}`;;
                

                     /////////////////////////////////////////////////////////////////adding name to mongo
                    // add the doc to mongodb
                    let mongoResponse
                    try {
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
                        console.error('Error inserting pages:', error);
                        // TODO: delete the document from mongo
                        return res.status(400).json({ error: 'Supabase error', message:'Error storing your file' });
                    } 
           
                    console.log('pages stored in supabase, of size', pageArray.length)
                    console.log('Inserted pages:', pagesdata);

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

