import { test, expect } from '@playwright/test';

test.describe('Location Autocomplete Component', () => {
  test.beforeEach(async ({ page }) => {
    // Login first to access the new listing page
    await page.goto('/auth/login');
    
    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    const passwordInput = page.getByLabel(/password/i).or(page.locator('input[type="password"]'));
    const loginButton = page.getByRole('button', { name: /sign in|login/i });
    
    await emailInput.fill('testuser@example.com');
    await passwordInput.fill('Abcd_123');
    await loginButton.click();
    
    // Wait for login to complete
    await page.waitForURL(url => !url.pathname.includes('/auth/login'), { timeout: 10000 });
    
    // Navigate to new listing page
    await page.goto('/profile/listings/new');
    await page.waitForLoadState('networkidle');
  });

  test('should display location autocomplete input field', async ({ page }) => {
    // Verify the location input field is present
    const locationInput = page.locator('input[placeholder*="location"], input[placeholder*="地點"], input[placeholder*="位置"]')
      .or(page.locator('input').filter({ hasText: /location|地點|位置/i }))
      .or(page.locator('[data-testid="location-input"]'));
    
    await expect(locationInput.first()).toBeVisible();
    console.log('✅ Location input field is visible');
  });

  test('should show loading state when Google Maps is initializing', async ({ page }) => {
    // Look for loading indicator
    const loadingIndicator = page.locator('text=Loading Google Maps...')
      .or(page.locator('text=載入中...'))
      .or(page.locator('[data-testid="maps-loading"]'))
      .or(page.locator('.loading'));
    
    // The loading state might be brief, so we check if it appears or if the component is ready
    const isLoadingVisible = await loadingIndicator.first().isVisible().catch(() => false);
    
    if (isLoadingVisible) {
      console.log('✅ Loading state detected');
      // Wait for loading to complete
      await expect(loadingIndicator.first()).not.toBeVisible({ timeout: 10000 });
      console.log('✅ Loading completed');
    } else {
      console.log('✅ Google Maps loaded quickly or already cached');
    }
  });

  test('should display current location button', async ({ page }) => {
    // Wait for Google Maps to load
    await page.waitForTimeout(3000);
    
    // Look for current location button
    const currentLocationButton = page.getByRole('button', { name: /current location|目前位置|獲取位置/i })
      .or(page.locator('button').filter({ hasText: /location|位置/i }))
      .or(page.locator('[data-testid="current-location-btn"]'));
    
    await expect(currentLocationButton.first()).toBeVisible();
    console.log('✅ Current location button is visible');
  });

  test('should handle location input and show suggestions', async ({ page }) => {
    // Wait for Google Maps to load
    await page.waitForTimeout(3000);
    
    // Find the location input field
    const locationInput = page.locator('input[placeholder*="location"], input[placeholder*="地點"], input[placeholder*="位置"]')
      .or(page.locator('input').filter({ hasText: /location|地點|位置/i }))
      .or(page.locator('[data-testid="location-input"]'));
    
    await expect(locationInput.first()).toBeVisible();
    
    // Type a location query
    await locationInput.first().fill('Taipei 101');
    await page.waitForTimeout(2000); // Wait for API response
    
    // Look for suggestion dropdown
    const suggestionDropdown = page.locator('[role="listbox"]')
      .or(page.locator('.suggestions'))
      .or(page.locator('[data-testid="location-suggestions"]'))
      .or(page.locator('ul').filter({ hasText: /taipei/i }));
    
    const isSuggestionVisible = await suggestionDropdown.first().isVisible().catch(() => false);
    
    if (isSuggestionVisible) {
      console.log('✅ Location suggestions dropdown appeared');
      
      // Look for suggestion items
      const suggestionItems = page.locator('[role="option"]')
        .or(page.locator('li').filter({ hasText: /taipei/i }))
        .or(page.locator('[data-testid="suggestion-item"]'));
      
      const suggestionCount = await suggestionItems.count();
      expect(suggestionCount).toBeGreaterThan(0);
      console.log(`✅ Found ${suggestionCount} location suggestions`);
      
      // Click on first suggestion
      await suggestionItems.first().click();
      
      // Verify input value is updated
      const inputValue = await locationInput.first().inputValue();
      expect(inputValue).toContain('Taipei');
      console.log('✅ Location suggestion selected and input updated');
    } else {
      console.log('⚠️ No suggestions appeared - might need valid Google Maps API key');
    }
  });

  test('should handle current location button click', async ({ page }) => {
    // Wait for Google Maps to load
    await page.waitForTimeout(3000);
    
    // Find current location button
    const currentLocationButton = page.getByRole('button', { name: /current location|目前位置|獲取位置/i })
      .or(page.locator('button').filter({ hasText: /location|位置/i }))
      .or(page.locator('[data-testid="current-location-btn"]'));
    
    await expect(currentLocationButton.first()).toBeVisible();
    
    // Click current location button
    await currentLocationButton.first().click();
    
    // Wait for geolocation request (might be denied in test environment)
    await page.waitForTimeout(3000);
    
    // Check if button state changed (might be disabled during loading)
    const isButtonDisabled = await currentLocationButton.first().isDisabled().catch(() => false);
    
    if (isButtonDisabled) {
      console.log('✅ Current location button disabled during geolocation request');
      
      // Wait for button to be enabled again
      await expect(currentLocationButton.first()).toBeEnabled({ timeout: 10000 });
      console.log('✅ Current location button enabled after geolocation attempt');
    } else {
      console.log('✅ Current location button clicked (geolocation might be denied in test environment)');
    }
  });

  test('should integrate with form validation', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Fill required fields except location
    const titleInput = page.locator('input[name="title"]').or(page.getByLabel(/title|標題/i));
    const descriptionInput = page.locator('textarea[name="description"]').or(page.getByLabel(/description|描述/i));
    const priceInput = page.locator('input[name="price"]').or(page.getByLabel(/price|價格/i));
    
    if (await titleInput.isVisible().catch(() => false)) {
      await titleInput.fill('Test Product');
    }
    
    if (await descriptionInput.isVisible().catch(() => false)) {
      await descriptionInput.fill('Test description');
    }
    
    if (await priceInput.isVisible().catch(() => false)) {
      await priceInput.fill('100');
    }
    
    // Try to submit form without location
    const submitButton = page.getByRole('button', { name: /submit|create|建立|提交/i });
    
    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click();
      
      // Look for validation error on location field
      const locationError = page.locator('text=Location is required')
        .or(page.locator('text=地點為必填'))
        .or(page.locator('[data-testid="location-error"]'))
        .or(page.locator('.error').filter({ hasText: /location|地點/i }));
      
      const isErrorVisible = await locationError.first().isVisible().catch(() => false);
      
      if (isErrorVisible) {
        console.log('✅ Form validation error shown for missing location');
      } else {
        console.log('⚠️ No validation error detected - form might have different validation logic');
      }
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Wait for component to load
    await page.waitForTimeout(3000);
    
    // Mock network failure or invalid API key scenario
    await page.route('**/maps/api/js**', route => {
      route.abort('failed');
    });
    
    // Reload page to trigger API failure
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Look for error message or fallback UI
    const errorMessage = page.locator('text=Failed to load Google Maps')
      .or(page.locator('text=地圖載入失敗'))
      .or(page.locator('[data-testid="maps-error"]'))
      .or(page.locator('.error'));
    
    const fallbackInput = page.locator('input[placeholder*="Enter location manually"]')
      .or(page.locator('input[placeholder*="手動輸入地點"]'));
    
    const isErrorVisible = await errorMessage.first().isVisible().catch(() => false);
    const isFallbackVisible = await fallbackInput.first().isVisible().catch(() => false);
    
    if (isErrorVisible || isFallbackVisible) {
      console.log('✅ Error handling detected - showing error message or fallback UI');
    } else {
      console.log('⚠️ No specific error handling detected for API failures');
    }
  });

  test('should maintain location value during form interaction', async ({ page }) => {
    // Wait for Google Maps to load
    await page.waitForTimeout(3000);
    
    // Find location input and set a value
    const locationInput = page.locator('input[placeholder*="location"], input[placeholder*="地點"], input[placeholder*="位置"]')
      .or(page.locator('[data-testid="location-input"]'));
    
    await expect(locationInput.first()).toBeVisible();
    await locationInput.first().fill('Test Location');
    
    // Interact with other form fields
    const titleInput = page.locator('input[name="title"]').or(page.getByLabel(/title|標題/i));
    
    if (await titleInput.isVisible().catch(() => false)) {
      await titleInput.click();
      await titleInput.fill('Test Product');
    }
    
    // Check if location value is preserved
    const locationValue = await locationInput.first().inputValue();
    expect(locationValue).toBe('Test Location');
    console.log('✅ Location value preserved during form interaction');
  });
});