import connectDB from '../../../helper/mongodb';
import Document from '../../../models/Document';
import { middleware } from "../../../middleware/middleware";
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);  

connectDB();
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  const result = await middleware(req);

  if (!result.success) {
    res.status(400).json({ success: false, message: result.message });
  } else {

  if (req.method === 'POST') {
    const { userRefID, docuName, type } = req.body;

    if (type == 'fetch') {
      if (!userRefID) {
        console.log("all fields not present for fetching doc")
        return res.status(400).send('userRefID is required');
      }
        try {
            console.log("fetching all docs for user with user if: ", userRefID)
            const usersDocumentList = await Document.find({ userRefID: userRefID });
            if (usersDocumentList.length === 0) {
              console.log("user has no docs")
                return res.status(200).json({ message: 'Empty List' });
            } else {
              console.log("user has docs and is returned")
                return res.status(200).json(usersDocumentList);
            }
        } catch (error) {
          console.log("theres an error", error)
            return res.status(500).json({ error: 'Error fetching users documents' });
        }
    } else if (type == 'add') {

      if (!userRefID || !docuName) {
        console.log("all fields not present forfetching doc")
        return res.status(400).send('userRefID or docuName is not present in request');
      }

      try{
        console.log(`adding a doc ${docuName} for user ${userRefID}`)
        const existingUserDocu = await Document.findOne({
            userRefID: userRefID,
            docuName: docuName
        });
      
        if (existingUserDocu) {
          console.log('doc already exists')
          return res.status(200).json({ message:'document already exists' });
        } 
        const document = new Document({userRefID, docuName });
        await document.save();
        console.log('doc saved')
        return res.status(201).json({message:'Doc added success',result:document});
      }catch(error){
        console.log("there was an error", error)
        return res.status(500).json({ error: 'Error creating user\'s document' });
      }
        
    } else {
        return res.status(500).json({ error: 'Wrong input body' });
    }
}

   else if (req.method === 'DELETE'){
    try {
        const { docId, docName } = req.body;

        if (!docId) {
          console.log("all fields not present deleting doc")
          return res.status(400).send('docId is required');
        }

        console.log(`deleting doc with doc id :${docId}`)

        console.log("deleting pages from supabase")
        const { data, error } = await supabase
        .from('pages')
        .delete()
        .match({ document: docId });

        if (error) {
            console.error('Error deleting pages from supabase:', error);
            return res.status(500).json({ success: false, message: 'Error deleting pages' });
        } else {
            console.log('Deleted pages from supabase:');
        }
        console.log('deleting document from mongo')  
        // Delete the document
        const result = await Document.deleteMany({ docuId: docId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'No documents found with the specified docId' });
          }
        console.log('mongo document deleted',result)
        res.status(200).json({ success: true, message: 'Document and related data deleted successfully' });
      } catch (error) {
        console.log('there was an error',error)
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
      }
    }
  }
}
