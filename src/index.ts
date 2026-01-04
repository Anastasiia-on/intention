import { createBot } from "./bot";
import { config } from "./config";
import { startCronJobs } from "./jobs";

if (!config.botToken) {
  throw new Error("BOT_TOKEN is required");
}

const bot = createBot(config.botToken);
startCronJobs(bot);

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
