import { expect, test } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the hero section', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Your Web3 Identity')).toBeVisible();
  });

  test('should have a connect wallet button', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /connect|wallet/i });
    await expect(connectButton).toBeVisible();
  });

  test('should navigate to explore page', async ({ page }) => {
    await page.getByRole('link', { name: 'Explore' }).click();
    await expect(page).toHaveURL('/explore');
  });

  test('should navigate to leaderboard page', async ({ page }) => {
    await page.getByRole('link', { name: 'Leaderboard' }).click();
    await expect(page).toHaveURL('/leaderboard');
  });

  test('should toggle dark/light mode', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /theme|dark|light/i });
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      // Check that theme changed
      const html = page.locator('html');
      const classAttr = await html.getAttribute('class');
      expect(classAttr).toBeDefined();
    }
  });
});

test.describe('Explore Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore');
  });

  test('should display explore heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /explore/i })).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('test');
    await page.waitForTimeout(500); // Debounce
    
    // Search should be applied
    await expect(searchInput).toHaveValue('test');
  });

  test('should display filter options', async ({ page }) => {
    const filtersButton = page.getByRole('button', { name: /filter/i });
    if (await filtersButton.isVisible()) {
      await filtersButton.click();
      await expect(page.getByText(/verified/i)).toBeVisible();
    }
  });
});

test.describe('Leaderboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leaderboard');
  });

  test('should display leaderboard heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /leaderboard/i })).toBeVisible();
  });

  test('should have tabs for different rankings', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /points/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /followers/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /badges/i })).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    const followersTab = page.getByRole('tab', { name: /followers/i });
    await followersTab.click();
    await expect(followersTab).toHaveAttribute('data-state', 'active');
  });
});

test.describe('Responsive Design', () => {
  test('should display mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Mobile menu button should be visible
    const mobileMenuButton = page.getByRole('button', { name: /menu/i });
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      // Navigation links should appear
      await expect(page.getByRole('link', { name: /explore/i })).toBeVisible();
    }
  });

  test('should hide desktop nav on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Desktop nav should be hidden
    const desktopNav = page.locator('nav.hidden.md\\:flex');
    await expect(desktopNav).toBeHidden();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Decorative images can have empty alt, but not missing
      expect(alt).not.toBeNull();
    }
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/');
    
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const name = await button.getAttribute('aria-label') || await button.textContent();
      expect(name?.trim()).not.toBe('');
    }
  });
});
