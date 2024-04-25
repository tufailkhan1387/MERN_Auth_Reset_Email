import mongoose from "mongoose";

export const forgetPasswordSchema = new mongoose.Schema({
  name: {
    OTP: String,
  },
  requestedAt: {
    type: Date,
    default: true,
  },
  expireAt: {
    type: Date,
    default: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // This should match the model name you export for UserType
  },
  status: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.model.forgetPassword ||
  mongoose.model("forgetPassword", forgetPasswordSchema);
