import connectDB from '../../helper/mongodb';
import Mes from '../../models/Mes';
import Chat from '../../models/Chat'

connectDB();
export const config = {
  api: {
    bodyParser: true,
  },
};

//messages, relate to mes
export default async function handler(req, res) {
    // get chats messages
    if (req.method === 'GET') {
        
        try {
          const { chatID } = req.query;
          
          if (!chatID) {
            return res.status(400).json({ success: false, message: 'Missing chatID' });
          }
    
          const messages = await Mes.find({ chatID });
          const userMessages = messages.filter(msg => msg.messageType === 'userMessage');
          const botMessages = messages.filter(msg => msg.messageType === 'botMessage');
    
          res.status(200).json({ 
            success: true, 
            data: { userMessages, botMessages } 
          });
        } catch (error) {
          res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
      } 


      else if (req.method === 'POST') {
        try {
          const { chatID, userID, messageType, content } = req.body;
          if (!chatID || !userID || !messageType || !content) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
          }
          
          const newMessage = new Mes({ chatID, userID, messageType, content });
          const savedMessage = await newMessage.save();
          res.status(201).json({ success: true, data: savedMessage });
        } catch (error) {
          res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
      } else {
        res.status(405).json({ success: false, message: 'Method Not Allowed' });
      }
}