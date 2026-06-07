/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  getDocs 
} from "firebase/firestore";
import { db, auth, isFirebaseConfigured, OperationType, handleFirestoreError } from "./firebase";
import { type Trade } from "../types";

const TRADES_COLLECTION = "trades";

/**
 * Persists a newly initialized open trade directly in Firestore (scoped to the user's secure account)
 */
export async function createCloudTrade(trade: Trade, userId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  
  const path = `${TRADES_COLLECTION}/${trade.id}`;
  try {
    const docRef = doc(db, TRADES_COLLECTION, trade.id);
    const cloudPayload = {
      ...trade,
      userId,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, cloudPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Updates an existing trade (e.g. updating setup criteria, or final closure reflections)
 */
export async function updateCloudTrade(trade: Trade, userId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  const path = `${TRADES_COLLECTION}/${trade.id}`;
  try {
    const docRef = doc(db, TRADES_COLLECTION, trade.id);
    const cloudPayload = {
      ...trade,
      userId,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, cloudPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Deletes or archives a trade from the active persistent cloud collection
 */
export async function deleteCloudTrade(tradeId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  const path = `${TRADES_COLLECTION}/${tradeId}`;
  try {
    const docRef = doc(db, TRADES_COLLECTION, tradeId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Establishes a real-time secure listener of user-specific trades
 */
export function listenToUserTrades(
  userId: string, 
  onUpdate: (trades: Trade[]) => void, 
  onError: (error: any) => void
) {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  const q = query(
    collection(db, TRADES_COLLECTION), 
    where("userId", "==", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const trades: Trade[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        trades.push(data as Trade);
      });
      // Sort chronologically by date and id
      trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(trades);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, TRADES_COLLECTION);
      onError(error);
    }
  );
}
