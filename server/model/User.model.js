import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, "Please provide unique Username"],
    unique: [true, "Username Exist"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    unique: false,
  },

  email: {
    type: String,
    required: [true, "Please provide a unique email"],
    unique: true,
  },
  firstName: { type: String },
  lastName: { type: String },
  deviceToken: { type: String },
  countryCode: { type: String },
  phoneNum: { type: String },
  address: { type: String },
  profile: { type: String },
  stripeCustomerId: { type: String },
  verifiedAt: { type: Date },
  status: { type: Boolean },
  userTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserType", // This should match the model name you export for UserType
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role", // This should match the model name you export for UserType
  },
});


export default mongoose.model.Users || mongoose.model("User", UserSchema);
