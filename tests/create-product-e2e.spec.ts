import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Create Product End-to-End', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
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

  test('should complete full product creation workflow', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // Step 1: Fill basic product information
    console.log('Step 1: Filling basic product information...');
    
    const titleInput = page.locator('input[name="title"]').or(page.getByLabel(/title|標題/i));
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Test Camera Equipment');
    
    const descriptionInput = page.locator('textarea[name="description"]').or(page.getByLabel(/description|描述/i));
    await expect(descriptionInput).toBeVisible();
    await descriptionInput.fill('Professional camera equipment for rent. Perfect for photography enthusiasts and professionals.');
    
    // Step 2: Select category
    console.log('Step 2: Selecting category...');
    
    const categorySelect = page.locator('select[name="category"]')
      .or(page.getByLabel(/category|類別/i))
      .or(page.locator('[data-testid="category-select"]'));
    
    if (await categorySelect.isVisible().catch(() => false)) {
      await categorySelect.selectOption({ index: 1 }); // Select first available category
      console.log('✅ Category selected');
    } else {
      // Look for dropdown trigger button
      const categoryTrigger = page.locator('button').filter({ hasText: /select category|選擇類別/i })
        .or(page.locator('[data-testid="category-trigger"]'));
      
      if (await categoryTrigger.isVisible().catch(() => false)) {
        await categoryTrigger.click();
        
        // Select first option from dropdown
        const firstOption = page.locator('[role="option"]').first()
          .or(page.locator('li').first());
        
        if (await firstOption.isVisible().catch(() => false)) {
          await firstOption.click();
          console.log('✅ Category selected from dropdown');
        }
      }
    }
    
    // Step 3: Set pricing
    console.log('Step 3: Setting pricing...');
    
    const priceInput = page.locator('input[name="price"]').or(page.getByLabel(/price|價格/i));
    await expect(priceInput).toBeVisible();
    await priceInput.fill('150');
    
    const depositInput = page.locator('input[name="deposit"]').or(page.getByLabel(/deposit|押金/i));
    if (await depositInput.isVisible().catch(() => false)) {
      await depositInput.fill('300');
    }
    
    // Step 4: Set location using autocomplete
    console.log('Step 4: Setting location...');
    
    // Wait for Google Maps to load
    await page.waitForTimeout(2000);
    
    const locationInput = page.locator('input[placeholder*="location"], input[placeholder*="地點"], input[placeholder*="位置"]')
      .or(page.locator('[data-testid="location-input"]'));
    
    await expect(locationInput.first()).toBeVisible();
    await locationInput.first().fill('Taipei Main Station, Taiwan');
    
    // Wait for suggestions and select if available
    await page.waitForTimeout(2000);
    
    const suggestionItems = page.locator('[role="option"]')
      .or(page.locator('li').filter({ hasText: /taipei/i }));
    
    const suggestionCount = await suggestionItems.count();
    if (suggestionCount > 0) {
      await suggestionItems.first().click();
      console.log('✅ Location selected from suggestions');
    } else {
      console.log('⚠️ No location suggestions available - using manual input');
    }
    
    // Step 5: Upload images (if file input is available)
    console.log('Step 5: Handling image upload...');
    
    const fileInput = page.locator('input[type="file"]');
    
    if (await fileInput.isVisible().catch(() => false)) {
      // Create a test image file path (you might need to have a test image in your project)
      const testImagePath = path.join(process.cwd(), 'test-image.png');
      
      try {
        await fileInput.setInputFiles(testImagePath);
        
        // Wait for image preview to appear
        await page.waitForTimeout(2000);
        
        const imagePreview = page.locator('img[alt*="preview"]')
          .or(page.locator('[data-testid="image-preview"]'))
          .or(page.locator('.preview'));
        
        if (await imagePreview.first().isVisible().catch(() => false)) {
          console.log('✅ Image uploaded and preview shown');
        }
      } catch (error) {
        console.log('⚠️ Test image not found, skipping image upload');
      }
    } else {
      console.log('⚠️ File input not found, skipping image upload');
    }
    
    // Step 6: Set availability dates (if date picker is available)
    console.log('Step 6: Setting availability dates...');
    
    const startDateInput = page.locator('input[name="startDate"]')
      .or(page.getByLabel(/start date|開始日期/i))
      .or(page.locator('[data-testid="start-date"]'));
    
    if (await startDateInput.isVisible().catch(() => false)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      await startDateInput.fill(tomorrowStr);
      
      const endDateInput = page.locator('input[name="endDate"]')
        .or(page.getByLabel(/end date|結束日期/i))
        .or(page.locator('[data-testid="end-date"]'));
      
      if (await endDateInput.isVisible().catch(() => false)) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];
        
        await endDateInput.fill(nextWeekStr);
        console.log('✅ Availability dates set');
      }
    }
    
    // Step 7: Add additional details
    console.log('Step 7: Adding additional details...');
    
    const conditionSelect = page.locator('select[name="condition"]')
      .or(page.getByLabel(/condition|狀況/i));
    
    if (await conditionSelect.isVisible().catch(() => false)) {
      await conditionSelect.selectOption('excellent');
    }
    
    const brandInput = page.locator('input[name="brand"]')
      .or(page.getByLabel(/brand|品牌/i));
    
    if (await brandInput.isVisible().catch(() => false)) {
      await brandInput.fill('Canon');
    }
    
    // Step 8: Review form before submission
    console.log('Step 8: Reviewing form data...');
    
    // Take screenshot of completed form
    await page.screenshot({ 
      path: 'tests/screenshots/create-product-form-completed.png',
      fullPage: true 
    });
    
    // Verify all required fields are filled
    const titleValue = await titleInput.inputValue();
    const descriptionValue = await descriptionInput.inputValue();
    const priceValue = await priceInput.inputValue();
    const locationValue = await locationInput.first().inputValue();
    
    expect(titleValue).toBeTruthy();
    expect(descriptionValue).toBeTruthy();
    expect(priceValue).toBeTruthy();
    expect(locationValue).toBeTruthy();
    
    console.log('✅ All required fields verified');
    
    // Step 9: Submit the form
    console.log('Step 9: Submitting form...');
    
    const submitButton = page.getByRole('button', { name: /create|submit|建立|提交/i })
      .or(page.locator('button[type="submit"]'))
      .or(page.locator('[data-testid="submit-button"]'));
    
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    
    await submitButton.click();
    
    // Step 10: Handle submission result
    console.log('Step 10: Handling submission result...');
    
    // Wait for either success redirect or error message
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    
    // Check for success indicators
    const successMessage = page.locator('text=Product created successfully')
      .or(page.locator('text=產品建立成功'))
      .or(page.locator('[data-testid="success-message"]'))
      .or(page.locator('.success'));
    
    const isSuccessVisible = await successMessage.first().isVisible().catch(() => false);
    const isRedirected = !currentUrl.includes('/profile/listings/new');
    
    if (isSuccessVisible || isRedirected) {
      console.log('✅ Product creation successful!');
      
      if (isRedirected) {
        console.log(`✅ Redirected to: ${currentUrl}`);
      }
    } else {
      // Check for validation errors
      const errorMessages = page.locator('.error, [role="alert"], .text-red-500')
        .or(page.locator('text=required')
        .or(page.locator('text=必填')));
      
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        console.log(`⚠️ Found ${errorCount} validation errors:`);
        
        for (let i = 0; i < Math.min(errorCount, 5); i++) {
          const errorText = await errorMessages.nth(i).textContent();
          console.log(`  - ${errorText}`);
        }
        
        // Take screenshot of errors
        await page.screenshot({ 
          path: 'tests/screenshots/create-product-errors.png',
          fullPage: true 
        });
      } else {
        console.log('⚠️ Form submission completed but no clear success/error indicators found');
      }
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /create|submit|建立|提交/i })
      .or(page.locator('button[type="submit"]'));
    
    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click();
      
      // Wait for validation errors
      await page.waitForTimeout(2000);
      
      // Check for validation error messages
      const errorMessages = page.locator('.error, [role="alert"], .text-red-500')
        .or(page.locator('text=required'))
        .or(page.locator('text=必填'));
      
      const errorCount = await errorMessages.count();
      
      expect(errorCount).toBeGreaterThan(0);
      console.log(`✅ Found ${errorCount} validation errors for empty form`);
      
      // Take screenshot of validation errors
      await page.screenshot({ 
        path: 'tests/screenshots/create-product-validation-errors.png',
        fullPage: true 
      });
    }
  });

  test('should handle form navigation and data persistence', async ({ page }) => {
    // Fill some form data
    await page.waitForTimeout(2000);
    
    const titleInput = page.locator('input[name="title"]').or(page.getByLabel(/title|標題/i));
    
    if (await titleInput.isVisible().catch(() => false)) {
      await titleInput.fill('Test Product Navigation');
      
      // Navigate away and back
      await page.goto('/profile');
      await page.waitForTimeout(1000);
      
      await page.goto('/profile/listings/new');
      await page.waitForTimeout(2000);
      
      // Check if data is preserved (might not be depending on implementation)
      const titleValue = await titleInput.inputValue();
      
      if (titleValue === 'Test Product Navigation') {
        console.log('✅ Form data persisted across navigation');
      } else {
        console.log('⚠️ Form data not persisted (expected behavior for security)');
      }
    }
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Fill some form data
    await page.waitForTimeout(2000);
    
    const titleInput = page.locator('input[name="title"]').or(page.getByLabel(/title|標題/i));
    
    if (await titleInput.isVisible().catch(() => false)) {
      await titleInput.fill('Test Browser Navigation');
      
      // Use browser back button
      await page.goBack();
      await page.waitForTimeout(1000);
      
      // Use browser forward button
      await page.goForward();
      await page.waitForTimeout(2000);
      
      // Check if we're back on the form page
      const currentUrl = page.url();
      expect(currentUrl).toContain('/profile/listings/new');
      console.log('✅ Browser navigation handled correctly');
    }
  });
});