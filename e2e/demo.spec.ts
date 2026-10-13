import { expect, test } from "@playwright/test";

test("the demo walks a load from booking to the driver's phone", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Try the demo" }).click();

  // Sample office with money and loads in every stage.
  await expect(page.getByRole("heading", { name: "Namaste, Ravi" })).toBeVisible();
  await expect(page.getByText("Demo mode: sample data only.")).toBeVisible();
  await expect(page.getByText("Your margin")).toBeVisible();

  // Fix a truck for an open load.
  await page.goto("/loads?stage=open");
  await page
    .locator("tr, li")
    .filter({ hasText: "Tiruppur → Hyderabad", visible: true })
    .getByRole("link")
    .first()
    .click();
  await page.getByLabel("Vehicle").selectOption({ label: "PB10GH3344 · Singh Carriers (Harpreet Singh)" });
  await page.getByLabel("Driver").selectOption({ label: "Gurpreet Singh" });
  await page.getByLabel("Truck hire").fill("29000");
  await page.getByLabel("Advance to owner").fill("20000");
  await page.getByRole("button", { name: "Fix truck" }).click();
  await expect(page.getByText("Truck fixed. The driver gets the trip link on WhatsApp.")).toBeVisible();
  await expect(page.getByText("ਸਤ ਸ੍ਰੀ ਅਕਾਲ Gurpreet")).toBeVisible();
  await expect(page.getByText("₹5,000")).toBeVisible(); // 34,000 freight − 29,000 hire

  // Play the driver: first two steps and the LR photo.
  await page.getByRole("link", { name: "Open driver's phone" }).click();
  await page.getByRole("button", { name: "ਲੋਡਿੰਗ ਵਾਲੀ ਥਾਂ ਪਹੁੰਚ ਗਏ", exact: true }).click();
  await page.getByRole("button", { name: "ਲੋਡਿੰਗ ਹੋ ਗਈ", exact: true }).click();
  await page.getByRole("button", { name: /LR/ }).click();
  await page.getByRole("link", { name: "← Back to the load" }).click();

  await expect(page.getByText("On the way").first()).toBeVisible();
  await expect(page.getByText(/^Received /)).toBeVisible();

  // Connections show who works with whom.
  await page.goto("/connections?view=drivers");
  await expect(page.getByRole("link", { name: "Gurpreet Singh" })).toBeVisible();

  // Reset puts the sample data back.
  await page.getByRole("button", { name: "Start the demo again" }).click();
  await expect(page.getByText("The demo is back to its starting sample data.")).toBeVisible();
});
