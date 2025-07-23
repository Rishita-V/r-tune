require("dotenv").config();
const { Telegraf } = require("telegraf");
const { google } = require("googleapis");

// 🔐 Logging env var presence
console.log("🤖 BOT_TOKEN:", process.env.BOT_TOKEN ? "✅" : "❌ Missing");
console.log("📁 GDRIVE_FOLDER_ID:", process.env.GDRIVE_FOLDER_ID ? "✅" : "❌ Missing");
console.log("🧾 GOOGLE_SERVICE_ACCOUNT:", process.env.GOOGLE_SERVICE_ACCOUNT ? "✅" : "❌ Missing");
console.log("💬 CHAT_ID:", process.env.CHAT_ID ? "✅" : "❌ Missing");

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

// 🧪 TEMP: Use fixed day for testing
const day = 1;
const filename = `day${day}.mp3`;

// Get file ID from Google Drive
async function getFileIdFromDrive(filename) {
  const res = await drive.files.list({
    q: `name='${filename}' and '${process.env.GDRIVE_FOLDER_ID}' in parents`,
    fields: "files(id, name)",
    spaces: "drive",
  });
  const file = res.data.files[0];
  return file ? file.id : null;
}

// Get direct link
async function getDirectLink(filename) {
  const fileId = await getFileIdFromDrive(filename);
  if (!fileId) {
    console.log("❌ Could not find file in Drive:", filename);
    return null;
  }
  console.log("✅ File ID:", fileId);
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

// Send voice message
async function sendDailyVoice() {
  const chatId = process.env.CHAT_ID;
  console.log("🔔 Sending to chat ID:", chatId);
  console.log("🎧 Today's file:", filename);

  const url = await getDirectLink(filename);
  if (!url) {
    console.log("❌ Could not get file URL");
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

// Run
sendDailyVoice();
