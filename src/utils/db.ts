export const DB_NAME = "PeerBinDB";
export const DB_VERSION = 3; // Incremented for message store
export const STORE_NAME = "snippets"; // for active editor autosave
export const MSG_STORE_NAME = "messages";

export interface MessageItem {
  id: string; // timestamp string
  type: "inbox" | "sent";
  content: string;
  timestamp: number;
}

/**
 * Initializes the IndexedDB for PeerBin.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(MSG_STORE_NAME)) {
        db.createObjectStore(MSG_STORE_NAME, { keyPath: "id" });
      }
      // Clean up old history if it existed
      if (db.objectStoreNames.contains("history")) {
        db.deleteObjectStore("history");
      }
    };
  });
}

// --- ACTIVE SNIPPET AUTOSAVE ---

export async function saveSnippet(id: string, content: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id, content, updatedAt: Date.now() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadSnippet(id: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      if (request.result) resolve(request.result.content);
      else resolve(null);
    };
    request.onerror = () => reject(request.error);
  });
}

// --- MESSAGES (INBOX & SENT) ---

export async function saveMessage(
  content: string,
  type: "inbox" | "sent",
): Promise<MessageItem> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MSG_STORE_NAME], "readwrite");
    const store = transaction.objectStore(MSG_STORE_NAME);
    const item: MessageItem = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: Date.now(),
    };
    const request = store.put(item);

    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

export async function getMessages(
  type: "inbox" | "sent",
): Promise<MessageItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MSG_STORE_NAME], "readonly");
    const store = transaction.objectStore(MSG_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const items = (request.result as MessageItem[])
        .filter((msg) => msg.type === type)
        .sort((a, b) => b.timestamp - a.timestamp); // newest first
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteMessage(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MSG_STORE_NAME], "readwrite");
    const store = transaction.objectStore(MSG_STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
