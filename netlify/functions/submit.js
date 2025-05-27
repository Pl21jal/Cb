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
      fileName = filename;
      const filePath = path.join('/tmp', filename);
      file.pipe(fs.createWriteStream(filePath));
      file.on('end', () => {
        fileData = filePath;
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
          file: fileName,
        }),
      });
    });

    busboy.end(Buffer.from(event.body, 'base64'));
  });
};
