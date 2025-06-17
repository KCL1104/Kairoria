# Kairoria - Marketplace Platform

## Instant Sign-Out Feature

This project includes an advanced instant sign-out system that provides immediate user feedback and handles pending operations gracefully.

### Key Features

1. **Instant Visual Feedback**: UI updates immediately when sign-out is initiated
2. **Comprehensive Data Cleanup**: Clears all authentication tokens, localStorage, sessionStorage, and cookies
3. **Pending Operations Handling**: Detects and manages ongoing operations before sign-out
4. **Force Sign-Out Option**: Allows users to bypass pending operations if needed
5. **Background Cleanup**: Performs server-side cleanup asynchronously without blocking the UI
6. **Error Handling**: Graceful error handling with user-friendly messages

### Implementation

The instant sign-out system consists of:

- `lib/instant-signout.ts`: Core sign-out logic with singleton pattern
- `hooks/use-instant-signout.ts`: React hook for UI state management
- `components/auth/InstantSignOutButton.tsx`: Reusable sign-out button component
- Enhanced logout API endpoint with immediate response headers
- Updated auth context to use instant sign-out

### Usage

```tsx
import { InstantSignOutButton } from '@/components/auth/InstantSignOutButton'

// Basic usage
<InstantSignOutButton />

// With confirmation dialog
<InstantSignOutButton confirmBeforeSignOut={true} />

// Custom styling
<InstantSignOutButton 
  variant="destructive" 
  size="lg"
  className="custom-class"
/>
```

### Pending Operations

The system can track pending operations to prevent data loss:

```tsx
import { registerPendingOperation, completePendingOperation } from '@/lib/instant-signout'

// Register an operation
registerPendingOperation('file-upload-123')

// Complete the operation
completePendingOperation('file-upload-123')
```

### Technical Benefits

1. **Immediate Response**: Users see instant feedback without waiting for server responses
2. **Data Safety**: Prevents sign-out during critical operations
3. **Robust Cleanup**: Ensures complete session termination across all storage mechanisms
4. **Graceful Degradation**: Works even if server-side operations fail
5. **User Experience**: Smooth, responsive interface with clear status indicators