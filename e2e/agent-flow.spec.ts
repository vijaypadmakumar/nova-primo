import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test("sign in rejects a wrong mobile number", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Mobile number").fill("12345");
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByText("Please enter a valid 10-digit mobile number.")).toBeVisible();
});

test("a signed-out visitor is sent to sign in", async ({ page }) => {
  await page.goto("/loads");
  await expect(page).toHaveURL(/\/login$/);
});

test("agent creates a party, books two loads and finds them again", async ({ page }) => {
  await signUp(page);

  // Create a party from the new-load screen and come straight back.
  await page.goto("/loads/new");
  await page.getByRole("link", { name: "+ Create a new party" }).click();
  await page.getByLabel("Name").fill("Shree Cement Traders");
  await page.getByLabel("City").fill("Bengaluru");
  await page.getByLabel("Mobile number").fill("98450 12345");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "New load" })).toBeVisible();
  await expect(page.getByLabel("Party (shipper)")).toHaveValue(/.+/);

  // Book the first load.
  await page.getByRole("textbox", { name: "From", exact: true }).fill("Bengaluru");
  await page.getByRole("textbox", { name: "To", exact: true }).fill("Chennai");
  await page.getByLabel("Goods").fill("Cement bags");
  await page.getByLabel("Weight (tonnes)").fill("9.5");
  await page.getByLabel("Truck type").selectOption("open_body");
  await page.getByLabel("Party freight").fill("45,000");
  await page.getByRole("button", { name: "Save load" }).click();
  await expect(page.getByText("Load 1 is saved.")).toBeVisible();
  await expect(page.getByText("₹45,000")).toBeVisible();
  await expect(page.getByText("9.5 t")).toBeVisible();

  // The second load for the same party offers the saved route.
  await page.goto("/loads/new");
  await page.getByLabel("Party (shipper)").selectOption({ label: "Shree Cement Traders (Bengaluru)" });
  await page.getByRole("button", { name: "Bengaluru → Chennai" }).click();
  await expect(page.getByRole("textbox", { name: "To", exact: true })).toHaveValue("Chennai");
  await expect(page.getByLabel("Goods")).toHaveValue("Cement bags");
  await page.getByRole("button", { name: "Save load" }).click();
  await expect(page.getByText("Load 2 is saved.")).toBeVisible();

  // Both loads show on the board and on the party's page.
  await page.goto("/loads");
  await expect(page.getByRole("link", { name: /Truck needed\s*2/ })).toBeVisible();
  await page.goto("/masters/shippers");
  await page.getByRole("link", { name: "Shree Cement Traders" }).first().click();
  await expect(page.getByRole("heading", { name: "Loads from this party (2)" })).toBeVisible();
});

test("form errors are shown next to the field", async ({ page }) => {
  await signUp(page);
  await page.goto("/masters/vehicles/new");
  await page.getByLabel("Vehicle number").fill("ka 01 ab 1234");
  await page.getByLabel("Capacity (tonnes)").fill("nine");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Enter a number, like 9 or 9.5.")).toBeVisible();
  await expect(page.getByLabel("Vehicle number")).toHaveValue("ka 01 ab 1234");

  await page.getByLabel("Capacity (tonnes)").fill("16");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "KA01AB1234" })).toBeVisible();
});

test("the agent can switch the screens to Hindi", async ({ page }) => {
  await signUp(page);
  await page.getByRole("button", { name: "हिंदी" }).first().click();
  await expect(page.getByRole("heading", { name: "नमस्ते, Ravi" })).toBeVisible();
  await page.getByRole("button", { name: "English" }).first().click();
  await expect(page.getByRole("heading", { name: "Namaste, Ravi" })).toBeVisible();
});
