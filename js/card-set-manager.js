// Card Set Manager - Handles create/edit functionality
import db from './db.js';
import { getThemePreference, setThemePreference, toggleTheme, showToast, copyToClipboard, safeJsonParse, downloadFile, getUrlParameter } from './utils.js';

class CardSetManager {
    constructor() {
        this.cards = [];
        this.setId = null;
        this.isEditMode = false;
    }

    async init() {
        // Initialize database
        await db.init();

        // Initialize theme
        setThemePreference(getThemePreference());

        // Check if editing existing set
        this.setId = getUrlParameter('id');
        if (this.setId) {
            this.isEditMode = true;
            await this.loadSet();
        } else {
            // Start with 2 empty cards
            this.addCard();
            this.addCard();
        }

        this.setupEventListeners();
        this.updateUI();
    }

    async loadSet() {
        try {
            const set = await db.getSet(parseInt(this.setId));
            if (!set) {
                showToast('Set not found', 'error');
                window.location.href = 'index.html';
                return;
            }

            // Load set info
            document.getElementById('setTitle').value = set.name;
            document.getElementById('setDescription').value = set.description || '';
            document.getElementById('pageTitle').textContent = 'Edit Study Set';

            // Load cards
            const cards = await db.getCardsBySetId(parseInt(this.setId));
            this.cards = cards.map((card, index) => ({
                id: card.id,
                front: card.front,
                back: card.back,
                frontImage: card.frontImage || null,
                backImage: card.backImage || null,
                tempId: index
            }));

            this.renderCards();
        } catch (error) {
            console.error('Error loading set:', error);
            showToast('Failed to load set', 'error');
        }
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            toggleTheme();
        });

        // Add card button
        document.getElementById('addCardBtn').addEventListener('click', () => {
            this.addCard();
        });

        // Save button
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveSet();
        });

        // Cancel button
        document.getElementById('cancelBtn').addEventListener('click', () => {
            if (confirm('Discard changes?')) {
                window.location.href = 'index.html';
            }
        });

        // Import/Export
        document.getElementById('importBtn').addEventListener('click', () => {
            this.showImportModal();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.showExportModal();
        });

        // Import modal
        document.getElementById('cancelImport').addEventListener('click', () => {
            this.hideImportModal();
        });

        document.getElementById('confirmImport').addEventListener('click', () => {
            this.importCards();
        });

        // Export modal
        document.getElementById('closeExport').addEventListener('click', () => {
            this.hideExportModal();
        });

        document.getElementById('copyExport').addEventListener('click', async () => {
            const text = document.getElementById('exportText').value;
            const success = await copyToClipboard(text);
            if (success) {
                showToast('Copied to clipboard!', 'success');
            } else {
                showToast('Failed to copy', 'error');
            }
        });

        document.getElementById('downloadExport').addEventListener('click', () => {
            const title = document.getElementById('setTitle').value.trim() || 'cards';
            const filename = `${title.replace(/[^a-z0-9]/gi, '_')}_export.json`;
            downloadFile(this.exportData, filename);
            showToast('Downloaded!', 'success');
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.handleImportFile(e);
        });
    }

    addCard() {
        const tempId = Date.now() + Math.random();
        this.cards.push({
            tempId,
            front: '',
            back: '',
            frontImage: null,
            backImage: null
        });
        this.renderCards();
    }

    deleteCard(tempId) {
        if (this.cards.length <= 1) {
            showToast('You must have at least one card', 'error');
            return;
        }

        this.cards = this.cards.filter(card => card.tempId !== tempId);
        this.renderCards();
    }

    renderCards() {
        const container = document.getElementById('cardsContainer');
        container.innerHTML = '';

        this.cards.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            container.appendChild(cardElement);
        });
    }

    createCardElement(card, index) {
        const template = document.getElementById('cardTemplate');
        const clone = template.content.cloneNode(true);

        const cardEditor = clone.querySelector('.card-editor');
        cardEditor.dataset.cardIndex = index;
        cardEditor.dataset.tempId = card.tempId;

        const cardNumber = clone.querySelector('.card-number');
        cardNumber.textContent = index + 1;

        const termInput = clone.querySelector('.term-input');
        const definitionInput = clone.querySelector('.definition-input');

        termInput.value = card.front || '';
        definitionInput.value = card.back || '';

        // Update card data on input
        termInput.addEventListener('input', (e) => {
            this.cards[index].front = e.target.value;
        });

        definitionInput.addEventListener('input', (e) => {
            this.cards[index].back = e.target.value;
        });

        // Image upload for TERM (front)
        const imageInput = clone.querySelector('.card-image-input');
        const imageBtn = clone.querySelector('.card-image-btn');
        const imagePreview = clone.querySelector('.card-image-preview');
        const previewImg = clone.querySelector('.preview-img');
        const removeImageBtn = clone.querySelector('.remove-image-btn');

        imageBtn.addEventListener('click', () => {
            imageInput.click();
        });

        imageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const imageData = await this.readImageFile(file);
                this.cards[index].frontImage = imageData;
                previewImg.src = imageData;
                imagePreview.style.display = 'block';
                imageBtn.style.display = 'none';
            }
        });

        removeImageBtn.addEventListener('click', () => {
            this.cards[index].frontImage = null;
            previewImg.src = '';
            imagePreview.style.display = 'none';
            imageBtn.style.display = 'inline-flex';
            imageInput.value = '';
        });

        // Load existing front image if present
        if (card.frontImage) {
            previewImg.src = card.frontImage;
            imagePreview.style.display = 'block';
            imageBtn.style.display = 'none';
        }

        // Image upload for DEFINITION (back)
        const imageInputDef = clone.querySelector('.card-image-input-def');
        const imageBtnDef = clone.querySelector('.card-image-btn-def');
        const imagePreviewDef = clone.querySelector('.card-image-preview-def');
        const previewImgDef = clone.querySelector('.preview-img-def');
        const removeImageBtnDef = clone.querySelector('.remove-image-btn-def');

        imageBtnDef.addEventListener('click', () => {
            imageInputDef.click();
        });

        imageInputDef.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const imageData = await this.readImageFile(file);
                this.cards[index].backImage = imageData;
                previewImgDef.src = imageData;
                imagePreviewDef.style.display = 'block';
                imageBtnDef.style.display = 'none';
            }
        });

        removeImageBtnDef.addEventListener('click', () => {
            this.cards[index].backImage = null;
            previewImgDef.src = '';
            imagePreviewDef.style.display = 'none';
            imageBtnDef.style.display = 'inline-flex';
            imageInputDef.value = '';
        });

        // Load existing back image if present
        if (card.backImage) {
            previewImgDef.src = card.backImage;
            imagePreviewDef.style.display = 'block';
            imageBtnDef.style.display = 'none';
        }

        // Delete button
        const deleteBtn = clone.querySelector('.delete-card-btn');
        deleteBtn.addEventListener('click', () => {
            this.deleteCard(card.tempId);
        });

        return clone;
    }

    async readImageFile(file) {
        return new Promise((resolve, reject) => {
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image size must be less than 5MB', 'error');
                reject(new Error('File too large'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async saveSet() {
        const title = document.getElementById('setTitle').value.trim();
        const description = document.getElementById('setDescription').value.trim();

        // Validation
        if (!title) {
            showToast('Please enter a title', 'error');
            return;
        }

        // Filter out empty cards
        const validCards = this.cards.filter(card =>
            card.front.trim() && card.back.trim()
        );

        if (validCards.length === 0) {
            showToast('Please add at least one card with both term and definition', 'error');
            return;
        }

        try {
            let setId;

            if (this.isEditMode) {
                // Update existing set
                const set = await db.getSet(parseInt(this.setId));
                set.name = title;
                set.description = description;
                await db.updateSet(set);
                setId = parseInt(this.setId);

                // Get existing cards
                const existingCards = await db.getCardsBySetId(setId);
                const existingIds = new Set(existingCards.map(c => c.id));

                // Update/create cards
                for (const card of validCards) {
                    if (card.id && existingIds.has(card.id)) {
                        // Update existing card
                        const existingCard = existingCards.find(c => c.id === card.id);
                        existingCard.front = card.front.trim();
                        existingCard.back = card.back.trim();
                        existingCard.frontImage = card.frontImage;
                        existingCard.backImage = card.backImage;
                        await db.updateCard(existingCard);
                        existingIds.delete(card.id);
                    } else {
                        // Create new card
                        await db.createCard(setId, card.front.trim(), card.back.trim(), card.frontImage, card.backImage);
                    }
                }

                // Delete removed cards
                for (const id of existingIds) {
                    await db.deleteCard(id);
                }

                showToast('Set updated successfully!', 'success');
            } else {
                // Create new set
                setId = await db.createSet(title, description);

                // Create cards
                for (const card of validCards) {
                    await db.createCard(setId, card.front.trim(), card.back.trim(), card.frontImage, card.backImage);
                }

                showToast('Set created successfully!', 'success');
            }

            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);

        } catch (error) {
            console.error('Error saving set:', error);
            showToast('Failed to save set', 'error');
        }
    }

    showImportModal() {
        document.getElementById('importModal').style.display = 'flex';
        document.getElementById('importText').value = '';
    }

    hideImportModal() {
        document.getElementById('importModal').style.display = 'none';
    }

    importCards() {
        const text = document.getElementById('importText').value.trim();
        if (!text) {
            showToast('Please enter JSON data', 'error');
            return;
        }

        try {
            const data = safeJsonParse(text);
            if (!Array.isArray(data)) {
                throw new Error('Data must be an array');
            }

            let importedCount = 0;
            for (const item of data) {
                if (item.front && item.back) {
                    const tempId = Date.now() + Math.random();
                    this.cards.push({
                        tempId,
                        front: item.front,
                        back: item.back,
                        frontImage: item.frontImage || null,
                        backImage: item.backImage || null
                    });
                    importedCount++;
                }
            }

            if (importedCount > 0) {
                this.renderCards();
                showToast(`Imported ${importedCount} cards!`, 'success');
                this.hideImportModal();
            } else {
                showToast('No valid cards found in data', 'error');
            }

        } catch (error) {
            console.error('Import error:', error);
            showToast('Invalid JSON format', 'error');
        }
    }

    async handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const isJSON = file.name.endsWith('.json');
        const isCSV = file.name.endsWith('.csv');

        if (!isJSON && !isCSV) {
            showToast('Please select a JSON or CSV file', 'error');
            return;
        }

        try {
            const text = await file.text();

            if (isCSV) {
                // Parse CSV and convert to JSON
                const jsonData = this.parseCSV(text);
                document.getElementById('importText').value = JSON.stringify(jsonData, null, 2);
            } else {
                // It's JSON, use as-is
                document.getElementById('importText').value = text;
            }

            this.importCards();
            event.target.value = ''; // Reset file input
        } catch (error) {
            console.error('Error reading file:', error);
            showToast('Failed to read file', 'error');
        }
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const cards = [];

        for (const line of lines) {
            // Find the first comma to split term and definition
            const firstCommaIndex = line.indexOf(',');

            if (firstCommaIndex === -1) {
                console.warn('Skipping invalid line (no comma):', line);
                continue;
            }

            const front = line.substring(0, firstCommaIndex).trim();
            const back = line.substring(firstCommaIndex + 1).trim();

            // Skip empty cards
            if (!front || !back) {
                console.warn('Skipping line with empty term or definition:', line);
                continue;
            }

            cards.push({
                front: front,
                back: back
            });
        }

        return cards;
    }

    async showExportModal() {
        const exportData = this.cards
            .filter(card => card.front.trim() && card.back.trim())
            .map(card => ({
                front: card.front.trim(),
                back: card.back.trim(),
                frontImage: card.frontImage || null,
                backImage: card.backImage || null
            }));

        const json = JSON.stringify(exportData, null, 2);
        document.getElementById('exportText').value = json;
        document.getElementById('exportModal').style.display = 'flex';

        // Store data for download
        this.exportData = json;
    }

    hideExportModal() {
        document.getElementById('exportModal').style.display = 'none';
    }

    updateUI() {
        // Any additional UI updates
    }
}

// Initialize when page loads
const manager = new CardSetManager();
document.addEventListener('DOMContentLoaded', () => {
    manager.init();
});
