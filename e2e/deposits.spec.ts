import { expect, test, type Browser } from "@playwright/test";

const PASSWORD = "password123";
const uniquePhone = () => `01${Math.floor(300000000 + Math.random() * 699999999)}`;

async function newUser(browser: Browser, name: string) {
  const page = await (await browser.newContext()).newPage();
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Phone number").fill(uniquePhone());
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/messes$/);
  return page;
}

async function messWithMember(browser: Browser) {
  const admin = await newUser(browser, "Deposit Admin");
  await admin.goto("/messes/new");
  await admin.getByLabel("Mess name").fill(`Deposit Mess ${Date.now()}`);
  await admin.getByRole("button", { name: "Continue" }).click();
  await admin.getByRole("button", { name: "Continue" }).click();
  await admin.getByRole("button", { name: "Create mess" }).click();
  await expect(admin).toHaveURL(/\/members$/);
  const slug = new URL(admin.url()).pathname.split("/")[2];

  await admin.goto(`/m/${slug}`);
  const code = (await admin.getByRole("button", { name: /^Join code [A-Z0-9]+/ }).textContent())!.trim();
  const member = await newUser(browser, "Rafiq Payer");
  await member.goto(`/join?code=${code}`);
  await member.getByRole("button", { name: "Ask to join" }).click();
  await admin.goto(`/m/${slug}/members?tab=requests`);
  await admin.getByRole("button", { name: "Approve" }).click();
  await expect(admin.getByText("No requests right now")).toBeVisible();
  return { admin, member, slug };
}

test("a member's bKash deposit is confirmed and shows in their balance", async ({ browser }) => {
  const { admin, member, slug } = await messWithMember(browser);

  await member.goto(`/m/${slug}/deposits`);
  await member.getByRole("button", { name: "Add deposit" }).click();
  const form = member.getByRole("dialog");
  await form.getByLabel("Amount").fill("3000");
  await form.getByRole("radio", { name: "bKash" }).click();
  await form.getByLabel("Transaction ID").fill("9AX7K2LM3Q");
  await form.getByRole("button", { name: "Add deposit" }).click();
  await expect(member.getByText("Deposit sent for confirmation")).toBeVisible();
  await expect(member.getByText("9AX7K2LM3Q")).toBeVisible();

  // The same transaction can't be added twice.
  await member.getByRole("button", { name: "Add deposit" }).click();
  await member.getByRole("dialog").getByLabel("Amount").fill("3000");
  await member.getByRole("dialog").getByRole("radio", { name: "bKash" }).click();
  await member.getByRole("dialog").getByLabel("Transaction ID").fill("9ax7k2lm3q");
  await member.getByRole("dialog").getByRole("button", { name: "Add deposit" }).click();
  await expect(member.getByText("This bKash transaction is already recorded")).toBeVisible();
  await member.keyboard.press("Escape");

  await admin.goto(`/m/${slug}/deposits?tab=review`);
  await expect(admin.getByText("9AX7K2LM3Q")).toBeVisible();
  await admin.getByRole("button", { name: "Confirm" }).click();
  await expect(admin.getByText("All caught up")).toBeVisible();

  // No bazar yet, so the meal rate is 0 and the whole deposit is in credit.
  await member.goto(`/m/${slug}`);
  await expect(member.getByText("Refund ৳3,000.00")).toBeVisible();
  await member.goto(`/m/${slug}/months`);
  await expect(member.getByText(/so far$/)).toBeVisible();
  await expect(member.getByText("Refund ৳3,000.00").filter({ visible: true }).first()).toBeVisible();
});

test("a manager records cash for a member, and rejects a deposit the member then fixes", async ({
  browser,
}) => {
  const { admin, member, slug } = await messWithMember(browser);

  await admin.goto(`/m/${slug}/deposits`);
  await admin.getByRole("button", { name: "Record deposit" }).click();
  const form = admin.getByRole("dialog");
  await form.getByLabel("Member").click();
  await admin.getByRole("option", { name: "Rafiq Payer" }).click();
  await form.getByLabel("Amount").fill("1500");
  await form.getByRole("button", { name: "Record deposit" }).click();
  await expect(admin.getByText("Deposit recorded")).toBeVisible();
  await expect(admin.getByText("By member")).toBeVisible();

  await member.goto(`/m/${slug}/deposits`);
  await expect(member.getByText("1 confirmed")).toBeVisible();
  await member.getByRole("button", { name: "Add deposit" }).click();
  await member.getByRole("dialog").getByLabel("Amount").fill("2000");
  await member.getByRole("dialog").getByRole("button", { name: "Add deposit" }).click();
  await expect(member.getByText("Deposit sent for confirmation")).toBeVisible();

  await admin.goto(`/m/${slug}/deposits?tab=review`);
  await admin.getByRole("button", { name: "Reject" }).click();
  await admin.getByLabel("Reason").fill("I got 1800");
  await admin.getByRole("button", { name: "Reject deposit" }).click();
  await expect(admin.getByText("All caught up")).toBeVisible();

  await member.reload();
  await member.getByRole("button", { name: /Rejected/ }).click();
  await expect(member.getByRole("dialog").getByText("I got 1800")).toBeVisible();
  await member.getByRole("dialog").getByRole("button", { name: "Edit" }).click();
  const edit = member.getByRole("dialog", { name: "Edit deposit" });
  await edit.getByLabel("Amount").fill("1800");
  await edit.getByRole("button", { name: "Save deposit" }).click();
  await expect(member.getByText("Deposit updated")).toBeVisible();
  await expect(member.getByText("৳1,800.00").first()).toBeVisible();
  await expect(member.getByText("Pending").first()).toBeVisible();
});
