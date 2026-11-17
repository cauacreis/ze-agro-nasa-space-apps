import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('./data');

function ensureFile(filePath, rootKey = 'items') {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({ [rootKey]: [] }, null, 1));
    }
}

function readItems(filePath, rootKey = 'items') {
    ensureFile(filePath, rootKey);
    try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return Array.isArray(raw[rootKey]) ? raw[rootKey] : [];
    } catch {
        return [];
    }
}

function writeItems(filePath, items, rootKey = 'items') {
    ensureFile(filePath, rootKey);
    fs.writeFileSync(filePath, JSON.stringify({ [rootKey]: items }, null, 1));
}

function makeId() {
    return `${Date.now().toString(36)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
}

export function createJsonStore(filePath, rootKey = 'items') {
    return {
        filePath,
        list(filter = () => true) {
            return readItems(filePath, rootKey).filter(filter);
        },
        add(item) {
            const items = readItems(filePath, rootKey);
            const record = { id: makeId(), criado_em: new Date().toISOString(), ...item };
            items.push(record);
            writeItems(filePath, items, rootKey);
            return record;
        },
        update(id, patch) {
            const items = readItems(filePath, rootKey);
            const index = items.findIndex((x) => x.id === id);
            if (index < 0) return null;
            items[index] = { ...items[index], ...patch };
            writeItems(filePath, items, rootKey);
            return items[index];
        },
        remove(id) {
            const items = readItems(filePath, rootKey);
            const next = items.filter((x) => x.id !== id);
            if (next.length === items.length) return false;
            writeItems(filePath, next, rootKey);
            return true;
        },
        removeByUser(numero) {
            const items = readItems(filePath, rootKey);
            const next = items.filter((x) => x.numero !== numero);
            const removed = items.length - next.length;
            if (removed > 0) writeItems(filePath, next, rootKey);
            return removed;
        }
    };
}

// Armazenamento operacional local (fora do git via data/). Um processo PM2,
// arquivos pequenos, baixo volume. Nada secreto entra aqui.
export const fieldStore = createJsonStore(path.join(DATA_DIR, 'field_records.json'));
export const remindersStore = createJsonStore(path.join(DATA_DIR, 'reminders.json'));
export const accountsStore = createJsonStore(path.join(DATA_DIR, 'finance_accounts.json'));

export function apagarDadosLocais(numero) {
    return {
        registros: fieldStore.removeByUser(numero),
        lembretes: remindersStore.removeByUser(numero),
        contas: accountsStore.removeByUser(numero)
    };
}
