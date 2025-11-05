// Study Modes Manager - Handles all study modes
import db from './db.js';
import SRSAlgorithm from './srs-algorithm.js';
import { getThemePreference, setThemePreference, toggleTheme, shuffleArray, isAnswerCorrect, formatDuration, getUrlParameter, setUrlParameters, getTestQuestionTypePreference } from './utils.js';

class StudyModesManager {
    constructor() {
        this.setId = null;
        this.mode = null;
        this.cards = [];
        this.currentIndex = 0;
        this.sessionId = null;
        this.sessionStart = Date.now();
        this.stats = {
            cardsStudied: 0,
            correctCount: 0,
            incorrectCount: 0
        };
        this.cardStartTime = Date.now();

        // Test mode specific
        this.testTargetCount = null;
        this.testCards = [];
        this.incorrectCards = [];
        this.correctCards = [];
    }

    async init() {
        await db.init();
        setThemePreference(getThemePreference());

        this.setId = parseInt(getUrlParameter('setId'));
        this.mode = getUrlParameter('mode');
        const countParam = getUrlParameter('count');
        this.testTargetCount = countParam ? parseInt(countParam) : null;

        if (!this.setId || !this.mode) {
            window.location.href = 'index.html';
            return;
        }

        await this.loadSet();
        this.setupEventListeners();
        await this.startSession();
    }

    async loadSet() {
        const set = await db.getSet(this.setId);
        if (!set) {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('setTitle').textContent = set.name;
        document.getElementById('modeLabel').textContent = this.getModeName();

        this.cards = await db.getCardsBySetId(this.setId);

        if (this.cards.length === 0) {
            alert('This set has no cards!');
            window.location.href = 'index.html';
            return;
        }

        // Sort cards by SRS priority for better learning
        this.cards = SRSAlgorithm.sortCardsByPriority(this.cards);
    }

    getModeName() {
        const modes = {
            'flashcards': '📇 Flashcards',
            'learn': '📖 Learn',
            'test': '📝 Test',
            'match': '🎯 Match'
        };
        return modes[this.mode] || 'Study';
    }

    setupEventListeners() {
        document.getElementById('themeToggle').addEventListener('click', () => {
            toggleTheme();
        });
    }

    async startSession() {
        this.sessionId = await db.createSession(this.setId, this.mode);
        this.sessionStart = Date.now();

        // Start appropriate mode
        switch (this.mode) {
            case 'flashcards':
                this.startFlashcardsMode();
                break;
            case 'learn':
                this.startLearnMode();
                break;
            case 'test':
                this.startTestMode();
                break;
            case 'match':
                this.startMatchMode();
                break;
        }
    }

    updateProgress() {
        const progressText = document.getElementById('progressText');
        const accuracyText = document.getElementById('accuracyText');
        const progressBar = document.getElementById('progressBar');

        // Use appropriate total based on mode
        let totalCards, currentPosition;
        if (this.mode === 'test' && this.testTargetCount) {
            totalCards = this.testTargetCount;
            currentPosition = this.currentIndex + 1;
        } else if (this.mode === 'test' && this.testCards.length > 0) {
            totalCards = this.testCards.length;
            currentPosition = this.currentIndex + 1;
        } else if (this.mode === 'match') {
            totalCards = this.matchPairs.length;
            currentPosition = this.matchedPairs;
        } else {
            totalCards = this.cards.length;
            currentPosition = this.currentIndex + 1;
        }

        progressText.textContent = `${currentPosition} / ${totalCards}`;

        const total = this.stats.correctCount + this.stats.incorrectCount;
        const accuracy = total > 0 ? Math.round((this.stats.correctCount / total) * 100) : 0;
        accuracyText.textContent = `Accuracy: ${accuracy}%`;

        const progress = (currentPosition / totalCards) * 100;
        progressBar.style.width = `${progress}%`;
    }

    // ============ FLASHCARDS MODE ============

    startFlashcardsMode() {
        document.getElementById('flashcardsMode').style.display = 'block';
        this.currentIndex = 0;
        this.showFlashcard();

        const flashcard = document.getElementById('flashcard');
        flashcard.addEventListener('click', () => {
            flashcard.classList.toggle('flipped');
            if (flashcard.classList.contains('flipped')) {
                document.getElementById('confidenceRating').style.display = 'block';
                document.getElementById('flashcardControls').style.display = 'none';
            }
        });

        document.getElementById('prevCard').addEventListener('click', () => this.prevFlashcard());
        document.getElementById('nextCard').addEventListener('click', () => this.nextFlashcard());
        document.getElementById('shuffleCards').addEventListener('click', () => this.shuffleFlashcards());

        // Confidence ratings
        document.querySelectorAll('.btn-rating').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.rateFlashcard(rating);
            });
        });
    }

    showFlashcard() {
        const card = this.cards[this.currentIndex];
        document.getElementById('cardFront').textContent = card.front;
        document.getElementById('cardBack').textContent = card.back;

        // Show/hide front image
        const frontImage = document.getElementById('cardFrontImage');
        if (card.frontImage) {
            frontImage.src = card.frontImage;
            frontImage.style.display = 'block';
        } else {
            frontImage.style.display = 'none';
        }

        // Show/hide back image
        const backImage = document.getElementById('cardBackImage');
        if (card.backImage) {
            backImage.src = card.backImage;
            backImage.style.display = 'block';
        } else {
            backImage.style.display = 'none';
        }

        const flashcard = document.getElementById('flashcard');
        flashcard.classList.remove('flipped');

        document.getElementById('confidenceRating').style.display = 'none';
        document.getElementById('flashcardControls').style.display = 'flex';

        this.cardStartTime = Date.now();
        this.updateProgress();
    }

    async rateFlashcard(rating) {
        const card = this.cards[this.currentIndex];
        const timeSpent = Date.now() - this.cardStartTime;
        const quality = SRSAlgorithm.mapSimpleRatingToQuality(rating);
        const correct = rating >= 3;

        // Update SRS
        const updatedCard = SRSAlgorithm.calculateNextReview(card, quality);
        await db.updateCard(updatedCard);

        // Record performance
        await db.recordPerformance(card.id, this.sessionId, correct, timeSpent, rating);

        // Update stats
        this.stats.cardsStudied++;
        if (correct) {
            this.stats.correctCount++;
        } else {
            this.stats.incorrectCount++;
        }

        // Move to next card
        if (this.currentIndex < this.cards.length - 1) {
            this.currentIndex++;
            this.showFlashcard();
        } else {
            await this.endSession();
        }
    }

    prevFlashcard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.showFlashcard();
        }
    }

    nextFlashcard() {
        if (this.currentIndex < this.cards.length - 1) {
            this.currentIndex++;
            this.showFlashcard();
        } else {
            this.endSession();
        }
    }

    shuffleFlashcards() {
        const current = this.cards[this.currentIndex];
        this.cards = shuffleArray(this.cards);
        this.currentIndex = this.cards.indexOf(current);
        this.showFlashcard();
    }

    // ============ LEARN MODE ============

    startLearnMode() {
        document.getElementById('learnMode').style.display = 'block';
        this.currentIndex = 0;
        this.showLearnCard();

        document.getElementById('checkAnswer').addEventListener('click', () => this.checkLearnAnswer());
        document.getElementById('continueLearn').addEventListener('click', () => this.nextLearnCard());

        document.getElementById('answerInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.checkLearnAnswer();
            }
        });
    }

    showLearnCard() {
        const card = this.cards[this.currentIndex];
        document.getElementById('learnQuestion').textContent = card.front;

        // Show/hide question image
        const questionImage = document.getElementById('learnQuestionImage');
        if (card.frontImage) {
            questionImage.src = card.frontImage;
            questionImage.style.display = 'block';
        } else {
            questionImage.style.display = 'none';
        }

        document.getElementById('learnAnswer').style.display = 'none';
        document.getElementById('learnInput').style.display = 'block';
        document.getElementById('learnContinue').style.display = 'none';

        document.getElementById('answerInput').value = '';
        document.getElementById('answerInput').focus();

        this.cardStartTime = Date.now();
        this.updateProgress();
    }

    async checkLearnAnswer() {
        const card = this.cards[this.currentIndex];
        const userAnswer = document.getElementById('answerInput').value.trim();

        if (!userAnswer) {
            return;
        }

        const timeSpent = Date.now() - this.cardStartTime;
        const correct = isAnswerCorrect(userAnswer, card.back);

        // Show answer
        document.getElementById('userAnswer').textContent = userAnswer;
        document.getElementById('correctAnswer').textContent = card.back;

        const feedback = document.getElementById('answerFeedback');
        feedback.className = 'answer-feedback ' + (correct ? 'correct' : 'incorrect');
        feedback.textContent = correct ? '✓ Correct!' : '✗ Incorrect';

        document.getElementById('learnInput').style.display = 'none';
        document.getElementById('learnAnswer').style.display = 'flex';
        document.getElementById('learnContinue').style.display = 'block';

        // Update SRS
        const quality = correct ? 4 : 1;
        const updatedCard = SRSAlgorithm.calculateNextReview(card, quality);
        await db.updateCard(updatedCard);

        // Record performance
        await db.recordPerformance(card.id, this.sessionId, correct, timeSpent);

        // Update stats
        this.stats.cardsStudied++;
        if (correct) {
            this.stats.correctCount++;
        } else {
            this.stats.incorrectCount++;
        }
    }

    async nextLearnCard() {
        if (this.currentIndex < this.cards.length - 1) {
            this.currentIndex++;
            this.showLearnCard();
        } else {
            await this.endSession();
        }
    }

    // ============ TEST MODE ============

    startTestMode() {
        document.getElementById('testMode').style.display = 'block';
        this.currentIndex = 0;

        // Prepare test cards based on target count
        this.prepareTestCards();

        this.showTestQuestion();

        document.getElementById('submitTest').addEventListener('click', () => this.checkTestAnswer());
        document.getElementById('nextTest').addEventListener('click', () => this.nextTestQuestion());
    }

    prepareTestCards() {
        const totalCards = this.cards.length;
        const targetCount = this.testTargetCount || totalCards;

        if (targetCount <= totalCards) {
            // Select subset of cards, prioritizing least learned
            const sortedCards = SRSAlgorithm.sortCardsByPriority([...this.cards]);
            this.testCards = sortedCards.slice(0, targetCount);
        } else {
            // Will need to repeat cards - start with all cards
            this.testCards = [...this.cards];
        }

        // Shuffle for variety
        this.testCards = shuffleArray(this.testCards);
    }

    showTestQuestion() {
        const card = this.testCards[this.currentIndex];
        document.getElementById('questionNum').textContent = this.currentIndex + 1;
        document.getElementById('testQuestion').textContent = card.front;

        // Show/hide question image
        const questionImage = document.getElementById('testQuestionImage');
        if (card.frontImage) {
            questionImage.src = card.frontImage;
            questionImage.style.display = 'block';
        } else {
            questionImage.style.display = 'none';
        }

        // Get user's question type preference
        const questionTypePreference = getTestQuestionTypePreference();
        console.log('[DEBUG] showTestQuestion() - questionTypePreference:', questionTypePreference);

        let useMultipleChoice;
        if (questionTypePreference === 'mc') {
            // All Multiple Choice
            useMultipleChoice = true;
            console.log('[DEBUG] Mode: All Multiple Choice - useMultipleChoice = true');
        } else if (questionTypePreference === 'written') {
            // All Written
            useMultipleChoice = false;
            console.log('[DEBUG] Mode: All Written - useMultipleChoice = false');
        } else {
            // Mix - randomly decide (70% MC, 30% written)
            useMultipleChoice = Math.random() > 0.3;
            console.log('[DEBUG] Mode: Mix - useMultipleChoice =', useMultipleChoice);
        }

        if (useMultipleChoice) {
            console.log('[DEBUG] Calling showMultipleChoice()');
            this.showMultipleChoice(card);
        } else {
            console.log('[DEBUG] Calling showWrittenAnswer()');
            this.showWrittenAnswer();
        }

        document.getElementById('testFeedback').style.display = 'none';
        document.getElementById('submitTest').style.display = 'inline-flex';
        document.getElementById('nextTest').style.display = 'none';

        this.cardStartTime = Date.now();
        this.updateProgress();
    }

    showMultipleChoice(correctCard) {
        document.getElementById('testChoices').style.display = 'flex';
        document.getElementById('testWritten').style.display = 'none';

        // Get wrong answers - support 2-4 options
        const wrongCards = this.cards.filter(c => c.id !== correctCard.id);

        // Determine how many wrong answers to use (aim for 3, but handle edge cases)
        const availableWrongAnswers = wrongCards.length;
        let numWrongAnswers;

        if (availableWrongAnswers >= 3) {
            // Ideal case: 4 total options (3 wrong + 1 correct)
            numWrongAnswers = 3;
        } else if (availableWrongAnswers >= 1) {
            // Minimum case: 2-3 total options (1-2 wrong + 1 correct)
            numWrongAnswers = availableWrongAnswers;
        } else {
            // Edge case: only 1 card in set, fallback to written answer
            console.warn('Not enough cards for multiple choice, showing written answer instead');
            this.showWrittenAnswer();
            return;
        }

        const wrongAnswers = shuffleArray(wrongCards).slice(0, numWrongAnswers);

        // Mix with correct answer
        const allChoices = shuffleArray([...wrongAnswers, correctCard]);

        // Render choices
        const choicesContainer = document.getElementById('testChoices');
        choicesContainer.innerHTML = '';

        allChoices.forEach(card => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = card.back;
            button.dataset.cardId = card.id;
            button.addEventListener('click', () => {
                document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
                button.classList.add('selected');
            });
            choicesContainer.appendChild(button);
        });
    }

    showWrittenAnswer() {
        document.getElementById('testChoices').style.display = 'none';
        document.getElementById('testWritten').style.display = 'block';
        const textarea = document.getElementById('testWrittenAnswer');
        textarea.value = '';
        textarea.disabled = false;
        textarea.focus();
    }

    async checkTestAnswer() {
        const card = this.testCards[this.currentIndex];
        const timeSpent = Date.now() - this.cardStartTime;
        let correct = false;

        if (document.getElementById('testChoices').style.display === 'flex') {
            // Multiple choice
            const selected = document.querySelector('.choice-btn.selected');
            if (!selected) return;

            correct = parseInt(selected.dataset.cardId) === card.id;

            // Show feedback
            document.querySelectorAll('.choice-btn').forEach(btn => {
                btn.disabled = true;
                if (parseInt(btn.dataset.cardId) === card.id) {
                    btn.classList.add('correct');
                } else if (btn.classList.contains('selected')) {
                    btn.classList.add('incorrect');
                }
            });
        } else {
            // Written answer
            const userAnswer = document.getElementById('testWrittenAnswer').value.trim();
            if (!userAnswer) return;

            correct = isAnswerCorrect(userAnswer, card.back);
            document.getElementById('testWrittenAnswer').disabled = true;
        }

        // Show feedback
        const feedback = document.getElementById('testFeedback');
        feedback.className = 'test-feedback ' + (correct ? 'correct' : 'incorrect');
        feedback.textContent = correct ? '✓ Correct!' : `✗ Incorrect. The answer is: ${card.back}`;
        feedback.style.display = 'block';

        // Track correct/incorrect cards for smart repetition
        if (correct) {
            if (!this.correctCards.find(c => c.id === card.id)) {
                this.correctCards.push(card);
            }
        } else {
            if (!this.incorrectCards.find(c => c.id === card.id)) {
                this.incorrectCards.push(card);
            }
        }

        // Update SRS
        const quality = correct ? 4 : 1;
        const updatedCard = SRSAlgorithm.calculateNextReview(card, quality);
        await db.updateCard(updatedCard);

        // Record performance
        await db.recordPerformance(card.id, this.sessionId, correct, timeSpent);

        // Update stats
        this.stats.cardsStudied++;
        if (correct) {
            this.stats.correctCount++;
        } else {
            this.stats.incorrectCount++;
        }

        document.getElementById('submitTest').style.display = 'none';
        document.getElementById('nextTest').style.display = 'inline-flex';
    }

    async nextTestQuestion() {
        const targetCount = this.testTargetCount || this.testCards.length;

        if (this.currentIndex < this.testCards.length - 1) {
            // More cards in current deck
            this.currentIndex++;
            this.showTestQuestion();
        } else if (this.testCards.length < targetCount) {
            // Need to add more cards to reach target count
            const cardsNeeded = targetCount - this.testCards.length;
            const newCards = this.selectAdditionalCards(cardsNeeded);

            if (newCards.length > 0) {
                // Add new cards to the deck
                this.testCards.push(...newCards);
                this.currentIndex++;
                this.showTestQuestion();
            } else {
                // No more cards available
                await this.endSession();
            }
        } else {
            // Reached target, end session
            await this.endSession();
        }
    }

    selectAdditionalCards(count) {
        // Prioritize incorrectly answered cards (3:1 ratio)
        const incorrectWeight = 3;
        const correctWeight = 1;

        const additionalCards = [];

        // Calculate how many of each type to add
        const totalWeight = incorrectWeight + correctWeight;
        const incorrectCount = Math.ceil(count * incorrectWeight / totalWeight);
        const correctCount = count - incorrectCount;

        // Add incorrect cards (can repeat)
        for (let i = 0; i < incorrectCount && this.incorrectCards.length > 0; i++) {
            const card = this.incorrectCards[i % this.incorrectCards.length];
            additionalCards.push(card);
        }

        // Fill remaining with correct cards
        for (let i = 0; i < correctCount && this.correctCards.length > 0; i++) {
            const card = this.correctCards[i % this.correctCards.length];
            additionalCards.push(card);
        }

        // If we still don't have enough, use any available cards
        if (additionalCards.length < count) {
            const remaining = count - additionalCards.length;
            for (let i = 0; i < remaining && this.cards.length > 0; i++) {
                const card = this.cards[i % this.cards.length];
                additionalCards.push(card);
            }
        }

        return shuffleArray(additionalCards);
    }

    // ============ MATCH MODE ============

    startMatchMode() {
        document.getElementById('matchMode').style.display = 'block';

        // Limit to 6 pairs for better UX
        const matchCards = this.cards.slice(0, 6);
        this.matchPairs = matchCards.map(card => ({
            id: card.id,
            front: card.front,
            back: card.back
        }));

        this.matchedPairs = 0;
        this.matchStartTime = Date.now();
        this.selectedTiles = [];

        this.renderMatchGrid();
        this.startMatchTimer();
        this.updateProgress();

        document.getElementById('restartMatch').addEventListener('click', () => {
            this.startMatchMode();
        });
    }

    renderMatchGrid() {
        const grid = document.getElementById('matchGrid');
        grid.innerHTML = '';

        // Create tiles for fronts and backs
        const tiles = [];
        this.matchPairs.forEach(pair => {
            tiles.push({ id: pair.id, text: pair.front, type: 'front' });
            tiles.push({ id: pair.id, text: pair.back, type: 'back' });
        });

        // Shuffle tiles
        const shuffled = shuffleArray(tiles);

        // Render tiles
        shuffled.forEach((tile, index) => {
            const tileEl = document.createElement('div');
            tileEl.className = 'match-tile';
            tileEl.textContent = tile.text;
            tileEl.dataset.id = tile.id;
            tileEl.dataset.type = tile.type;
            tileEl.dataset.index = index;

            tileEl.addEventListener('click', () => this.selectMatchTile(tileEl, tile));

            grid.appendChild(tileEl);
        });

        document.getElementById('matchCount').textContent = `0 / ${this.matchPairs.length}`;
    }

    selectMatchTile(tileEl, tile) {
        if (tileEl.classList.contains('matched') || tileEl.classList.contains('selected')) {
            return;
        }

        if (this.selectedTiles.length >= 2) {
            return;
        }

        tileEl.classList.add('selected');
        this.selectedTiles.push({ element: tileEl, tile });

        if (this.selectedTiles.length === 2) {
            setTimeout(() => this.checkMatch(), 500);
        }
    }

    async checkMatch() {
        const [first, second] = this.selectedTiles;

        if (first.tile.id === second.tile.id && first.tile.type !== second.tile.type) {
            // Match!
            first.element.classList.add('matched');
            second.element.classList.add('matched');
            first.element.classList.remove('selected');
            second.element.classList.remove('selected');

            this.matchedPairs++;
            document.getElementById('matchCount').textContent = `${this.matchedPairs} / ${this.matchPairs.length}`;

            // Record performance
            const card = this.matchPairs.find(p => p.id === first.tile.id);
            await db.recordPerformance(card.id, this.sessionId, true, 1000);
            this.stats.cardsStudied++;
            this.stats.correctCount++;

            this.updateProgress();

            if (this.matchedPairs === this.matchPairs.length) {
                this.completeMatchMode();
            }
        } else {
            // No match - record as incorrect attempt
            first.element.classList.remove('selected');
            second.element.classList.remove('selected');

            this.stats.incorrectCount++;
            this.updateProgress();
        }

        this.selectedTiles = [];
    }

    startMatchTimer() {
        this.matchTimer = setInterval(() => {
            const elapsed = Date.now() - this.matchStartTime;
            document.getElementById('matchTimer').textContent = formatDuration(elapsed);
        }, 100);
    }

    completeMatchMode() {
        clearInterval(this.matchTimer);
        const elapsed = Date.now() - this.matchStartTime;

        document.getElementById('matchGrid').style.display = 'none';
        document.getElementById('matchComplete').style.display = 'block';
        document.getElementById('finalTime').textContent = formatDuration(elapsed);

        this.endSession();
    }

    // ============ SESSION END ============

    async endSession() {
        await db.endSession(this.sessionId, this.stats);

        // Show completion screen
        document.querySelectorAll('.study-mode').forEach(el => el.style.display = 'none');
        document.getElementById('sessionComplete').style.display = 'block';

        const elapsed = Date.now() - this.sessionStart;
        const total = this.stats.correctCount + this.stats.incorrectCount;
        const accuracy = total > 0 ? Math.round((this.stats.correctCount / total) * 100) : 0;

        document.getElementById('totalCards').textContent = this.stats.cardsStudied;
        document.getElementById('finalAccuracy').textContent = `${accuracy}%`;
        document.getElementById('studyTime').textContent = formatDuration(elapsed);

        document.getElementById('studyAgain').addEventListener('click', () => {
            window.location.reload();
        });

        document.getElementById('viewAnalytics').addEventListener('click', () => {
            window.location.href = `analytics.html?setId=${this.setId}`;
        });
    }
}

// Initialize
const manager = new StudyModesManager();
document.addEventListener('DOMContentLoaded', () => {
    manager.init();
});
