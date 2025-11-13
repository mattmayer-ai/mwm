# Firebase Account Setup

## Current Status
- **Logged in as:** `matt.mayer@swiftracks.com`
- **Need:** `matt.mayer@hotmail.com` (where `askmwm` project exists)

## Steps to Switch Accounts

### Option 1: Logout and Re-login (Recommended)
```bash
firebase logout
firebase login
# Follow the prompts to authenticate with matt.mayer@hotmail.com
```

### Option 2: Use Multiple Accounts
```bash
# Logout current account
firebase logout

# Login with hotmail account
firebase login --no-localhost
# Or use browser-based login:
firebase login
```

## After Switching Accounts

1. **Verify project access:**
   ```bash
   firebase projects:list
   # Should see "askmwm" in the list
   ```

2. **Set active project:**
   ```bash
   firebase use askmwm
   # Or if it doesn't exist yet:
   firebase use --add
   # Select "askmwm" from the list
   ```

3. **Verify active project:**
   ```bash
   firebase use
   # Should show: "askmwm (current)"
   ```

## If Project Doesn't Exist

If `askmwm` doesn't appear after switching accounts, you may need to:

1. **Create the project in Firebase Console:**
   - Go to https://console.firebase.google.com
   - Click "Add project"
   - Project ID: `askmwm`
   - Follow the setup wizard

2. **Or use an existing project:**
   - If you want to use one of your existing projects, update:
     - `firebase.json` (if needed)
     - `.env.local` → `VITE_FIREBASE_PROJECT_ID=your-project-id`
     - CORS origins in Functions

## Quick Commands

```bash
# Check current login
firebase login:list

# List projects
firebase projects:list

# Set active project
firebase use askmwm

# Verify
firebase use
```

