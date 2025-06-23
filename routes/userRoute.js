import express from 'express';
import { bookAppointment, cancelAppointment, getProfileData, handleFail, handleSuccess, listAppointment, OnlinePayment, updateUserProfile, userLogin, userRegister } from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';
import uplaod from '../middlewares/multer.js';


const userRouter = express.Router();


userRouter.post('/register',userRegister)
userRouter.post('/login',userLogin)

userRouter.get('/get-profile',authUser,getProfileData)
userRouter.post('/update-profile',uplaod.single('image'),authUser,updateUserProfile)

userRouter.post('/book-appointment',authUser,bookAppointment);
userRouter.get('/appointments',authUser,listAppointment);
userRouter.post('/cancel-appointment',authUser,cancelAppointment);
userRouter.post('/online-payment',authUser,OnlinePayment);
userRouter.post('/payment/success/:tranId',handleSuccess);
userRouter.post('/payment/fail',handleFail);

export default userRouter;