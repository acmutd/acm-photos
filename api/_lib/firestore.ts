// @ts-expect-error — firebase-admin CJS default export
import admin from "firebase-admin";

let dbInstance: FirebaseFirestore.Firestore | null = null;

export function getDb(): FirebaseFirestore.Firestore {
  if (dbInstance) return dbInstance;

  if (admin.apps.length > 0) {
    dbInstance = admin.firestore();
    return dbInstance;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");

  const sa = JSON.parse(raw);
  if (typeof sa.private_key === "string") {
    sa.private_key = sa.private_key.replace(/\\n/g, "\n");
  }

  admin.initializeApp({ credential: admin.credential.cert(sa) });
  dbInstance = admin.firestore();
  return dbInstance;
}

export { admin };
