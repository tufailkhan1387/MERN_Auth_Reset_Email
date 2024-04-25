import jwt from "jsonwebtoken";
import ENV from "../config.js";
import { ApiResponse } from "../helper/ApiResponse.js";

/** auth middleware */
export default async function Auth(req, res, next) {
  try {
    const acccessToken = req.header("accessToken");

    if (!acccessToken) throw new Error();

    const validToken = jwt.verify(acccessToken, ENV.JWT_SECRET);
    if (validToken) {
        req.user = validToken;
      next();
    } else {
        const response = ApiResponse("0","Access Denied","Error",{});
        return res.json(response)
    }
  } catch (error) {
    const response = ApiResponse("0","Access Denied","Error",{});
    return res.json(response);
  }
}
