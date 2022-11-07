var args = process.argv.slice(2);
console.log(args);
const fs = require("fs");
const path = require("path");
const sg = require("any-steganography");
const file = path.join(__dirname, "test", "input.txt");
const fileDir = path.join(__dirname, "test", "images");
const encryptedDir = path.join(__dirname, "test", "output");
const output = path.join(__dirname, "test-with-message.jpg");
const steganographyClass = require("any-steganography");
const key = "abcdefghabcdefghabcdefghabcdefgh";
console.log(file);

var text = fs.readFileSync(file).toString("utf-8");
// var textByLine = text.split("\n");
console.log(text.length);

const loopFilesEncode = async (dir) => {
  try {
    const files = await fs.promises.readdir(dir);
    // console.log(files);
    var i = 0;
    var c = 1;
    for (const file of files) {
      stegaEncode(
        path.join(__dirname, "test", "images", file),
        text.slice(i, i + parseInt(text.length / 5, 10)),
        path.join(__dirname, "test", "output", `${c}.jpg`)
      );
      i = i + parseInt(text.length / 5, 10);
      c++;
    }
    return files;
  } catch (e) {
    console.error(e);
  }
};

const loopFilesDecode = async (dir) => {
  try {
    const files = await fs.promises.readdir(dir);
    // console.log(files);
    var res = "";
    for (const file of files) {
      res = res + stegaDecode(path.join(encryptedDir, file));
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

function stegaEncode(guestFile, message, outputFile) {
  const buffer = sg.default.write(guestFile, message, key);
  fs.writeFile(outputFile, buffer, (err) => {
    if (err) {
      console.log(err);
      return;
    }
  });
}

function stegaDecode(inputFile) {
  const buffer = fs.readFileSync(inputFile);
  const message = steganographyClass.default.decode(buffer, "jpg", key);
  console.log(message);
  console.log("--------------------------------");
  return message;
}

switch (args[0]) {
  case "enc":
    loopFilesEncode(fileDir);
    break;
  case "dec":
    loopFilesDecode(encryptedDir);
    break;
  default:
    console.log("unknown operation");
    break;
}
