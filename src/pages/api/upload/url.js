import { middleware } from "../../../middleware/middleware";
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
                
                    // add the doc to mongodb
                    let mongoResponse

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



                    const requestBody ={
                        "sentences":test
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

