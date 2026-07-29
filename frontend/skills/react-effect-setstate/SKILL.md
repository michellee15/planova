---
name: react-effect-setstate
description: Remove unnecessary Effects from React components. Use when a setState call appears synchronously in a useEffect body (ESLint react-hooks/set-state-in-effect), when an Effect exists only to transform data or react to user events, or when chained Effects are creating cascading renders. Covers decision tree, six fix patterns, real codebase examples, and what NOT to do.
---

# react-effect-setstate

Use this skill when:
- ESLint reports `react-hooks/set-state-in-effect` on a file
- A code review surfaces a `set*()` call directly in a `useEffect` body (not inside an async function or callback)
- Refactoring a component where one effect resets state that another effect depends on
- An Effect exists only to transform data that could be derived during render
- An Effect reacts to a user event (click, input, select) instead of the event handler owning the logic
- Multiple Effects chain through state updates (Effect → setState → Effect → setState)

Do **not** apply this skill to:
- `toast(...)`, `router.push(...)`, or other imperative calls inside effects — those are fine. The rule only fires on React state setters (`useState`/`useReducer` dispatches).
- `setState` called inside an async function **nested inside** the effect — the rule targets the synchronous body only.
- Effects that genuinely synchronize with an external system (DOM API, WebSocket, third-party library, browser subscription) — those are correct Effects.

## Related skills
- `pr-review` — surfaces this pattern during code review

## Required rule reads
- `.cursor/rules/useeffect-patterns.mdc` — decision framework for when Effects are and are not appropriate
- `.cursor/rules/react-patterns.mdc` — hook extraction thresholds and component structure

---

## Why This Matters

Effects are for **synchronizing with external systems** — the DOM, a WebSocket, a third-party library. Using them for data transformation or user-event reactions is architecturally wrong, not just a lint violation.

Calling `setState` in the synchronous body of an effect creates a **cascade**:

```
Effect A fires → setState → React re-renders → Effect B fires (because its dep changed)
```

Even in React 18 where multiple `setState` calls are batched into one render, the dependent effect still runs an extra time. This means unnecessary API calls, flicker, and logic that is harder to reason about.

> Reference: https://react.dev/learn/you-might-not-need-an-effect

---

## Decision Tree

```
Unnecessary Effect or setState inside useEffect?
│
├── Is the value computable from existing state or props?
│   └── YES → Pattern 2: derived state — delete the state, use useMemo or inline
│
├── Is the trigger a user action you own (click, select, input change)?
│   └── YES → Pattern 3: event handler promotion — move setState into the handler
│
├── Are multiple Effects chaining (Effect → setState → Effect → setState)?
│   └── YES → Consolidate: compute all derived values during render (useMemo chain)
│             or merge all updates into a single event handler
│
├── Is the Effect sharing logic that two or more handlers both need?
│   └── YES → Extract a plain function; call it from each handler — no Effect needed
│
├── Is the effect fetching data from an API?
│   ├── Need a quick, contained fix → Pattern 1: key-based remount
│   └── Willing to refactor the data layer → Pattern 6: migrate to useQuery / useInfiniteQuery
│
├── Should ALL component state reset when one input changes?
│   └── YES → Pattern 1: key-based remount (shell + content split or key at call site)
│
├── Multiple state values reset together and the reset is triggered from more than one place?
│   └── YES → Pattern 5: useReducer with a RESET action
│
├── Need remount-free, fine-grained control (animation, focus, scroll continuity)?
│   └── YES → Pattern 4: merge effects + useRef previous-value tracker
│
└── Effect synchronizes with an external system (DOM, WebSocket, third-party lib)?
    └── YES → Effect is correct — do not remove it
```

---

## Pattern 1 — Key-based remount

**Best for:** All component state should reset when one input/prop changes.

### Variant A: key at the call site

```tsx
// ShiftsWithYourCompany.tsx
// When storeFilter or dateFilter changes, WeeklyContainer remounts → pageNumber resets automatically
<WeeklyContainer
  key={`${storeFilter}-${dateFilter}`}
  storeFilter={storeFilter}
  dateFilter={dateFilter}
/>
```

Real example: `apps/flex-store/src/features/profile/workerProfile/shiftsWithYourCompany/ShiftsWithYourCompany.tsx`

### Variant B: shell + content split

Use this when the component has guard logic (not-selected, not-verified, loading) that should stay mounted while only the data-bearing content resets.

```tsx
// Outer shell: guards only, no state, no effects
function ReviewsByWorkers() {
  const selectedStore = useSelectedStore();
  if (!selectedStore) return <PleaseSelectStorePage />;
  if (!selectedStore.isVerified) return <RequestVerification />;
  // key resets all inner state when store changes — no reset effect needed
  return <ReviewsByWorkersContent key={selectedStore.id} selectedStore={selectedStore} />;
}

// Inner content: all state lives here — starts fresh on every mount
function ReviewsByWorkersContent({ selectedStore }: { selectedStore: SelectedStore }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(STARTING_PAGE);
  const [hasMore, setHasMore] = useState(true);

  // ✅ Single data-loading effect — no reset effect needed
  useEffect(() => {
    const fetchData = async () => { /* ... */ };
    fetchData();
  }, [selectedStore, page]);
  // ...
}
```

Real example: `apps/flex-store/src/pages/reviews-by-workers.tsx`

**Pro:** Zero logic, React-blessed.  
**Con:** Remounts the subtree — can cause a loading flash on slow networks or heavy trees.

---

## Pattern 2 — Derived state

**Best for:** The "state" is just a filtered or transformed version of props or other state.

```tsx
// ❌ Before
const [filtered, setFiltered] = useState<Item[]>([]);
useEffect(() => {
  setFiltered(items.filter((x) => x.active));
}, [items]);

// ✅ After — no state, no effect
const filtered = useMemo(() => items.filter((x) => x.active), [items]);
```

**Pro:** Eliminates state entirely — can never go stale.  
**Con:** Only works when the value is purely derivable. Does not apply when state accumulates user interactions (e.g., an append-only list built from multiple fetches).

---

## Pattern 3 — Event handler promotion

**Best for:** The trigger is a user action you own — a click, a select, a search input change.

```tsx
// ❌ Before — watching the result of an action in an effect
useEffect(() => {
  setPage(STARTING_PAGE);
}, [searchQuery]);

// ✅ After — co-locate the reset with its cause
const handleSearch = (query: string) => {
  setSearchQuery(query);
  setPage(STARTING_PAGE); // happens at the same time, same render
};
```

**Pro:** Semantically correct. Effects are for synchronizing with external systems, not for reacting to user events.  
**Con:** Only works when you own the setter for the triggering value. If the trigger comes from a hook's output (e.g., a query `isSuccess`), this pattern doesn't apply.

---

## Pattern 4 — Merge effects with a `useRef` previous-value tracker

**Best for:** Cannot remount (animation, maintained focus, scroll position continuity), and need fine-grained control over which state resets vs. persists.

```tsx
const prevStoreIdRef = useRef<string | undefined>(undefined);

useEffect(() => {
  if (!selectedStore?.id) return;

  const isStoreChange = prevStoreIdRef.current !== selectedStore.id;
  prevStoreIdRef.current = selectedStore.id;

  const fetchData = async () => {
    const response = await api.reviews.get(selectedStore.id, page);
    const items = response.content?.[0]?.reviews ?? [];

    // Replace on store change, append on page increment
    setReviews((prev) => (isStoreChange ? items : [...prev, ...items]));
    setHasMore(!response.last);
  };

  fetchData();
}, [selectedStore, page]);
```

**Pro:** No remount cost. Fine-grained per-field reset control.  
**Con:** Ref adds cognitive load. Easy to introduce stale-closure bugs. Harder to review. Prefer Pattern 1 when remount cost is acceptable.

---

## Pattern 5 — `useReducer` with a RESET action

**Best for:** Multiple state values always reset together AND the reset is triggered from more than one place.

```tsx
type State = { page: number; reviews: Review[]; hasMore: boolean };
type Action =
  | { type: 'RESET' }
  | { type: 'APPEND'; reviews: Review[]; last: boolean }
  | { type: 'NEXT_PAGE' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'RESET':
      return { page: STARTING_PAGE, reviews: [], hasMore: true };
    case 'APPEND':
      return { ...state, reviews: [...state.reviews, ...action.reviews], hasMore: !action.last };
    case 'NEXT_PAGE':
      return { ...state, page: state.page + 1 };
  }
}

// In event handlers or wherever the reset should happen:
dispatch({ type: 'RESET' }); // atomic — all three values change in one render
```

**Pro:** Impossible to partially reset. All related state transitions live in one place.  
**Con:** Boilerplate. Overkill when there is only one reset trigger. Prefer Pattern 1 or 3 for simpler cases.

---

## Pattern 6 — React Query migration

**Best for:** The `useEffect` is fetching data from an API. This is the most common root cause of this warning in this codebase.

Replace `useState` + manual fetch effect with `useQuery` or `useInfiniteQuery`. The query key includes the dependency — when it changes, React Query handles invalidation and refetch automatically.

```tsx
// ❌ Before — manual fetch pattern with reset cascade
const [reviews, setReviews] = useState<Review[]>([]);
const [page, setPage] = useState(STARTING_PAGE);
useEffect(() => { setPage(STARTING_PAGE); setReviews([]); }, [storeId]); // ← the warning
useEffect(() => { fetchAndAppend(storeId, page); }, [storeId, page]);

// ✅ After — useInfiniteQuery handles pagination, reset, and caching
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: reviewKeys.byStore(storeId),        // key change = automatic reset + refetch
  queryFn: ({ pageParam }) =>
    api.reviews.getStoreReviewsByWorkers(storeId, pageParam, PAGE_SIZE),
  initialPageParam: 0,
  getNextPageParam: (lastPage) =>
    lastPage.last ? undefined : lastPage.pageable.pageNumber + 1,
  enabled: !!storeId,
});

// Flatten pages for rendering
const reviews = data?.pages.flatMap((p) => p.content?.[0]?.reviews ?? []) ?? [];
```

For the infinite scroll trigger, pair with `useInView` from `react-intersection-observer` (already used in this codebase — see `useInfiniteScroll` hook).

**Pro:** Eliminates all manual server state. Loading, error, background refetch, and cache invalidation handled for free.  
**Con:** Larger refactor. Changes the data-fetching architecture, not just the effect pattern.

> `apps/flex-store/src/pages/reviews-by-workers.tsx` is a strong candidate for this migration. The Pattern 1 fix applied there is correct and unblocks the lint warning, but Pattern 6 is the proper long-term resolution.

---

## When Effects ARE Appropriate

Don't remove an Effect that genuinely belongs there. Effects are correct for:

- **Synchronizing with external systems**: DOM APIs, WebSockets, third-party library initialization
- **Browser subscriptions**: `addEventListener`, `IntersectionObserver`, `ResizeObserver`
- **Data fetching**: Effects are acceptable (add an `ignore` flag for race-condition cleanup), but prefer `useQuery` or `useInfiniteQuery` in this codebase
- **One-time app initialization**: module-level guard flag or initialize before components render
- **External store subscriptions**: prefer `useSyncExternalStore` over a manual Effect

```tsx
// ✅ Correct Effect — external subscription with cleanup
useEffect(() => {
  const sub = externalStore.subscribe(handleChange);
  return () => sub.unsubscribe();
}, []);

// ✅ Correct Effect — data fetch with race-condition guard
useEffect(() => {
  let ignore = false;
  fetchData().then((data) => { if (!ignore) setData(data); });
  return () => { ignore = true; };
}, [id]);
```

---

## What NOT to Do

```tsx
// ❌ Suppressing the lint warning without fixing the cascade
useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setPage(STARTING_PAGE);
}, [storeId]);

// ❌ Using useRef purely to silence the warning without changing the structure
const suppressRef = useRef(false);
useEffect(() => {
  if (!suppressRef.current) { setPage(0); }
}, [storeId]);

// ❌ Moving setState into a setTimeout to dodge the synchronous check
useEffect(() => {
  setTimeout(() => setPage(0), 0); // still a cascade, just deferred
}, [storeId]);
```

All three suppress the symptom while keeping the cascade. The render cycle cost and correctness risk remain.
