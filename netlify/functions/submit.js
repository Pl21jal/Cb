const Busboy = require('busboy');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  return new Promise((resolve, reject) => {
    if (event.httpMethod !== 'POST') {
      resolve({
        statusCode: 405,
        body: 'Method Not Allowed',
      });
      return;
    }

    const busboy = new Busboy({ headers: event.headers });
    let fields = {};
    let fileData = null;
    let fileName = null;

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      // Pastikan filename tidak kosong
      if (!filename) {
        file.resume(); // lewati file ini
        return;
      }

      fileName = filename;
      const filePath = path.join('/tmp', filename);

      const writeStream = fs.createWriteStream(filePath);
      file.pipe(writeStream);

      file.on('end', () => {
        fileData = filePath;
      });

      writeStream.on('error', (err) => {
        console.error('Write error:', err);
      });
    });

    busboy.on('field', (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on('finish', () => {
      resolve({
        statusCode: 200,
        body: JSON.stringify({
          message: 'Form received!',
          data: fields,
          file: fileName || 'No file uploaded',
        }),
      });
    });

    try {
      busboy.end(Buffer.from(event.body, 'base64'));
    } catch (err) {
      console.error('Busboy error:', err);
      reject({
        statusCode: 500,
        body: 'Internal server error',
      });
    }
  });
};
