import dotenv from "dotenv";
dotenv.config({path:"./env"});

import { connectDB } from "./db/index.js";
const port=process.env.PORT || 3000
connectDB()
.then(()=>{
    app.listen(port,()=>{
        log(`server is running on port: ${port}`);
    })
})
.catch((err)=>{
    console.log("MONGO db connection failed:",err);
})