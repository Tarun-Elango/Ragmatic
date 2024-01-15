const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//messages
const pageSchema = new Schema({
    document: {
    type: String, // Reference to id document
    required: true
  },
  userID: {
    type: String, // Reference to User Auth0id
    required: true
  },
  PageNumber: {
    type: String, // Reference to pagenumber
    required: true
  },
  PageText: {
    type: String, // 'userMessage' or 'botMessage'
    required: true
  },
  embeddingsID: { // for pinecone relation
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

const Page = mongoose.models.Page || mongoose.model('Page', pageSchema);
module.exports = Page;
