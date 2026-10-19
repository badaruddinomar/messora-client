import { expect, test, type Browser, type Page } from "@playwright/test";
import { format } from "date-fns";

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

async function createMess(page: Page, name: string) {
  await page.goto("/messes/new");
  await page.getByLabel("Mess name").fill(name);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Create mess" }).click();
  await expect(page).toHaveURL(/\/members$/);
  return new URL(page.url()).pathname.split("/")[2];
}

test("the current month is open, and an admin can hand a member this month's manager powers", async ({
  browser,
}) => {
  const thisMonth = format(new Date(), "MMMM yyyy");
  const admin = await newUser(browser, "Month Admin");
  const slug = await createMess(admin, `Month Mess ${Date.now()}`);

  await admin.goto(`/m/${slug}`);
  const code = (await admin.getByRole("button", { name: /^Join code [A-Z0-9]+/ }).textContent())!.trim();
  const member = await newUser(browser, "Karim Manager");
  await member.goto(`/join?code=${code}`);
  await member.getByRole("button", { name: "Ask to join" }).click();
  await admin.goto(`/m/${slug}/members?tab=requests`);
  await admin.getByRole("button", { name: "Approve" }).click();
  await expect(admin.getByText("No requests right now")).toBeVisible();

  // The months page shows the open current month without a manager.
  await admin.goto(`/m/${slug}/months`);
  await expect(admin.getByText(thisMonth).first()).toBeVisible();
  await expect(admin.getByText("Open", { exact: true })).toBeVisible();
  await expect(admin.getByText("No month manager").first()).toBeVisible();

  await admin.getByRole("button", { name: "Assign" }).click();
  await admin.getByLabel("Month manager").click();
  await admin.getByRole("option", { name: "Karim Manager" }).click();
  await admin.getByRole("button", { name: "Save" }).click();
  await expect(admin.getByText(`Karim Manager manages ${thisMonth}`)).toBeVisible();

  // The member now has manager powers for this month.
  await member.goto(`/m/${slug}`);
  await expect(member.getByText("Manager of this month")).toBeVisible();
  await expect(member.getByRole("button", { name: "Invite members" })).toBeVisible();
  await member.goto(`/m/${slug}/members`);
  await expect(member.getByRole("tab", { name: /Requests/ })).toBeVisible();

  // …but only admins can change who manages the month.
  await member.goto(`/m/${slug}/months`);
  await expect(member.getByText("Karim Manager").first()).toBeVisible();
  await expect(member.getByRole("button", { name: "Change" })).toHaveCount(0);
});
