require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();

// Middleware
app.use(
  cors({
    origin: 'https://webga.ru',
    methods: ['POST'],
    credentials: true,
  })
);
app.use(bodyParser.json());

app.post('/message', async (req, res) => {
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
    res.status(200).json({ message: 'Сообщение успешно отправлено' });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'Ошибка при отправке сообщения', details: error.message });
  }
});

const port = 4000;
app.listen(port, () => console.log(`Сервер работает на порту ${port}`));
