import { execFileSync } from "node:child_process";
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
  const admin = await newUser(browser, "Close Admin");
  await admin.goto("/messes/new");
  await admin.getByLabel("Mess name").fill(`Close Mess ${Date.now()}`);
  await admin.getByRole("button", { name: "Continue" }).click();
  await admin.getByRole("button", { name: "Continue" }).click();
  await admin.getByRole("button", { name: "Create mess" }).click();
  await expect(admin).toHaveURL(/\/members$/);
  const slug = new URL(admin.url()).pathname.split("/")[2];

  await admin.goto(`/m/${slug}`);
  const code = (await admin.getByRole("button", { name: /^Join code [A-Z0-9]+/ }).textContent())!.trim();
  const member = await newUser(browser, "Rafi Resident");
  await member.goto(`/join?code=${code}`);
  await member.getByRole("button", { name: "Ask to join" }).click();
  await admin.goto(`/m/${slug}/members?tab=requests`);
  await admin.getByRole("button", { name: "Approve" }).click();
  await expect(admin.getByText("No requests right now")).toBeVisible();
  return { admin, member, slug };
}

/**
 * A month can only close once it has ended, so the mess's first month is moved back to last month,
 * with 1200 of bazar (no meals, so shared equally) and a 1000 deposit from the admin.
 */
function lastMonthWithMoney(slug: string) {
  const sql = `
    WITH m AS (SELECT id FROM "Mess" WHERE slug = '${slug}'),
         admin AS (SELECT id, "userId" FROM "MessMember" WHERE "messId" = (SELECT id FROM m) AND role = 'ADMIN'),
         prev AS (SELECT (date_trunc('month', current_date) - interval '1 month')::date AS s,
                         (date_trunc('month', current_date) - interval '1 day')::date AS e)
    UPDATE "MessMonth" SET "startDate" = prev.s, "endDate" = prev.e,
      year = extract(year FROM prev.s), month = extract(month FROM prev.s)
    FROM prev WHERE "messId" = (SELECT id FROM m);
    UPDATE "MessMember" SET "joinedAt" = (date_trunc('month', current_date) - interval '1 month')::date
      WHERE "messId" = (SELECT id FROM "Mess" WHERE slug = '${slug}');
    UPDATE "MessSetting" SET "autoGenerateMeals" = false
      WHERE "messId" = (SELECT id FROM "Mess" WHERE slug = '${slug}');
    DELETE FROM "MealEntry" WHERE "messId" = (SELECT id FROM "Mess" WHERE slug = '${slug}');
    INSERT INTO "Bazar" (id, "messId", "monthId", "shopperId", date, "totalAmount", status, "createdById", "updatedAt")
      SELECT gen_random_uuid(), mm."messId", mm.id, a.id, mm."startDate" + 2, 1200, 'APPROVED', a."userId", now()
      FROM "MessMonth" mm JOIN "MessMember" a ON a."messId" = mm."messId" AND a.role = 'ADMIN'
      WHERE mm."messId" = (SELECT id FROM "Mess" WHERE slug = '${slug}');
    INSERT INTO "Deposit" (id, "messId", "monthId", "memberId", amount, status, "updatedAt")
      SELECT gen_random_uuid(), mm."messId", mm.id, a.id, 1000, 'APPROVED', now()
      FROM "MessMonth" mm JOIN "MessMember" a ON a."messId" = mm."messId" AND a.role = 'ADMIN'
      WHERE mm."messId" = (SELECT id FROM "Mess" WHERE slug = '${slug}');`;
  execFileSync("psql", [DATABASE_URL, "-v", "ON_ERROR_STOP=1", "-q", "-c", sql]);
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

test("a manager closes an ended month, members see their bill and dues, and balances get settled", async ({
  browser,
}) => {
  const { admin, member, slug } = await messWithMember(browser);
  const label = lastMonthWithMoney(slug);

  await admin.goto(`/m/${slug}/months`);
  await expect(admin.getByText(`${label} has ended`)).toBeVisible();
  await admin.getByRole("link", { name: `Review & close ${label}` }).click();
  await expect(admin.getByRole("heading", { name: label })).toBeVisible();

  await admin.getByRole("button", { name: "Close month" }).click();
  const wizard = admin.getByRole("dialog");
  await expect(wizard.getByText(`${label} has ended`)).toBeVisible();
  await expect(wizard.getByText("Nothing is waiting for approval")).toBeVisible();
  await expect(wizard.getByText("the bazar will be shared equally")).toBeVisible();
  await wizard.getByRole("button", { name: "Start closing" }).click();
  await expect(wizard.getByText("Cash in hand")).toBeVisible();
  await expect(wizard.getByText("Rafi Resident")).toBeVisible();
  await wizard.getByRole("button", { name: `Close ${label}` }).click();
  await expect(wizard.getByText(`${label} is closed`)).toBeVisible();
  await wizard.getByRole("link", { name: "Settle up" }).click();

  await expect(admin.getByText("Still to collect")).toBeVisible();
  await expect(admin.getByText("৳600.00").first()).toBeVisible();

  // The member sees what they owe on the overview, and their bill line by line.
  await member.goto(`/m/${slug}`);
  await expect(member.getByText(`from ${label}`)).toBeVisible();
  await expect(member.getByText("You owe the mess")).toBeVisible();
  await member.getByRole("link", { name: "See my bill" }).click();
  await expect(member.getByText("Shared costs").first()).toBeVisible();
  await expect(member.getByText("৳600.00").first()).toBeVisible();

  await admin.getByRole("button", { name: "Record payment" }).click();
  await admin.getByRole("dialog").getByRole("button", { name: "Record payment" }).click();
  await expect(admin.getByText("Rafi Resident is settled")).toBeVisible();
  await admin.getByRole("button", { name: "Record refund" }).click();
  await admin.getByRole("dialog").getByRole("button", { name: "Record refund" }).click();
  await expect(admin.getByText("Close Admin is settled")).toBeVisible();
  await expect(admin.getByText(`Every ${label} balance is paid.`)).toBeVisible();

  await member.goto(`/m/${slug}`);
  await expect(member.getByText("You owe the mess")).toBeHidden();
});
