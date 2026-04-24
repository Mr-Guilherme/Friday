import { expect, test } from "@playwright/test";

const mailpitUrl = "http://127.0.0.1:54324";

type MailpitMessage = {
  ID: string;
  To: { Address: string }[];
};

type MailpitMessagesResponse = {
  messages: MailpitMessage[];
};

type MailpitMessageDetail = {
  Text?: string;
  HTML?: string;
};

async function getMagicLink(email: string) {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    const response = await fetch(`${mailpitUrl}/api/v1/messages?limit=50`);
    const inbox = (await response.json()) as MailpitMessagesResponse;
    const message = inbox.messages.find((item) =>
      item.To.some((recipient) => recipient.Address === email),
    );

    if (message) {
      const detailResponse = await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`);
      const detail = (await detailResponse.json()) as MailpitMessageDetail;
      const body = `${detail.Text ?? ""}\n${detail.HTML ?? ""}`;
      const match = body.match(/https?:\/\/[^"'\s<>)]+/);

      if (match) {
        return match[0].replaceAll("&amp;", "&");
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Magic link email was not delivered to ${email}`);
}

test("logs in with magic link and sends a chat message", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop covers the full magic-link flow.");

  const email = `friday-${Date.now()}@example.com`;

  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: /Pratique inglês|Practice English/ }),
  ).toBeVisible();
  await page.getByLabel(/Email/i).fill(email);
  await page.getByRole("button", { name: /magic link/i }).click();

  const magicLink = await getMagicLink(email);
  await page.goto(magicLink);

  await expect(page.getByRole("heading", { name: "Friday" })).toBeVisible();
  await page
    .getByPlaceholder(/Digite em inglês|Write in English/)
    .fill("Help me practice a daily update.");
  await page.getByRole("button", { name: /Enviar|Send/ }).click();

  await expect(page.getByText("Help me practice a daily update.")).toBeVisible();
  await expect(page.getByText(/Let's practice that/)).toBeVisible();
});

test("keeps the chat layout usable on mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-only layout assertion.");

  await page.goto("/login");
  await expect(page.getByRole("button", { name: /magic link/i })).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});
