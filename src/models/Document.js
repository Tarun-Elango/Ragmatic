import mongoose, {Schema} from "mongoose";

const documentSchema = new Schema(
  {
    docuId: {
        type: String,
        default: function () {
          return 'DOC' + Date.now();
        },
        required: false,
      },
    userRefID:{
      type:String,
      required:true,  
    }, // the id of the user this belongs to
    docuName: {
      type:String, 
      required:true
    }
  },
  {
    timestamps: true,
  }
);

const Document =  mongoose.models.Document || mongoose.model('Document', documentSchema);

export default Document