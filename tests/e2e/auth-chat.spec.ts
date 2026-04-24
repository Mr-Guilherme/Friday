import { expect, type Page, test } from "@playwright/test";

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

async function loginWithMagicLink(page: Page) {
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
}

async function sendMessage(page: Page, message: string) {
  const chatLog = page.getByRole("log");

  await page.getByPlaceholder(/Digite em inglês|Write in English/).fill(message);
  await page.getByRole("button", { name: /Enviar|Send/ }).click();
  await expect(chatLog.getByText(message)).toBeVisible();
  await expect(chatLog.getByText(/Friday está pensando|Friday is thinking/)).toBeVisible();
  await expect(chatLog.getByText(/Let's practice that/)).toBeVisible();
  await expect(chatLog.getByText(/Friday está pensando|Friday is thinking/)).not.toBeVisible();
}

test("logs in with magic link and switches between chat conversations", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Desktop covers the full magic-link flow.");

  const firstMessage = "Help me practice a daily update.";
  const secondMessage = "Simulate a code review conversation.";

  await loginWithMagicLink(page);
  await page.route("**/api/chat", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });

  await sendMessage(page, firstMessage);
  await expect(page.getByRole("button", { name: firstMessage })).toBeVisible();

  await page.getByRole("button", { name: /Nova conversa|New conversation/ }).click();
  await sendMessage(page, secondMessage);
  await expect(page.getByRole("button", { name: secondMessage })).toBeVisible();

  await page.getByRole("button", { name: firstMessage }).click();
  await expect(page.getByRole("log").getByText(firstMessage)).toBeVisible();
  await expect(page.getByRole("log").getByText(secondMessage)).not.toBeVisible();

  await page.getByRole("button", { name: secondMessage }).click();
  await expect(page.getByRole("log").getByText(secondMessage)).toBeVisible();
  await expect(page.getByRole("log").getByText(firstMessage)).not.toBeVisible();
});

test("keeps the chat layout usable on mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-only layout assertion.");

  await page.goto("/login");
  await expect(page.getByRole("button", { name: /magic link/i })).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});
