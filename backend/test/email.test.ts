import { afterEach, describe, expect, test, vi } from "vitest";
import { ENV } from "../src/env";
import {
  escapeHtml,
  generateApprovalEmailHtml,
  generateJoinRequestEmailHtml,
  generateRejectionEmailHtml,
  sendEmail,
} from "../src/email";

afterEach(() => vi.unstubAllGlobals());

describe("templates", () => {
  test("user-supplied names and titles are escaped", () => {
    const html = generateJoinRequestEmailHtml(
      '<img src=x onerror="alert(1)">',
      "Tom & Jerry's <script>",
      "https://app.example.test/dashboard"
    );
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("Tom &amp; Jerry&#39;s &lt;script&gt;");
    expect(generateApprovalEmailHtml("<b>", "https://x.test")).toContain("&lt;b&gt;");
    expect(generateRejectionEmailHtml("<b>")).toContain("&lt;b&gt;");
  });

  test("escapeHtml leaves plain text alone", () => {
    expect(escapeHtml("Campus bike-share map")).toBe("Campus bike-share map");
  });
});

describe("sendEmail", () => {
  test("is a silent no-op when Resend isn't configured (local dev)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    ENV.resendApiKey = "";
    await expect(sendEmail({ to: "a@example.test", subject: "s", html: "h" })).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("posts to Resend with the key, and reports failures without throwing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    ENV.resendApiKey = "re_test_key";
    ENV.resendFromEmail = "pioHub <noreply@example.test>";

    await expect(sendEmail({ to: "a@example.test", subject: "s", html: "h" })).resolves.toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test_key");
    expect(JSON.parse(init.body)).toEqual({
      from: "pioHub <noreply@example.test>",
      to: "a@example.test",
      subject: "s",
      html: "h",
    });

    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ message: "bad" }) });
    await expect(sendEmail({ to: "a@example.test", subject: "s", html: "h" })).resolves.toBe(false);
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(sendEmail({ to: "a@example.test", subject: "s", html: "h" })).resolves.toBe(false);
  });
});
