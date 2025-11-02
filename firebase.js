// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, get, update, remove } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";

/* CONFIG — pastikan ini sesuai project Firebase-mu */
const firebaseConfig = {
  apiKey: "AIzaSyCB_n8gLUD6v26ypy7fQVeEupnjbgqEpHA",
  authDomain: "nopweb-ars.firebaseapp.com",
  databaseURL: "https://nopweb-ars-default-rtdb.firebaseio.com",
  projectId: "nopweb-ars",
  storageBucket: "nopweb-ars.appspot.com",
  messagingSenderId: "891237986049",
  appId: "1:891237986049:web:71c01c1a85be93e3d8b500",
  measurementId: "G-TPCRV172CR"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);

/* --- USER helpers
   users stored under /users/{username}
   { username, password, role: "trial"|"pro"|"admin", uploadsCount }
*/
export async function getUserByUsername(username) {
  if (!username) return null;
  const snap = await get(ref(db, `users/${username}`));
  return snap.exists() ? snap.val() : null;
}
export async function createUserRecord({ username, password, role = 'trial' }) {
  if (!username || !password) throw new Error('Missing username/password');
  await set(ref(db, `users/${username}`), { username, password, role, uploadsCount: 0 });
  return true;
}
export async function deleteUserRecord(username) {
  if (!username) throw new Error('Missing username');
  await remove(ref(db, `users/${username}`));
  return true;
}
export async function updateUserRecord(username, data) {
  if (!username) throw new Error('Missing username');
  await update(ref(db, `users/${username}`), data);
  return true;
}
export function listenUsers(cb) {
  onValue(ref(db, 'users'), (snap) => cb(snap.exists() ? snap.val() : {}));
}

/* --- QUOTA logic */
export async function canUserUpload(username, role) {
  if (!username || !role) return { allowed:false, remaining:0 };
  if (role === 'admin' || role === 'pro') return { allowed:true, remaining: Infinity };
  // trial
  const u = await getUserByUsername(username);
  const used = (u && u.uploadsCount) ? u.uploadsCount : 0;
  const remaining = Math.max(0, 2 - used);
  return { allowed: remaining > 0, remaining };
}
export async function recordUserUpload(username) {
  if (!username) return;
  const snap = await get(ref(db, `users/${username}/uploadsCount`));
  const curr = snap.exists() ? snap.val() : 0;
  await set(ref(db, `users/${username}/uploadsCount`), curr + 1);
  return true;
}

/* --- Storage helper */
export async function uploadFileToStorage(path, file) {
  const storageRef = sRef(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
}

/* --- Messages */
export async function pushMessage(obj) {
  const r = push(ref(db, 'pesan'));
  await set(r, obj);
  return true;
}
export function onMessagesValue(cb) {
  onValue(ref(db, 'pesan'), (snap) => cb(snap.exists() ? snap.val() : null));
}
export async function deleteMessage(id) {
  if (!id) throw new Error('Missing id');
  await remove(ref(db, `pesan/${id}`));
  return true;
}
export async function pushReply(messageId, replyObj) {
  if (!messageId) throw new Error('Missing messageId');
  const r = push(ref(db, `pesan/${messageId}/replies`));
  await set(r, replyObj);
  return true;
}

/* ---- Exports for rate.html convenience ---- */
export {
  createUserRecord as createUser,
  deleteUserRecord as deleteUser,
  updateUserRecord as updateUser,
  uploadFileToStorage as uploadFile,
};
