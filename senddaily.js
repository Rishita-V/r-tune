require("dotenv").config();
const { Telegraf } = require("telegraf");
const { google } = require("googleapis");

// ✅ Log secrets existence
console.log("🔍 Checking secrets...");
console.log("🤖 BOT_TOKEN:", process.env.BOT_TOKEN ? "✅" : "❌ MISSING");
console.log("💬 CHAT_ID:", process.env.CHAT_ID ? "✅" : "❌ MISSING");
console.log("📁 GDRIVE_FOLDER_ID:", process.env.GDRIVE_FOLDER_ID ? "✅" : "❌ MISSING");

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  console.log("🧾 GOOGLE_SERVICE_ACCOUNT: ✅ Parsed successfully");
} catch (e) {
  console.log("🧾 GOOGLE_SERVICE_ACCOUNT: ❌ Invalid JSON");
  process.exit(1);
}

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Authenticate Google Drive
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
  const dayNum = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  console.log(`📅 Today is day ${dayNum}`);
  return dayNum;
}

// Get file ID
async function getFileIdFromDrive(filename) {
  try {
    const res = await drive.files.list({
      q: `name='${filename}' and '${process.env.GDRIVE_FOLDER_ID}' in parents`,
      fields: "files(id, name)",
      spaces: "drive",
    });

    const file = res.data.files[0];
    if (file) {
      console.log(`📄 Found file: ${file.name} (ID: ${file.id})`);
      return file.id;
    } else {
      console.log("❌ File not found in folder");
      return null;
    }
  } catch (err) {
    console.log("❌ Error fetching file from Drive:", err.message);
    return null;
  }
}

// Get direct download link
async function getDirectLink(filename) {
  const fileId = await getFileIdFromDrive(filename);
  if (!fileId) return null;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

// Main
async function sendDaily() {
  const chatId = process.env.CHAT_ID;
  if (!chatId) {
    console.log("❌ CHAT_ID missing");
    return;
  }

  const day = getCurrentDayNumber();
  const filename = `day${day}.mp3`;
  const url = await getDirectLink(filename);

  if (!url) {
    console.log("❌ Could not get file URL");
    return;
  }

  console.log("🎧 Sending audio from URL:", url);

  try {
    await bot.telegram.sendMessage(chatId, "Your daily dose of Love ❤");
    await bot.telegram.sendAudio(chatId, { url });
    console.log(`✅ Sent day ${day} audio successfully`);
  } catch (err) {
    console.log("❌ Failed to send audio:", err.message);
  }
}

sendDaily();
