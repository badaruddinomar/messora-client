import { expect, test, type Browser, type Page } from "@playwright/test";

/*
 * Mess & membership flows across several users, against the real API.
 */

const PASSWORD = "password123";
const uniquePhone = () => `01${Math.floor(300000000 + Math.random() * 699999999)}`;

async function register(page: Page, name: string, next?: string) {
  const phone = uniquePhone();
  await page.goto(next ? `/register?next=${encodeURIComponent(next)}` : "/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Phone number").fill(phone);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  return phone;
}

async function newUser(browser: Browser, name: string) {
  const page = await (await browser.newContext()).newPage();
  await register(page, name);
  await expect(page).toHaveURL(/\/messes$/);
  return page;
}

async function createMess(page: Page, name: string) {
  await page.goto("/messes/new");
  await page.getByLabel("Mess name").fill(name);
  await page.getByLabel(/^Address/).fill("Mirpur 10, Dhaka");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText(/Runs from the 1st/)).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByPlaceholder("Meal name").first()).toHaveValue("Breakfast");
  await page.getByRole("button", { name: "Create mess" }).click();
  await expect(page).toHaveURL(/\/m\/[a-z0-9-]+\/members$/);
  return new URL(page.url()).pathname.split("/")[2];
}

test("a new user lands on the hub, creates a mess and is its admin", async ({ page }) => {
  await register(page, "Rahim Uddin");
  // /dashboard sends people without a mess to the hub.
  await expect(page).toHaveURL(/\/messes$/);
  await expect(page.getByRole("heading", { name: /Welcome, Rahim/ })).toBeVisible();

  const slug = await createMess(page, `Green House ${Date.now()}`);
  await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
  await expect(page.getByText("Rahim Uddin").filter({ visible: true }).first()).toBeVisible();

  // Overview shows the join code to the admin, and /dashboard now opens this mess.
  await page.goto("/dashboard");
  await expect(page).toHaveURL(new RegExp(`/m/${slug}$`));
  await expect(page.getByText("Join code", { exact: true })).toBeVisible();
});

test("joining with a code needs a manager's approval", async ({ browser }) => {
  const admin = await newUser(browser, "Admin User");
  const slug = await createMess(admin, `Code Mess ${Date.now()}`);
  await admin.goto(`/m/${slug}`);
  const code = (await admin.getByRole("button", { name: /^Join code [A-Z0-9]+/ }).textContent())!.trim();

  const joiner = await newUser(browser, "Karim Join");
  await joiner.goto(`/join?code=${code}`);
  await joiner.getByRole("button", { name: "Ask to join" }).click();
  await expect(joiner.getByRole("heading", { name: "Request sent" })).toBeVisible();

  // Pending members see a waiting screen instead of the mess.
  await joiner.goto(`/m/${slug}`);
  await expect(joiner.getByText("Waiting for approval")).toBeVisible();

  await admin.goto(`/m/${slug}/members?tab=requests`);
  await admin.getByRole("button", { name: "Approve" }).click();
  await expect(admin.getByText("No requests right now")).toBeVisible();

  await joiner.reload();
  await expect(joiner.getByRole("heading", { level: 1, name: /Code Mess/ })).toBeVisible();
});

test("an invitation link lets a new person sign up and join directly", async ({ browser }) => {
  const admin = await newUser(browser, "Invite Admin");
  const slug = await createMess(admin, `Invite Mess ${Date.now()}`);

  await admin.getByRole("button", { name: "Invite", exact: true }).click();
  await admin.getByLabel("Phone number").fill(uniquePhone());
  await admin.getByRole("button", { name: "Create invitation" }).click();
  const link = await admin.getByLabel("Invitation link").inputValue();
  expect(link).toMatch(/\/invite\/[a-f0-9]{64}$/);

  const guestPage = await (await browser.newContext()).newPage();
  await guestPage.goto(link);
  await expect(guestPage.getByText(/Invite Admin invited you to join/)).toBeVisible();
  await guestPage.getByRole("link", { name: "Create an account to join" }).click();

  await guestPage.getByLabel("Full name").fill("Invited Guest");
  await guestPage.getByLabel("Phone number").fill(uniquePhone());
  await guestPage.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await guestPage.getByRole("button", { name: "Create account" }).click();

  // Back on the invitation, now logged in.
  await guestPage.getByRole("button", { name: /^Join Invite Mess/ }).click();
  await expect(guestPage).toHaveURL(new RegExp(`/m/${slug}$`));

  await admin.goto(`/m/${slug}/members`);
  await expect(admin.getByText("Invited Guest").filter({ visible: true }).first()).toBeVisible();
});

test("admins manage roles; the last admin can't leave", async ({ browser }) => {
  const admin = await newUser(browser, "Role Admin");
  const slug = await createMess(admin, `Role Mess ${Date.now()}`);
  await admin.goto(`/m/${slug}`);
  const code = (await admin.getByRole("button", { name: /^Join code [A-Z0-9]+/ }).textContent())!.trim();

  const member = await newUser(browser, "Plain Member");
  await member.goto(`/join?code=${code}`);
  await member.getByRole("button", { name: "Ask to join" }).click();
  await admin.goto(`/m/${slug}/members?tab=requests`);
  await admin.getByRole("button", { name: "Approve" }).click();

  await admin.getByRole("tab", { name: "Active" }).click();
  await admin.getByRole("button", { name: "Actions for Plain Member" }).filter({ visible: true }).click();
  await admin.getByRole("menuitem", { name: "Make manager" }).click();
  await expect(admin.getByText("Plain is now manager")).toBeVisible();

  // The only admin can't leave.
  await admin.goto(`/m/${slug}/settings`);
  await admin.getByRole("button", { name: "Leave mess" }).click();
  await admin.getByRole("button", { name: "Leave mess" }).last().click();
  await expect(admin.getByText(/You're the only admin/)).toBeVisible();

  // Members can't change settings.
  await member.goto(`/m/${slug}/settings`);
  await expect(member.getByText("Only admins can change these settings.")).toBeVisible();
  await expect(member.getByLabel("Mess name")).toBeDisabled();
});
