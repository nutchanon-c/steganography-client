const fs = require("fs");
const path = require("path");
const sg = require("any-steganography");
const steganographyClass = require("any-steganography");
const key = "abcdefghabcdefghabcdefghabcdefgh";
var args = process.argv.slice(2);
console.log(args);

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
