

const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use("/", (req, res, next) => {
  res.send("Working");
})

mongoose.connect("")
.then(()=> console.log("Connected to MongoDB"))
.then(() => {
  app.listen(5000);
}).catch((err) => console.log(err));