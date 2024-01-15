import connectDB from '../../helper/mongodb';
import Document from '../../models/Document';
import { Pinecone } from '@pinecone-database/pinecone';

import Pages from '../../models/Pages'
import Mes from '../../models/Mes';
import Chat from '../../models/Chat'

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment:process.env.PINECONE_ENVIRONMENT,
  });
  

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
    try {
        const { docId, docName } = req.body;
    
        const index = pinecone.index('jotdown')
        // Delete embeddings from Pinecone
        await index.namespace(docName).deleteAll();

        // Delete the document
        const result = await Document.deleteMany({ docuId: docId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'No documents found with the specified docId' });
          }
    
       // get all chats for doc
        const chats = await Chat.find({ document: docId });
        //delete the chat and its messages
        for (const chat of chats) {
          const chatId = chat._id; // Assuming `_id` is the field that stores the chat ID
          // Delete the chat
          const deletedChat = await Chat.findByIdAndDelete(chatId);
          if (!deletedChat) {
            return res.status(404).json({ success: false, message: 'Chat not found' });
          }
        
          // Delete all associated messages
          const test = await Mes.deleteMany({ chatID: chatId });
        }
        console.log('deleted chats and messages')
    
    
        // Delete all pages associated with the document
        await Pages.deleteMany({ document: docId });
        console.log('deleted pages')
    
    
        res.status(200).json({ success: true, message: 'Document and related data deleted successfully' });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
      }
    }
}