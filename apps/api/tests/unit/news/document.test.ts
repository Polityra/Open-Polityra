import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

const request = vi.hoisted(() => vi.fn());
vi.mock("node:https", () => ({ request }));
import { fetchPublicDocument } from "../../../src/modules/news/scraper";

function respond(statusCode: number, headers: Record<string, string>, body = "") {
  const outgoing = new EventEmitter() as EventEmitter & { end: () => void; destroy: () => void };
  outgoing.destroy = () => outgoing.emit("error", new Error("destroyed"));
  outgoing.end = () => {
    queueMicrotask(() => {
      const response = new EventEmitter() as EventEmitter & {
        statusCode: number;
        headers: Record<string, string>;
        resume: () => void;
        destroy: () => void;
      };
      response.statusCode = statusCode;
      response.headers = headers;
      response.resume = () => {};
      response.destroy = () => {};
      request.mock.calls[request.mock.calls.length - 1][2](response);
      if (body) response.emit("data", Buffer.from(body));
      response.emit("end");
    });
  };
  return outgoing;
}

describe("public document redirects", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("follows and revalidates a same-domain redirect", async () => {
    request
      .mockImplementationOnce(() => respond(301, { location: "/feed.xml" }))
      .mockImplementationOnce(() =>
        respond(200, { "content-type": "application/rss+xml" }, "<rss/>"),
      );
    await expect(fetchPublicDocument("https://8.8.8.8/", "8.8.8.8")).resolves.toMatchObject({
      body: "<rss/>",
      finalUrl: "https://8.8.8.8/feed.xml",
    });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("rejects redirects outside the configured domain before requesting them", async () => {
    request.mockImplementationOnce(() => respond(302, { location: "https://127.0.0.1/" }));
    await expect(fetchPublicDocument("https://8.8.8.8/", "8.8.8.8")).rejects.toThrow(
      "source domain",
    );
    expect(request).toHaveBeenCalledTimes(1);
  });
});
