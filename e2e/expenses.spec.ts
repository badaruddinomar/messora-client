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
  const admin = await newUser(browser, "Cost Admin");
  await admin.goto("/messes/new");
  await admin.getByLabel("Mess name").fill(`Cost Mess ${Date.now()}`);
  await admin.getByRole("button", { name: "Continue" }).click();
  await admin.getByRole("button", { name: "Continue" }).click();
  await admin.getByRole("button", { name: "Create mess" }).click();
  await expect(admin).toHaveURL(/\/members$/);
  const slug = new URL(admin.url()).pathname.split("/")[2];

  await admin.goto(`/m/${slug}`);
  const code = (await admin.getByRole("button", { name: /^Join code [A-Z0-9]+/ }).textContent())!.trim();
  const member = await newUser(browser, "Tanvir Tenant");
  await member.goto(`/join?code=${code}`);
  await member.getByRole("button", { name: "Ask to join" }).click();
  await admin.goto(`/m/${slug}/members?tab=requests`);
  await admin.getByRole("button", { name: "Approve" }).click();
  await expect(admin.getByText("No requests right now")).toBeVisible();
  return { admin, member, slug };
}

test("an admin sets up rooms and seats, and the member's seat rent shows in their balance", async ({
  browser,
}) => {
  const { admin, member, slug } = await messWithMember(browser);

  await admin.goto(`/m/${slug}/rooms`);
  await admin.getByRole("button", { name: "Add room" }).click();
  await admin.getByLabel("Name").fill("Room 1");
  await admin.getByRole("dialog").getByRole("button", { name: "Add room" }).click();
  await expect(admin.getByText("Room added")).toBeVisible();

  await admin.getByRole("button", { name: "Seat" }).click();
  await admin.getByLabel("Seat", { exact: true }).fill("Bed A");
  await admin.getByLabel("Monthly rent").fill("3000");
  await admin.getByRole("button", { name: "Add seat" }).click();
  await expect(admin.getByText("Seat added")).toBeVisible();

  await admin.getByRole("button", { name: "Options for Bed A" }).click();
  await admin.getByRole("menuitem", { name: "Put someone here" }).click();
  await admin.getByLabel("Member").click();
  await admin.getByRole("option", { name: "Tanvir Tenant" }).click();
  await admin.getByRole("button", { name: "Save" }).click();
  await expect(admin.getByText("Tanvir Tenant is in Bed A")).toBeVisible();

  await member.goto(`/m/${slug}/rooms`);
  await expect(member.getByText("Tanvir Tenant").first()).toBeVisible();
  await expect(member.getByRole("button", { name: "Add room" })).toBeHidden();
  await member.goto(`/m/${slug}`);
  await expect(member.getByText("Seat rent")).toBeVisible();
});

test("a manager adds shared costs with a live split, pays the cook, and adds charges", async ({
  browser,
}) => {
  const { admin, member, slug } = await messWithMember(browser);

  await admin.goto(`/m/${slug}/expenses`);
  await admin.getByRole("button", { name: "Add expense" }).click();
  const form = admin.getByRole("dialog");
  await form.getByLabel("Amount").fill("900");
  await expect(form.getByText("Who pays what")).toBeVisible();
  await expect(form.getByText("৳450.00").first()).toBeVisible();

  // Custom shares have to add up.
  await form.getByRole("radio", { name: "Set amounts" }).click();
  await form.getByLabel("Cost Admin").fill("600");
  await expect(form.getByText("Left ৳300.00")).toBeVisible();
  await form.getByLabel("Tanvir Tenant").fill("300");
  await expect(form.getByText("Adds up")).toBeVisible();
  await form.getByRole("button", { name: "Add expense" }).click();
  await expect(admin.getByText("Expense added")).toBeVisible();
  await expect(admin.getByText("Electricity bill")).toBeVisible();

  await member.goto(`/m/${slug}/expenses`);
  await expect(member.getByText("You: ৳300.00")).toBeVisible();
  await expect(member.getByRole("button", { name: "Add expense" })).toBeHidden();

  // Staff and salary.
  await admin.getByRole("tab", { name: "Staff" }).click();
  await admin.getByRole("button", { name: "Add staff" }).click();
  await admin.getByLabel("Name").fill("Rahima Khala");
  await admin.getByLabel("Monthly salary").fill("6000");
  await admin.getByRole("dialog").getByRole("button", { name: "Add staff" }).click();
  await expect(admin.getByText("Staff added")).toBeVisible();
  await admin.getByRole("button", { name: "Pay", exact: true }).click();
  await admin.getByRole("button", { name: "Record salary" }).click();
  await expect(admin.getByText("Rahima Khala's salary recorded")).toBeVisible();
  await expect(admin.getByText(/^Paid/)).toBeVisible();

  // A credit for the member.
  await admin.getByRole("tab", { name: "Charges" }).click();
  await admin.getByRole("button", { name: "Add charge" }).click();
  const charge = admin.getByRole("dialog");
  await charge.getByLabel("Member").click();
  await admin.getByRole("option", { name: "Tanvir Tenant" }).click();
  await charge.getByRole("radio", { name: "Adjustment" }).click();
  await charge.getByRole("radio", { name: "Take off the bill" }).click();
  await charge.getByLabel("Amount").fill("100");
  await charge.getByLabel("What it's for").fill("Fixed the tap");
  await charge.getByRole("button", { name: "Add charge" }).click();
  await expect(admin.getByText("Charge added")).toBeVisible();

  await member.goto(`/m/${slug}/expenses?tab=charges`);
  await expect(member.getByText("Fixed the tap")).toBeVisible();
  await expect(member.getByText("−৳100.00").first()).toBeVisible();
  await member.goto(`/m/${slug}/expenses`);
  await expect(member.getByText("Rahima Khala's salary")).toBeVisible();
});
