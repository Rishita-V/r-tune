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

// Calculate current day number based on start date
function getCurrentDayNumber() {
  const start = new Date("2025-07-24"); // Start date as Day 1
  const now = new Date();
  const dayNumber = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  return dayNumber;
}

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

// Generate direct download URL
async function getDirectLink(filename) {
  const fileId = await getFileIdFromDrive(filename);
  if (!fileId) return null;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

// Main function to send message to all users
async function sendDailyVoice() {
  const chatIds = process.env.CHAT_IDS.split(",").map((id) => id.trim());
  const day = getCurrentDayNumber();
  const filename = `day${day}.mp3`;

  console.log("🎧 Today's file:", filename);

  const url = await getDirectLink(filename);

  if (!url) {
    console.log("❌ Voice file not found or inaccessible");
    return;
  }

  console.log("✅ File URL:", url);

  for (const chatId of chatIds) {
    try {
      await bot.telegram.sendMessage(chatId, "Your daily dose of Love ❤️");
      await bot.telegram.sendAudio(chatId, { url });
      console.log(`✅ Sent to ${chatId}`);
    } catch (err) {
      console.error(`❌ Failed for ${chatId}:`, err.message);
    }
  }
}

// Optional: Enable /start to capture chat IDs
bot.start((ctx) => {
  console.log("New chat ID:", ctx.chat.id);
  ctx.reply("You're now subscribed to daily love messages ❤️");
});

// Only run when executed directly
if (require.main === module) {
  sendDailyVoice();
}
