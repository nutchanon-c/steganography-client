// require("dotenv").config();
import dotenv from "dotenv";
dotenv.config();
// const { exec } = require("child_process");
import { exec } from "child_process";
// const { v4: uuidv4 } = require("uuid");
import { v4 as uuidv4 } from "uuid";
// const fs = require("fs");
import fs from "fs";
// const path = require("path");
import path from "path";
// const sg = require("any-steganography");
import sg from "any-steganography";
// const steganographyClass = require("any-steganography");
// import { sg as steganographyClass } from "any-steganography";
// const AWS = require("aws-sdk");
import AWS from "aws-sdk";
// var request = require("request");
import request from "request";

import fetch from "node-fetch";

const getKey = () => {
  let keyFilePath = "./key.txt";
  try {
    if (fs.existsSync(keyFilePath)) {
      let keyText = fs.readFileSync(keyFilePath).toString("utf-8");
      console.log("Key file found and loaded");
      return keyText;
    } else {
      console.log("Key file not found. Generating new key");
      let keyGen = randomString(32);
      fs.writeFileSync(keyFilePath, keyGen);
      return keyGen;
    }
  } catch (err) {
    console.log(err);
  }
};

const getUUID = () => {
  let uuidFilePath = "./uuid.txt";
  try {
    if (fs.existsSync(uuidFilePath)) {
      let keyText = fs.readFileSync(uuidFilePath).toString("utf-8");
      console.log("UUID file found and loaded");
      return keyText;
    } else {
      console.log("UUID file not found. Generating new key");
      let uuid = uuidv4();
      fs.writeFileSync(uuidFilePath, uuid);
      return uuid;
    }
  } catch (err) {
    console.log(err);
  }
};

const uuid = getUUID();
const key = getKey();
console.log(key);

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// console.log(uuidv4());

const uploadFile = async (localFilePath, cloudFilePath) => {
  const filename = localFilePath;
  const fileContent = fs.readFileSync(filename);

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${uuid}/${cloudFilePath}`,
    Body: fileContent,
  };

  const data = await s3.upload(params).promise(); // this line
  console.log(`File uploaded successfully. ${data.Location}`);
  return data.Location;
};

var args = process.argv.slice(2);
console.log(args);

function randomString(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// console.log(randomString(32));

const executeTerminalCommand = (command) => {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
};

const checkABEKey = () => {};

const encryptKeyWithABE = () => {
  let sessionKeyFilePath = "./key.txt";
  let abePubKeyPath = "../abe/pub_key";
  let attr = "attr1";

  executeTerminalCommand(
    `cpabe-enc ${abePubKeyPath} ${sessionKeyFilePath} ${attr}`
  );

  // executeTerminalCommand(
  //   `cpabe-enc ${abePubKeyPath} -k ${sessionKeyFilePath} ${attr}`
  // );

  return sessionKeyFilePath + ".cpabe";
};
const decryptKeyWithABE = () => {
  let encryptedKeyPath = "./key.txt.cpabe";
  let abePubKeyPath = "../abe/pub_key";
  let abeKeyPath = "../abe/testkey";
  executeTerminalCommand(
    `cpabe-dec ${abePubKeyPath} ${abeKeyPath} ${encryptedKeyPath}`
  );
};

const decryptKeyWithABEWithPath = async (encSKPath, userAbeKeyPath) => {
  console.log(`decrypting session key ${encSKPath}`);
  let abePubKeyPath = "../abe/pub_key";
  executeTerminalCommand(
    `cpabe-dec ${abePubKeyPath} ${userAbeKeyPath} ${encSKPath}`
  );
};

const downloadFile = async (url, fileName) => {
  // const https = require("https"); // or 'https' for https:// URLs
  // const fs = require("fs");
  // const fetch = require("node-fetch");
  if (!fs.existsSync("./downloads")) {
    fs.mkdirSync("./downloads");
  }
  const file = fs.createWriteStream(`${fileName}`);
  // https.get(url).then((response) => {
  //   response.pipe(file);
  //   // after download completed close filestream
  //   file.on("finish", () => {
  //     file.close();
  //     console.log("Download Completed");
  //     return `./downloads/${fileName}`;
  //   });
  //   return false;
  // });
  fetch(url).then((response) => {
    response.body.pipe(file);
    // after download completed close filestream
    file.on("finish", () => {
      file.close();
      console.log("Download Completed");
      return `${fileName}`;
    });
    return false;
  });
};

// encryptKeyWithABE();
// decryptKeyWithABE();

const uploadFileToCloud = async (path, setid) => {
  // console.log(path);
  let filename = path.replace(/^.*[\\\/]/, "");
  console.log(`uploading: ${filename}`);
  let url = await uploadFile(path, `${setid}/${filename}`);
  // console.log(path);
  return url;
};

const loopFilesEncode = async (fileDir, key, text, outputDir) => {
  try {
    const files = await fs.promises.readdir(fileDir);
    // console.log(`files: ${files}`);
    var i = 0;
    var c = 1;
    for (const file of files) {
      console.log(`encoding to file ${path.join(fileDir, file)}`);
      stegaEncode(
        path.join(fileDir, file),
        text.slice(i, i + text.length / files.length),
        path.join(outputDir, `${c}.jpg`),
        key
      );
      i = i + text.length / files.length;
      c++;
    }
    return files;
  } catch (e) {
    console.error(e);
  }
};

function stegaEncode(guestFile, message, outputFile, key) {
  const buffer = sg.default.write(guestFile, message, key);
  fs.writeFile(outputFile, buffer, (err) => {
    if (err) {
      console.log(err);
      return;
    }
  });
}

const loopFilesDecode = async (dir, key) => {
  try {
    const files = await fs.promises.readdir(dir);
    // console.log(files);
    var res = "";
    for (const file of files) {
      res = res + stegaDecode(path.join(dir, file), key);
    }
    fs.writeFile(
      path.join(__dirname, "test", "output", "decoded.txt"),
      res,
      (err) => {
        if (err) {
          console.error(err);
          return;
        }
      }
    );
  } catch (e) {
    console.error(e);
  }
};

function stegaDecode(inputFile, key) {
  const buffer = fs.readFileSync(inputFile);
  const message = sg.default.decode(buffer, "jpg", key);
  console.log(message);
  console.log("--------------------------------");
  return message;
}

var method = args[0];

async function main() {
  switch (method) {
    case "enc":
      if (args.length === 3) {
        var ptPath = args[1];
        var imageDirectory = args[2];
        const file = ptPath;
        const fileDir = imageDirectory + "/images/";
        const encryptedDir = imageDirectory + "/output/";
        console.log(file);
        var text = fs.readFileSync(file).toString("utf-8");
        // var textByLine = text.split("\n");
        console.log(text.length);
        await loopFilesEncode(fileDir, key, text, encryptedDir);
        let encryptedKeyPath = encryptKeyWithABE();

        let allFilePath = [];

        let payload = {
          uuid: uuid,
          files: [],
          keyPath: "",
          user_attributes: [],
        };

        await request.get(
          `${process.env.API_URL}:3000/newID`,
          function (error, response, body) {
            if (!error && response.statusCode == 200) {
              let bodyJson = JSON.parse(body);
              let set_id = bodyJson.id;
              console.log(`top setid: ${bodyJson.id}`);
              console.log(`returned new id body: ${body}`);

              try {
                fs.promises.readdir(encryptedDir).then(async (files) => {
                  // console.log(files);
                  let i = 1;
                  for (const file of files) {
                    console.log(`file: ${file}`);
                    // console.log(path.join(fileDir, file));
                    await uploadFileToCloud(
                      `${encryptedDir}/${file}`,
                      set_id
                    ).then((url) => {
                      allFilePath.push({ sequence: i, url: url });
                    });
                    i++;
                  }

                  payload.files = allFilePath;

                  await uploadFileToCloud(encryptedKeyPath, set_id).then((url) => {
                    let tmp = { ...payload };
                    tmp.keyPath = url;
                    tmp.set_id = set_id;
                    payload = { ...tmp };
                    console.log(payload);
                    payload.user_attributes = ["attr1", "attr2", "attr3"];
                    request.post(
                      `${process.env.API_URL}:3000/new`,
                      { json: payload },
                      function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                          console.log(body);

                          fs.appendFile(
                            `./picture_sets/${set_id}.json`,
                            `{"file":"${file}", "ps_id":"${set_id}"}`,
                            function (err) {
                              if (err) throw err;
                              console.log("Saved!");
                            }
                          );
                        } else {
                          console.log("api error");
                        }
                      }
                    );
                  });
                });
              } catch (e) {
                console.error(e);
              }
            } else {
              console.log("api error");
            }
          }
        );
      } else {
        console.log("please try again");
      }

      break;
    case "dec":
      if (args.length === 2) {
        var directory = args[1];
        // var textByLine = text.split("\n");
        // console.log(text.length);
        loopFilesDecode(directory, key);
      } else {
        console.log("please try again");
      }
      break;
    case "req":
      if (args.length === 2) {
        var set_id = args[1];
        request.post(`${process.env.API_URL}:3000/request`, {
          json: { set_id: set_id, uuid: uuid },
        });

        request.post(
          `${process.env.API_URL}:3000/request`,
          { json: { set_id: set_id, uuid: uuid } },
          function (error, response, body) {
            if (!error && response.statusCode == 200) {
              let files = body.files;
              let key_url = body.key_url;
              console.log(`files ${files}`);
              files.forEach((e) => {
                console.log(e.url, e.sequence);
              });
              downloadFile(
                key_url,
                "./downloads/key/keytodecrypt.txt.cpabe"
              ).then(() => {
                files.forEach(async (element) => {
                  await downloadFile(
                    element.url,
                    `./downloads/images/${element.sequence}`
                  );
                });

                decryptKeyWithABEWithPath(
                  "./downloads/key/keytodecrypt.txt.cpabe",
                  "./test-sysadmin-key"
                ).then(() => {
                  let key = fs.readFileSync("./downloads/key/keytodecrypt.txt");
                  loopFilesDecode("./downloads/images", key);
                });
              });
            } else {
              console.log("api error");
            }
          }
        );
      }
    default:
      console.log("unknown operation");
      break;
  }
}

main();
