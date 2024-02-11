import connectDB from '../../helper/mongodb';
import Document from '../../models/Document';
import { Pinecone } from '@pinecone-database/pinecone';
import { middleware } from "../../middleware/middleware";
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

  const result = await middleware(req);

  if (!result.success) {
    res.status(400).json({ success: false, message: result.message });
  } else {

  if (req.method === 'POST') {
    const { userRefID, docuName, type } = req.body;

    if (type == 'fetch') {
        try {
            const usersDocumentList = await Document.find({ userRefID: userRefID });
            if (usersDocumentList.length === 0) {
                return res.status(200).json({ message: 'Empty List' });
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
            return res.status(200).json({ message:'document already exists' });
        } else {
            try {
                const document = new Document({userRefID, docuName });
                await document.save();
                return res.status(201).json({message:'Doc added success',result:document});
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
        console.log('-----------------------------')
        // Delete the document
        const result = await Document.deleteMany({ docuId: docId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'No documents found with the specified docId' });
          }
        console.log('deleting pinecone')
        console.log(result)
        console.log('-----------------------------')
       // get all chats for doc
        const chats = await Chat.find({ document: docId });
        //delete the chat and its messages
        console.log('deleting Chat')
        for (const chat of chats) {
          const chatId = chat._id; // Assuming `_id` is the field that stores the chat ID
          // Delete the chat
          const deletedChat = await Chat.findByIdAndDelete(chatId);
          console.log(deletedChat)
          if (!deletedChat) {
            return res.status(404).json({ success: false, message: 'Chat not found' });
          }
        
          // Delete all associated messages
          const test = await Mes.deleteMany({ chatID: chatId });
          console.log("deleting chats messages")
          console.log(test)
        }
        console.log('deleted chats and messages')

        console.log('-----------------------------')
        console.log('deleting pages')
        // Delete all pages associated with the document
        const pagesDelete = await Pages.deleteMany({ document: docId });
        console.log(pagesDelete)
        
    
    
        res.status(200).json({ success: true, message: 'Document and related data deleted successfully' });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
      }
    }
  }
}

/**
 * 
 -----------------------------
deleting pinecone
{ acknowledged: true, deletedCount: 1 }
-----------------------------
deleting Chat, only has 1 chat, if more chats
{
  _id: new ObjectId('65a8896fc970f13a088d285f'),
  userID: [ 'auth0|65a4342b8dea5e613655d349' ],
  document: 'DOC1705543978488',
  chatName: 'what are the Ma',
  createdAt: 2024-01-18T02:14:07.093Z,
  updatedAt: 2024-01-18T02:14:07.093Z,
  __v: 0
}
deleting chats messages
{ acknowledged: true, deletedCount: 2 }
deleted chats and messages
-----------------------------
deleting pages
{ acknowledged: true, deletedCount: 22 }
 */