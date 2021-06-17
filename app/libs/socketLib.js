const socketio = require('socket.io');
const mongoose = require('mongoose');
const shortid = require('shortid');
const logger = require('./loggerLib.js');
const events = require('events');
const eventEmitter = new events.EventEmitter();

const tokenLib = require("./tokenLib.js");

const check = require("./checkLib.js");
const response = require('./responseLib')
const UserModel = mongoose.model('User')


const NotificationModel = mongoose.model('Notification')

const moment = require('moment')
const momenttz = require('moment-timezone')
const timeZone = 'Asia/Calcutta'

const time = require('./timeLib');





let setServer = (server) => {


  let io = socketio.listen(server);

  let myIo = io.of('/')

  myIo.on('connection', (socket) => {


    socket.on("sendMyNotification", (userEmail) => {


      console.log("in on fun")


      NotificationModel.find({ userEmailToSendNotification: userEmail, notificationStatus: "un-seen" }, (err, result) => {
        if (err) {
          console.log("error while finding notification: ", err)
          logger.error(err.message, 'socketlib: sendMyNotification', 10)

        } else {
          console.log("notificationObj found successfully", result)
          logger.info("notificationObj found successfully", 'socketlib: sendMyNotification', 1)
          socket.emit("YourNotifications", result);
        }
      })

    })

  })


}
module.exports = {
  setServer: setServer
}