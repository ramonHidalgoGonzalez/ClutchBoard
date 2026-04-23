import { expect, test } from "@playwright/test"

test("login mockeado y navegacion principal", async ({ page }) => {
  await page.goto("/login")
  await page.waitForURL("**/dashboard")
  await expect(page.getByRole("heading", { name: "RruMu#EUW" })).toBeVisible()

  await page.goto("/matches")
  await expect(page.getByRole("heading", { name: "Historial, filtros y comparativas" })).toBeVisible()

  await page.goto("/improvement")
  await expect(page.getByRole("heading", { name: "Coach mode explicable" })).toBeVisible()
})
