import connectDB from '../../helper/mongodb';
import Mes from '../../models/Mes';
import Chat from '../../models/Chat'
import { middleware } from "../../middleware/middleware";
const { createClient } = require('@supabase/supabase-js');
// Create a single Supabase client for interacting with your database
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
    // get chats
    if (req.method === 'GET') {
        try {
          const { userID, document } = req.query;
          if (!userID || !document) {
            return res.status(400).json({ success: false, message: 'Missing userID or document' });
          }
    
          const chats = await Chat.find({ userID, document });
          res.status(200).json({ success: true, data: chats });
        } catch (error) {
          res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
      } 
///////////////////////////////////////////////////////////// create a new chat
      else if (req.method === 'POST') {
        try {
          const { userID, document, chatName } = req.body;
          if (!userID || !document || !chatName) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
          }
    
          const newChat = new Chat({ userID, document, chatName });
          const savedChat = await newChat.save();
          res.status(201).json({ success: true, data: savedChat });
        } catch (error) {
          res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
      } 
///////////////////////////////////////////////////////////// delete a given chat by chat id
else if (req.method === 'DELETE') {
        try {
          const { chatId } = req.query;
          
          // Delete the chat
          const deletedChat = await Chat.findByIdAndDelete(chatId);
          if (!deletedChat) {
            return res.status(404).json({ success: false, message: 'Chat not found' });
          }
    
          // Delete all associated messages
          await Mes.deleteMany({ chatID: chatId });

          // delete rows from supabase where chatid matches
          if (!chatId) {
              return res.status(400).send('chatId is required');
          }

          const { error } = await supabase
              .from('vector_embeddings')
              .delete()
              .eq('chat_id', chatId);

          if (error) {
              console.error('Error deleting rows:', error);
              return res.status(500).send('Failed to delete rows');
          }

          console.log('Rows deleted successfully from supabase');
    
          res.status(200).json({ success: true, message: 'Chat and associated messages deleted, and rows from supabase' });
        } catch (error) {
          res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
      } else {
        res.status(405).json({ success: false, message: 'Method Not Allowed' });
      }
}
}
