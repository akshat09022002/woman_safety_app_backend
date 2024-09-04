const mongoose = require("mongoose");

const DBkey = "mongodb+srv://akshatkindle:Aisehi%401234@akbase.zt293q8.mongodb.net/wsapp";

mongoose.connect(DBkey);

const userSchema = new mongoose.Schema({
  name: { type: String },
  phoneNo: { type: Number },
  email: { type: String },
  password: { type: String },
  emergencyContacts: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User"},
  ],
  gender: { type: String },
  location: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true },
  },
  isHelping: { type: Boolean, default: false },
  helpList: [
    { type: mongoose.Schema.Types.ObjectId, ref: "HelpSession" },
  ],
});

userSchema.index({ location: "2dsphere" });

const helpSessionSchema = new mongoose.Schema({
    victimId: { type: String, required: true },
    name: { type: String},
    location: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
    acceptors: [{ 
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      acceptedAt: {type: Date },
      verified: { type: Boolean, default: false } 
    }],
    helpers: [{ 
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
      acceptedAt: Date 
    }],
    timestamp: { type: Date, default: Date.now },
    isClosed: { type: Boolean, default: false },
  });

  helpSessionSchema.index({ location: '2dsphere' });

const HelpSession = mongoose.model("HelpSession", helpSessionSchema);
const User = mongoose.model("User", userSchema);

module.exports = {
  HelpSession,
  User
};