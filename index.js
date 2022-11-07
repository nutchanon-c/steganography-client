const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const sg = require("any-steganography");
const steganographyClass = require("any-steganography");

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

const key = getKey();
console.log(key);

const encryptKeyWithABE = () => {
  let sessionKeyFilePath = "./key.txt";
  let abePubKeyPath = "../abe/pub_key";
  let attr = "sysadmin";

  executeTerminalCommand(
    `cpabe-enc ${abePubKeyPath} ${sessionKeyFilePath} ${attr}`
  );
};
const decryptKeyWithABE = () => {
  let encryptedKeyPath = "./key.txt.cpabe";
  let abePubKeyPath = "../abe/pub_key";
  let abeKeyPath = "../abe/testkey";
  executeTerminalCommand(
    `cpabe-dec ${abePubKeyPath} ${abeKeyPath} ${encryptedKeyPath}`
  );
};

// encryptKeyWithABE();
// decryptKeyWithABE();

const uploadFileToCloud = (path) => {
  // TODO: implement
};

const loopFilesEncode = async (fileDir, key, text, outputDir) => {
  try {
    const files = await fs.promises.readdir(fileDir);
    // console.log(files);
    var i = 0;
    var c = 1;
    for (const file of files) {
      // console.log(path.join(fileDir, file));
      stegaEncode(
        path.join(fileDir, file),
        text.slice(i, i + parseInt(text.length / 5, 10)),
        path.join(outputDir, `${c}.jpg`),
        key
      );
      i = i + parseInt(text.length / 5, 10);
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
  const message = steganographyClass.default.decode(buffer, "jpg", key);
  console.log(message);
  console.log("--------------------------------");
  return message;
}

var method = args[0];

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
      loopFilesEncode(fileDir, key, text, encryptedDir);
      encryptKeyWithABE();
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
  default:
    console.log("unknown operation");
    break;
}
