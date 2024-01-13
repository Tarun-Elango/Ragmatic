import connectDB from '../../helper/mongodb';
import Mes from '../../models/Mes';
import Chat from '../../models/Chat'

connectDB();
export const config = {
  api: {
    bodyParser: true,
  },
};


export default async function handler(req, res) {
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
/////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////
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
    
          res.status(200).json({ success: true, message: 'Chat and associated messages deleted' });
        } catch (error) {
          res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
      } else {
        res.status(405).json({ success: false, message: 'Method Not Allowed' });
      }
    
}
