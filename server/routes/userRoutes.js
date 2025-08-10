import express from "express";
import { auth } from "../Middlewares/auth.js";
import { getPublishedCreations, getUserCreations, togglelikecreation } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post('/get-user-creations', auth, getUserCreations);
userRouter.post('/get-published-creations', auth, getPublishedCreations);
userRouter.post('/toggle-like-creation', auth, togglelikecreation);

export default userRouter;