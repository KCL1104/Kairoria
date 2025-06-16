import { test, expect } from '@playwright/test';

test.describe('User Authentication Detection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  test('should detect unauthenticated user state', async ({ page }) => {
    // Step 1: Verify we're on the home page
    await expect(page).toHaveURL('/');
    
    // Step 2: Check that Sign In and Get Started buttons are visible (indicating user is not logged in)
    const signInButton = page.getByRole('link', { name: 'Sign In' });
    const getStartedButton = page.getByRole('link', { name: 'Get Started' });
    
    await expect(signInButton).toBeVisible();
    await expect(getStartedButton).toBeVisible();
    
    // Step 3: Verify user avatar/menu is not visible
    const userAvatar = page.locator('[data-testid="user-avatar"]').or(page.locator('button').filter({ hasText: /profile|avatar/i }));
    await expect(userAvatar).not.toBeVisible();
    
    // Step 4: Try to access a protected route and verify redirect to login
    await page.goto('/profile');
    
    // Should be redirected to login page with callback URL
    await expect(page).toHaveURL(/\/auth\/login.*callbackUrl.*profile/);
    
    console.log('✅ Unauthenticated user state detected correctly');
  });

  test('should authenticate user and detect logged-in state', async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto('/auth/login');
    
    // Step 2: Fill in login credentials
    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    const passwordInput = page.getByLabel(/password/i).or(page.locator('input[type="password"]'));
    const loginButton = page.getByRole('button', { name: /sign in|login/i });
    
    await emailInput.fill('testuser@example.com');
    await passwordInput.fill('Abcd_123');
    await loginButton.click();
    
    // Step 3: Wait for successful login and redirect
    // Wait for either redirect to home page or profile completion
    await page.waitForURL(url => 
      url.pathname === '/' || 
      url.pathname === '/profile' || 
      url.pathname === '/complete-profile' ||
      url.pathname === '/complete-signup'
    , { timeout: 10000 });
    
    // Step 4: Navigate to home page to check authentication state
    await page.goto('/');
    
    // Step 5: Verify authenticated user UI elements
    // Look for user avatar, profile menu, or user-specific elements
    const userAvatar = page.locator('button').filter({ hasText: /profile|avatar/i })
      .or(page.locator('[data-testid="user-avatar"]'))
      .or(page.locator('img[alt*="avatar"]'))
      .or(page.locator('button').filter({ has: page.locator('img') }));
    
    // Wait a bit for the auth state to load
    await page.waitForTimeout(2000);
    
    // Check if user avatar/menu is visible
    const isUserAvatarVisible = await userAvatar.first().isVisible().catch(() => false);
    
    if (isUserAvatarVisible) {
      console.log('✅ User avatar found - user is logged in');
      
      // Click on user avatar to open menu
      await userAvatar.first().click();
      
      // Verify user menu options are available
      const profileLink = page.getByRole('menuitem', { name: /profile/i })
        .or(page.getByRole('link', { name: /profile/i }))
        .or(page.locator('a').filter({ hasText: /profile/i }));
      
      const signOutOption = page.getByRole('menuitem', { name: /sign out|logout/i })
        .or(page.getByRole('button', { name: /sign out|logout/i }))
        .or(page.locator('button').filter({ hasText: /sign out|logout/i }));
      
      await expect(profileLink.first()).toBeVisible();
      await expect(signOutOption.first()).toBeVisible();
      
      console.log('✅ User menu with Profile and Sign Out options found');
    } else {
      // Alternative check: look for absence of Sign In button
      const signInButton = page.getByRole('link', { name: 'Sign In' });
      const isSignInVisible = await signInButton.isVisible().catch(() => false);
      
      if (!isSignInVisible) {
        console.log('✅ Sign In button not visible - user appears to be logged in');
      } else {
        console.log('❌ User appears to still be logged out');
        throw new Error('User authentication was not successful or not detected properly');
      }
    }
    
    // Step 6: Test access to protected route
    await page.goto('/profile');
    
    // Should NOT be redirected to login page
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    
    if (currentUrl.includes('/auth/login')) {
      console.log('❌ User was redirected to login page - authentication failed');
      throw new Error('User was redirected to login despite being authenticated');
    } else {
      console.log('✅ User can access protected route - authentication successful');
    }
    
    console.log('✅ Authenticated user state detected correctly');
  });

  test('should detect authentication state changes', async ({ page }) => {
    // Step 1: Start unauthenticated
    await page.goto('/');
    
    const signInButton = page.getByRole('link', { name: 'Sign In' });
    await expect(signInButton).toBeVisible();
    console.log('✅ Initial unauthenticated state confirmed');
    
    // Step 2: Login
    await signInButton.click();
    
    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    const passwordInput = page.getByLabel(/password/i).or(page.locator('input[type="password"]'));
    const loginButton = page.getByRole('button', { name: /sign in|login/i });
    
    await emailInput.fill('testuser@example.com');
    await passwordInput.fill('Abcd_123');
    await loginButton.click();
    
    // Wait for login to complete
    await page.waitForURL(url => !url.pathname.includes('/auth/login'), { timeout: 10000 });
    
    // Step 3: Navigate back to home and verify authenticated state
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check for authenticated state indicators
    const userAvatar = page.locator('button').filter({ hasText: /profile|avatar/i })
      .or(page.locator('[data-testid="user-avatar"]'))
      .or(page.locator('img[alt*="avatar"]'))
      .or(page.locator('button').filter({ has: page.locator('img') }));
    
    const isUserAvatarVisible = await userAvatar.first().isVisible().catch(() => false);
    const isSignInVisible = await page.getByRole('link', { name: 'Sign In' }).isVisible().catch(() => false);
    
    if (isUserAvatarVisible || !isSignInVisible) {
      console.log('✅ Authentication state change detected - user is now logged in');
    } else {
      console.log('❌ Authentication state change not detected properly');
      throw new Error('Authentication state change was not detected');
    }
    
    // Step 4: Test logout (if user menu is available)
    if (isUserAvatarVisible) {
      await userAvatar.first().click();
      
      const signOutButton = page.getByRole('menuitem', { name: /sign out|logout/i })
        .or(page.getByRole('button', { name: /sign out|logout/i }))
        .or(page.locator('button').filter({ hasText: /sign out|logout/i }));
      
      if (await signOutButton.first().isVisible().catch(() => false)) {
        await signOutButton.first().click();
        
        // Wait for logout to complete
        await page.waitForTimeout(2000);
        
        // Verify return to unauthenticated state
        const signInButtonAfterLogout = page.getByRole('link', { name: 'Sign In' });
        await expect(signInButtonAfterLogout).toBeVisible();
        
        console.log('✅ Logout detected - user is now unauthenticated');
      }
    }
  });

  test('should handle middleware authentication correctly', async ({ page }) => {
    // Step 1: Test middleware behavior for protected routes when unauthenticated
    await page.goto('/messages');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/auth\/login.*callbackUrl.*messages/);
    console.log('✅ Middleware correctly redirects unauthenticated users from /messages');
    
    // Step 2: Login and test middleware allows access
    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    const passwordInput = page.getByLabel(/password/i).or(page.locator('input[type="password"]'));
    const loginButton = page.getByRole('button', { name: /sign in|login/i });
    
    await emailInput.fill('testuser@example.com');
    await passwordInput.fill('Abcd_123');
    await loginButton.click();
    
    // Wait for login and potential redirect
    await page.waitForURL(url => !url.pathname.includes('/auth/login'), { timeout: 10000 });
    
    // Step 3: Now try to access protected route
    await page.goto('/messages');
    await page.waitForTimeout(2000);
    
    // Should NOT be redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/login')) {
      console.log('❌ Middleware still redirecting authenticated user');
      throw new Error('Middleware is not recognizing authenticated user');
    } else {
      console.log('✅ Middleware correctly allows authenticated user access to /messages');
    }
    
    // Step 4: Test another protected route
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    
    const profileUrl = page.url();
    if (profileUrl.includes('/auth/login')) {
      console.log('❌ Middleware redirecting authenticated user from /profile');
      throw new Error('Middleware is not consistently recognizing authenticated user');
    } else {
      console.log('✅ Middleware correctly allows authenticated user access to /profile');
    }
  });
});