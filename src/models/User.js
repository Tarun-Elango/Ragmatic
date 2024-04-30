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
        auth0id: {
          type: String,  // Change the type based on the type of IDs you expect from Auth0
          required:true,
        },
        createdAt: {
          type: String,  // Change the type to String
          default: () => new Date().toISOString(), // Use a function to set the default value to the current date as a string
        },
        updatedAt: {
          type: String,
          default: () => new Date().toISOString(),
        },
        tier: {
          type: String,
          required: true
        },
      },
    {
        timestamps: true
    }
)

const User = mongoose.models.User  || mongoose.model("User", userSchema)

export default User