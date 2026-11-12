# Change Log

This document records the changes made to Idiya during the project improvement and launch-readiness passes.

## Social feed and interactions

- Made the home feed viewable without signing in; sign-in is still required to publish, like, or comment.
- Added search across post titles, post text, and author names, plus feed filters for all posts, photos, and videos.
- Added feed loading, empty, retry, and error states, refresh control, and newest-first ordering for posts with timestamps.
- Added responsive post cards with author information, timestamps, optional media, like counts, comments, and sharing.
- Added like/unlike behavior, duplicate-like checks, share links with native share support where available, and copy-to-clipboard fallback.
- Changed comments to update live from Firestore, added timestamps and author details, and improved comment form validation and error feedback.

## Post creation and media

- Reworked the post composer with optional title and text, a media picker, image/video previews, removable selections, upload progress, and publish feedback.
- Added support for JPG, PNG, GIF, WebP, AVIF, MP4, WebM, and MOV uploads, with a 50 MB file-size limit.
- Added Firebase Storage uploads under per-user post paths and saved the media URL, type, and storage path with each post.
- Added cleanup of an uploaded file if saving its post record fails.
- Added authenticated route handling and guarded post creation for signed-out visitors.

## Interface and accessibility

- Replaced the previous Bootstrap-centered styling with a cohesive Idiya visual system: updated typography, colors, cards, buttons, forms, and spacing.
- Added responsive desktop sidebars, tablet feed layout, and fixed mobile navigation.
- Added responsive sign-in and post-composer screens, mobile safe-area padding, keyboard focus styles, accessible labels, and reduced-motion support.
- Reworked the Google sign-in page and added clear sign-in, sign-out, upload, and publishing error messages.
- Updated page metadata, viewport configuration, and application title in `index.html`.

## Firebase and project setup

- Added Firebase Storage initialization in `src/config/firebase.js`.
- Added `firestore.rules` to define public feed reads, signed-in post/like/comment creation, content validation, and owner-only deletes.
- Added `storage.rules` to restrict uploads to a user's own post folder, accepted image/video MIME types, and the 50 MB size limit.
- Connected those rule files in `firebase.json`.
- Replaced the original project notes in `README.md` with local development, Firebase prerequisites, and deployment instructions.
- Added the `prop-types` dependency for React component prop validation.
- Excluded the legacy `login` template directory from the application lint run; the active app code is linted.

## Earlier cleanup included in this work

- Corrected React `class` attributes to `className`, improved form labels, and removed unused JSX and console output.
- Normalized the create-post route and updated navigation to use React Router links.
- Added prop validation and addressed the lint errors and effect dependency warnings found during the earlier cleanup.
- Improved error handling for post creation, sign-in, likes, and comments.

## Validation performed

- `npm run lint` passed.
- `npm run build` passed.
- Browser smoke checks confirmed the public feed, search, photo filter, and 390 px mobile layout; no horizontal overflow was observed.

## Before production launch

- Enable Firebase Authentication with Google, Firestore, and Cloud Storage in the intended Firebase project.
- Deploy the included Firestore and Storage rules before opening the app to users:

  ```sh
  firebase deploy --only hosting,firestore:rules,storage
  ```

- Configure the project's authorized authentication domains and verify the deployed Firebase configuration.
- Consider adding moderation, reporting, and privacy/terms workflows before inviting the public.
