import { expect, test, type Page } from "@playwright/test";

/*
 * Auth flows against the real API. Flows that need the emailed code (verify email, reset password)
 * are covered by the server's integration tests, which can read the outgoing mail.
 */

const uniquePhone = () => `01${Math.floor(300000000 + Math.random() * 699999999)}`;
const PASSWORD = "password123";

async function register(page: Page, { phone = uniquePhone(), email = "" } = {}) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Karim Uddin");
  await page.getByLabel("Phone number").fill(phone);
  if (email) await page.getByLabel(/^Email/).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  return { phone };
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login/);
}

test("guests are sent to login, then back to where they were going", async ({ page }) => {
  const { phone } = await register(page);
  // Without a mess yet, the dashboard sends people to the messes hub.
  await expect(page).toHaveURL(/\/messes$/);
  await logout(page);

  await page.goto("/verify-email");
  await expect(page).toHaveURL(/\/login\?next=%2Fverify-email/);

  await page.getByLabel("Phone or email").fill(phone);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/verify-email$/);
});

test("registering with an email goes straight to email verification", async ({ page }) => {
  await register(page, { email: `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com` });
  await expect(page).toHaveURL(/\/verify-email$/);
  await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();
});

test("shows validation errors inline and server errors in an alert", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter your full name")).toBeVisible();
  await expect(page.getByText("Enter your phone number")).toBeVisible();

  await page.goto("/login");
  await page.getByLabel("Phone or email").fill("nobody@example.com");
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.locator("[data-slot=alert]")).toContainText("Invalid credentials");
});

test("the session survives a reload and silently refreshes an expired access token", async ({
  page,
  context,
}) => {
  await register(page);
  await expect(page.getByRole("heading", { name: /Welcome, Karim/ })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: /Welcome, Karim/ })).toBeVisible();

  await context.clearCookies({ name: "access_token" });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Welcome, Karim/ })).toBeVisible();
});

test("logged-in users can't open the auth pages", async ({ page }) => {
  await register(page);
  await expect(page).toHaveURL(/\/messes$/);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/messes$/);
});

test("the theme can be switched from the account menu", async ({ page }) => {
  await register(page);
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitemradio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
