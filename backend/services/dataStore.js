import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isMongoConnected } from '../config/db.js';

// Import Mongoose Models
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Job } from '../models/Job.js';
import { Event } from '../models/Event.js';
import { Message } from '../models/Message.js';
import { JobApplication } from '../models/JobApplication.js';
import { AdminLog } from '../models/AdminLog.js';
import { CalendarEvent } from '../models/CalendarEvent.js';

const models = {
    User,
    Post,
    Job,
    Event,
    Message,
    JobApplication,
    AdminLog,
    CalendarEvent
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, '../data.json');

// Initialize data.json with default structure if missing
const initJSONDb = () => {
    if (!fs.existsSync(DB_FILE)) {
        const defaultSchema = {
            users: [],
            posts: [],
            jobs: [],
            events: [],
            messages: [],
            jobapplications: [],
            adminlogs: [],
            calendarevents: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultSchema, null, 2), 'utf8');
    }
};

// Queue variable to serialize concurrent writes safely
let writeQueue = Promise.resolve();

const readData = async () => {
    initJSONDb();
    try {
        const raw = await fs.promises.readFile(DB_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Error reading JSON DB file:', err);
        return { users: [], posts: [], jobs: [], events: [], messages: [] };
    }
};

const writeData = async (data) => {
    initJSONDb();
    return new Promise((resolve, reject) => {
        writeQueue = writeQueue.then(async () => {
            const tempFile = `${DB_FILE}.tmp`;
            try {
                await fs.promises.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf8');
                await fs.promises.rename(tempFile, DB_FILE);
                resolve();
            } catch (err) {
                console.error('Error writing JSON DB file atomically:', err);
                if (fs.existsSync(tempFile)) {
                    try { fs.unlinkSync(tempFile); } catch (e) {}
                }
                reject(err);
            }
        });
    });
};

const getCollectionKey = (modelName) => {
    const map = {
        User: 'users',
        Post: 'posts',
        Job: 'jobs',
        Event: 'events',
        Message: 'messages',
        JobApplication: 'jobapplications',
        AdminLog: 'adminlogs',
        CalendarEvent: 'calendarevents'
    };
    return map[modelName] || modelName.toLowerCase() + 's';
};

const normalizeDoc = (doc) => {
    if (!doc) return null;
    const normalized = { ...doc };
    if (normalized._id && !normalized.id) {
        normalized.id = normalized._id.toString();
    }
    if (normalized.id && !normalized._id) {
        normalized._id = normalized.id;
    }
    if (normalized.role) {
        const r = normalized.role.toUpperCase();
        if (r === 'UNDERGRADUATE' || r === 'STUDENT') normalized.role = 'student';
        else if (r === 'GRADUATE' || r === 'ALUMNI') normalized.role = 'alumni';
        else normalized.role = normalized.role.toLowerCase();
    }
    // Set default status for users
    if (normalized.email !== undefined && normalized.role !== undefined) {
        normalized.status = normalized.status || 'active';
    }
    // Set default status for jobs
    if (normalized.company !== undefined && normalized.postedBy !== undefined) {
        normalized.status = normalized.status || 'open';
    }
    // Set default pinning for posts
    if (normalized.content !== undefined && normalized.author !== undefined) {
        normalized.isPinned = normalized.isPinned || false;
    }
    return normalized;
};

const matchQuery = (item, query) => {
    if (!query || Object.keys(query).length === 0) return true;

    for (const key in query) {
        const val = query[key];

        if (key === '$or') {
            if (!Array.isArray(val)) return false;
            const matchesAny = val.some(subQuery => matchQuery(item, subQuery));
            if (!matchesAny) return false;
            continue;
        }

        const itemVal = item[key];

        if (val && typeof val === 'object' && !Array.isArray(val)) {
            if (val.$regex !== undefined) {
                const regex = new RegExp(val.$regex, val.$options || '');
                if (!regex.test(itemVal || '')) return false;
            } else if (val.$in !== undefined) {
                if (Array.isArray(itemVal)) {
                    if (!itemVal.some(v => val.$in.includes(v))) return false;
                } else {
                    if (!val.$in.includes(itemVal)) return false;
                }
            } else if (val.$gte !== undefined) {
                if (itemVal === undefined || itemVal === null || itemVal < val.$gte) return false;
            } else if (val.$gt !== undefined) {
                if (itemVal === undefined || itemVal === null || itemVal <= val.$gt) return false;
            } else if (val.$lte !== undefined) {
                if (itemVal === undefined || itemVal === null || itemVal > val.$lte) return false;
            } else if (val.$lt !== undefined) {
                if (itemVal === undefined || itemVal === null || itemVal >= val.$lt) return false;
            } else if (val.$ne !== undefined) {
                if (itemVal === val.$ne) return false;
            } else {
                // Object direct comparison
                if (JSON.stringify(itemVal) !== JSON.stringify(val)) return false;
            }
        } else {
            // Primitive comparison
            if (Array.isArray(itemVal)) {
                if (!itemVal.includes(val)) return false;
            } else {
                if (itemVal !== val) return false;
            }
        }
    }
    return true;
};

const offlinePopulate = async (modelName, docs, path) => {
    if (!docs) return docs;
    const isArray = Array.isArray(docs);
    const list = isArray ? docs : [docs];

    const data = await readData();

    for (const doc of list) {
        if (!doc) continue;
        const refId = doc[path];
        if (refId) {
            const idStr = refId.toString();
            const user = data.users.find(u => u.id === idStr || u._id === idStr);
            if (user) {
                const { passwordHash, ...cleanUser } = user;
                doc[path] = normalizeDoc(cleanUser);
            }
        }
    }

    return isArray ? list : list[0];
};

export const dataStore = {
    find: async (modelName, query = {}, options = {}) => {
        if (isMongoConnected()) {
            let q = models[modelName].find(query);
            if (options.sort) q = q.sort(options.sort);
            if (options.skip) q = q.skip(options.skip);
            if (options.limit) q = q.limit(options.limit);
            if (options.populate) q = q.populate(options.populate);
            const results = await q.lean();
            return results.map(normalizeDoc);
        } else {
            const key = getCollectionKey(modelName);
            const data = await readData();
            let items = data[key] || [];

            // Filter
            items = items.filter(item => matchQuery(item, query));

            // Sort
            if (options.sort) {
                const sortKeys = Object.keys(options.sort);
                items.sort((a, b) => {
                    for (const sKey of sortKeys) {
                        const order = options.sort[sKey];
                        let valA = a[sKey];
                        let valB = b[sKey];
                        if (sKey === 'createdAt' || sKey === 'timestamp') {
                            valA = new Date(valA || 0).getTime();
                            valB = new Date(valB || 0).getTime();
                        }
                        if (typeof valA === 'boolean') valA = valA ? 1 : 0;
                        if (typeof valB === 'boolean') valB = valB ? 1 : 0;
                        if (valA === undefined || valA === null) valA = 0;
                        if (valB === undefined || valB === null) valB = 0;
                        if (valA < valB) return -1 * order;
                        if (valA > valB) return 1 * order;
                    }
                    return 0;
                });
            }

            // Pagination
            const skip = options.skip || 0;
            const limit = options.limit || items.length;
            items = items.slice(skip, skip + limit);

            const normalized = items.map(normalizeDoc);
            if (options.populate) {
                await offlinePopulate(modelName, normalized, options.populate);
            }
            return normalized;
        }
    },

    findOne: async (modelName, query = {}, options = {}) => {
        if (isMongoConnected()) {
            let q = models[modelName].findOne(query);
            if (options.populate) q = q.populate(options.populate);
            const doc = await q.lean();
            return normalizeDoc(doc);
        } else {
            const key = getCollectionKey(modelName);
            const data = await readData();
            const items = data[key] || [];
            const found = items.find(item => matchQuery(item, query));
            if (!found) return null;
            const normalized = normalizeDoc(found);
            if (options.populate) {
                await offlinePopulate(modelName, normalized, options.populate);
            }
            return normalized;
        }
    },

    findById: async (modelName, id, options = {}) => {
        if (isMongoConnected()) {
            let q = models[modelName].findById(id);
            if (options.populate) q = q.populate(options.populate);
            const doc = await q.lean();
            return normalizeDoc(doc);
        } else {
            const key = getCollectionKey(modelName);
            const data = await readData();
            const items = data[key] || [];
            const found = items.find(item => item.id === id || item._id === id);
            if (!found) return null;
            const normalized = normalizeDoc(found);
            if (options.populate) {
                await offlinePopulate(modelName, normalized, options.populate);
            }
            return normalized;
        }
    },

    insert: async (modelName, doc) => {
        if (isMongoConnected()) {
            const Model = models[modelName];
            const newDoc = new Model(doc);
            const saved = await newDoc.save();
            return normalizeDoc(saved.toObject());
        } else {
            const key = getCollectionKey(modelName);
            const data = await readData();
            if (!data[key]) data[key] = [];

            const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const newDoc = {
                ...doc,
                _id: id,
                id: id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            data[key].push(newDoc);
            await writeData(data);
            return normalizeDoc(newDoc);
        }
    },

    update: async (modelName, query, updates) => {
        if (isMongoConnected()) {
            const doc = await models[modelName].findOneAndUpdate(query, updates, { new: true }).lean();
            return normalizeDoc(doc);
        } else {
            const key = getCollectionKey(modelName);
            const data = await readData();
            const items = data[key] || [];

            const index = items.findIndex(item => matchQuery(item, query));
            if (index === -1) return null;

            const currentItem = items[index];
            let updatedItem = { ...currentItem };

            // Support MongoDB set/push/pull operators
            if (updates.$set) {
                updatedItem = { ...updatedItem, ...updates.$set };
            }
            if (updates.$push) {
                for (const field in updates.$push) {
                    if (!Array.isArray(updatedItem[field])) updatedItem[field] = [];
                    updatedItem[field].push(updates.$push[field]);
                }
            }
            if (updates.$pull) {
                for (const field in updates.$pull) {
                    if (Array.isArray(updatedItem[field])) {
                        const pullVal = updates.$pull[field];
                        if (pullVal && typeof pullVal === 'object' && !Array.isArray(pullVal)) {
                            updatedItem[field] = updatedItem[field].filter(v => !matchQuery(v, pullVal));
                        } else {
                            updatedItem[field] = updatedItem[field].filter(v => 
                                v !== pullVal && 
                                (v && pullVal && v.toString() !== pullVal.toString())
                            );
                        }
                    }
                }
            }
            if (updates.$unset) {
                for (const field in updates.$unset) {
                    delete updatedItem[field];
                }
            }

            // Primitive updates fallback (non-operator fields)
            const hasOperators = Object.keys(updates).some(k => k.startsWith('$'));
            if (!hasOperators) {
                updatedItem = { ...updatedItem, ...updates };
            }

            updatedItem.updatedAt = new Date().toISOString();
            items[index] = updatedItem;
            data[key] = items;
            await writeData(data);
            return normalizeDoc(updatedItem);
        }
    },

    remove: async (modelName, query) => {
        if (isMongoConnected()) {
            const doc = await models[modelName].findOneAndDelete(query).lean();
            return normalizeDoc(doc);
        } else {
            const key = getCollectionKey(modelName);
            const data = await readData();
            const items = data[key] || [];

            const index = items.findIndex(item => matchQuery(item, query));
            if (index === -1) return null;

            const deleted = items.splice(index, 1)[0];
            data[key] = items;
            await writeData(data);
            return normalizeDoc(deleted);
        }
    }
};
