import mongoose from "mongoose";

export const UserTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide UserType name"],
    unique: [true, "UserType Exist"],
  },
  status: {
    type: Boolean,
   default:true
  }
});

export default mongoose.model.UserType || mongoose.model("UserType", UserTypeSchema);
