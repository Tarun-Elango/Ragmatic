const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//messages
const mesSchema = new Schema({
  chatID: {
    type: Schema.Types.ObjectId, // Reference to Chat document
    required: true
  },
  userID: {
    type: String, // Reference to User Auth0id
    required: true
  },
  messageType: {
    type: String, // 'userMessage' or 'botMessage'
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Mes = mongoose.models.Mes || mongoose.model('Mes', mesSchema);
module.exports = Mes;
