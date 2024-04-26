import connectDB from '../../../helper/mongodb';
import Mes from '../../../models/Mes';
import ChatV2 from '../../../models/ChatV2'
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
    // get chats by user and document choosen
    if (req.method === 'GET') {
        try {
          const { userID } = req.query;
          
          if (!userID) {
            console.log('All fields not present for chat get')
            return res.status(400).json({ success: false, message: 'Missing userID or document' });
          }
          console.log('Request to get chats for :', userID)
          const chats = await ChatV2.find({ userID });
          console.log("returning Chats back to client")
          res.status(200).json({ success: true, data: chats });
        } catch (error) {
          console.log("there was an error",error)
          res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
      } 
///////////////////////////////////////////////////////////// create a new chat for user, selected document and a given name
      else if (req.method === 'POST') {
        try {
          const { userID,  chatName } = req.body;
          
          if (!userID ||  !chatName) {
            console.log("all fields not present for chat post")
            return res.status(400).json({ success: false, message: 'Missing required fields' });
          }
          console.log(`${userID} wants to create a new chat with name ${chatName}`)
          const document = ["none"]
          const newChat = new ChatV2({ userID, document, chatName });
          const savedChat = await newChat.save();
          console.log("chat saved and returning new chat back to client")
          res.status(201).json({ success: true, data: savedChat });
        } catch (error) {
          console.log("there was an error",error)
          res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
      } 
///////////////////////////////////////////////////////////// delete a given chat by chat id
else if (req.method === 'DELETE') {
        try {
          const { chatId } = req.query;

          if (!chatId) {
            console.log("all fields not present for chat delete")
            return res.status(400).send('chatId is required');
          }

          console.log(`${chatId} is requested to be deleted`)
          // Delete the chat
          const deletedChat = await ChatV2.findByIdAndDelete(chatId);
          if (!deletedChat) {
            console.log(`${chatId} not found`)
            return res.status(404).json({ success: false, message: 'Chat not found' });
          }
          console.log('deleted all chats')
    
          // Delete all associated messages
          await Mes.deleteMany({ chatID: chatId });
          console.log(`deleted all messages related to chat ${chatId}`)

          // delete rows from supabase where chatid matches
          const { error } = await supabase
              .from('vector_embeddings')
              .delete()
              .eq('chat_id', chatId);
          if (error) {
              console.error('Error deleting rows from supabase for chatvector:', error);
              return res.status(500).send('Failed to delete rows');
          }

          console.log('Rows deleted successfully from supabase');
    
          res.status(200).json({ success: true, message: 'Chat and associated messages deleted, and rows from supabase' });
        } catch (error) {
          console.log("there was an error",error)
          res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
      } else {
        res.status(405).json({ success: false, message: 'Method Not Allowed' });
      }
    }
}
