import connectDB from '../../helper/mongodb';
import Document from '../../models/Document';


connectDB();
export const config = {
  api: {
    bodyParser: true,
  },
};


export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { userRefID, docuName, type } = req.body;

    if (type == 'fetch') {
        try {
            const usersDocumentList = await Document.find({ userRefID: userRefID });
            if (usersDocumentList.length === 0) {
                return res.status(404).json({ error: 'No documents found for the user' });
            } else {
                return res.status(200).json(usersDocumentList);
            }
        } catch (error) {
            return res.status(500).json({ error: 'Error fetching users documents' });
        }
    } else if (type == 'add') {
        const existingUserDocu = await Document.findOne({
            userRefID: userRefID,
            docuName: docuName
        });
        if (existingUserDocu) {
            return res.status(400).json({ error: 'User\'s document already exists' });
        } else {
            try {
                const document = new Document({ userRefID, docuName });
                await document.save();
                return res.status(201).json(document);
            } catch (error) {
                return res.status(500).json({ error: 'Error creating user\'s document' });
            }
        }
    } else {
        return res.status(500).json({ error: 'Wrong input body' });
    }
}



   else if (req.method === 'DELETE'){
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