import validator from 'validator'
import bcrypt from 'bcrypt'
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'
import userModel from '../models/userModel.js'



// API to get all doctors list for admin dashboard
const getAllDoctors = async (req,res)=>{
  try {
    const doctors = await doctorModel.find({}).select('-password')
    res.status(200).json({
      success:true,
      doctors
    })
  } catch (error) {
    console.log(error);
    res.status(404).json({
      success:false,
      message:error.message
    })
  }
}

// API for adding doctor
const addDoctor = async(req,res)=>{
  try {
    const {name,email,password,speciality,degree,experience,about,fees,address} = req.body;
    const imageFile = req.file;
    
    if(!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address)
      return res.status(403).json({
        success:false,
        message:"Missing details",      
    })
    if(!validator.isEmail(email)){
      return res.status(400).json({
        success:false,
        message:"Please enter a valid email"
      })
    }
    if(password.length < 8){
       return res.status(400).json({
        success:false,
        message:"Password should be minimum 8 character"
      })
    }

    const existingDoctor = await doctorModel.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // hasing doctor password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password,salt)

    //upload image to cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path,{resource_type:"image"})
    const imageUrl = imageUpload.secure_url;

    const doctorData = {
      name,
      email,
      image:imageUrl,
      password:hashPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address:JSON.parse(address),
      date:Date.now()
    }

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    res.status(200).json({
      success:true,
      message:"Doctor added successfully!"
    })


  } catch (error) {
    console.log(error);
    res.status(404).json({
      success:false,
      message:error.message
    })
  }
}

// API for admin Login
const loginAdmin = async(req,res) =>{
  try {
    const {email,password} = req.body;

    if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
      const token = jwt.sign(email+password,process.env.JWT_SECRET);
      res.json({
        success:true,
        message:"Login Successfully",
        token
      })
    }else{
      res.json({
        success:false,
        message:"Invalid credentials"
      })
    }


  } catch (error) {
    console.log(error);
    res.status(404).json({
      success:false,
      message:error.message
    })
  }
}

//API to get all appointments list
const appointmentsAdmin = async (req,res) =>{
  try {
    
    const appointments = await appointmentModel.find({})

    res.status(200).json({
      success:true,
      appointments
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}


//API to Canceled  appointments
const appointmentCancel = async (req,res) =>{
  try {
    
        const {appointmentId} = req.body
        const appointmentData = await appointmentModel.findById(appointmentId);
    
      
        await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})
    
        // releasing doctor slot
    
        const {docId,slotDate,slotTime} = appointmentData;
        const doctorData = await doctorModel.findById(docId);
        let slots_booked = doctorData.slots_booked
    
        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
    
        await doctorModel.findByIdAndUpdate(docId,{slots_booked});
    
        res.status(200).json({
          success:true,
          message:"Appoointment Cancelled"
        })
    
  } catch (error) {
      console.log(error);
      res.status(500).json({
      success:false,
      message:error.message
    }) 
  }
}

//API to get dashboard data for admin panel
const adminDashboard = async (req,res) =>{
  try {
    const doctors =await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});

    const dashData = {
      doctors:doctors.length,
      appointments: appointments.length,
      patients: users.length,
      latestAppointments: appointments.reverse().slice(0,5)
    }
    res.status(200).json({
      success:true,
      dashData
    })

  } catch (error) {
      console.log(error);
      res.status(500).json({
      success:false,
      message:error.message
    }) 
  }
}

//API to Delete doctor data from db
const deleteDoctorData = async (req,res) =>{
  try {
    const {docId} = req.body
    const deleteDoctor = await doctorModel.findByIdAndDelete(docId);
    if(!deleteDoctor){
      return res.status(404).json({
        success:false,
        message:"Data Not Found!"
      })
    };

    res.status(200).json({
      success:true,
      message:"Doctor Data Delete Successfully"
    })

  } catch (error) {
     console.log(error);
      res.status(500).json({
      success:false,
      message:error.message
    }) 
  }
}


export {getAllDoctors,addDoctor,loginAdmin,appointmentsAdmin,appointmentCancel,adminDashboard,deleteDoctorData}