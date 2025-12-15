const jwt = require("jsonwebtoken");

const auth = ( req,res,next) => {
    //Checked the token 
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer")){
        res.status(401).json({success:false, message: "Authozation token required!!"});
    }

    //extract the token from the authheader
    const token = authHeader.split(" ")[1];

    //Verify the token
    try {
        const decodedUser = jwt.verify(token,process.env.JWT_KEY);
        req.user = decodedUser;
        next();
    }catch(error){
        console.log(error);
        res.status(401).json({success:false, message: "Invalid token!!"});
    }
    

};

module.exports = auth;