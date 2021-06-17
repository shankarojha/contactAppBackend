const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const appConfig = require("../../config/config");
const app = require("../../app");
const multerMiddleware = require("../middlewares/multer");
const contactController = require("../controllers/contactController");

module.exports.setRouter = (app) => {
  let baseUrl = `${appConfig.apiVersion}`;

  // define routes

  app.post(
    `/signup`,
    multerMiddleware.upload.single("image"),
    contactController.signup
  );

  app.post(`/login`, contactController.login);

  app.put(`/editcontact/:email`, multerMiddleware.upload.single("image"), contactController.editContact)

  app.get(`/getContacts`,contactController.getAllContacts)

  app.get(`/searchContact/:text/search`, contactController.searchContact)
};
