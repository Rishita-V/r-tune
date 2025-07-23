require("dotenv").config();
const { Telegraf } = require("telegraf");
const { google } = require("googleapis");

const bot = new Telegraf(process.env.BOT_TOKEN);
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const auth = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  ["https://www.googleapis.com/auth/drive.readonly"]
);
const drive = google.drive({ version: "v3", auth });

function getCurrentDayNumber() {
  const start = new Date("2024-07-24");
  const now = new Date();
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

async function getFileIdFromDrive(filename) {
  const res = await drive.files.list({
    q: `name='${filename}' and '${process.env.GDRIVE_FOLDER_ID}' in parents`,
    fields: "files(id, name)",
    spaces: "drive",
  });
  const file = res.data.files[0];
  return file ? file.id : null;
}

async function getDirectLink(filename) {
  const fileId = await getFileIdFromDrive(filename);
  if (!fileId) return null;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

async function sendDailyVoice() {
  const day = getCurrentDayNumber();
  const filename = `day${day}.mp3`;
  const url = await getDirectLink(filename);

  if (!url) {
    console.log("Voice file not found:", filename);
    return;
  }

  const chatId = process.env.CHAT_ID;

  try {
    await bot.telegram.sendMessage(chatId, "Your daily dose of Love ❤");
    await bot.telegram.sendAudio(chatId, { url });
    console.log(`✅ Sent day ${day} audio to ${chatId}`);
  } catch (err) {
    console.error("❌ Failed to send message:", err.message);
  }
}

sendDailyVoice().then(() => process.exit());
