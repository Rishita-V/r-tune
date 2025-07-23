require("dotenv").config();
const { Telegraf } = require("telegraf");
const { google } = require("googleapis");

// Initialize bot
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

// Get file ID
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
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

// Main function
async function sendDailyVoice() {
  const chatId = process.env.CHAT_ID;
  console.log("🔔 Sending to chat ID:", chatId);

  const day = getCurrentDayNumber();
  const filename = `day${day}.mp3`;
  console.log("🎧 Today's file:", filename);

  const url = await getDirectLink(filename);

  if (!url) {
    console.log("❌ Voice file not found or inaccessible");
    return;
  }

  console.log("✅ File URL:", url);

  try {
    await bot.telegram.sendMessage(chatId, "Your daily dose of Love ❤");
    await bot.telegram.sendAudio(chatId, { url });
    console.log(`✅ Sent day ${day} audio successfully`);
  } catch (err) {
    console.error("❌ Failed to send message:", err.message);
  }
}

// Run and exit
sendDailyVoice();
