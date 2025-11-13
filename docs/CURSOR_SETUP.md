# Cursor Setup Complete ✅

## Configuration Files Created

1. **`.cursorrules`** - Updated with UI guidelines and code style
2. **`.cursorignore`** - Ignores build artifacts and sensitive files
3. **Path aliases** - Added to `tsconfig.json` and `vite.config.ts`

## Path Aliases Available

You can now use these clean imports throughout the codebase:

```typescript
import { ChatHome } from '@app/routes/home/ChatHome';
import { useChatStore } from '@features/chat/store';
import { WideModal } from '@components/WideModal';
import { db } from '@lib/firebase';
import { useThemeStore } from '@stores/theme.store';
```

## Tailwind Utility Classes

Three utility classes are now available:

- `.card-rect` - Rectangular card with consistent styling
- `.modal-wide` - Wide modal container (max-w-4xl/5xl)
- `.actions-bar` - Bottom-center action bar with safe area padding

## Design North Star (from .cursorrules)

- Immersive "canvas" feel, logo top-right
- Compact context card (rect radius), chat input directly under it with same corners
- Title fits single line on 1280px
- No initial scroll at 1440×900
- No dense top bar: primary actions are bottom-center quick buttons with icons
  (Settings/hamburger → contains theme + "How the AI works"; Experience; Portfolio; Connect)
- Experience/Portfolio/Connect open wide modals with blurred backdrop; easy close
- Maintain analytics hooks, citation deep-link highlights, and tone badges

## Next Steps

1. **Career Data Compilation**: Use the Claude prompt pack provided to compile your canonical profile JSON
2. **Content Ingestion**: Run `npm run ingest` after adding new content
3. **Deploy**: Use `firebase deploy --only hosting,functions` when ready

## Remaining TypeScript Errors

There are 4 minor TypeScript errors remaining (mostly unused imports and missing sitemap modules). These don't block functionality and can be cleaned up incrementally.

