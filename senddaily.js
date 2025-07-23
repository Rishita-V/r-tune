require("dotenv").config();
const { Telegraf } = require("telegraf");
const { google } = require("googleapis");

// Load env variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const GDRIVE_FOLDER_ID = process.env.GDRIVE_FOLDER_ID;
const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT;

// Log check
console.log("🤖 BOT_TOKEN:", BOT_TOKEN ? "✅" : "❌ Missing");
console.log("💬 CHAT_ID:", CHAT_ID ? "✅" : "❌ Missing");
console.log("📁 GDRIVE_FOLDER_ID:", GDRIVE_FOLDER_ID ? "✅" : "❌ Missing");
console.log("🔐 GOOGLE_SERVICE_ACCOUNT:", GOOGLE_SERVICE_ACCOUNT ? "✅" : "❌ Missing");

// Init bot
const bot = new Telegraf(BOT_TOKEN);

// Authenticate Google Drive
const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT);
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

// Get file ID
async function getFileId(filename) {
  const res = await drive.files.list({
    q: `name='${filename}' and '${GDRIVE_FOLDER_ID}' in parents`,
    fields: "files(id, name)",
    spaces: "drive",
  });
  const file = res.data.files[0];
  return file ? file.id : null;
}

// Get download URL
async function getFileUrl(filename) {
  const fileId = await getFileId(filename);
  if (!fileId) return null;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

// Main
async function sendDaily() {
  const day = getCurrentDayNumber();
  const filename = `day${day}.mp3`;

  console.log(`📅 Sending: ${filename}`);

  const url = await getFileUrl(filename);

  if (!url) {
    console.log("❌ Voice file not found:", filename);
    return;
  }

  try {
    await bot.telegram.sendMessage(CHAT_ID, "Your daily dose of Love ❤");
    await bot.telegram.sendAudio(CHAT_ID, { url });
    console.log("✅ Sent successfully!");
  } catch (err) {
    console.error("❌ Error sending message:", err.message);
  }
}

sendDaily();
