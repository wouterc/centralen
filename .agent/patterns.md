> [!IMPORTANT]
> **CRITICAL CODING CHECKLIST (MANDATORY BEFORE EVERY EDIT):**
> 1. **N+1 Optimization**: Have you used `select_related` (FK) or `prefetch_related` (M2M) in the ViewSet?
> 2. **UI Compactness & Contrast**: 
>    - **Compact**: Use `py-0.5`, `px-1`, `leading-tight`, and small fonts (`text-[11px]`). No "airy" layouts.
>    - **Contrast**: Use `text-gray-900` or `text-black` for readability. Avoid light grays for important text.
> 3. **State Management**: Are you reusing data from `StateContext.tsx` instead of re-fetching?

## 1. Performance & Caching (The N+1 Rule)
- **CRITICAL**: Every Django ViewSet `get_queryset` method MUST optimize queries. Use `.select_related()` for ForeignKey relationships and `.prefetch_related()` for ManyToMany relationships.
- **Frontend Persistence**: Pages must not re-fetch data on every navigation. Data should be kept in `StateContext.tsx` and reused unless a refresh is explicitly requested or data is empty.


## 3. Design System (Compact & High Contrast)
- **Husk Layout**: Follow the rules in `Husk_Layout_Setting.txt` (Glassmorphism, specific grays, bold headers).
- **MANDATORY Compactness**: 
    - Tables must use `py-0.5` or `py-1` on rows.
    - Forms must use `mb-1` or `mb-2` for spacing, never large `space-y-6`.
    - Line height should be `leading-tight` or `leading-none` for labels.
- **MANDATORY Contrast**: 
    - Content text MUST be `text-gray-900` or `text-black`.
    - Borders must be visible: Use `border-gray-300` or `border-gray-400` instead of `border-gray-100`.
    - Section headers should be bold/black for clear separation.
- **Navigation**: Sidebar-only navigation (`bg-gray-800`). No top header/app bar.
- **Icons**: Use `lucide-react` exclusively for all UI icons for consistency.

## 3. Backend & Database
- **Auto-calculated Metadata**: Side-effects like image dimensions, file size, or other derived values should be handled in the Django `save()` method.
- **API Consistency**: Keep API responses and TypeScript interfaces in `snake_case` for simplicity and 1:1 mapping with the database.
- **Django Standards**: Use standard Django naming conventions unless explicitly specified for external system compatibility.

## 4. Frontend Development
- **Form Handling**: Use clean, modular components for forms (e.g., in `OpgaveForm`, `VidenForm`) with uniform validation and state management.
- **Data Display**: In data tables, values of `0` should often be displayed as empty strings `""` to improve visual clarity.
- **Service Layer**: All API communication must go through the `services/` layer.

## 6. Media & Assets
- **Upload Deduplication**: Check file hashes during upload in the backend to prevent duplicate files and manage naming conflicts.
- **Responsive Media**: Always provide metadata (width/height) for images so the frontend can handle layouts without layout shifts.
