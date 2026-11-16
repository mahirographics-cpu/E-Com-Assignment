const dns = require("dns");
const mongoose = require("mongoose");


try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Create a .env file (see .env.example).");
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected:", mongoose.connection.host);
}

module.exports = connectDB;