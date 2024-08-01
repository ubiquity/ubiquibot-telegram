import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker, { Environment } from "../src/worker";

declare module "cloudflare:test" {
  interface ProvidedEnv extends Environment {}
}

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("telegram bot worker", () => {
  it("responds with ok", async () => {
    const request = new IncomingRequest("http://example.com");
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(await response.text()).toBe("ok");
  });
});
