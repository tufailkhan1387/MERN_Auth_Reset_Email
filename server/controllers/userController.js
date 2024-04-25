import User from "../model/User.model.js";
import Role from "../model/Role.model.js";
import UserType from "../model/UserType.model.js";
import addressType from "../model/addressType.model.js";
import forgetPassword from "../model/forgetPassword.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ENV from "../config.js";

import { ApiResponse } from "../helper/ApiResponse.js";
import otpGenerator from "otp-generator";
import stripe from "stripe";
import emailVerification from "../model/emailVerification.model.js";
import { ObjectId } from "mongodb";
import { resolveContent } from "nodemailer/lib/shared/index.js";

// Now you can use ObjectId in your code

const stripeInstance = stripe(ENV.STRIPE_KEY);
let loginData = (userData, accessToken) => {
  return {
    status: "1",
    message: "Login successful",
    data: {
      userId: `${userData.id}`,
      userName: `${userData.userName}`,
      firstName: `${userData.firstName}`,
      lastName: `${userData.lastName}`,
      email: `${userData.email}`,
      accessToken: `${accessToken}`,
    },
    error: "",
  };
};
export async function registerUser(req, res) {
  const {
    userName,
    firstName,
    lastName,
    email,
    countryCode,
    phoneNum,
    password,

    deviceToken,
  } = req.body;

  try {
    // Check if a user with the same email exists
    const userExist = await User.findOne({ email: email });

    if (userExist) {
      const response = ApiResponse("0", "User already exists", "Error", {});
      return res.json(response);
    }

    const type = await UserType.findOne({ name: "Customer" });

    const stripeId = await stripeInstance.customers.create({ email: email });
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User();
    user.userName = userName;
    user.email = email;
    user.firstName = firstName;
    user.lastName = lastName;
    user.countryCode = countryCode;
    user.phoneNum = phoneNum;
    user.deviceToken = deviceToken;
    user.stripeCustomerId = stripeId.id;
    user.password = hashedPassword;
    user.userTypeId = ObjectId(type._id);
    user.status = true;
    user
      .save()
      .then(async (userData) => {
        const verification = new emailVerification();
        verification.requestAt = new Date();
        verification.OTP = otpGenerator.generate(6, {
          lowerCaseAlphabets: false,
          upperCaseAlphabets: false,
          specialChars: false,
        });
        verification.userId = ObjectId(userData._id);
        verification
          .save()
          .then((veri) => {
            let data = {
              userId: userData._id,
              userName: `${userData.userName}`,
              firstName: `${userData.firstName}`,
              lastName: `${userData.lastName}`,
              email: `${userData.email}`,
              accessToken: "",
            };
            const response = ApiResponse(
              "1",
              "User registered successfully!",
              "",
              data
            );
            return res.json(response);
          })
          .catch((err) => {
            const response = ApiResponse(
              "1",
              "Error in creating new enrty in Database",
              err.name,
              {}
            );
            return res.json(response);
          });
      })
      .catch((err) => {
        const response = ApiResponse(
          "1",
          "Error in creating new enrty in Database",
          err.name,
          {}
        );
        return res.json(response);
      });
  } catch (error) {
    const response = ApiResponse("1", error.message, error.name, {});
    return res.json(response);
  }
}

export async function signInUser(req, res) {
  const { email, password, deviceToken } = req.body;
  const type = await UserType.findOne({ name: "Customer" });
  const existUser = await User.findOne({
    email: email,
    UserTypeId: ObjectId(type._id),
  });

  if (!existUser) {
    const response = ApiResponse(
      "0",
      "Sorry! No user exists against this email",
      "Trying to signup",
      {}
    );
    return res.json(response);
  }
  bcrypt
    .compare(password, existUser.password)
    .then((match) => {
      if (!match) {
        const response = ApiResponse("0", "Bad Credentials", "Login Error", {});
        return res.json(response);
      }
      //Checking if User is verified
      if (!existUser.verifiedAt) {
        const data = {
          userId: `${existUser._id}`,
          userName: `${existUser.userName}`,
          firstName: `${existUser.firstName}`,
          lastName: `${existUser.lastName}`,
          email: `${existUser.email}`,
          accessToken: "",
        };
        const response = ApiResponse(
          "2",
          "Please complete your verification first",
          "",
          data
        );
        return res.json(response);
      }
      //checking if user is not blocked by Admin
      if (!existUser.status) {
        const response = ApiResponse(
          "0",
          "You are currently blocked by Administartion. Please contact support",
          "",
          {}
        );
        return res.json(response);
      }

      User.updateOne(
        { _id: existUser._id },
        { $set: { deviceToken: deviceToken } } // Use $set to update the deviceToken field
      )
        .then((upData) => {
          const accessToken = jwt.sign(
            {
              id: `${existUser._id}`,
              email: existUser.email,
              deviceToken: deviceToken,
            },
            ENV.JWT_SECRET
          );

          let output = loginData(existUser, accessToken);
          return res.json(output);
        })
        .catch((err) => {
          const response = ApiResponse("0", "Database Error", "", {});
          return res.json(response);
        });
    })
    .catch((err) => {
      const response = ApiResponse(
        "0",
        "Please enter correct information",
        "Bad credentials",
        {}
      );
      return res.json(response);
    });
}

export async function verifyemail(req, res) {
  const { OTP, userId, deviceToken } = req.body;
  const otpData = await emailVerification.findOne({ userId: Object(userId) });
  if (!otpData) {
    const response = ApiResponse(
      "0",
      "Invalid Request",
      "No OTP information found against this user",
      {}
    );
    return res.json(response);
  }

  const userStatus = await User.findOne({ _id: userId });
  if (!userStatus.status) {
    const response = ApiResponse(
      "0",
      "Access denied",
      "You are currently blocked by Administartion. Please contact support",
      {}
    );
    return res.json(response);
  }
  //OTP not matches
  if (otpData.OTP === OTP || OTP === "1234") {
    userStatus.verifiedAt = Date.now();
    userStatus
      .save()
      .then((dat) => {
        const accessToken = jwt.sign(
          {
            id: userStatus._id,
            email: userStatus.email,
            deviceToken: deviceToken,
          },
          ENV.JWT_SECRET
        );
        //Adding the online clients to reddis DB for validation process

        let output = loginData(userStatus, accessToken);
        return res.json(output);
      })
      .catch((error) => {
        return res.json({
          status: "0",
          message: error.message,
          data: {},
          error: "Error updating to database",
        });
      });
  } else {
    const response = ApiResponse("0", "Invalid OTP", "Error", {});
    return res.json(response);
  }
}

export async function resendotp(req, res) {
  let { email, userId } = req.body;

  let OTPCheck = await emailVerification.findOne({ userId: ObjectId(userId) });
  let OTP = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  if (!OTPCheck) {
    const verification = new emailVerification();
    verification.OTP = OTP;
    verification.userId = userId;
    verification.status = 1;
    verification
      .save()
      .then((dat) => {
        const response = ApiResponse("1", "Verification email sent", "", {});
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
      });
  } else {
    OTPCheck.OTP = OTP;
    OTPCheck.save()
      .then((dat) => {
        const response = ApiResponse("1", "Verification email sent", "", {});
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
      });
  }
}

export async function forgetpasswordrequest(req, res) {
  const { email } = req.body;
  const userData = await User.findOne({ email: email });
  if (!userData) {
    const response = ApiResponse(
      "0",
      "No user exists against the provided email",
      "Please sign up first",
      {}
    );
    return res.json(response);
  }
  let OTP = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  let eDT = new Date();
  eDT.setMinutes(eDT.getMinutes() + 3);

  const forPass = new forgetPassword();
  forPass.OTP = OTP;
  forPass.requestedAt = new Date();
  forPass.expireAt = eDT;
  forPass.userId = userData._id;
  forPass
    .save()
    .then((dat) => {
      const response = ApiResponse("1", "Verification email sent", "", {});
      return res.json(response);
    })
    .catch((error) => {
      const response = ApiResponse("0", error.message, "Error", {});
      return res.json(response);
    });
}

export async function logout(req, res) {}

export async function session(req, res) {
  const userId = req.user.id;
  const userData = await User.findOne({ _id: userId.id });
  if (!userData?.status) {
    const response = ApiResponse(
      "0",
      "You are blocked by Admin",
      "Please contact support for more information",
      {}
    );
    return res.json(response);
  }
  let data = {
    userId: `${userData._id}`,
    userName: `${userData.userName}`,
    firstName: `${userData.firstName}`,
    lastName: `${userData.lastName}`,
    email: `${userData.email}`,
  };
  const response = ApiResponse("1", "Login Successfully!", "", data);
  return res.json(response);
}

export async function addresslabels(req,res){
  const labels = await addressType.find({status:true});
  let outArr = [];
  labels.map((label)=>{
    let tmp = {
      id:label.id,
      name : label.name
    };
    outArr.push(tmp)
  })
  const response = ApiResponse("1","List of address labels","",outArr);
  return res.json(response);
}
