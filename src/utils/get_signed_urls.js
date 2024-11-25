let AWS = require("aws-sdk");
const { Storage } = require("@google-cloud/storage");

const fs = require("fs");
const path = require("path");
const storage = new Storage({
  projectId: process.env.project_id,
  keyFilename: path.join(
    __dirname,
    "../config/dronalis-project-ef4c229cdb19.json"
  ),
});

const s3 = new AWS.S3();
exports.getSignedURL = async (key) => {
  try {
    const options = {
      //   version: "v4",
      action: "read",
      expires: Date.now() + 125 * 60 * 1000, // 15 minutes
    };
    const url = await storage
      .bucket(process.env.bucket)
      .file(key)
      .getSignedUrl(options);
    console.log(url, "funtion");
    return url;
  } catch (err) {
    console.log(err);
  }
};
