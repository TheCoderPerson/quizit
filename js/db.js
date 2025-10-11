// IndexedDB Database Wrapper for QuizIt
const DB_NAME = 'QuizItDB';
const DB_VERSION = 1;

class QuizItDB {
    constructor() {
        this.db = null;
    }

    /**
     * Initialize and open the database
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create Sets store
                if (!db.objectStoreNames.contains('sets')) {
                    const setsStore = db.createObjectStore('sets', { keyPath: 'id', autoIncrement: true });
                    setsStore.createIndex('name', 'name', { unique: false });
                    setsStore.createIndex('created', 'created', { unique: false });
                    setsStore.createIndex('modified', 'modified', { unique: false });
                }

                // Create Cards store
                if (!db.objectStoreNames.contains('cards')) {
                    const cardsStore = db.createObjectStore('cards', { keyPath: 'id', autoIncrement: true });
                    cardsStore.createIndex('setId', 'setId', { unique: false });
                    cardsStore.createIndex('nextReview', 'nextReview', { unique: false });
                }

                // Create Sessions store
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
                    sessionsStore.createIndex('setId', 'setId', { unique: false });
                    sessionsStore.createIndex('startTime', 'startTime', { unique: false });
                }

                // Create CardPerformance store
                if (!db.objectStoreNames.contains('cardPerformance')) {
                    const performanceStore = db.createObjectStore('cardPerformance', { keyPath: 'id', autoIncrement: true });
                    performanceStore.createIndex('cardId', 'cardId', { unique: false });
                    performanceStore.createIndex('sessionId', 'sessionId', { unique: false });
                    performanceStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    /**
     * Generic method to add a record to a store
     */
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic method to get a record by ID
     */
    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic method to get all records from a store
     */
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic method to update a record
     */
    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic method to delete a record
     */
    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get records by index
     */
    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ========== Set-specific methods ==========

    async createSet(name, description = '') {
        const now = Date.now();
        const set = {
            name,
            description,
            created: now,
            modified: now,
            starred: false
        };
        return await this.add('sets', set);
    }

    async getSet(id) {
        return await this.get('sets', id);
    }

    async getAllSets() {
        return await this.getAll('sets');
    }

    async updateSet(set) {
        set.modified = Date.now();
        return await this.update('sets', set);
    }

    async deleteSet(id) {
        // Delete the set
        await this.delete('sets', id);

        // Delete all cards in the set
        const cards = await this.getCardsBySetId(id);
        for (const card of cards) {
            await this.delete('cards', card.id);

            // Delete card performance records
            const performances = await this.getByIndex('cardPerformance', 'cardId', card.id);
            for (const perf of performances) {
                await this.delete('cardPerformance', perf.id);
            }
        }

        // Delete all sessions for the set
        const sessions = await this.getByIndex('sessions', 'setId', id);
        for (const session of sessions) {
            await this.delete('sessions', session.id);
        }
    }

    // ========== Card-specific methods ==========

    async createCard(setId, front, back, frontImage = null, backImage = null) {
        const card = {
            setId,
            front,
            back,
            frontImage,
            backImage,
            easeFactor: 2.5,  // SM-2 algorithm default
            interval: 0,      // days until next review
            repetitions: 0,   // consecutive correct answers
            nextReview: Date.now(),
            created: Date.now()
        };
        return await this.add('cards', card);
    }

    async getCard(id) {
        return await this.get('cards', id);
    }

    async getCardsBySetId(setId) {
        return await this.getByIndex('cards', 'setId', setId);
    }

    async updateCard(card) {
        return await this.update('cards', card);
    }

    async deleteCard(id) {
        // Delete card performance records
        const performances = await this.getByIndex('cardPerformance', 'cardId', id);
        for (const perf of performances) {
            await this.delete('cardPerformance', perf.id);
        }

        return await this.delete('cards', id);
    }

    async getCardsDueForReview(setId) {
        const cards = await this.getCardsBySetId(setId);
        const now = Date.now();
        return cards.filter(card => card.nextReview <= now);
    }

    // ========== Session-specific methods ==========

    async createSession(setId, mode) {
        const session = {
            setId,
            mode,
            startTime: Date.now(),
            endTime: null,
            cardsStudied: 0,
            correctCount: 0,
            incorrectCount: 0
        };
        return await this.add('sessions', session);
    }

    async getSession(id) {
        return await this.get('sessions', id);
    }

    async getSessionsBySetId(setId) {
        return await this.getByIndex('sessions', 'setId', setId);
    }

    async updateSession(session) {
        return await this.update('sessions', session);
    }

    async endSession(sessionId, stats) {
        const session = await this.getSession(sessionId);
        session.endTime = Date.now();
        session.cardsStudied = stats.cardsStudied || 0;
        session.correctCount = stats.correctCount || 0;
        session.incorrectCount = stats.incorrectCount || 0;
        return await this.updateSession(session);
    }

    // ========== Card Performance methods ==========

    async recordPerformance(cardId, sessionId, correct, timeSpent, confidence = 3) {
        const performance = {
            cardId,
            sessionId,
            correct,
            timeSpent,
            confidence,
            timestamp: Date.now()
        };
        return await this.add('cardPerformance', performance);
    }

    async getPerformanceByCardId(cardId) {
        return await this.getByIndex('cardPerformance', 'cardId', cardId);
    }

    async getPerformanceBySessionId(sessionId) {
        return await this.getByIndex('cardPerformance', 'sessionId', sessionId);
    }

    // ========== Analytics methods ==========

    async getSetStatistics(setId) {
        const cards = await this.getCardsBySetId(setId);
        const sessions = await this.getSessionsBySetId(setId);

        let totalCorrect = 0;
        let totalIncorrect = 0;
        let totalTime = 0;

        for (const session of sessions) {
            if (session.endTime) {
                totalCorrect += session.correctCount || 0;
                totalIncorrect += session.incorrectCount || 0;
                totalTime += session.endTime - session.startTime;
            }
        }

        const totalAttempts = totalCorrect + totalIncorrect;
        const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;

        // Calculate mastery level (cards with ease factor > 2.5 and interval > 1)
        const masteredCards = cards.filter(c => c.easeFactor > 2.5 && c.interval >= 1).length;
        const masteryLevel = cards.length > 0 ? (masteredCards / cards.length) * 100 : 0;

        return {
            totalCards: cards.length,
            totalSessions: sessions.length,
            totalTime,
            accuracy,
            masteryLevel,
            totalCorrect,
            totalIncorrect
        };
    }

    async getCardStatistics(cardId) {
        const performances = await this.getPerformanceByCardId(cardId);

        const totalAttempts = performances.length;
        const correctCount = performances.filter(p => p.correct).length;
        const incorrectCount = totalAttempts - correctCount;
        const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;

        const totalTime = performances.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
        const avgTime = totalAttempts > 0 ? totalTime / totalAttempts : 0;

        const lastStudied = totalAttempts > 0 ? performances[performances.length - 1].timestamp : null;

        return {
            totalAttempts,
            correctCount,
            incorrectCount,
            accuracy,
            avgTime,
            lastStudied
        };
    }
}

// Create and export a singleton instance
const db = new QuizItDB();

export default db;
