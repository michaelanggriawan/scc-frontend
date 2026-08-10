import { test, expect } from "@playwright/test";

// These smoke tests need BOTH servers up: backend on :4000, frontend on :3001.
// Seed the backend first (npm run seed) so admin@scc.example.com / admin12345 exists.

test("home renders and links to booking", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /every kind of event/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Book Now" }).click();
  await expect(page).toHaveURL(/\/booking/);
  await expect(
    page.getByRole("heading", { name: "Submit an Inquiry" }),
  ).toBeVisible();
});

test("guest can submit an inquiry", async ({ page }) => {
  await page.goto("/booking");
  await page.getByRole("heading", { name: "Submit an Inquiry" }).waitFor();
  await page.getByLabel("Full Name").fill("Playwright Guest");
  await page.getByLabel("Email").fill("playwright@example.com");
  await page.getByRole("button", { name: "Submit Inquiry" }).click();
  await expect(page.getByText(/Your inquiry reference is/i)).toBeVisible();
});

test("admin can log in and see the dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("admin@scc.example.com");
  await page.getByLabel("Password").fill("admin12345");
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(
    page.getByRole("heading", { name: "Dashboard" }),
  ).toBeVisible();
});
