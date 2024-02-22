import mongoose, {Schema} from "mongoose";
// a doc for each chat
const chatSchemaV2 = new Schema({
    userID: {
      type: String, // Reference to User auth0id
      required: true
    },
    document: [{
        type: String, // Reference to Document id
        required: true
    }],
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
  
  const ChatV2 = mongoose.models.ChatV2 || mongoose.model('ChatV2', chatSchemaV2);
  module.exports = ChatV2;
  