"use client";

import { firebaseConfig } from "@/firebase/config";
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore"; // Removed connectFirestoreEmulator import

// Declare global properties for the singleton instance. This is essential for
// Serverless environments (like Vercel) to prevent connection leaks.
declare global {
  // Use `var` for global declarations in this context
  var firebaseAppInstance: FirebaseApp | undefined;
  var firestoreInstance: Firestore | undefined;
}

/**
 * Initializes Firebase services using the Singleton Pattern for scalable
 * deployment, connecting directly to the remote Google Cloud Firestore
 * (to ensure local development speed).
 */
export function initializeFirebase() {
  let firebaseApp: FirebaseApp;
  let firestore: Firestore;
  let auth: Auth;

  // 1. Check for existing singleton instance
  if (globalThis.firebaseAppInstance) {
    // Reuse existing instances (Vercel Scalability Fix)
    firebaseApp = globalThis.firebaseAppInstance;
    firestore = globalThis.firestoreInstance!;
    auth = getAuth(firebaseApp);
  } else {
    // 2. Initialize the Firebase App instance (once)
    if (!getApps().length) {
      try {
        // Attempt Firebase App Hosting initialization first (production safe)
        firebaseApp = initializeApp();
      } catch (e) {
        // Fallback to local config (development safe)
        if (process.env.NODE_ENV === "production") {
          console.warn(
            "Automatic initialization failed. Falling back to firebase config object.",
            e
          );
        }
        firebaseApp = initializeApp(firebaseConfig);
      }
    } else {
      firebaseApp = getApp();
    }

    // 3. Initialize services
    firestore = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);

    // NOTE: connectFirestoreEmulator call is intentionally REMOVED here.

    // 4. Store the instances globally for reuse (Scalability fix for Vercel)
    globalThis.firebaseAppInstance = firebaseApp;
    globalThis.firestoreInstance = firestore;
  }

  // Return all required SDKs.
  return {
    firebaseApp,
    auth,
    firestore,
  };
}

export * from "./provider";
export * from "./client-provider";
export * from "./firestore/use-collection";
export * from "./firestore/use-doc";
export * from "./firestore/use-notes";
export * from "./non-blocking-updates";
export * from "./non-blocking-login";
export * from "./errors";
export * from "./error-emitter";
