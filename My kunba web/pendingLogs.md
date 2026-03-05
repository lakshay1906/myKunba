Scheduled / translated blogs (implemented)

- **Restrict content images mode**: When editing a blog with `?restrictImages=1` (e.g. `/dashboard/blog/my-slug?restrictImages=1`), the content editor uses translation mode:
  - The image icon (lucide Image) opens a **dropdown** listing only images already in the post content (no new uploads).
  - Selecting an image inserts it at the cursor and removes it from the dropdown so it can’t be selected again (until removed from content).
  - Admin can reorder images by moving/removing and re-inserting from the dropdown.
  - **Cover image** is read-only: shown but cannot be changed.
- Use this URL param when opening the blog edit page from scheduled or translated flows.
