require("dotenv").config();
const { Telegraf } = require("telegraf");

// Parse Google service account JSON from environment variable
const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT;
let serviceAccount = null;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (err) {
  console.error("Invalid GOOGLE_SERVICE_ACCOUNT JSON", err);
  process.exit(1);
}

// Initialize your Google Drive logic here if needed using serviceAccount
// For now, we assume you use file IDs hardcoded like before

const bot = new Telegraf(process.env.BOT_TOKEN);
const chatId = process.env.CHAT_ID; // Set this secret in GitHub for your user/chat ID

const googleDriveMap = {
  "day1.mp3": "1jUaS2tw9lZxDCXVlqhKA8Lz_Q5WbZ39O",
  // Add more mappings as you upload files
};

function getCurrentDayNumber() {
  const start = new Date("2024-07-24");
  const now = new Date();
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

function getFileId(filename) {
  return googleDriveMap[filename] || "";
}

function directLink(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

(async () => {
  const day = getCurrentDayNumber();
  const filename = `day${day}.mp3`;
  const fileId = getFileId(filename);

  if (!fileId) {
    console.log("No voice file found for today:", filename);
    process.exit(0);
  }

  const url = directLink(fileId);

  try {
    await bot.telegram.sendMessage(chatId, "Your daily dose of Love ❤");
    await bot.telegram.sendAudio(chatId, { url });
    console.log("Daily voice message sent!");
  } catch (err) {
    console.error("Error sending message:", err.message);
    process.exit(1);
  }

  process.exit(0);
})();
