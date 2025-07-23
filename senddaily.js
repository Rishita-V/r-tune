require("dotenv").config();
const { Telegraf } = require("telegraf");
const { google } = require("googleapis");

// Debug: Check env variables
console.log("🤖 BOT_TOKEN:", process.env.BOT_TOKEN ? "✅" : "❌ Missing");
console.log("📁 GDRIVE_FOLDER_ID:", process.env.GDRIVE_FOLDER_ID ? "✅" : "❌ Missing");
console.log("🧾 GOOGLE_SERVICE_ACCOUNT:", process.env.GOOGLE_SERVICE_ACCOUNT ? "✅" : "❌ Missing");
console.log("💬 CHAT_ID:", process.env.CHAT_ID ? "✅" : "❌ Missing");

// Init Telegram bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Authenticate Google Drive
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
const auth = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  ["https://www.googleapis.com/auth/drive.readonly"]
);
const drive = google.drive({ version: "v3", auth });

// Get current day number
function getCurrentDayNumber() {
  const start = new Date("2024-07-23");
  const now = new Date();
  return Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
}

// Get file ID from Drive
async function getFileIdFromDrive(filename) {
  const res = await drive.files.list({
    q: `name='${filename}' and '${process.env.GDRIVE_FOLDER_ID}' in parents`,
    fields: "files(id, name)",
    spaces: "drive",
  });
  const file = res.data.files[0];
  return file ? file.id : null;
}

// Get direct download link
async function getDirectLink(filename) {
  const fileId = await getFileIdFromDrive(filename);
  if (!fileId) return null;
  return https://drive.google.com/uc?export=download&id=${fileId};
}

// Send the daily voice message
async function sendDaily() {
  const chatId = process.env.CHAT_ID;
  const day = getCurrentDayNumber();
  const filename = `day${day}.mp3`;

  console.log(`📅 Day ${day} → Looking for file: ${filename}`);
  const url = await getDirectLink(filename);

  if (!url) {
    console.log("❌ No voice file found or accessible.");
    return;
  }

  try {
    await bot.telegram.sendMessage(chatId, "Your daily dose of Love ❤");
    await bot.telegram.sendAudio(chatId, { url });
    console.log(`✅ Sent "${filename}" to ${chatId}`);
  } catch (err) {
    console.error("❌ Failed to send audio:", err.message);
  }
}

// Run it
sendDaily().finally(() => {
  bot.stop();
  process.exit(0);
});
