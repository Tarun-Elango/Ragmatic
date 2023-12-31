import connectDB from '../../helper/mongodb';
import Message from '../../models/Message';

connectDB();
export const config = {
  api: {
    bodyParser: true,
  },
};


export default async function handler(req, res) {
  // get all of the users messages
  if (req.method === 'GET') {
    const { userId } = req.query;
    console.log(userId)
      try {
          const usersMessageObject = await Message.findOne({userId})
          res.status(200).json(usersMessageObject);
      } catch (error) {
        res.status(500).json({ error: 'Error fetching users messages' });
      }
    } 
    
  
  // add a message, modify a chat message
  else if (req.method === 'PATCH'){
      const customHeaderValue = req.headers['task'];
      const { userId, chatID, pdfId, chatName, userMessage, botMessage, arrayIndex } = req.body;
      
      try {
        if (customHeaderValue === 'add') {
          const existingUser = await Message.findOne({ userId });
          if (!existingUser) {
            // Scenario 1: User is new, create a new message object
            const newUserMessage = new Message({
              userId,
              chats: [
                {
                  chatID,
                  chatName,
                  pdfId,
                  userMessages: [userMessage],
                  botMessages: [botMessage],
                },
              ],
            });

            await newUserMessage.save();
            res.status(201).json({ success: true, message: 'New user and chat created.' });
          }

          else {
            // Scenario 2: User already exists
            const existingChat = existingUser.chats.find((chat) => chat.chatID === chatID);

            if (existingChat) {
              // Scenario 3: User has an existing chat, add messages to the existing array
              existingChat.userMessages.push(userMessage);
              existingChat.botMessages.push(botMessage);
            } else {
              // User has a message object, but no existing chat, create a new sub chat object
              existingUser.chats.push({
                chatID,
                chatName,
                pdfId,
                userMessages: [userMessage],
                botMessages: [botMessage],
              });
            }

            await existingUser.save();
            res.status(201).json({ success: true, message: 'New chat created or messages added to existing chat.' });
          }  
        } 

        else if (customHeaderValue === 'modify') {
          const usersMessageObject = await Message.findOne({userId})

            if (userId, chatID, arrayIndex != undefined){
              const currentChat = usersMessageObject.chats.find(chat => chat.chatID === chatID); // find the current users chat 

              if (currentChat){
                const userMessages = currentChat.userMessages; // Access userMessages directly from currentChat
                const botMessages = currentChat.botMessages; // Access botMessages directly from currentChat

                if (userMessages.length > arrayIndex && botMessages.length > arrayIndex) {
                  userMessages.splice(arrayIndex);
                  botMessages.splice(arrayIndex);
                }
                await usersMessageObject.save();
                return res.status(200).json({ message: 'Messages modified successfully.' });
              }
              else{
                return res.status(200).json({ message: 'Current user chat config is not present.' });
              }
            }
            else {
              res.status(200).json({ error: 'input parameters dont match' });
            }
        } 
        else {
            // Handle unknown endpoints
            res.status(404).json({ error: 'Endpoint not found' });
        }

      } catch (error){
      res.status(500).json({ error: 'Error patching user message' });
      }
  }
  
  // delete a particular users chat object
  else if (req.method === 'DELETE'){
      const { userId, chatID} = req.body;
      try {
        const updatedUser = await Message.findOneAndUpdate(
          { userId },
          { $pull: { chats: { chatID: chatID } } },
          { new: true }
        );
      
        if (updatedUser) {
          return res.status(200).json({ message: 'Chat deleted successfully.' });
        } else {
          return res.status(404).json({ error: 'User not found.' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Error fetching users messages' });
      }
   }

}
