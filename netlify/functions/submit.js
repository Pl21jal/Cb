const Busboy = require('busboy');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const FormData = require('form-data');

const TELEGRAM_TOKEN = '7887428382:AAEPSoJn_agWn17MEGEM43hStu-pmr6kC5Q';
const CHAT_ID = '7096229986';

exports.handler = async (event) => {
  return new Promise((resolve, reject) => {
    if (event.httpMethod !== 'POST') {
      resolve({ statusCode: 405, body: 'Method Not Allowed' });
      return;
    }

    const busboy = new Busboy({ headers: event.headers });
    let fields = {};
    let filePath = '';
    let fileName = '';
    let mimeType = '';

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      fileName = filename;
      mimeType = mimetype;
      filePath = path.join(os.tmpdir(), filename);
      const writeStream = fs.createWriteStream(filePath);
      file.pipe(writeStream);
    });

    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on('finish', async () => {
      try {
        const name = fields.name || '-';
        const phone = fields.phone || '-';
        const email = fields.email || '-';

        const message = `📥 Data Baru Masuk:\n👤 Nama: ${name}\n📞 No HP: ${phone}\n✉️ Email: ${email}`;

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          chat_id: CHAT_ID,
          text: message,
        });

        if (filePath && fs.existsSync(filePath)) {
          const formData = new FormData();
          formData.append('chat_id', CHAT_ID);
          formData.append('document', fs.createReadStream(filePath), {
            filename: fileName,
            contentType: mimeType,
          });

          await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, formData, {
            headers: formData.getHeaders(),
          });
        }

        resolve({
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            fields: { name, phone, email },
            file: fileName
          }),
        });
      } catch (error) {
        console.error('Upload error:', error);
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'Gagal mengirim ke Telegram' }),
        });
      }
    });

    busboy.end(Buffer.from(event.body, 'base64'));
  });
};
