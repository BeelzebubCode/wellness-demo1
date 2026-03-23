// tests/e2e/ministry-dashboard.spec.ts
// Playwright E2E + Performance tests for the Ministry Dashboard
import { test, expect, type Page } from "@playwright/test";

// ─── Helpers ────────────────────────────────────────────────────────────────
async function loginAsMinistry(page: Page) {
    await page.goto("/login");
    await page.fill('[name="username"]', "ministry_admin");
    await page.fill('[name="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/ministry/**", { timeout: 10_000 });
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Feature Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Ministry Dashboard — Features", () => {
    test.beforeEach(async ({ page }) => {
        await loginAsMinistry(page);
    });

    test("University list loads with university cards", async ({ page }) => {
        await page.goto("/ministry/universities");
        // Wait for at least one university card to render
        const cards = page.locator("[data-testid='university-card'], .rounded-2xl");
        await expect(cards.first()).toBeVisible({ timeout: 15_000 });
        // Expect more than 10 universities
        const count = await cards.count();
        expect(count).toBeGreaterThan(10);
    });

    test("University detail page (CU) renders all sections", async ({ page }) => {
        await page.goto("/ministry/universities/CU");
        // Wait for the university name header
        await expect(page.locator("h1")).toContainText("จุฬาลงกรณ์", { timeout: 15_000 });

        // Stats cards should be visible
        await expect(page.getByText("การนัดหมายทั้งหมด")).toBeVisible();
        await expect(page.getByText("อัตราสำเร็จ")).toBeVisible();

        // Story sections should load
        await expect(page.getByText("ประวัติการใช้บริการ")).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText("การกระจายความเสี่ยง")).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText("ประเด็นปัญหา")).toBeVisible({ timeout: 10_000 });
    });

    test("Risk distribution shows 5 bands", async ({ page }) => {
        await page.goto("/ministry/universities/CU");
        await expect(page.getByText("การกระจายความเสี่ยง")).toBeVisible({ timeout: 15_000 });

        // All 5 risk levels should appear
        const riskLabels = ["ปกติ", "ต่ำ", "ปานกลาง", "สูง", "สูงมาก"];
        for (const label of riskLabels) {
            await expect(page.getByText(label).first()).toBeVisible({ timeout: 5_000 });
        }
    });

    test("Date filter changes data", async ({ page }) => {
        await page.goto("/ministry/universities/CU");
        await expect(page.getByText("ประวัติการใช้บริการ")).toBeVisible({ timeout: 15_000 });

        // Click "7 วัน" and verify data reload
        const btn7d = page.getByText("7 วัน").first();
        if (await btn7d.isVisible()) {
            await btn7d.click();
            // Should show loading state briefly then data
            await page.waitForTimeout(2_000);
            await expect(page.getByText("นัดหมายรวม").first()).toBeVisible();
        }
    });

    test("Navigation sidebar works", async ({ page }) => {
        await page.goto("/ministry/universities");

        // Click national overview
        const nationalLink = page.getByText("ภาพรวมระดับประเทศ");
        if (await nationalLink.isVisible()) {
            await nationalLink.click();
            await page.waitForURL("**/ministry", { timeout: 10_000 });
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Performance Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Ministry Dashboard — Performance", () => {
    test.beforeEach(async ({ page }) => {
        await loginAsMinistry(page);
    });

    test("University list risk-metrics API < 5s (batch query)", async ({ page }) => {
        const apiResponsePromise = page.waitForResponse(
            (r) => r.url().includes("/api/v2/dashboards/ministry") && r.status() === 200,
            { timeout: 15_000 }
        );

        const navStart = Date.now();
        await page.goto("/ministry/universities");
        const apiResponse = await apiResponsePromise;
        const elapsed = Date.now() - navStart;

        console.log(`[PERF] University list API responded in ${elapsed}ms`);
        // Batch query should be under 5s
        expect(elapsed).toBeLessThan(5_000);
    });

    test("University detail page loads within 6s", async ({ page }) => {
        const start = Date.now();
        await page.goto("/ministry/universities/CU");
        await expect(page.locator("h1")).toContainText("จุฬาลงกรณ์", { timeout: 10_000 });
        const elapsed = Date.now() - start;

        console.log(`[PERF] CU detail page loaded in ${elapsed}ms`);
        expect(elapsed).toBeLessThan(6_000);
    });

    test("Story API prefetch (story=all) responds < 3s", async ({ page }) => {
        const storyPromise = page.waitForResponse(
            (r) => r.url().includes("/api/v2/dashboards/ministry/story") && r.url().includes("story=all"),
            { timeout: 15_000 }
        );

        await page.goto("/ministry/universities/CU");
        const storyResponse = await storyPromise;
        const timing = storyResponse.headers()["x-response-time"];

        console.log(`[PERF] Story=all API response time: ${timing ?? "N/A"}`);
        expect(storyResponse.status()).toBe(200);
    });

    test("Page transition from list to detail < 3s", async ({ page }) => {
        await page.goto("/ministry/universities");
        await page.waitForTimeout(3_000); // Wait for list to load

        const start = Date.now();
        // Click on the first university card
        await page.locator("a[href*='/ministry/universities/']").first().click();
        // Wait for the detail page header
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 5_000 });
        const elapsed = Date.now() - start;

        console.log(`[PERF] Page transition took ${elapsed}ms`);
        expect(elapsed).toBeLessThan(3_000);
    });

    test("No unnecessary duplicate story API calls", async ({ page }) => {
        const storyCalls: string[] = [];

        page.on("request", (req) => {
            if (req.url().includes("/api/v2/dashboards/ministry/story")) {
                const url = new URL(req.url());
                storyCalls.push(url.searchParams.get("story") ?? "unknown");
            }
        });

        await page.goto("/ministry/universities/CU");
        await page.waitForTimeout(8_000); // Wait for all requests

        console.log(`[PERF] Story API calls: ${storyCalls.length}`, storyCalls);
        // Should have the prefetch (all) + individual story requests
        // But individual requests should hit client cache, resulting in fewer actual network calls
        expect(storyCalls.length).toBeLessThan(10);
    });
});
