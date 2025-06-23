import validator from 'validator'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import {v2 as cloudinary } from 'cloudinary'
import razorpay from 'razorpay'
import SSLCommerzPayment from 'sslcommerz-lts'

import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';

//API to register user

const userRegister = async (req,res) =>{

  try {
    const {email,name,password} = req.body;
    if(!name || !email || !password){
      return res.status(401).json({
        success:false,
        message:"Missing Details"
      })
    }

    if(!validator.isEmail(email)){
      return res.status(400).json({
        success:false,
        message:"Enter a valid email"
      })
    }

    if(password.length < 8){
      return res.json({
        success:false,
        message:"Password will be minimun 8 character"
      })
    }

    //hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password,salt);

    const userData = {
      name,
      email,
      password : hashPassword
    }

    const newUser = new userModel(userData);
    const user = await newUser.save()

    const token = jwt.sign({id:user._id}, process.env.JWT_SECRET)

    return res.status(200).json({
      success:true,
      message:"Registration complate successfully",
      token
    })


    
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}

//API for user login
const userLogin = async (req,res) =>{
  try {
    const {email,password} = req.body
    const user = await userModel.findOne({email});

    if(!user){
     return  res.status(404).json({
          success:false,
          message:"User does not exist!"
        });
    };

    const isPasswordMatch = await bcrypt.compare(password,user.password);

    if(isPasswordMatch){
      const token = jwt.sign({id:user._id},process.env.JWT_SECRET);
      res.status(200).json({
        success:true,
        message:"Login successfully!",
        token
      })
    }else{
      res.status(400).json({
        success:false,
        message:"Invalid credentials"
      })
    }


  } catch (error) {
    console.log(error);
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}

//API to get user profile data
const getProfileData = async(req,res) =>{
  try {

    // const {userId} = req.body; (get request pathaile body theke jayna)
    const {userId} = req;
    const userData = await userModel.findById(userId).select('-password')

    res.status(200).json({
      success:true,
      userData
    })

  } catch (error) {
    console.log(error)
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}

//API to update user profile
const updateUserProfile = async (req,res) =>{
  try {

    const {userId} = req
     const {name,phone,address,dob,gender} = req.body;
     const imageFile = req.file;

     if(!name || !phone || !dob || !gender){
      return res.status(401).json({
        success:false,
        message:"Data Missing"
      });
     };

     await userModel.findByIdAndUpdate(userId,{name,phone,address:JSON.parse(address),dob,gender})

     if(imageFile){
      const imageUpload = await cloudinary.uploader.upload(imageFile.path,{resource_type:"image"});

      const imageURL = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId,{image:imageURL});

     }

     res.status(200).json({
      success:true,
      message:"Profile Updated Successfully!"
     })





  } catch (error) {
    console.log(error)
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}

//API to book appointment
const bookAppointment = async (req,res) =>{
  try {

    const {userId} = req
    const {docId,slotDate,slotTime} = req.body

    const docData = await doctorModel.findById(docId).select('-password');

    if(!docData.available){
      return res.json({
        success:false,
        message:"Doctor not available!"
      })
    }
    let slots_booked = docData.slots_booked

    //checking for slot availablity
    if(slots_booked[slotDate]){
      if(slots_booked[slotDate].includes(slotTime)){
        return res.json({
        success:false,
        message:"Time slot not available!"
      })
      }else{
        slots_booked[slotDate].push(slotTime)
      }
    }else{
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime)
    }

    const userData = await userModel.findById(userId).select('-password');
    delete docData.slots_booked

    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount:docData.fees,
      slotTime,
      slotDate,
      date: Date.now()
    }

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save()

    //save new slots data in docData
    await doctorModel.findByIdAndUpdate(docId,{slots_booked});

    res.status(200).json({
      success:true,
      message:"Appointment Booked Successfully!"
    })




  } catch (error) {
    console.log(error)
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}

//API fo get user appointment
const listAppointment = async (req,res) =>{
  try {
    
    const {userId} = req
    const appointments = await appointmentModel.find({userId});

    res.status(200).json({
      success:true,
      appointments
    })

  } catch (error) {
    console.log(error)
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}

//API to cencel appointment
const cancelAppointment = async (req,res) =>{
  try {
    const { userId} = req 
    const {appointmentId} = req.body
    const appointmentData = await appointmentModel.findById(appointmentId);

    //verify appointment user
    if(appointmentData.userId !== userId){
      return res.status(401).json({
        success:false,
        message:"Unauthorized action"
      })
    }
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
    console.log(error)
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}





////////
const store_id = process.env.STORE_ID
const store_passwd = process.env.STORE_PASSWORD
const is_live = false


//API to make payment of appointment using razorpay
const OnlinePayment = async (req,res) =>{
  const {appointmentId} = req.body

  try {

    const appointmentData = await appointmentModel.findById(appointmentId)
    const tran_id = appointmentId
     const data = {
        total_amount: appointmentData.amount,
        currency: 'BDT',
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: `http://localhost:3000/api/user/payment/success/${tran_id}`,
        fail_url: 'http://localhost:3000/api/user/payment/fail',
        cancel_url: 'http://localhost:3000/api/user/payment/cancel',
        ipn_url: 'http://localhost:3000/api/user/payment/ipn',
        
    };
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
    sslcz.init(data).then(apiResponse => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL
        // res.redirect(GatewayPageURL)
        res.json({
          success:true,
          url:GatewayPageURL
        })

    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success:false,
      message:error.message
    })
  }


}

const handleSuccess = async (req,res) =>{
  const {tranId} = req.params;
  try {
    await appointmentModel.findByIdAndUpdate(tranId,{
      payment:true,
      message:"Payment successfull",
    });
    res.redirect('http://localhost:5173/my-appintments')

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}

const handleFail = async (req,res) =>{
  res.redirect('http://localhost:5173/failed')
}

export {userRegister,userLogin,getProfileData,updateUserProfile,bookAppointment,listAppointment,cancelAppointment,OnlinePayment,handleSuccess,handleFail}