const express = require("express");
const userRoute = require("./Routes/userRoute");
const connectDB = require("./Configuration/connectDB");

var cors = require("cors");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

const port = process.env.PORT;
connectDB();
app.use(cors());

app.listen(port, (er) => {
  if (er) {
    console.log(er);
  } else {
    console.log(`server is running on port ${port}`);
  }
});

app.use(express.json());
app.use("/api", userRoute);
