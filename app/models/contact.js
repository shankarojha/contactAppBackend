"use-strict";

const mongoose = require("mongoose");

let contactSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: "",
    required: true,
    index: true,
  },

  contactName: {
    type: String,
    required: true,
    index: true,
    default:''
  },

  dob: {
    type: Date,
    default: Date.now(),
  },

  imageName: {
    type: String,
    default: "",
  },

  imagePath: {
    type: String,
    default: "",
  },

  mobile: {
    type: Number,
  },

  email: {
    type: String,
  },

  joinedOn: {
    type: Date,
    default: Date.now(),
  },

  password: {
    type: String,
    default: "contactGroupPassword123",
  },

  socialLoginFlag: {
    type: Boolean,
    default: false,
  },

  localLoginFlag: {
    type: Boolean,
    default: false,
  },
});

mongoose.model("Contact", contactSchema);


