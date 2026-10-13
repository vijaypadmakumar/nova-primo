import { expect, type Page } from "@playwright/test";

/** A fresh random mobile number, so every test signs up its own office. */
export function randomMobile() {
  return `9${String(Math.floor(Math.random() * 1e9)).padStart(9, "0")}`;
}

/** Signs in with the on-screen test code and sets up a new office. */
export async function signUp(page: Page, { name = "Ravi", office = "Sri Balaji Transport" } = {}) {
  await page.goto("/login");
  await page.getByText("Sign in with your mobile number").click();
  await page.getByLabel("Mobile number").fill(randomMobile());
  await page.getByRole("button", { name: "Send code" }).click();

  const code = await page.getByTestId("dev-code").textContent();
  await page.getByLabel("6-digit code").fill(code!.trim());
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { name: "Set up your office" })).toBeVisible();
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Office name").fill(office);
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByRole("heading", { name: `Namaste, ${name}` })).toBeVisible();
}
