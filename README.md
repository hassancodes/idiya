# Idiya

Idiya is a responsive community feed for sharing ideas, photos, and short videos. Visitors can browse and search public posts; signed-in members can publish, like, and comment.

## Run locally

```sh
npm install
npm run dev
```

Before using Firebase features, configure the Firebase project in `src/config/firebase.js`. In the Firebase console:

1. Enable Google as a sign-in provider in Authentication and add your local and production domains to Authorized domains.
2. Create a Cloud Firestore database.
3. Enable Cloud Storage and create its default bucket.
4. Deploy the included Firestore and Storage rules before opening the app to users.

The public feed is readable without signing in. Creating posts, liking, commenting, and uploading media require a signed-in Google account. Media is limited to 50 MB and supported image/video formats.

## Deploy

The repository is configured for Firebase Hosting and targets the project selected in `.firebaserc`.

```sh
npm run lint
npm run build
firebase deploy --only hosting,firestore:rules,storage
```

If the project or Firebase CLI is not already selected, sign in with `firebase login` and select the intended project with `firebase use`. The rules in `firestore.rules` and `storage.rules` are part of the app’s access controls; deploy them before publishing the site.
