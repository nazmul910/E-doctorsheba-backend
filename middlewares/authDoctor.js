 import jwt from 'jsonwebtoken'
 
 const authDoctor = async (req,res,next) =>{
   try {
     const {dtoken} = req.headers
     if(!dtoken){
       return res.json({
         success:false,
         message:"Not Authorized Login Again"
       });
     }
 
     const token_decode = jwt.verify(dtoken,process.env.JWT_SECRET)
 
    //  req.body.userId = token_decode.id (get request pathaile body theke jayna)
     req.docId = token_decode.id
 
     next()
 
   } catch (error) {
     console.log(error);
     res.status(500).json({
       success:false,
       message:error.message
     })
   }
 }
 
 export default authDoctor