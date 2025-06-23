import express from 'express';
import { addDoctor,adminDashboard,appointmentCancel,appointmentsAdmin,deleteDoctorData,getAllDoctors,loginAdmin } from '../controllers/adminController.js';
import uplaod from '../middlewares/multer.js';
import authAdmin from '../middlewares/authAdmin.js';
import { changedAvailablity } from '../controllers/doctorController.js';



const adminRouter = express.Router()

adminRouter.post('/all-doctor',authAdmin,getAllDoctors)
adminRouter.post('/add-doctor',authAdmin,uplaod.single('image'),addDoctor)
adminRouter.post('/login',loginAdmin)
adminRouter.post('/changed-availability',authAdmin,changedAvailablity);
adminRouter.get('/appointments',authAdmin,appointmentsAdmin);
adminRouter.post('/cancel-appointment',authAdmin,appointmentCancel);
adminRouter.get('/dashboard',authAdmin,adminDashboard);
adminRouter.delete('/delete-doctor',authAdmin,deleteDoctorData);

export default adminRouter