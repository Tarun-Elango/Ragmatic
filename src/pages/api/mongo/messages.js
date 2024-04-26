import connectDB from '../../../helper/mongodb';
import Mes from '../../../models/Mes';
import { middleware } from "../../../middleware/middleware";

connectDB();
export const config = {
  api: {
    bodyParser: true,
  },
};

//messages, relate to mes
export default async function handler(req, res) {
  const result = await middleware(req);

  if (!result.success) {
    res.status(400).json({ success: false, message: result.message });
  } else {
    // get chats messages, all chat messages from a chat id
    if (req.method === 'GET') {
        
        try {
          const { chatID } = req.query;
          
          if (!chatID) {
            console.log('all fields not present')
            return res.status(400).json({ success: false, message: 'Missing chatID' });
          }
          console.log(`getting messages for chat: ${chatID}`)
    
          const messages = await Mes.find({ chatID });
          const userMessages = messages.filter(msg => msg.messageType === 'userMessage');
          const botMessages = messages.filter(msg => msg.messageType === 'botMessage');
    
          console.log('found messages and returning')
          res.status(200).json({ 
            success: true, 
            data: { userMessages, botMessages } 
          });
        } catch (error) {
          console.log('there was an error', error)
          res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
      } 

      // create a new message, has the chatid, user, message type ai or user, text
      else if (req.method === 'POST') {
        try {
          const { chatID, userID, messageType, content } = req.body;
          if (!chatID || !userID || !messageType || !content) {
            console.log('all fields not present')
            return res.status(400).json({ success: false, message: 'Missing required fields' });
          }
          
          console.log(`creating new mesage for user ${userID} for chat ${chatID} and message type ${messageType}`)
          const newMessage = new Mes({ chatID, userID, messageType, content });
          const savedMessage = await newMessage.save();
          console.log('message created')
          res.status(201).json({ success: true, data: savedMessage });
        } catch (error) {
          console.log('there was an error')
          res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
      } else {
        res.status(405).json({ success: false, message: 'Method Not Allowed' });
      }
    }
}
