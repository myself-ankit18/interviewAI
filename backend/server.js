const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")

connectToDB();



app.listen(3000,()=>{
    console.log("ser");
}) 