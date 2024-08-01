import TelegramBot, { TelegramExecutionContext } from "../../main/src/main.js";
import { marked } from "marked";

export interface Environment {
  SECRET_TELEGRAM_API_TOKEN: string;
  SECRET_TELEGRAM_API_TOKEN2: string;
  SECRET_TELEGRAM_API_TOKEN3: string;
  AI: Ai;
  DB: D1Database;
  R2: R2Bucket;
}

type promiseFunc<T> = (resolve: (result: T) => void, reject: (e?: Error) => void) => Promise<T>;

/**
 * Wrap setTimeout in a Promise
 * @param func - function to call after setTimeout
 */
function wrapPromise<T>(func: promiseFunc<T>, time = 1000) {
  return new Promise((resolve, reject) => {
    return setTimeout(() => {
      func(resolve, reject).catch((e: unknown) => {
        console.log(e);
      });
    }, time);
  });
}

/**
 * Convert markdown to html that Telegram can parse
 * @param s - the string containing markdown
 */
async function markdown_to_html(s: string) {
  const parsed = await marked.parse(s);
  return parsed.replace(/<p>/g, "").replace(/<\/p>/g, "");
}

export default {
  fetch: async (request: Request, env: Environment, ctx: ExecutionContext) => {
    const tuxrobot = new TelegramBot(env.SECRET_TELEGRAM_API_TOKEN);
    const duckduckbot = new TelegramBot(env.SECRET_TELEGRAM_API_TOKEN2);
    const translatepartybot = new TelegramBot(env.SECRET_TELEGRAM_API_TOKEN3);
    await Promise.all([
      tuxrobot
        .on(":document", async (bot: TelegramExecutionContext) => {
          const file_id: string = bot.update.message?.document?.file_id ?? "";
          const file_response = await bot.getFile(file_id);
          const id = crypto.randomUUID().slice(0, 5);
          await env.R2.put(id, await file_response.arrayBuffer());
          await bot.reply(`https://r2.seanbehan.ca/${id}`);
          return new Response("ok");
        })
        .on("epoch", async (bot: TelegramExecutionContext) => {
          switch (bot.update_type) {
            case "message":
              await bot.reply(Math.floor(Date.now() / 1000).toString());
              break;

            default:
              break;
          }
          return new Response("ok");
        })
        .on("start", async (bot: TelegramExecutionContext) => {
          switch (bot.update_type) {
            case "message":
              await bot.reply("Send me a message to talk to llama3. Use /clear to wipe history. Use /photo to generate a photo. Use /code to generate code.");
              break;

            default:
              break;
          }
          return new Response("ok");
        })
        .on("code", async (bot: TelegramExecutionContext) => {
          switch (bot.update_type) {
            case "message": {
              const prompt = bot.update.message?.text?.toString().split(" ").slice(1).join(" ") ?? "";
              const messages = [{ role: "user", content: prompt }];
              let response: AiTextGenerationOutput;
              try {
                // @ts-expect-error broken bindings
                response = await env.AI.run("@hf/thebloke/deepseek-coder-6.7b-instruct-awq", { messages });
              } catch (e) {
                console.log(e);
                await bot.reply(`Error: ${e as string}`);
                return new Response("ok");
              }
              if ("response" in response) {
                await bot.reply(await markdown_to_html(response.response ?? ""), "HTML");
              }
              break;
            }

            default:
              break;
          }
          return new Response("ok");
        })
        .on(":photo", async (bot: TelegramExecutionContext) => {
          const file_id: string = bot.update.message?.photo?.pop()?.file_id ?? "";
          const file_response = await bot.getFile(file_id);
          const blob = await file_response.arrayBuffer();
          if (bot.update.message?.caption) {
            const inputs = {
              prompt: bot.update.message.caption,
              image: [...new Uint8Array(blob)],
            };
            let response;
            try {
              response = await env.AI.run("@cf/runwayml/stable-diffusion-v1-5-img2img", inputs);
            } catch (e) {
              console.log(e);
              await bot.reply(`Error: ${e as string}`);
              return new Response("ok");
            }
            const id = crypto.randomUUID();
            await env.R2.put(id, response);
            await bot.replyPhoto(`https://r2.seanbehan.ca/${id}`);
            ctx.waitUntil(
              wrapPromise(async () => {
                await env.R2.delete(id);
              }, 500)
            );
          } else {
            const input = {
              image: [...new Uint8Array(blob)],
              prompt: "Generate a caption for this image",
              max_tokens: 512,
            };
            let response: AiImageToTextOutput;
            try {
              response = await env.AI.run("@cf/llava-hf/llava-1.5-7b-hf", input);
            } catch (e) {
              console.log(e);
              await bot.reply(`Error: ${e as string}`);
              return new Response("ok");
            }
            await bot.replyPhoto(file_id, response.description);
          }
          return new Response("ok");
        })
        .on("photo", async (bot: TelegramExecutionContext) => {
          switch (bot.update_type) {
            case "message": {
              const prompt = bot.update.message?.text?.toString() ?? "";
              let photo: AiTextToImageOutput;
              try {
                photo = await env.AI.run("@cf/lykon/dreamshaper-8-lcm", { prompt });
              } catch (e) {
                console.log(e);
                await bot.reply(`Error: ${e as string}`);
                return new Response("ok");
              }
              const photo_file = new File([await new Response(photo).blob()], "photo");
              const id = crypto.randomUUID();
              await env.R2.put(id, photo_file);
              await bot.replyPhoto(`https://r2.seanbehan.ca/${id}`);
              ctx.waitUntil(
                wrapPromise(async () => {
                  await env.R2.delete(id);
                }, 500)
              );
              break;
            }
            case "inline": {
              const prompt = bot.update.inline_query?.query.toString().split(" ").slice(1).join(" ") ?? "";
              let photo: AiTextToImageOutput;
              try {
                photo = await env.AI.run("@cf/lykon/dreamshaper-8-lcm", { prompt });
              } catch (e) {
                console.log(e);
                await bot.reply(`Error: ${e as string}`);
                return new Response("ok");
              }
              const photo_file = new File([await new Response(photo).blob()], "photo");
              const id = crypto.randomUUID();
              await env.R2.put(id, photo_file);
              await bot.replyPhoto(`https://r2.seanbehan.ca/${id}`);
              ctx.waitUntil(
                wrapPromise(async () => {
                  await env.R2.delete(id);
                }, 500)
              );
              break;
            }

            default:
              break;
          }
          return new Response("ok");
        })
        .on("clear", async (bot: TelegramExecutionContext) => {
          switch (bot.update_type) {
            case "message":
              await env.DB.prepare("DELETE FROM Messages WHERE userId=?").bind(bot.update.message?.from.id).run();
              await bot.reply("history cleared");
              break;

            default:
              break;
          }
          return new Response("ok");
        })
        .on(":message", async (bot: TelegramExecutionContext) => {
          switch (bot.update_type) {
            case "message": {
              const prompt = bot.update.message?.text?.toString() ?? "";
              const { results } = await env.DB.prepare("SELECT * FROM Messages WHERE userId=?")
                .bind(bot.update.inline_query ? bot.update.inline_query.from.id : bot.update.message?.from.id)
                .all();
              const message_history = results.map((col) => ({ role: "system", content: col.content as string }));
              const messages = [
                { role: "system", content: "You are a friendly assistant named TuxRobot. Use lots of emojis in your responses." },
                ...message_history,
                {
                  role: "user",
                  content: prompt,
                },
              ];
              let response: AiTextGenerationOutput;
              try {
                // @ts-expect-error broken bindings
                response = await env.AI.run("@cf/meta/llama-3-8b-instruct", { messages, max_tokens: 150 });
              } catch (e) {
                console.log(e);
                await bot.reply(`Error: ${e as string}`);
                return new Response("ok");
              }
              if ("response" in response) {
                if (response.response) {
                  await bot.reply(await markdown_to_html(response.response ?? ""), "HTML");
                  await env.DB.prepare("INSERT INTO Messages (id, userId, content) VALUES (?, ?, ?)")
                    .bind(
                      crypto.randomUUID(),
                      bot.update.inline_query ? bot.update.inline_query.from.id : bot.update.message?.from.id,
                      `'[INST] ${prompt} [/INST] \n ${response.response}`
                    )
                    .run();
                }
              }
              break;
            }
            case "inline": {
              const messages = [
                { role: "system", content: "You are a friendly assistant named TuxRobot. Use lots of emojis in your responses." },
                {
                  role: "user",
                  content: bot.update.inline_query?.query.toString() ?? "",
                },
              ];
              let response: AiTextGenerationOutput;
              try {
                // @ts-expect-error broken bindings
                response = await env.AI.run("@cf/meta/llama-3-8b-instruct", { messages, max_tokens: 100 });
              } catch (e) {
                console.log(e);
                await bot.reply(`Error: ${e as string}`);
                return new Response("ok");
              }
              if ("response" in response) {
                await bot.reply(response.response ?? "");
              }
              break;
            }

            default:
              break;
          }
          return new Response("ok");
        })
        .handle(request.clone()),
      duckduckbot
        .on(":message", async (bot: TelegramExecutionContext) => {
          switch (bot.update_type) {
            case "message": {
              await bot.reply("https://duckduckgo.com/?q=" + encodeURIComponent(bot.update.message?.text?.toString() ?? ""));
              break;
            }
            case "inline": {
              await bot.reply("https://duckduckgo.com/?q=" + encodeURIComponent(bot.update.inline_query?.query ?? ""));
              break;
            }

            default:
              break;
          }
          return new Response("ok");
        })
        .handle(request.clone()),
      translatepartybot
        .on(":message", async (bot: TelegramExecutionContext) => {
          switch (bot.update_type) {
            case "inline": {
              const translated_text = await fetch(
                "https://translate.googleapis.com/translate_a/single?sl=auto&tl=en&dt=t&dj=1&prev=input&ie=utf-8&oe=utf-8&client=gtx&q=" +
                  encodeURIComponent(bot.update.inline_query?.query.toString() ?? "")
              )
                .then((r) => r.json())
                .then((json) => (json as { sentences: [{ trans: string; orig: string; backend: number }] }).sentences[0].trans);
              await bot.reply(translated_text);
              break;
            }
            case "message":
              await bot.reply("Use me in inline mode by typing @TranslatePartyBot and the text you want to translate.");
              break;

            default:
              break;
          }

          return new Response("ok");
        })
        .handle(request.clone()),
    ]);
    return new Response("ok");
  },
};
