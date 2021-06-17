const express = require("express");
const app = express(); // instance of express
const fs = require("fs");
const https = require("https");
const http = require("http");
const mongoose = require("mongoose");
const appConfig = require('./config/config');
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const logger = require("./app/libs/loggerLib");
const routeLoggerMiddleware = require("./app/middlewares/routeLogger");
const globalErrorMiddleware = require("./app/middlewares/appErrorHandler");
const modelsPath = "./app/models";
const routesPath = "./app/routes";
const path = require('path')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(routeLoggerMiddleware.logIp);
app.use(globalErrorMiddleware.globalErrorHandler);

// express static path
app.use(express.static(path.join(__dirname, "client")));
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static("images"));

app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  next();
});

// Bootstrap models

fs.readdirSync(modelsPath).forEach(function (file) {
  if (~file.indexOf(".js")) {
    require(modelsPath + "/" + file);
  }
}); // end bootstrap models

// Bootstrap Routes

fs.readdirSync(routesPath).forEach(function (file) {
  if (~file.indexOf(".js")) {
    let route = require(routesPath + "/" + file);
    route.setRouter(app);
  }
}); // end bootstrap routes

// Calling global not-found(404) handler after calling the routes

app.use(globalErrorMiddleware.globalNotFoundHandler);

// end global not-found(404) handler

/**
 
 *creating http web server object

*/

const server = http.createServer(app);

// start listening to http server

server.listen(appConfig.port);
server.on("error", onError);
server.on("listening", onListening);

// event listeners for error event

function onError(error) {
  if (error.syscall !== "listen") {
    logger.error(error.code + "not Equal listen", "serverOnErrorHandler", 10);
    throw error;
  }

  // handle specific listen errors with friendly messages

  switch (error.code) {
    case "EACCES":
      logger.error(
        error.code + ":elavated privileges required",
        "serverOnErrorHandler",
        10
      );
      process.exit(1);
      break;
    case "EADDRINUSE":
      logger.error(
        error.code + ":port is already in use.",
        "serverOnErrorHandler",
        10
      );
      process.exit(1);
      break;
    default:
      logger.error(
        error.code + ":some unknown error occured",
        "serverOnErrorHandler",
        10
      );
      throw error;
  }
} // end onError

// event listeners for HTTP server 'listening' event

function onListening(req,res) {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe" + addr : "port" + addr.port;
  "Listening on" + bind;
  logger.info(
    "server listening on port" + addr.port,
    "serverOnListeningHandler",
    10
  );
  console.log("-->listening")
  let db = mongoose.connect(appConfig.db.uri, { useNewUrlParser: true });
}

process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  // application specific logging, throwing an error, or other logic here
});

/**
 * Database connection settings
 */

mongoose.connection.on("error", function (err) {
  console.log("database connection error");
  console.log(err);
  logger.error(err, "mongoose connection on error handler", 10);
});

mongoose.connection.on("open", function (err) {
  if (err) {
    console.log("database error");
    console.log(err);
    logger.error(err, "mongoose connection open handler", 10);
  } else {
    console.log("database connection open success");
    logger.info(
      "database connection open",
      "database connection open handler",
      10
    );
  }
}); // end

module.exports = app;
