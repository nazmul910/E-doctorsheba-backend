import mongoose from 'mongoose';

const connectDB = async()=>{
  mongoose.connection.on('connected',()=> console.log("Database Connected"));
  await mongoose.connect(`${process.env.MONGODB_URI}/e-doctorsheba`); //eikhane /e-doctorsheba dara database ei name toiri hobe tai dewya hoyeche
}

export default connectDB; 