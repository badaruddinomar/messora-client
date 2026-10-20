import path from "node:path";
import { expect, test, type Browser } from "@playwright/test";

const PASSWORD = "password123";
const RECEIPT = path.join(__dirname, "fixtures", "receipt.jpg");
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

/** An admin's mess with one approved member. */
async function messWithMember(browser: Browser) {
  const admin = await newUser(browser, "Bazar Admin");
  await admin.goto("/messes/new");
  await admin.getByLabel("Mess name").fill(`Bazar Mess ${Date.now()}`);
  await admin.getByRole("button", { name: "Continue" }).click();
  await admin.getByRole("button", { name: "Continue" }).click();
  await admin.getByRole("button", { name: "Create mess" }).click();
  await expect(admin).toHaveURL(/\/members$/);
  const slug = new URL(admin.url()).pathname.split("/")[2];

  await admin.goto(`/m/${slug}`);
  const code = (await admin.getByRole("button", { name: /^Join code [A-Z0-9]+/ }).textContent())!.trim();
  const member = await newUser(browser, "Sadia Shopper");
  await member.goto(`/join?code=${code}`);
  await member.getByRole("button", { name: "Ask to join" }).click();
  await admin.goto(`/m/${slug}/members?tab=requests`);
  await admin.getByRole("button", { name: "Approve" }).click();
  await expect(admin.getByText("No requests right now")).toBeVisible();
  return { admin, member, slug };
}

test("a member adds a bazar with a receipt and a manager approves it", async ({ browser }) => {
  const { admin, member, slug } = await messWithMember(browser);

  await member.goto(`/m/${slug}/bazar`);
  await member.getByRole("button", { name: "Add bazar" }).first().click();
  const form = member.getByRole("dialog");
  await form.getByLabel("Total").fill("1250.50");
  await form.getByLabel("Receipt photo").setInputFiles(RECEIPT);
  await expect(form.getByText("Receipt added")).toBeVisible();
  await form.getByRole("button", { name: "Add bazar" }).click();
  await expect(member.getByText("Bazar sent for approval")).toBeVisible();
  await expect(member.getByText("৳1,250.50").first()).toBeVisible();

  await admin.goto(`/m/${slug}/bazar?tab=review`);
  await expect(admin.getByRole("tab", { name: /To review/ })).toContainText("1");
  await admin.getByRole("button", { name: "Approve" }).click();
  await expect(admin.getByText("All caught up")).toBeVisible();

  await member.reload();
  await member.getByRole("tab", { name: "Bazars" }).click();
  await expect(member.getByText("1 approved · counts toward the meal rate")).toBeVisible();
  await member
    .getByRole("button", { name: /Sadia Shopper/ })
    .first()
    .click();
  await expect(member.getByRole("dialog").getByAltText("Receipt")).toBeVisible();
  await expect(member.getByRole("dialog").getByText("Approved by Bazar Admin")).toBeVisible();
});

test("an itemised bazar is rejected with a reason, fixed and resubmitted", async ({ browser }) => {
  const { admin, member, slug } = await messWithMember(browser);

  await member.goto(`/m/${slug}/bazar`);
  await member.getByRole("button", { name: "Add bazar" }).first().click();
  const form = member.getByRole("dialog");
  await form.getByRole("tab", { name: "List items" }).click();
  await form.getByLabel("Item 1", { exact: true }).fill("Rice");
  await form.getByLabel("Quantity").first().fill("5");
  await form.getByLabel("Price of item 1").fill("350.50");
  await form.getByLabel("Price of item 1").press("Enter");
  await form.getByLabel("Item 2", { exact: true }).fill("Eggs");
  await form.getByLabel("Price of item 2").fill("144");
  await expect(form.getByText("৳494.50")).toBeVisible();
  await form.getByRole("button", { name: "Add bazar" }).click();
  await expect(member.getByText("Bazar sent for approval")).toBeVisible();

  await admin.goto(`/m/${slug}/bazar?tab=review`);
  await admin.getByRole("button", { name: "Reject" }).click();
  await admin.getByLabel("Reason").fill("Eggs were 132");
  await admin.getByRole("button", { name: "Reject bazar" }).click();
  await expect(admin.getByText("All caught up")).toBeVisible();

  await member.reload();
  await member.getByRole("button", { name: /Rice, Eggs/ }).click();
  const detail = member.getByRole("dialog");
  await expect(detail.getByText("Eggs were 132")).toBeVisible();
  await detail.getByRole("button", { name: "Edit" }).click();
  const edit = member.getByRole("dialog", { name: "Edit bazar" });
  await edit.getByLabel("Price of item 2").fill("132");
  await edit.getByRole("button", { name: "Save bazar" }).click();
  await expect(member.getByText("Bazar updated")).toBeVisible();
  await expect(member.getByText("৳482.50").first()).toBeVisible();
});

test("a manager plans bazar duty and the member's bazar ticks it off", async ({ browser }) => {
  const { admin, member, slug } = await messWithMember(browser);

  await admin.goto(`/m/${slug}/bazar?tab=duty`);
  await expect(admin.getByText("No bazar duty planned")).toBeVisible();
  await admin.getByRole("button", { name: "Plan rotation" }).click();
  const plan = admin.getByRole("dialog");
  await plan.getByRole("button", { name: /Sadia Shopper/ }).click();
  await plan.getByRole("button", { name: /Bazar Admin/ }).click();
  await plan.getByRole("button", { name: "Plan duty" }).click();
  await expect(admin.getByText("Bazar duty planned").first()).toBeVisible();
  await expect(admin.getByText("Today", { exact: true })).toBeVisible();

  // The member is first in line, so they're on duty today.
  await member.goto(`/m/${slug}`);
  await expect(member.getByText("You're on bazar duty today")).toBeVisible();
  await member.getByRole("button", { name: "Add bazar" }).click();
  await member.getByRole("dialog").getByLabel("Total").fill("800");
  await member.getByRole("dialog").getByRole("button", { name: "Add bazar" }).click();
  await expect(member.getByText("Bazar sent for approval")).toBeVisible();
  await expect(member.getByText("You're on bazar duty today")).toBeHidden();

  await member.goto(`/m/${slug}/bazar?tab=duty`);
  await expect(member.getByLabel("Done").first()).toBeVisible();
});
