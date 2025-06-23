import express from 'express'
import { appointmentsDoctor, doctorList, loginDoctor,appointmentComplete,appointmentCancel, doctorDashboard, getDoctorProfile, updateDoctorProfile } from '../controllers/doctorController.js';
import authDoctor from '../middlewares/authDoctor.js';

const doctorRouter = express.Router();

doctorRouter.get('/list',doctorList)
doctorRouter.post('/login',loginDoctor)
doctorRouter.get('/appointmetns',authDoctor,appointmentsDoctor)
doctorRouter.post('/complete-appointment',authDoctor,appointmentComplete);
doctorRouter.post('/cancel-appointment',authDoctor,appointmentCancel);
doctorRouter.get('/dashboard',authDoctor,doctorDashboard);
doctorRouter.get('/profile',authDoctor,getDoctorProfile);
doctorRouter.post('/update-profile',authDoctor,updateDoctorProfile)

export default doctorRouter; 