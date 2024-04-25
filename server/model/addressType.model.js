import mongoose from "mongoose";

export const addressTypeSchema = new mongoose.Schema({
  name: {
    type: String,
   
  },
  status: {
    type: Boolean,
   default:true
  }
});

export default mongoose.model.addressType || mongoose.model("addressType", addressTypeSchema);
