require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const { RecaptchaV3 } = require("express-recaptcha");

const app = express();

// Создание экземпляра reCAPTCHA
const recaptcha = new RecaptchaV3(
  process.env.RECAPTCHA_SITE_KEY,
  process.env.RECAPTCHA_SECRET_KEY
);

// Ограничение частоты запросов
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // ограничение каждого IP до 100 запросов за окно
});

// Middleware
app.use(limiter);
app.use(
  cors({
    origin: "https://webga.ru",
    methods: ["POST"],
    credentials: true,
  })
);
app.use(bodyParser.json());

app.post("/message", async (req, res) => {
  recaptcha.verify(req, async (error, data) => {
    if (error || !data.success || data.score < 0.5) {
      return res.status(400).json({ message: "reCAPTCHA не пройдена" });
    }

    const { email, message } = req.body;

    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL,
      to: process.env.EMAIL_TO,
      subject: `Новое сообщение от ${email}`,
      text: message,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: "Сообщение успешно отправлено" });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({
          error: "Ошибка при отправке сообщения",
          details: error.message,
        });
    }
  });
});

const port = 4000;
app.listen(port, () => console.log(`Сервер работает на порту ${port}`));
