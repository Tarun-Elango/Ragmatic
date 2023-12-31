import connectDB from '../../helper/mongodb';
import Document from '../../models/Document';


connectDB();
export const config = {
  api: {
    bodyParser: true,
  },
};


export default async function handler(req, res) {
  if (req.method === 'GET') {
      // get all the users document
      const { userId } = req.body;
      try {
          const usersDocumentList = await Document.find({ userRefID: userId });
          if (usersDocumentList.length === 0) {
              res.status(404).json({ error: 'No documents found for the user' });
          } else {
              res.status(200).json(usersDocumentList);
          }
      } catch (error) {
        res.status(500).json({ error: 'Error fetching users documents' });
      }

    } 
    
    else if (req.method === 'POST') {
      // upload a document for the user 
      const { userRefID, docuName } = req.body;
      const existingUserDocu = await Document.findOne({
          userRefID: userRefID,
          docuName: docuName
      });
    if (existingUserDocu){
      res.status(400).json({error:'users document already exists'})
    } else {
      try {
        const document = new Document({ userRefID, docuName });
        await document.save();
        res.status(201).json(document);
      } catch (error) {
        res.status(500).json({ error: 'Error creating users document' });
      }
    }
      
      
    } else if (req.method === 'DELETE'){
      // delete a document for the user using the document id
      const { documentId } = req.body; // Assuming the documentId is passed in the request body
      try {
          const deletedDocument = await Document.findByIdAndDelete(documentId);
          if (!deletedDocument) {
              res.status(404).json({ error: 'Document not found' });
          } else {
              res.status(200).json({ message: 'Document deleted successfully' });
          }
      } catch (error) {
          res.status(500).json({ error: 'Error deleting user document' });
      }
    }
}