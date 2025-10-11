// Main Application Logic for QuizIt
import db from './db.js';
import { getThemePreference, setThemePreference, toggleTheme, formatDate, showToast, debounce, downloadFile } from './utils.js';

class QuizItApp {
    constructor() {
        this.sets = [];
        this.filteredSets = [];
        this.deleteSetId = null;
        this.deferredPrompt = null;
        this.testConfigSetId = null;
        this.testConfigMode = null;
        this.exportSetId = null;
    }

    async init() {
        // Initialize database
        await db.init();

        // Initialize theme
        setThemePreference(getThemePreference());

        // Register service worker
        this.registerServiceWorker();

        // Setup PWA install prompt
        this.setupPWAInstall();

        // Load sets
        await this.loadSets();

        // Setup event listeners
        this.setupEventListeners();

        // Render sets
        this.renderSets();
    }

    async loadSets() {
        this.sets = await db.getAllSets();

        // Sort by modified date by default
        this.sets.sort((a, b) => b.modified - a.modified);

        this.filteredSets = [...this.sets];
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            toggleTheme();
        });

        // Search
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', debounce((e) => {
            this.filterSets();
        }, 300));

        document.getElementById('searchBtn').addEventListener('click', () => {
            this.filterSets();
        });

        // Filter starred
        document.getElementById('filterStarred').addEventListener('change', () => {
            this.filterSets();
        });

        // Sort
        document.getElementById('sortSelect').addEventListener('change', () => {
            this.sortSets();
            this.renderSets();
        });

        // Delete modal
        document.getElementById('cancelDelete').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.confirmDelete();
        });

        // Test config modal
        document.getElementById('cancelTestConfig').addEventListener('click', () => {
            this.hideTestConfigModal();
        });

        document.getElementById('startTestConfig').addEventListener('click', () => {
            this.confirmTestConfig();
        });

        document.getElementById('testQuestionCount').addEventListener('input', (e) => {
            this.updateTestConfigHint(parseInt(e.target.value));
        });

        // Import/Export Set modals
        document.getElementById('importSetBtn').addEventListener('click', () => {
            this.showImportSetModal();
        });

        document.getElementById('cancelImportSet').addEventListener('click', () => {
            this.hideImportSetModal();
        });

        document.getElementById('importSetFile').addEventListener('change', (e) => {
            this.handleImportSetFile(e);
        });

        document.getElementById('closeExportSet').addEventListener('click', () => {
            this.hideExportSetModal();
        });

        document.getElementById('downloadFullSet').addEventListener('click', () => {
            this.downloadFullSet();
        });
    }

    filterSets() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        const showStarredOnly = document.getElementById('filterStarred').checked;

        this.filteredSets = this.sets.filter(set => {
            const matchesSearch = !searchTerm ||
                set.name.toLowerCase().includes(searchTerm) ||
                (set.description && set.description.toLowerCase().includes(searchTerm));

            const matchesStarred = !showStarredOnly || set.starred;

            return matchesSearch && matchesStarred;
        });

        this.sortSets();
        this.renderSets();
    }

    sortSets() {
        const sortBy = document.getElementById('sortSelect').value;

        switch (sortBy) {
            case 'modified':
                this.filteredSets.sort((a, b) => b.modified - a.modified);
                break;
            case 'created':
                this.filteredSets.sort((a, b) => b.created - a.created);
                break;
            case 'name':
                this.filteredSets.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'cards':
                // This would require loading card counts, simplified for now
                this.filteredSets.sort((a, b) => b.modified - a.modified);
                break;
        }
    }

    async renderSets() {
        const container = document.getElementById('setsContainer');
        const emptyState = document.getElementById('emptyState');

        if (this.filteredSets.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';
        container.innerHTML = '';

        for (const set of this.filteredSets) {
            const card = await this.createSetCard(set);
            container.appendChild(card);
        }
    }

    async createSetCard(set) {
        const template = document.getElementById('setCardTemplate');
        const clone = template.content.cloneNode(true);

        const setCard = clone.querySelector('.set-card');
        setCard.dataset.setId = set.id;

        // Title
        clone.querySelector('.set-title').textContent = set.name;

        // Description
        const description = clone.querySelector('.set-description');
        description.textContent = set.description || 'No description';

        // Star button
        const starBtn = clone.querySelector('.star-btn');
        if (set.starred) {
            starBtn.classList.add('starred');
        }
        starBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleStar(set.id);
        });

        // Meta info
        const cards = await db.getCardsBySetId(set.id);
        const cardCount = cards.length;
        clone.querySelector('.card-count').textContent = `${cardCount} card${cardCount !== 1 ? 's' : ''}`;

        const sessions = await db.getSessionsBySetId(set.id);
        const lastSession = sessions.length > 0 ?
            sessions.sort((a, b) => b.startTime - a.startTime)[0] : null;

        clone.querySelector('.last-studied').textContent = lastSession ?
            `Studied ${formatDate(lastSession.startTime)}` : 'Never studied';

        // Stats - Mastery level
        const stats = await db.getSetStatistics(set.id);
        const progressFill = clone.querySelector('.progress-fill');
        progressFill.style.width = `${stats.masteryLevel}%`;
        clone.querySelector('.stat-value').textContent = `${Math.round(stats.masteryLevel)}%`;

        // Study mode buttons
        clone.querySelectorAll('.study-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = btn.dataset.mode;
                this.startStudy(set.id, mode);
            });
        });

        // Footer buttons
        clone.querySelector('.analytics-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = `analytics.html?setId=${set.id}`;
        });

        clone.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = `create.html?id=${set.id}`;
        });

        clone.querySelector('.export-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showExportSetModal(set.id);
        });

        clone.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showDeleteModal(set.id);
        });

        return clone;
    }

    async toggleStar(setId) {
        const set = this.sets.find(s => s.id === setId);
        if (!set) return;

        set.starred = !set.starred;
        await db.updateSet(set);

        // Find and update the star button
        const setCard = document.querySelector(`.set-card[data-set-id="${setId}"]`);
        if (setCard) {
            const starBtn = setCard.querySelector('.star-btn');
            starBtn.classList.toggle('starred');
        }
    }

    async startStudy(setId, mode) {
        if (mode === 'test') {
            // Show config modal for test mode
            this.testConfigSetId = setId;
            this.testConfigMode = mode;
            await this.showTestConfigModal(setId);
        } else {
            window.location.href = `study.html?setId=${setId}&mode=${mode}`;
        }
    }

    async showTestConfigModal(setId) {
        const cards = await db.getCardsBySetId(setId);
        const totalCards = cards.length;

        document.getElementById('testQuestionCount').value = Math.min(10, totalCards);
        document.getElementById('testQuestionCount').max = Math.max(totalCards * 2, 100);
        this.updateTestConfigHint(Math.min(10, totalCards), totalCards);

        document.getElementById('testConfigModal').style.display = 'flex';
    }

    updateTestConfigHint(count, totalCards = null) {
        const hint = document.getElementById('testConfigHint');
        if (totalCards === null) {
            // Get it from the current set
            const setId = this.testConfigSetId;
            db.getCardsBySetId(setId).then(cards => {
                totalCards = cards.length;
                this.updateTestConfigHint(count, totalCards);
            });
            return;
        }

        if (count > totalCards) {
            hint.textContent = `This set has ${totalCards} cards. Questions will repeat to reach ${count} total questions, prioritizing cards you get wrong.`;
        } else if (count < totalCards) {
            hint.textContent = `${count} of ${totalCards} cards will be shown, prioritizing the least learned cards.`;
        } else {
            hint.textContent = `All ${totalCards} cards will be shown.`;
        }
    }

    hideTestConfigModal() {
        this.testConfigSetId = null;
        this.testConfigMode = null;
        document.getElementById('testConfigModal').style.display = 'none';
    }

    confirmTestConfig() {
        const count = parseInt(document.getElementById('testQuestionCount').value);
        if (!count || count < 1) {
            showToast('Please enter a valid number', 'error');
            return;
        }

        window.location.href = `study.html?setId=${this.testConfigSetId}&mode=${this.testConfigMode}&count=${count}`;
    }

    showDeleteModal(setId) {
        this.deleteSetId = setId;
        document.getElementById('deleteModal').style.display = 'flex';
    }

    hideDeleteModal() {
        this.deleteSetId = null;
        document.getElementById('deleteModal').style.display = 'none';
    }

    async confirmDelete() {
        if (!this.deleteSetId) return;

        try {
            await db.deleteSet(this.deleteSetId);
            showToast('Set deleted successfully', 'success');

            // Reload sets
            await this.loadSets();
            this.filterSets();

            this.hideDeleteModal();
        } catch (error) {
            console.error('Error deleting set:', error);
            showToast('Failed to delete set', 'error');
        }
    }

    // ============ Import/Export Functions ============

    showImportSetModal() {
        document.getElementById('importSetModal').style.display = 'flex';
    }

    hideImportSetModal() {
        document.getElementById('importSetModal').style.display = 'none';
    }

    showExportSetModal(setId) {
        this.exportSetId = setId;
        document.getElementById('exportSetModal').style.display = 'flex';
    }

    hideExportSetModal() {
        this.exportSetId = null;
        document.getElementById('exportSetModal').style.display = 'none';
    }

    async downloadFullSet() {
        if (!this.exportSetId) return;

        try {
            // Get set data
            const set = await db.getSet(this.exportSetId);
            if (!set) {
                showToast('Set not found', 'error');
                return;
            }

            // Get all cards
            const cards = await db.getCardsBySetId(this.exportSetId);

            // Get all sessions
            const sessions = await db.getSessionsBySetId(this.exportSetId);

            // Get all performance records
            const allPerformance = [];
            for (const card of cards) {
                const performance = await db.getPerformanceByCardId(card.id);
                allPerformance.push(...performance);
            }

            // Create export data
            const exportData = {
                version: 1,
                exportDate: Date.now(),
                set: {
                    name: set.name,
                    description: set.description,
                    created: set.created,
                    modified: set.modified,
                    starred: set.starred
                },
                cards: cards.map(card => ({
                    front: card.front,
                    back: card.back,
                    frontImage: card.frontImage,
                    backImage: card.backImage,
                    easeFactor: card.easeFactor,
                    interval: card.interval,
                    repetitions: card.repetitions,
                    nextReview: card.nextReview,
                    created: card.created
                })),
                sessions: sessions,
                performance: allPerformance
            };

            const json = JSON.stringify(exportData, null, 2);
            const filename = `${set.name.replace(/[^a-z0-9]/gi, '_')}_backup.json`;
            downloadFile(json, filename);

            showToast('Set exported successfully!', 'success');
            this.hideExportSetModal();
        } catch (error) {
            console.error('Export error:', error);
            showToast('Failed to export set', 'error');
        }
    }

    async handleImportSetFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            showToast('Please select a JSON file', 'error');
            return;
        }

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Validate import data
            if (!data.set || !data.cards || !Array.isArray(data.cards)) {
                showToast('Invalid backup file format', 'error');
                return;
            }

            // Create new set
            const setId = await db.createSet(data.set.name, data.set.description);

            // Update set with additional properties
            const newSet = await db.getSet(setId);
            newSet.starred = data.set.starred || false;
            newSet.created = data.set.created || Date.now();
            await db.updateSet(newSet);

            // Create cards and track ID mapping
            const cardIdMap = new Map(); // old index -> new id
            for (let i = 0; i < data.cards.length; i++) {
                const cardData = data.cards[i];
                const newCardId = await db.createCard(
                    setId,
                    cardData.front,
                    cardData.back,
                    cardData.frontImage,
                    cardData.backImage
                );

                // Update card with SRS data
                const newCard = await db.getCard(newCardId);
                newCard.easeFactor = cardData.easeFactor || 2.5;
                newCard.interval = cardData.interval || 0;
                newCard.repetitions = cardData.repetitions || 0;
                newCard.nextReview = cardData.nextReview || Date.now();
                newCard.created = cardData.created || Date.now();
                await db.updateCard(newCard);

                cardIdMap.set(i, newCardId);
            }

            // Import sessions and performance if available
            if (data.sessions && Array.isArray(data.sessions)) {
                for (const sessionData of data.sessions) {
                    const sessionId = await db.createSession(setId, sessionData.mode);
                    const session = await db.getSession(sessionId);
                    session.startTime = sessionData.startTime;
                    session.endTime = sessionData.endTime;
                    session.cardsStudied = sessionData.cardsStudied;
                    session.correctCount = sessionData.correctCount;
                    session.incorrectCount = sessionData.incorrectCount;
                    await db.updateSession(session);
                }
            }

            showToast(`Imported "${data.set.name}" with ${data.cards.length} cards!`, 'success');
            this.hideImportSetModal();

            // Reload sets
            await this.loadSets();
            this.filterSets();

            event.target.value = ''; // Reset file input
        } catch (error) {
            console.error('Import error:', error);
            showToast('Failed to import set', 'error');
        }
    }

    // ============ PWA Functions ============

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('Service Worker registered:', registration);
                    })
                    .catch(error => {
                        console.log('Service Worker registration failed:', error);
                    });
            });
        }
    }

    setupPWAInstall() {
        const installBtn = document.getElementById('installBtn');

        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing
            e.preventDefault();
            // Save the event for later use
            this.deferredPrompt = e;
            // Show install button
            installBtn.style.display = 'inline-flex';
        });

        installBtn.addEventListener('click', async () => {
            if (!this.deferredPrompt) return;

            // Show the install prompt
            this.deferredPrompt.prompt();

            // Wait for the user's response
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`);

            // Clear the deferred prompt
            this.deferredPrompt = null;
            installBtn.style.display = 'none';
        });

        // Hide button if already installed
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            installBtn.style.display = 'none';
            showToast('QuizIt installed successfully!', 'success');
        });
    }
}

// Initialize app
const app = new QuizItApp();
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
