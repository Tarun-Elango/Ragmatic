import mongoose, {Schema} from "mongoose";

const userSchema = new Schema (
    {
        username: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
          unique: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        messageId: {
          type: Schema.Types.ObjectId,
          ref: "Message",
        },
      },
    {
        timestamps: true
    }
)

const User = mongoose.models.User  || mongoose.model("User", userSchema)

export default User