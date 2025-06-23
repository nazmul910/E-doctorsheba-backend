import doctorModel from "../models/doctorModel.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js";




const changedAvailablity = async (req,res) =>{
  try {
    
    const {docId} = req.body;

    const docData = await doctorModel.findById(docId);
    await doctorModel.findByIdAndUpdate(docId,{available: !docData.available});
    res.status(200).json({
      success:true,
      message:"Available Changed!"
    })

  } catch (error) {
    console.log(error);
    res.status(400).json({
      success:false,
      message:error.message
    })
  }
}

const doctorList = async(req,res)=>{
  try {
    const doctors = await doctorModel.find({}).select(['-password','-email']);
    res.status(200).json({
      success:true,
      doctors
    })
  } catch (error) {
    console.log(error)
    res.json({
      success:false,
      message:error.message
    })
  }
}



//API for doctor login
const loginDoctor = async (req,res) =>{
  try {
    const {email,password} = req.body;
    const doctor = await doctorModel.findOne({email});
    if(!doctor){
      return res.status(404).json({
        success:false,
        message:"Invalid credentials!"
      })
    };

    const isMatch = await bcrypt.compare(password, doctor.password)

    if(isMatch){
      const token = jwt.sign({id:doctor._id},process.env.JWT_SECRET);
      res.json({
        success:true,
        token
      })
    }else{
      res.json({
        success:false,
        message:"Invalid credentials!"
      })
    };


  } catch (error) {
    console.log(error)
    res.json({
      success:false,
      message:error.message
    })
  }
}


//API to get doctor appointments for  doctor dashboard
const appointmentsDoctor = async (req,res) =>{
  try {
    const {docId} = req;
    const appointments = (await appointmentModel.find({docId})).reverse();
    res.status(200).json({
      success:true,
      appointments
    })
  } catch (error) {
    console.log(error)
      res.json({
       success:false,
       message:error.message
    })
  }
}


//API to mark appointment completed for doctor dashboard
const appointmentComplete = async (req,res) =>{
  try {
   
    const {appointmentId} = req.body;

    const appintmentData = await appointmentModel.findById(appointmentId);

    if(appintmentData ){
      await appointmentModel.findByIdAndUpdate(appointmentId,{isCompleted:true})

      return res.status(200).json({
        success:true,
        message:"Appointment Completed"
      })
    }else{
      return res.status(403).json({
        success:false,
        message:"Mark Failed"
      })
    }
  } catch (error) {
    console.log(error)
      res.json({
       success:false,
       message:error.message
    })
  }
}

//API to cancel appointment completed for doctor dashboard
const appointmentCancel = async (req,res) =>{
  try {
 
    const {appointmentId} = req.body;

    const appintmentData = await appointmentModel.findById(appointmentId);

    if(appintmentData ){
      await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})

      return res.status(200).json({
        success:true,
        message:"Appointment Cancelled"
      })
    }else{
      return res.status(403).json({
        success:false,
        message:"Cancellation Failed"
      })
    }
  } catch (error) {
    console.log(error)
      res.json({
       success:false,
       message:error.message
    })
  }
}

//API to get dashboard data for doctor dashboard
const doctorDashboard = async (req,res) =>{
  try {
    
    const {docId}= req
    const appointments = await appointmentModel.find({docId});
    let earnings = 0

    appointments.map((item) =>{
      if(item.isCompleted || item.payment){
        earnings += item.amount
      }
    });

    let patients = []

    appointments.map((item) =>{
      if(!patients.includes(item.userId)){
        patients.push(item.userId);
      }
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.reverse().slice(0,5)
    };

    res.status(200).json({
      success:true,
      dashData
    })


  } catch (error) {
    console.log(error)
      res.json({
       success:false,
       message:error.message
    })
  }
}


//API to get doctor profile for doctor dashboard
const getDoctorProfile = async(req,res) =>{
  try {
    const {docId} = req;
    const profileData = await doctorModel.findById(docId).select('-password');

    res.status(200).json({
      success:true,
      profileData
    })

  } catch (error) {
    console.log(error)
      res.json({
       success:false,
       message:error.message
    })
  }
}

//API to update doctor data from doctor dashboard
const updateDoctorProfile = async (req,res) =>{
  try {
    const {docId} = req;
    const {fees,address,available} = req.body;
    await doctorModel.findByIdAndUpdate(docId,{fees,address,available})
    res.status(200).json({
      success:true,
      message:"Prfile Updated Successfully!"
    })
  } catch (error) {
    console.log(error)
      res.json({
       success:false,
       message:error.message
    })
  }
}


export {changedAvailablity,doctorList,loginDoctor,appointmentsDoctor,appointmentComplete,appointmentCancel,doctorDashboard,getDoctorProfile,updateDoctorProfile} 