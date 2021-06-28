const mongoose = require("mongoose");
const shortid = require("shortid");
const time = require("../libs/timeLib");
const response = require("../libs/responseLib");
const logger = require("../libs/loggerLib");
const token = require("../libs/tokenLib");
const validateUserInput = require("../libs/paramsValidationLib");
const check = require("../libs/checkLib");
const passwordLib = require("../libs/generatePasswordLib");
const { text } = require("body-parser");

/* Models */

const ContactModel = mongoose.model("Contact");
const AuthModel = mongoose.model("Auth");

/* Functions and methods */

let signup = (req, res) => {
  let validateInput = () => {
    return new Promise((resolve, reject) => {
      if (req.body.email) {
        if (!validateUserInput.Email(req.body.email)) {
          let apiResponse = response.generate(
            true,
            "Email does not meet requirements",
            400,
            null
          );
          reject(apiResponse);
        } else if (check.isEmpty(req.body.password)) {
          let apiResponse = response.generate(
            true,
            "Password missing",
            400,
            null
          );
          reject(apiResponse);
        } else {
          resolve(req);
        }
      } else {
        logger.error(
          "Field Missing During User Creation",
          "userController: createUser()",
          5
        );
        let apiResponse = response.generate(
          true,
          "One or More Parameter(s) is missing",
          400,
          null
        );
        reject(apiResponse);
      }
    });
  }; /* end validateInput */

  let createContact = () => {
    return new Promise((resolve, reject) => {
      ContactModel.findOne({ email: req.body.email }).exec((err, result) => {
        if (err) {
          logger.error(err.message, "userController: createUser", 10);
          let apiResponse = response.generate(
            true,
            "Failed To Create User",
            500,
            null
          );
          reject(apiResponse);
        } else if (check.isEmpty(result)) {
          let filePath = req.file.path.split("\\")[0];
          console.log("imageName" + req.file.path.split("/")[1]);

          let newContact = new ContactModel({
            userId: shortid.generate(),
            contactName: req.body.contactName.toLowerCase(),
            dob: req.body.dob,
            imageName: req.file.path.split("/")[1],
            imagePath: filePath,
            mobile: req.body.mobile,
            email: req.body.email.toLowerCase(),
            joinedOn: time.now(),
            password: passwordLib.hashpassword(req.body.password),
            localLoginFlag: true,
          });

          newContact.save((err, newContact) => {
            if (err) {
              logger.error(err.message, "userController: createUser", 10);
              let apiResponse = response.generate(
                true,
                "Failed to create new User",
                500,
                null
              );
              reject(apiResponse);
            } else {
              let newContactObj = newContact.toObject();
              resolve(newContactObj);
            }
          });
        } else {
          logger.error(
            "User Already Present With this Email both locally & socially",
            "userController: createUser",
            4
          );
          let apiResponse = response.generate(
            true,
            "User Already Present With this Email both locally & socially",
            403,
            null
          );
          reject(apiResponse);
        }
      });
    });
  };

  validateInput(req, res)
    .then(createContact)
    .then((resolve) => {
      delete resolve.password;
      let apiResponse = response.generate(false, "user created", 200, resolve);
      res.send(apiResponse);
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
}; /* end signup function */

/* start login function */

let login = (req, res) => {
  let findUser = () => {
    return new Promise((resolve, reject) => {
      if (req.body.email) {
        ContactModel.findOne({ email: req.body.email }).exec((err, result) => {
          if (err) {
            console.log(err);
            logger.error(
              "Failed To Retrieve User Data",
              "userController: findUser()",
              10
            );
            let apiResponse = response.generate(
              true,
              "Failed To Find User Details",
              500,
              null
            );
            reject(apiResponse);
          } else if (check.isEmpty(result)) {
            console.log("no user found");
            logger.error("No user found", "userController: findUser()", 10);
            let apiResponse = response.generate(
              true,
              "Failed To Find User",
              500,
              null
            );
            reject(apiResponse);
          } else {
            logger.info("User Found", "userController: findUser()", 10);
            resolve(result);
          }
        });
      }
    });
  }; // end findUser

  let validatePassword = (userDetails) => {
    console.log(userDetails);

    return new Promise((resolve, reject) => {
      let checkPassword = passwordLib.comparePasswordSync(
        req.body.password,
        userDetails.password
      );
      if (checkPassword === true) {
        let userDetailsObj = userDetails.toObject();
        delete userDetailsObj.password;
        delete userDetailsObj._id;
        delete userDetailsObj.__v;

        console.log(userDetailsObj);
        resolve(userDetailsObj);
      } else {
        logger.info(
          "Login Failed Due To Invalid Password",
          "userController: validatePassword()",
          10
        );
        let apiResponse = response.generate(
          true,
          "Wrong Password, Login Failed",
          400,
          null
        );
        reject(apiResponse);
      }
    });
  }; // end validatePassword

  let generateToken = (userDetailsObj) => {
    return new Promise((resolve, reject) => {
      token.generateToken(userDetailsObj, (err, tokenDetails) => {
        if (err) {
          console.log(err);
          let apiResponse = response.generate(
            true,
            "Failed To Generate Token",
            500,
            null
          );
          reject(apiResponse);
        } else {
          tokenDetails.userId = userDetailsObj.userId;
          tokenDetails.userDetails = userDetailsObj;
          resolve(tokenDetails);
          console.log(tokenDetails);
        }
      });
    });
  }; // end generateToken Function

  let saveToken = (tokenDetails) => {
    return new Promise((resolve, reject) => {
      AuthModel.findOne({ userId: tokenDetails.userId }).exec((err, result) => {
        if (err) {
          console.log(err);
          let apiResponse = response.generate(
            true,
            "Failed to generate token",
            500,
            null
          );
          reject(apiResponse);
        } else if (check.isEmpty(result)) {
          let newAuthModel = new AuthModel({
            userId: tokenDetails.userId,
            authToken: tokenDetails.token,
            tokenSecret: tokenDetails.tokenSecret,
            tokenGenerationTime: time.now(),
          });

          newAuthModel.save((err, result) => {
            if (err) {
              console.log(err);
              let apiResponse = response.generate(
                true,
                "Failed to save token",
                500,
                null
              );
              reject(apiResponse);
            } else {
              let apiResponse = {
                authToken: result.authToken,
                userDetails: tokenDetails.userDetails,
              };
              console.log("apiResponse:" + apiResponse);
              resolve(apiResponse);
            }
          });
          /* if user's AuthModel is already present */
        } else {
          result.authToken = tokenDetails.token;
          result.tokenSecret = tokenDetails.tokenSecret;
          result.tokenGenerationTime = time.now();
          result.save((err, newAuthToken) => {
            if (err) {
              console.log(err);
              let apiResponse = response.generate(
                true,
                "Failed to save token",
                500,
                null
              );
              reject(apiResponse);
            } else {
              let apiResponse = {
                authToken: newAuthToken.authToken,
                userDetails: tokenDetails.userDetails
              };
              console.log("apiResponse:" + apiResponse);
              resolve(apiResponse);
            }
          });
        }
      });
    });
  };

  findUser(req, res)
    .then(validatePassword)
    .then(generateToken)
    .then(saveToken)
    .then((resolve) => {
      let apiResponse = response.generate(
        false,
        "Login Successful",
        200,
        resolve
      );
      res.send(apiResponse);
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
}; // end login

/* Edit contact Info */

let editContact = (req, res) => {
  if (req.file) {
    let filePath = req.file.path.split("\\")[0];
    let options = req.body;

    options.imageName = req.file.path.split("/")[1];
    options.imagePath = filePath;
    ContactModel.updateOne({ email: req.params.email }, options).exec(
      (err, result) => {
        if (err) {
          console.log(err);
          logger.error(
            err.message,
            "contactController: editAnExistingcontact",
            10
          );
          let apiResponse = response.generate(true, "Failed", 500, null);
          res.send(apiResponse);
        } else if (check.isEmpty(result)) {
          logger.info(
            "No contact Found",
            "contactController: editAnExistingcontact"
          );
          let apiResponse = response.generate(
            true,
            "No contact Found",
            404,
            null
          );
          res.send(apiResponse);
        } else {
          console.log("contact details edited");
          let apiResponse = response.generate(
            false,
            "contact details edited",
            200,
            result
          );
          console.log("apiResponse:" + apiResponse);
          res.send(apiResponse);
        }
      }
    );
  } else {
    let options = req.body;
    ContactModel.updateOne({ email: options.email }, options).exec(
      (err, result) => {
        if (err) {
          console.log(err);
          logger.error(
            err.message,
            "contactController: editAnExistingcontact",
            10
          );
          let apiResponse = response.generate(true, "Failed", 500, null);
          res.send(apiResponse);
        } else if (check.isEmpty(result)) {
          logger.info(
            "No contact Found",
            "contactController: editAnExistingcontact"
          );
          let apiResponse = response.generate(
            true,
            "No contact Found",
            404,
            null
          );
          res.send(apiResponse);
        } else {
          console.log("contact details edited");
          let apiResponse = response.generate(
            false,
            "contact details edited",
            200,
            result
          );
          console.log("apiResponse:" + apiResponse);
          res.send(apiResponse);
        }
      }
    );
  }
};

/* Get all contacts */

let getPaginatedContacts = (req, res) => {
  
  const skip = parseInt(req.query.skip)
  const limit = parseInt(req.query.limit)
  
  ContactModel.find()
    .select("-__v -_id")
    .sort({ contactName: 1 })
    .skip(skip)
    .limit(limit)
    .exec((err, result) => {
      if (err) {
        console.log(err);
        logger.error(err.message, "contactController: getAllContacts", 10);
        let apiResponse = response.generate(
          true,
          "Failed To find text",
          500,
          null
        );
        res.send(apiResponse);
      } else if (check.isEmpty(result)) {
        console.log(err);
        logger.info("no contact found", "contactController: getAllContacts");
        let apiResponse = response.generate(
          true,
          "Failed To find contact",
          404,
          null
        );
        res.send(apiResponse);
      } else {
        logger.info("contact found", "contactController: getAllContacts");
        let apiResponse = response.generate(
          false,
          "Contact found",
          200,
          result
        );
        res.send(apiResponse);
      }
    });
}; // end getAllContacts

let getAllContacts = (req, res) => {
  ContactModel.find()
    .select("-__v -_id")
    .sort({ contactName: 1 })
    .exec((err, result) => {
      if (err) {
        console.log(err);
        logger.error(err.message, "contactController: getAllContacts", 10);
        let apiResponse = response.generate(
          true,
          "Failed To find text",
          500,
          null
        );
        res.send(apiResponse);
      } else if (check.isEmpty(result)) {
        console.log(err);
        logger.info("no contact found", "contactController: getAllContacts");
        let apiResponse = response.generate(
          true,
          "Failed To find contact",
          404,
          null
        );
        res.send(apiResponse);
      } else {
        logger.info("contact found", "contactController: getAllContacts");
        let apiResponse = response.generate(
          false,
          "Contact found",
          200,
          result
        );
        res.send(apiResponse);
      }
    });
}; // end getAllContacts

let searchContact = (req, res) => {
  let regex = { $regex: req.params.text, $options: "i" };
  ContactModel.find({ contactName: regex })
    .select("-__v -_id")
    .sort({ contactName: 1 })
    .exec((err, result) => {
      if (err) {
        console.log(err);
        logger.error(err.message, "contactController: searchContact", 10);
        let apiResponse = response.generate(
          true,
          "Failed To find text",
          500,
          null
        );
        res.status(500).send(apiResponse);
      } else if (check.isEmpty(result)) {
        logger.info("no contact found", "contactController: searchContact");
        let apiResponse = response.generate(
          true,
          "Failed To find contact",
          404,
          null
        );
        res.status(404).send(apiResponse);
      } else {
        logger.info("contact found", "contactController: searchContact");
        let apiResponse = response.generate(
          false,
          "Contact found",
          200,
          result
        );
        res.send(apiResponse);
      }
    });
};

let getSingleContact = (req, res) => {
  ContactModel.findOne({ userId: req.params.userId })
    .select("-__v -_id")
    .exec((err, result) => {
      if (err) {
        console.log(err);
        logger.error(err.message, "contactController: getSingleContact", 10);
        let apiResponse = response.generate(
          true,
          "Failed To find text",
          500,
          null
        );
        res.send(apiResponse)
      }else if(check.isEmpty(result)){
        logger.info("no contact found", "contactController: getSingleContact");
        let apiResponse = response.generate(
          true,
          "Failed To find contact",
          404,
          null
        );
        res.send(apiResponse)
      }else{
        logger.info("contact found", "contactController: getSingleContact");
        let apiResponse = response.generate(
          false,
          "Contact found",
          200,
          result
        );
        res.send(apiResponse);
      }
    });
};

module.exports = {
  signup: signup,
  login: login,
  editContact: editContact,
  getAllContacts: getAllContacts,
  searchContact: searchContact,
  getSingleContact:getSingleContact,
  getPaginatedContacts:getPaginatedContacts
};
