File: [`frontend/src/hooks/useDebouncedValue.ts`](../../../../frontend/src/hooks/useDebouncedValue.ts)

**What It Does**
- Generic hook to debounce any changing value.
- Used to throttle input-driven API calls.

**Why This Structure**
- Separates timing logic from components.
- Reduces repeated network requests during typing.

**Principles**
- Performance optimization.
- Reusable hooks.


**Principles Explained**
- `Performance optimization`: Reduce latency or compute costs where it matters most for UX.
- `Reusable hooks`: Encapsulate reusable logic in hooks to avoid duplication across components.
