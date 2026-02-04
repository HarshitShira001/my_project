import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

/* ================= TOKEN GENERATOR ================= */

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

/* ================= REGISTER ================= */

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }

  const user = await User.create({
    fullName,
    email,
    password,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

/* ================= LOGIN ================= */

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true, // ⚠️ false in localhost
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

/* ================= LOGOUT ================= */

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: { refreshToken: undefined },
  });

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

/* ================= REFRESH TOKEN ================= */

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedToken._id);

  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user._id);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access token refreshed"
      )
    );
});

/* ================= EXPORTS ================= */
const changeCurrentPassword = asyncHandler(async (req,res) => {
  const {oldPassword,newPassword,confirmpassword} = req.body

  if(!oldPassword || !newPassword || !confirmpassword){
    throw new ApiError(400, "All fields are required")
  }
  const user = await User.findById(req.user?.id)
  user.isPasswordCorrect(oldPassword)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid old password") 
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})
    return res.status(200).json(new ApiError(200, {}, "Password changed successfully"));
})

const getCurrentUser = asyncHandler(async(req,res) => {
  return res.status(200).json(new ApiResponse(200,req.user,"Current User Fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) => {
  const {fullName,email} = req.body
  if(!fullName || !email){
    throw new ApiError(400, "Fullname and email are required")
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email
      }
    },
    {new: true, runValidators: true}
).select("-password -refreshToken")

return res.status(200).json(new ApiResponse(200,updatedUser,"User details updated successfully"))
})

const updateUserAvator = asyncHandler(async(req,res) => {
  const avatorLocalPath = req.file?.path 
  if(!avatorLocalPath){
    throw new ApiError(400, "Avator image is required")
  } 
  uploadOnCloudinary(avatorLocalPath)
    if(avatar.url){
      throw new ApiError(400, "Avator upload failed")
    }
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
  const coverImageLocalPath = req.file?.path 
  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover image is required")
  } 
  uploadOnCloudinary(coverImageLocalPath)
    if(coverImage.url){
      throw new ApiError(400, "Cover image upload failed")
    }
})


await User.findByIdAndUpdate(
      req.user?._id,
      { $set: { avatar: avatar.url } },
      { new: true, runValidators: true }
    ).select("-password")



export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvator
};
