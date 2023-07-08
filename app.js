require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const app = express();

app.use(bodyParser.json());

const corsOptions = {
  origin: "https://webga.ru",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.options("*", cors(corsOptions)); // preflight CORS

app.post("/message", async (req, res) => {
  const { email, message, recaptchaScore } = req.body;

  // Проверка reCAPTCHA
  try {
    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaScore,
        },
      }
    );

    const { data } = response;

    if (data.success && data.score > 0.5) {
      // Создаем транспорт для отправки почты
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_SERVER, // замените на хост вашего SMTP-сервера
        port: 465,
        secure: true, // true для порта 465, false для других портов
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL,
        to: process.env.EMAIL_TO, // вставьте сюда адрес электронной почты, на который хотите получать сообщения
        subject: `Новое сообщение от ${email}`,
        text: message,
      };

      // Отправляем письмо
      transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
          console.log(err);
          res.status(500).json({ error: "Failed to send the email" });
        } else {
          res.status(200).json({ status: "Email sent" });
        }
      });
    } else {
      res.status(400).json({ error: "Failed reCAPTCHA verification" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server is listening on port ${port}`));
