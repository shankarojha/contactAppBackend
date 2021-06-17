let appConfig = [];

appConfig.port = 3000;
appConfig.allowedCorsOrigin = "*";
appConfig.env = "dev";
appConfig.db = {
  uri: "mongodb://127.0.0.1:27017/group-contact-appDB",
};

appConfig.version = "/api/v1";

module.exports = {
  port: appConfig.port,
  allowedCorsOrigin: appConfig.allowedCorsOrigin,
  env: appConfig.port.env,
  db: appConfig.db,
  apiVersion: appConfig.version,
};

