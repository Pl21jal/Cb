const fs = require("fs");
const path = require("path");
const os = require("os");
const busboy = require("busboy");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: event.headers });
    const fields = {};
    let fileData = null;
    let fileName = "";

    bb.on("file", (fieldname, file, info) => {
      const { filename, encoding, mimeType } = info;
      fileName = Date.now() + "_" + filename;
      const saveTo = path.join(os.tmpdir(), fileName);
      file.pipe(fs.createWriteStream(saveTo));
      file.on("end", () => {
        fileData = fileName;
      });
    });

    bb.on("field", (name, val) => {
      fields[name] = val;
    });

    bb.on("finish", () => {
      const uploadsDir = path.join(__dirname, "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
      }

      let savedFilePath = "";
      if (fileData) {
        const tempPath = path.join(os.tmpdir(), fileData);
        const finalPath = path.join(uploadsDir, fileData);
        fs.copyFileSync(tempPath, finalPath);
        savedFilePath = `/uploads/${fileData}`;
      }

      const newEntry = {
        name: fields.name || "",
        phone: fields.phone || "",
        photo: savedFilePath,
        time: new Date().toISOString()
      };

      const dataPath = path.join(__dirname, "data.json");
      let existingData = [];
      if (fs.existsSync(dataPath)) {
        existingData = JSON.parse(fs.readFileSync(dataPath));
      }

      existingData.push(newEntry);
      fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));

      resolve({
        statusCode: 200,
        body: JSON.stringify({ message: "Data saved successfully" })
      });
    });

    bb.end(Buffer.from(event.body, "base64"));
  });
};
