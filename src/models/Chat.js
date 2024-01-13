import mongoose, {Schema} from "mongoose";
// a doc for each chat
const chatSchema = new Schema({
    userID: [{
      type: String, // Reference to User auth0id
      required: true
    }],
    document: {
      type: String, // Reference to Document id
      required: true 
    },
    chatName: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });
  
  const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
  module.exports = Chat;
  