import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Foto } from './types';

const DB_NAME = 'muro_fotos_db';
const DB_VERSION = 1;
const STORE_NAME = 'fotos';

interface MuroFotosDB extends DBSchema {
  fotos: {
    key: string;
    value: Foto;
    indexes: { 'by-createdAt': number };
  };
}

let dbPromise: Promise<IDBPDatabase<MuroFotosDB>> | null = null;

function getDB(): Promise<IDBPDatabase<MuroFotosDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MuroFotosDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by-createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllFotosDB(): Promise<Foto[]> {
  const db = await getDB();
  const fotos = await db.getAllFromIndex(STORE_NAME, 'by-createdAt');
  // Devolvemos ordenado descendente (lo más reciente primero)
  return fotos.reverse();
}

export async function addFotosDB(nuevasFotos: Foto[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const foto of nuevasFotos) {
    await tx.store.add(foto);
  }
  await tx.done;
}

export async function updateFotoDB(foto: Foto): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, foto);
}

export async function deleteFotoDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}
