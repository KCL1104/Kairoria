import { test, expect } from '@playwright/test';

test.describe('Google Maps Integration', () => {
  test('should integrate Google Maps in marketplace view with full functionality', async ({ page }) => {
    // Step 1: Navigate to the marketplace page
    await page.goto('/marketplace/');
    
    // Step 2: Verify the View Map button is present
    const viewMapButton = page.getByRole('button', { name: 'View Map' });
    await expect(viewMapButton).toBeVisible();
    
    // Step 3: Click the View Map button to open the map dialog
    await viewMapButton.click();
    
    // Step 4: Verify the map dialog opens with title 'Explore Available Items'
    const mapDialog = page.getByRole('dialog', { name: 'Explore Available Items' });
    await expect(mapDialog).toBeVisible();
    
    const dialogTitle = page.getByRole('heading', { name: 'Explore Available Items', level: 2 });
    await expect(dialogTitle).toBeVisible();
    
    // Step 5: Verify the Google Maps iframe is loaded
    const mapIframe = page.locator('iframe');
    await expect(mapIframe).toBeVisible();
    
    // Step 6: Verify the My Location button is present
    const myLocationButton = page.getByRole('button', { name: 'My Location' });
    await expect(myLocationButton).toBeVisible();
    await expect(myLocationButton).toBeEnabled();
    
    // Step 7: Click the My Location button
    await myLocationButton.click();
    
    // Step 8: Verify the My Location button becomes disabled after clicking
    await expect(myLocationButton).toBeDisabled();
    
    // Step 9: Verify map controls are present (fullscreen, camera controls)
    // Note: These controls are within the Google Maps iframe and may not be directly accessible
    // We verify the map container and basic structure instead
    const mapRegion = page.getByRole('region', { name: '地圖' });
    await expect(mapRegion).toBeVisible();
    
    // Step 10: Verify the Available Items counter shows '(0)'
    const availableItemsText = page.locator('text=Available Items (0)');
    await expect(availableItemsText).toBeVisible();
    
    // Step 11: Take a screenshot of the map dialog
    await page.screenshot({ 
      path: 'tests/screenshots/google-maps-dialog.png',
      fullPage: false 
    });
    
    // Step 12: Close the map dialog
    const closeButton = page.getByRole('button', { name: 'Close' });
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    
    // Step 13: Verify the dialog closes and returns to the marketplace page
    await expect(mapDialog).not.toBeVisible();
    
    // Verify we're back on the marketplace page
    const marketplaceHeading = page.getByRole('heading', { name: 'Marketplace', level: 1 });
    await expect(marketplaceHeading).toBeVisible();
    
    // Verify the View Map button is still present and clickable
    await expect(viewMapButton).toBeVisible();
    await expect(viewMapButton).toBeEnabled();
  });
  
  test('should handle map dialog opening and closing multiple times', async ({ page }) => {
    await page.goto('/marketplace/');
    
    const viewMapButton = page.getByRole('button', { name: 'View Map' });
    const mapDialog = page.getByRole('dialog', { name: 'Explore Available Items' });
    const closeButton = page.getByRole('button', { name: 'Close' });
    
    // Test opening and closing the dialog multiple times
    for (let i = 0; i < 3; i++) {
      // Open dialog
      await viewMapButton.click();
      await expect(mapDialog).toBeVisible();
      
      // Close dialog
      await closeButton.click();
      await expect(mapDialog).not.toBeVisible();
    }
  });
  
  test('should display map components correctly', async ({ page }) => {
    await page.goto('/marketplace/');
    
    // Open map dialog
    await page.getByRole('button', { name: 'View Map' }).click();
    
    const mapDialog = page.getByRole('dialog', { name: 'Explore Available Items' });
    await expect(mapDialog).toBeVisible();
    
    // Verify essential map components
    await expect(page.locator('iframe')).toBeVisible(); // Google Maps iframe
    await expect(page.getByRole('button', { name: 'My Location' })).toBeVisible();
    await expect(page.locator('text=Your Location')).toBeVisible();
    await expect(page.locator('text=Available Items (0)')).toBeVisible();
    
    // Close dialog
    await page.getByRole('button', { name: 'Close' }).click();
  });
  
  test('should maintain map state during session', async ({ page }) => {
    await page.goto('/marketplace/');
    
    // Open map dialog
    await page.getByRole('button', { name: 'View Map' }).click();
    
    const mapDialog = page.getByRole('dialog', { name: 'Explore Available Items' });
    await expect(mapDialog).toBeVisible();
    
    // Click My Location button
    const myLocationButton = page.getByRole('button', { name: 'My Location' });
    await myLocationButton.click();
    await expect(myLocationButton).toBeDisabled();
    
    // Close and reopen dialog
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(mapDialog).not.toBeVisible();
    
    await page.getByRole('button', { name: 'View Map' }).click();
    await expect(mapDialog).toBeVisible();
    
    // Verify My Location button is reset to enabled state
    await expect(page.getByRole('button', { name: 'My Location' })).toBeEnabled();
    
    // Close dialog
    await page.getByRole('button', { name: 'Close' }).click();
  });
});