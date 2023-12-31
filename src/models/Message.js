import mongoose, {Schema} from "mongoose";

const messageSchema = new Schema(
  {
    userId: {
      type: String,
      ref: 'User',
      required: true,
    },
    chats: [
      {
        chatID:{
          type:String,
          required:true,
        },
        chatName:{
          type:String,
          required:true,
        },
        pdfId: {
          type: String,
          required: true,
        },
        userMessages: [String],
        botMessages: [String],
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Message =  mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message