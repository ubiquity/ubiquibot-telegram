import { describe, it, expect } from "vitest";
import TelegramBot from "../src/telegram_bot";

describe("telegram bot", () => {
  it("inline response", async () => {
    const bot = new TelegramBot("123456789").on(":message", async () => {
      return new Response("ok");
    });
    const request = new Request("http://example.com/123456789", {
      method: "POST",
      body: JSON.stringify({ inline_query: { query: "hello" } }),
    });
    expect(await (await bot.handle(request)).text()).toBe("ok");
    expect(bot.currentContext.update_type).toBe("inline");
  });
  it("message response", async () => {
    const bot = new TelegramBot("123456789").on(":message", async () => {
      return new Response("ok");
    });
    const request = new Request("http://example.com/123456789", {
      method: "POST",
      body: JSON.stringify({ message: { text: "hello" } }),
    });
    expect(await (await bot.handle(request)).text()).toBe("ok");
    expect(bot.currentContext.update_type).toBe("message");
  });
});
