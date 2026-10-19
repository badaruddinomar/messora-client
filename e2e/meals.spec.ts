import { expect, test, type Browser, type Page } from "@playwright/test";
import { format, parseISO } from "date-fns";

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

/** An admin's mess (default meals) with one approved member. */
async function messWithMember(browser: Browser) {
  const admin = await newUser(browser, "Meal Admin");
  await admin.goto("/messes/new");
  await admin.getByLabel("Mess name").fill(`Meal Mess ${Date.now()}`);
  await admin.getByRole("button", { name: "Continue" }).click();
  await admin.getByRole("button", { name: "Continue" }).click();
  await admin.getByRole("button", { name: "Create mess" }).click();
  await expect(admin).toHaveURL(/\/members$/);
  const slug = new URL(admin.url()).pathname.split("/")[2];

  await admin.goto(`/m/${slug}`);
  const code = (await admin.getByRole("button", { name: /^Join code [A-Z0-9]+/ }).textContent())!.trim();
  const member = await newUser(browser, "Rahim Eater");
  await member.goto(`/join?code=${code}`);
  await member.getByRole("button", { name: "Ask to join" }).click();
  await admin.goto(`/m/${slug}/members?tab=requests`);
  await admin.getByRole("button", { name: "Approve" }).click();
  await expect(admin.getByText("No requests right now")).toBeVisible();
  return { admin, member, slug };
}

const toggle = (page: Page, meal: string) =>
  page.getByRole("button", { name: new RegExp(`^${meal}: (on|off)$`) });

test("a member switches meals and guests, and it sticks", async ({ browser }) => {
  const { member, slug } = await messWithMember(browser);

  await member.goto(`/m/${slug}/meals`);
  await member.getByRole("button", { name: "Next day" }).click();
  await expect(member.getByText("Tomorrow", { exact: true })).toBeVisible();

  // Usual meals are on, so every meal starts on.
  await expect(toggle(member, "Lunch")).toHaveAttribute("aria-pressed", "true");
  await toggle(member, "Lunch").click();
  await expect(toggle(member, "Lunch")).toHaveAttribute("aria-pressed", "false");
  await member
    .getByRole("group", { name: "Guests for Dinner" })
    .getByRole("button", { name: "More guests for dinner" })
    .click();
  await expect(member.getByText("You're eating · 1 guest")).toBeVisible();
  await expect(member.getByText("Your meals for the day: 2.5")).toBeVisible();

  await member.reload();
  await expect(toggle(member, "Lunch")).toHaveAttribute("aria-pressed", "false");
  await expect(member.getByText("You're eating · 1 guest")).toBeVisible();

  // The calendar counts the same meals.
  await member.getByRole("tab", { name: "Calendar" }).click();
  const day = format(parseISO(await tomorrow(member)), "EEEE d MMMM");
  await expect(member.getByRole("button", { name: `${day}: 2.5 meals` })).toBeVisible();
});

test("a member takes a meal-off and cancels it", async ({ browser }) => {
  const { member, slug } = await messWithMember(browser);
  await member.goto(`/m/${slug}/meals?date=${await tomorrow(member)}`);
  await expect(toggle(member, "Dinner")).toHaveAttribute("aria-pressed", "true");

  await member.getByRole("button", { name: "Meal off" }).first().click();
  await member.getByLabel("Reason").fill("Going home");
  await member.getByRole("button", { name: "Turn meals off" }).click();
  await expect(member.getByText("Meals turned off for those days")).toBeVisible();
  await expect(member.getByText("Going home")).toBeVisible();
  await expect(toggle(member, "Dinner")).toHaveAttribute("aria-pressed", "false");

  await member.getByRole("button", { name: "Cancel meal-off" }).click();
  await member.getByRole("button", { name: "Cancel meal-off" }).last().click();
  await expect(member.getByText("None planned")).toBeVisible();
  await expect(toggle(member, "Dinner")).toHaveAttribute("aria-pressed", "true");
});

test("a manager fixes counts on the meal sheet, posts the menu and answers a request", async ({
  browser,
}) => {
  const { admin, member, slug } = await messWithMember(browser);
  const date = await tomorrow(admin);

  await admin.goto(`/m/${slug}/meals?tab=sheet&date=${date}`);
  const cell = admin.getByLabel("Lunch meals for Rahim Eater").filter({ visible: true });
  await expect(cell).toHaveValue("1");
  await cell.fill("2");
  await cell.press("Enter");
  await expect(admin.getByRole("row", { name: /^Total/ })).toContainText("3");

  // Menu, posted from My meals.
  await admin.getByRole("tab", { name: "My meals" }).click();
  await admin.getByRole("button", { name: "Add menu" }).nth(1).click();
  await admin.getByLabel("What's cooking").fill("Khichuri and beef");
  await admin.getByRole("button", { name: "Post menu" }).click();
  await expect(admin.getByText("Khichuri and beef")).toBeVisible();

  // The member sees both.
  await member.goto(`/m/${slug}/meals?date=${date}`);
  await expect(member.getByText("Khichuri and beef")).toBeVisible();
  await expect(member.getByText("2 meals").first()).toBeVisible();

  // A request goes to the manager and back.
  await member.getByRole("tab", { name: "Requests" }).click();
  await member.getByRole("button", { name: "New request" }).click();
  await member.getByLabel("Your request").fill("Fish curry, please");
  await member.getByRole("button", { name: "Send request" }).click();
  await expect(member.getByText("Fish curry, please")).toBeVisible();

  await admin.goto(`/m/${slug}/meals?tab=requests`);
  await expect(admin.getByText("Fish curry, please")).toBeVisible();
  await admin.getByRole("button", { name: "Approve" }).click();
  await expect(admin.getByText("No pending requests")).toBeVisible();

  await member.reload();
  await expect(member.getByText("Approved", { exact: true })).toBeVisible();
});

test("an admin adds a meal in settings", async ({ browser }) => {
  const { admin, slug } = await messWithMember(browser);
  await admin.goto(`/m/${slug}/settings`);
  await admin.getByRole("button", { name: "Add meal" }).click();
  const dialog = admin.getByRole("dialog");
  await dialog.getByLabel("Name").fill("Snacks");
  await dialog.getByLabel("Cutoff").fill("15:00");
  await dialog.getByRole("button", { name: "Add meal" }).click();
  await expect(admin.getByText("Meal added")).toBeVisible();
  await expect(admin.getByText("Cutoff 3:00 PM")).toBeVisible();

  await admin.goto(`/m/${slug}/meals?date=${await tomorrow(admin)}`);
  await expect(toggle(admin, "Snacks")).toBeVisible();
});

/** Tomorrow in the mess timezone (Asia/Dhaka by default), so cutoffs never get in the way. */
async function tomorrow(page: Page) {
  return page.evaluate(() => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  });
}
