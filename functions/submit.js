const busboy = require("busboy");

exports.handler = async (event) => {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: event.headers });
    let fields = {};
    let fileBuffer = null;
    let fileName = "";

    bb.on("file", (name, file, info) => {
      fileName = info.filename;
      const chunks = [];
      file.on("data", (chunk) => chunks.push(chunk));
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on("field", (name, value) => {
      fields[name] = value;
    });

    bb.on("close", () => {
      const base64Image = fileBuffer?.toString("base64");

      resolve({
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          message: "Data diterima",
          data: {
            name: fields.name || null,
            phone: fields.phone || null,
            fileName: fileName || null,
            imageBase64: base64Image
              ? `data:image/jpeg;base64,${base64Image}`
              : null
          }
        })
      });
    });

    bb.end(Buffer.from(event.body, "base64"));
  });
};

exports.config = {
  bodyParser: false
};
