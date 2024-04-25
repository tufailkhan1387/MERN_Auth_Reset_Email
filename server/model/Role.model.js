import mongoose from "mongoose";

export const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide Role name"],
    unique: [true, "Role Exist"],
  },
  status: {
    type: Boolean,
   default:true
  }
});

export default mongoose.model.Role || mongoose.model("Role", RoleSchema);
