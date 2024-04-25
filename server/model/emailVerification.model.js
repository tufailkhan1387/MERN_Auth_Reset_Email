import mongoose from "mongoose";

export const emailVerificationsSchema = new mongoose.Schema({
  requestedAt: {
    type: Date
  },
  OTP: {
    type: String,
    unique: [true, "OTP Exist"],
  },
  status: {
    type: Boolean,
    default: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // This should match the model name you export for UserType
  },
});
export default mongoose.model.emailVerification ||
  mongoose.model("emailVerification", emailVerificationsSchema);
