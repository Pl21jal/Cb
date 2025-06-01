const FormData = require("form-data");
const fetch = require("node-fetch");

exports.handler = async function (event) {
  const form = new FormData();
  const boundary = event.headers["content-type"].split("boundary=")[1];
  const buffer = Buffer.from(event.body, "base64");

  // Parse multipart form
  const Busboy = require("busboy");
  const busboy = Busboy({ headers: { "content-type": event.headers["content-type"] } });

  return await new Promise((resolve, reject) => {
    let nama = "", nohp = "", email = "", fotoBuffer = null, fotoName = "";

    busboy.on("field", (fieldname, val) => {
      if (fieldname === "name") nama = val;
      if (fieldname === "tel") nohp = val;
      if (fieldname === "email") email = val;
    });

    busboy.on("file", (fieldname, file, filename) => {
      const chunks = [];
      file.on("data", (data) => chunks.push(data));
      file.on("end", () => {
        fotoBuffer = Buffer.concat(chunks);
        fotoName = filename;
      });
    });

    busboy.on("finish", async () => {
      try {
        const token = "7887428382:AAEPSoJn_agWn17MEGEM43hStu-pmr6kC5Q"; // GANTI di bagian ini
        const chatId = "7096229986"; // GANTI juga di bagian ini

        // Kirim pesan teks ke Telegram
        const pesan = `📩 Form baru diterima:\n\n👤 Nama: ${nama}\n📱 No HP: ${nohp}\n✉️ Email: ${email}`;
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: pesan }),
        });

        // Kirim foto ke Telegram
        if (fotoBuffer) {
          const fotoForm = new FormData();
          fotoForm.append("chat_id", chatId);
          fotoForm.append("photo", fotoBuffer, { filename: fotoName });

          await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: "POST",
            body: fotoForm,
          });
        }

        resolve({
          statusCode: 200,
          body: JSON.stringify({ message: "Berhasil" }),
        });
      } catch (err) {
        console.error(err);
        reject({
          statusCode: 500,
          body: JSON.stringify({ error: "Gagal mengirim ke Telegram" }),
        });
      }
    });

    busboy.end(buffer);
  });
};
