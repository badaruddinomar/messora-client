import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test, type Browser } from "@playwright/test";

const PASSWORD = "password123";
const DATABASE_URL = process.env.E2E_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/messora";
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
  const admin = await newUser(browser, "Report Admin");
  await admin.goto("/messes/new");
  await admin.getByLabel("Mess name").fill(`Report Mess ${Date.now()}`);
  await admin.getByRole("button", { name: "Continue" }).click();
  await admin.getByRole("button", { name: "Continue" }).click();
  await admin.getByRole("button", { name: "Create mess" }).click();
  await expect(admin).toHaveURL(/\/members$/);
  const slug = new URL(admin.url()).pathname.split("/")[2];

  await admin.goto(`/m/${slug}`);
  const code = (await admin.getByRole("button", { name: /^Join code [A-Z0-9]+/ }).textContent())!.trim();
  const member = await newUser(browser, "Sakib Sharer");
  await member.goto(`/join?code=${code}`);
  await member.getByRole("button", { name: "Ask to join" }).click();
  await admin.goto(`/m/${slug}/members?tab=requests`);
  await admin.getByRole("button", { name: "Approve" }).click();
  await expect(admin.getByText("No requests right now")).toBeVisible();

  // Someone else asks to join and waits.
  const waiting = await newUser(browser, "Wahid Waiting");
  await waiting.goto(`/join?code=${code}`);
  await waiting.getByRole("button", { name: "Ask to join" }).click();
  return { admin, member, slug };
}

/** This month: 1200 of bazar and 6000 of house rent paid from the fund, 1000 deposited by the admin. */
function addMoney(slug: string) {
  const mess = `(SELECT id FROM "Mess" WHERE slug = '${slug}')`;
  const sql = `
    INSERT INTO "Bazar" (id, "messId", "monthId", "shopperId", date, "totalAmount", status, "createdById", "updatedAt")
      SELECT gen_random_uuid(), mm."messId", mm.id, a.id, mm."startDate", 1200, 'APPROVED', a."userId", now()
      FROM "MessMonth" mm JOIN "MessMember" a ON a."messId" = mm."messId" AND a.role = 'ADMIN'
      WHERE mm."messId" = ${mess};
    INSERT INTO "SharedExpense" (id, "messId", "monthId", category, title, amount, "billDate", "createdById", "updatedAt")
      SELECT gen_random_uuid(), mm."messId", mm.id, 'HOUSE_RENT', 'Rent', 6000, mm."startDate", a."userId", now()
      FROM "MessMonth" mm JOIN "MessMember" a ON a."messId" = mm."messId" AND a.role = 'ADMIN'
      WHERE mm."messId" = ${mess};
    INSERT INTO "Deposit" (id, "messId", "monthId", "memberId", amount, status, "updatedAt")
      SELECT gen_random_uuid(), mm."messId", mm.id, a.id, 1000, 'APPROVED', now()
      FROM "MessMonth" mm JOIN "MessMember" a ON a."messId" = mm."messId" AND a.role = 'ADMIN'
      WHERE mm."messId" = ${mess};`;
  execFileSync("psql", [DATABASE_URL, "-v", "ON_ERROR_STOP=1", "-q", "-c", sql]);
}

test("managers see their desk and reports, export CSV; members see their own dashboard", async ({
  browser,
}) => {
  const { admin, member, slug } = await messWithMember(browser);
  addMoney(slug);

  await admin.goto(`/m/${slug}`);
  await expect(admin.getByText("Your desk")).toBeVisible();
  // 1000 deposited − 1200 bazar − 6000 rent.
  await expect(admin.getByText("−৳6,200.00")).toBeVisible();
  await expect(admin.getByRole("link", { name: /1 person wants to join/ })).toBeVisible();
  await expect(admin.getByText("Who owes what so far")).toBeVisible();
  await expect(admin.getByRole("link", { name: "Sakib Sharer" })).toBeVisible();
  await expect(admin.getByText(/^Meal rate is/)).toBeVisible();

  await admin.getByRole("link", { name: "Reports" }).first().click();
  await expect(admin).toHaveURL(/\/reports/);
  await expect(admin.getByText("All shared costs were house rent")).toBeVisible();
  await expect(admin.getByText(/^Most bazar on/)).toBeVisible();
  await expect(admin.getByText("Bazar list")).toBeVisible();

  // Every chart has a table view.
  const categories = admin.locator('[data-slot="card"]', { hasText: "All shared costs were house rent" });
  await categories.getByRole("button", { name: "Table" }).click();
  await expect(categories.getByRole("cell", { name: "House rent" })).toBeVisible();

  const download = admin.waitForEvent("download");
  await admin.getByRole("button", { name: "CSV" }).click();
  await admin.getByRole("menuitem", { name: "Everyone's bill" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(new RegExp(`^${slug}-\\d{4}-\\d{2}-summary\\.csv$`));
  const csv = readFileSync((await file.path())!, "utf8");
  expect(csv).toContain("Member,Meals,Meal cost");
  expect(csv).toContain("Sakib Sharer");

  await member.goto(`/m/${slug}`);
  await expect(member.getByText(/^Meal rate is/)).toBeVisible();
  await expect(member.getByText("Your desk")).toBeHidden();
});
