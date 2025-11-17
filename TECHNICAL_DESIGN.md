# QuizIt - Technical Design Document

**Version:** 1.0
**Last Updated:** 2025-11-17
**Project:** QuizIt - Spaced Repetition Flashcard Learning App

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [File Structure](#4-file-structure)
5. [Core Components](#5-core-components)
6. [Data Model](#6-data-model)
7. [Key Features](#7-key-features)
8. [Algorithms](#8-algorithms)
9. [User Interface](#9-user-interface)
10. [PWA Implementation](#10-pwa-implementation)
11. [Data Flow](#11-data-flow)
12. [API Reference](#12-api-reference)
13. [Development Guide](#13-development-guide)
14. [Testing Strategy](#14-testing-strategy)
15. [Deployment](#15-deployment)
16. [Contributing Guidelines](#16-contributing-guidelines)
17. [Future Enhancements](#17-future-enhancements)

---

## 1. Project Overview

### 1.1 What is QuizIt?

**QuizIt** is a Progressive Web Application (PWA) designed for creating and studying flashcards using intelligent spaced repetition. Built entirely with vanilla JavaScript (no frameworks), it provides a lightweight, offline-capable learning platform that runs entirely in the browser.

### 1.2 Key Characteristics

- **Framework-free**: Built with vanilla JavaScript, HTML5, and CSS3
- **Offline-first**: Full functionality without internet connection
- **Privacy-focused**: All data stored locally on the user's device
- **Zero-backend**: No server required, purely client-side
- **Cross-platform**: Works on desktop and mobile browsers
- **Installable**: Can be installed as a native-like app via PWA

### 1.3 Target Users

- Students studying for exams
- Language learners
- Professionals memorizing technical information
- Anyone needing efficient memorization tools

### 1.4 Project Statistics

| Metric | Value |
|--------|-------|
| Total Lines of Code | 6,917 (excluding libraries) |
| JavaScript Files | 7 core modules |
| CSS Files | 5 stylesheets |
| HTML Pages | 5 pages |
| Third-party Dependencies | 1 (Chart.js) |
| Database | IndexedDB (client-side) |
| Browser Support | Chrome 80+, Firefox 75+, Safari 13+, Opera 67+ |

---

## 2. Technology Stack

### 2.1 Frontend Technologies

| Technology | Purpose | Version/Notes |
|------------|---------|---------------|
| **JavaScript** | Core logic | ES6+ (vanilla, no frameworks) |
| **HTML5** | Structure | Semantic markup |
| **CSS3** | Styling | CSS Variables, Grid, Flexbox |
| **IndexedDB** | Client-side storage | Native browser API |
| **Service Worker** | Offline support | PWA caching strategy |
| **Chart.js** | Data visualization | Minified library (201KB) |

### 2.2 Browser APIs Used

- **IndexedDB API**: Persistent local storage
- **Service Worker API**: Offline functionality and caching
- **Web App Manifest API**: PWA installation
- **LocalStorage API**: Theme preferences
- **Fetch API**: Network requests (for caching)
- **File API**: Import/export functionality
- **Canvas API**: Via Chart.js for analytics

### 2.3 Development Tools

- **Git**: Version control
- **GitHub**: Repository hosting
- **Browser DevTools**: Debugging and testing
- **HTTP Server**: Local development (Python, Node.js, or PHP)

### 2.4 No Build Process

QuizIt intentionally avoids build tools:
- No webpack, Rollup, or Vite
- No transpilation (uses native ES6 modules)
- No CSS preprocessing (uses native CSS variables)
- Deployed directly as static files

---

## 3. Architecture

### 3.1 Architectural Pattern

QuizIt follows a **modular, class-based architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────┐
│              User Interface Layer               │
│        (HTML Pages + Event Listeners)           │
└───────────────┬─────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────┐
│           Application Logic Layer               │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐ │
│  │QuizItApp │ │StudyModes│ │CardSetManager   │ │
│  │          │ │Manager   │ │                 │ │
│  └──────────┘ └──────────┘ └─────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐ │
│  │Analytics │ │SRS       │ │Utils            │ │
│  │Manager   │ │Algorithm │ │                 │ │
│  └──────────┘ └──────────┘ └─────────────────┘ │
└───────────────┬─────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────┐
│            Data Persistence Layer               │
│              QuizItDB (IndexedDB)               │
│  ┌─────┐ ┌─────┐ ┌────────┐ ┌──────────────┐   │
│  │Sets │ │Cards│ │Sessions│ │Card          │   │
│  │     │ │     │ │        │ │Performance   │   │
│  └─────┘ └─────┘ └────────┘ └──────────────┘   │
└─────────────────────────────────────────────────┘
```

### 3.2 Design Principles

1. **Single Responsibility**: Each class handles one specific concern
2. **Modularity**: Code split into ES6 modules with clear exports
3. **Event-Driven**: DOM events trigger application logic
4. **Data Persistence**: All operations sync with IndexedDB
5. **Progressive Enhancement**: Core functionality works, enhancements add value
6. **Mobile-First**: Responsive design from smallest screens up

### 3.3 Application Flow

```
User Opens App
    ↓
Service Worker Registration (for offline support)
    ↓
IndexedDB Initialization
    ↓
Load Study Sets from Database
    ↓
Render UI (index.html - Home Page)
    ↓
User Actions:
    ├─ Create New Set → create.html (CardSetManager)
    ├─ Study Set → study.html (StudyModesManager)
    │   ├─ Flashcards Mode (flip & rate)
    │   ├─ Learn Mode (type answers)
    │   ├─ Test Mode (quiz with scoring)
    │   └─ Match Mode (timed matching game)
    ├─ View Analytics → analytics.html (AnalyticsManager)
    ├─ Configure Settings → settings.html
    └─ Manage Sets → Edit/Delete/Import/Export
    ↓
Study Session Tracking
    ↓
SM-2 Algorithm Updates (interval, ease factor)
    ↓
Performance Data Recorded
    ↓
Analytics Charts Updated
```

---

## 4. File Structure

### 4.1 Complete Directory Tree

```
quizit/
├── index.html                 # Home page - study set library
├── study.html                 # Study interface for all 4 modes
├── create.html                # Card set creation/editing
├── analytics.html             # Performance dashboard
├── settings.html              # User preferences & configuration
├── manifest.json              # PWA manifest file
├── service-worker.js          # Service worker for offline support
├── IMPORT_FORMAT.md           # Import/export documentation
├── README.md                  # User-facing documentation
├── TECHNICAL_DESIGN.md        # This document
├── QuizIt.txt                 # Deployment note
│
├── js/                        # JavaScript modules (114KB total)
│   ├── app.js                 # Main application controller (575 lines)
│   ├── study-modes.js         # Study mode implementations (768 lines)
│   ├── card-set-manager.js    # Card set CRUD operations (516 lines)
│   ├── analytics.js           # Analytics & charts (515 lines)
│   ├── db.js                  # IndexedDB wrapper (364 lines)
│   ├── srs-algorithm.js       # SM-2 algorithm (255 lines)
│   └── utils.js               # Helper functions (410 lines)
│
├── css/                       # Stylesheets (49KB total)
│   ├── main.css              # Core layout & base styles (399 lines)
│   ├── components.css        # UI component styles (750 lines)
│   ├── analytics.css         # Analytics page styles (629 lines)
│   ├── create.css            # Card editor styles (323 lines)
│   └── themes.css            # Theme variables (271 lines)
│
├── lib/                       # Third-party libraries
│   └── chart.min.js          # Chart.js library (201KB)
│
├── images/                    # PWA icons & favicon
│   ├── icon-192.png          # 192x192 PNG icon
│   ├── icon-512.png          # 512x512 PNG icon
│   ├── icon-192.svg          # 192x192 SVG icon
│   ├── icon-512.svg          # 512x512 SVG icon
│   └── favicon.ico           # Browser favicon
│
└── .gitignore                # Git exclusions
```

### 4.2 File Responsibilities

#### HTML Pages

| File | Purpose | Dependencies |
|------|---------|--------------|
| `index.html` | Home page showing all study sets | app.js, db.js, utils.js |
| `study.html` | Study interface for all 4 modes | study-modes.js, srs-algorithm.js, db.js |
| `create.html` | Create/edit card sets | card-set-manager.js, db.js, utils.js |
| `analytics.html` | Performance dashboard with charts | analytics.js, db.js, chart.min.js |
| `settings.html` | App configuration & preferences | utils.js |

#### JavaScript Modules

| File | Exports | Dependencies | LOC |
|------|---------|--------------|-----|
| `app.js` | QuizItApp class | db.js, utils.js | 575 |
| `study-modes.js` | StudyModesManager class | db.js, srs-algorithm.js, utils.js | 768 |
| `card-set-manager.js` | CardSetManager class | db.js, utils.js | 516 |
| `analytics.js` | AnalyticsManager class | db.js, utils.js, Chart.js | 515 |
| `db.js` | QuizItDB class | - | 364 |
| `srs-algorithm.js` | SRSAlgorithm class | - | 255 |
| `utils.js` | Utility functions | - | 410 |

#### CSS Files

| File | Purpose | LOC |
|------|---------|-----|
| `main.css` | Core layout, typography, base styles | 399 |
| `components.css` | Buttons, cards, modals, forms, grids | 750 |
| `analytics.css` | Charts, stats cards, heatmaps | 629 |
| `create.css` | Card editor, preview panels | 323 |
| `themes.css` | Light/dark theme CSS variables | 271 |

---

## 5. Core Components

### 5.1 QuizItApp (app.js)

**Purpose**: Main application controller for the home page.

**Responsibilities**:
- Load and display all study sets
- Handle set deletion with cascading cleanup
- Star/unstar favorite sets
- Search functionality across set names and descriptions
- Sort sets by multiple criteria (modified, created, name, card count)
- Filter sets (starred only)
- PWA install prompt handling
- Check for updates feature

**Key Methods**:

```javascript
class QuizItApp {
    constructor()
    async init()                    // Initialize app and load sets
    async loadSets()                // Fetch all sets from DB
    renderSets()                    // Render sets to DOM
    async deleteSet(setId)          // Delete set and related data
    async toggleStar(setId)         // Toggle starred status
    handleSearch()                  // Filter sets by search query
    handleSort()                    // Sort sets by selected criteria
    handleFilter()                  // Filter starred sets
    handlePWAInstall()              // Handle PWA installation
}
```

**DOM Elements**:
- `#sets-grid`: Container for study set cards
- `#search-input`: Search input field
- `#sort-select`: Sort dropdown
- `#filter-starred`: Starred filter checkbox
- `#install-prompt`: PWA install banner

### 5.2 StudyModesManager (study-modes.js)

**Purpose**: Implements all 4 study modes.

**Responsibilities**:
- Manage study sessions
- Handle mode switching (Flashcards, Learn, Test, Match)
- Track performance during study
- Update card SRS data after each review
- Calculate session statistics
- Handle keyboard shortcuts

**Study Modes**:

#### 5.2.1 Flashcards Mode
- Show front of card
- Flip to reveal back
- Rate performance: Again (1), Hard (2), Good (3), Easy (4)
- Navigate with Previous/Next buttons
- Shuffle cards option
- Updates SM-2 algorithm based on rating

#### 5.2.2 Learn Mode
- Display question
- User types answer
- Compare answer using Levenshtein distance
- Show immediate feedback (correct/incorrect)
- Display correct answer if wrong
- Track accuracy

#### 5.2.3 Test Mode
- Configurable question count
- Configurable question types: Mix, Multiple Choice, Written
- Randomized question order
- Multiple choice with 4 options
- Written answer with fuzzy matching
- Retry incorrect answers
- Final score with percentage

#### 5.2.4 Match Mode
- Timed matching game
- Pairs of terms and definitions
- Click to select pairs
- Timer-based scoring
- Game completion detection

**Key Methods**:

```javascript
class StudyModesManager {
    constructor()
    async init()
    async startMode(mode)           // Initialize specific study mode

    // Flashcards Mode
    showFlashcard(card)
    flipCard()
    rateCard(quality)               // 1-4 rating

    // Learn Mode
    showLearnCard()
    checkAnswer()

    // Test Mode
    startTest()
    generateQuestion()
    submitAnswer()
    showResults()

    // Match Mode
    startMatch()
    handleCardClick()
    checkMatch()

    // Session Management
    async saveSession()
    async updateCardSRS(cardId, quality)
    calculateStats()
}
```

### 5.3 CardSetManager (card-set-manager.js)

**Purpose**: Manage card set creation and editing.

**Responsibilities**:
- Create new card sets
- Edit existing card sets
- Add/remove cards
- Upload images for cards (front/back)
- Import card sets (JSON format)
- Export card sets (simple or full backup)
- Validate card data
- Preview cards while editing

**Key Methods**:

```javascript
class CardSetManager {
    constructor()
    async init()
    async loadSet(setId)            // Load existing set for editing
    addCard()                       // Add new blank card
    removeCard(index)               // Remove card from editor
    handleImageUpload(index, side)  // Handle front/back image upload
    async saveSet()                 // Save set to database
    async importCards()             // Import from JSON file
    async exportSet(fullBackup)     // Export as JSON
    validateCards()                 // Ensure cards have content
    renderPreview()                 // Show card preview
}
```

**Import/Export Formats**:

Simple JSON (cards only):
```json
[
  {"front": "Question 1", "back": "Answer 1"},
  {"front": "Question 2", "back": "Answer 2"}
]
```

Full Backup (with SRS data):
```json
{
  "version": 1,
  "exportDate": "2025-11-17T...",
  "set": {
    "name": "My Set",
    "description": "Description",
    "created": 1234567890,
    "modified": 1234567890,
    "starred": false
  },
  "cards": [
    {
      "front": "Q1",
      "back": "A1",
      "easeFactor": 2.5,
      "interval": 0,
      "repetitions": 0,
      "nextReview": null
    }
  ],
  "sessions": [...],
  "performance": [...]
}
```

### 5.4 AnalyticsManager (analytics.js)

**Purpose**: Visualize learning progress and performance.

**Responsibilities**:
- Generate overview statistics
- Create performance charts
- Display session history
- Show card-level performance data
- Generate study heatmap (calendar view)
- Calculate mastery percentage
- Track accuracy by study mode

**Chart Types**:

1. **Performance Over Time** (Line Chart)
   - X-axis: Date
   - Y-axis: Number of cards
   - Two datasets: Correct (green), Incorrect (red)

2. **Accuracy by Mode** (Bar Chart)
   - X-axis: Study mode
   - Y-axis: Percentage
   - Shows accuracy for each mode

3. **Study Heatmap** (Calendar Grid)
   - Visual representation of study frequency
   - Color intensity based on cards studied per day

4. **Card Mastery Heatmap**
   - Grid showing all cards
   - Color coding based on ease factor and interval

**Key Methods**:

```javascript
class AnalyticsManager {
    constructor()
    async init()
    async loadAnalytics()
    renderOverview()                // Total stats
    renderPerformanceChart()        // Line chart
    renderAccuracyChart()           // Bar chart
    renderSessionHistory()          // Table of sessions
    renderCardPerformance()         // Per-card stats
    generateHeatmap()               // Study calendar
    calculateMastery()              // Overall progress %
}
```

### 5.5 QuizItDB (db.js)

**Purpose**: IndexedDB wrapper for data persistence.

**Responsibilities**:
- Initialize database with schema
- Provide CRUD operations for all object stores
- Handle database upgrades
- Ensure data integrity with transactions

**Object Stores**:

1. **sets**: Study set metadata
2. **cards**: Individual flashcards
3. **sessions**: Study session records
4. **cardPerformance**: Per-card performance tracking

**Key Methods**:

```javascript
class QuizItDB {
    constructor()
    async init()                    // Open/create database

    // Sets
    async getAllSets()
    async getSet(id)
    async addSet(set)
    async updateSet(set)
    async deleteSet(id)

    // Cards
    async getCardsBySetId(setId)
    async getCard(id)
    async addCard(card)
    async updateCard(card)
    async deleteCard(id)
    async deleteCardsBySetId(setId)

    // Sessions
    async addSession(session)
    async getSessionsBySetId(setId)
    async deleteSessionsBySetId(setId)

    // Performance
    async addPerformance(performance)
    async getPerformanceByCardId(cardId)
    async getPerformanceBySessionId(sessionId)
    async deletePerformanceByCardId(cardId)
    async deletePerformanceBySetId(setId)
}
```

### 5.6 SRSAlgorithm (srs-algorithm.js)

**Purpose**: Implement SM-2 spaced repetition algorithm.

**Responsibilities**:
- Calculate next review date
- Update ease factor based on performance
- Determine card status (New/Learning/Review)
- Prioritize cards for study
- Track repetition count

**Key Methods**:

```javascript
class SRSAlgorithm {
    static calculateNextReview(card, quality)
    static updateEaseFactor(currentEF, quality)
    static getCardStatus(card)      // New/Learning/Review
    static prioritizeCards(cards)   // Sort by priority
    static getDueCards(cards)       // Filter overdue cards
}
```

**Algorithm Details**: See [Section 8](#8-algorithms)

### 5.7 Utils (utils.js)

**Purpose**: Shared utility functions.

**Key Functions**:

```javascript
// DOM Utilities
function $(selector)                // querySelector shorthand
function $$(selector)               // querySelectorAll shorthand
function createElement(tag, attrs, children)

// String Utilities
function levenshteinDistance(a, b)  // Edit distance
function normalizeString(str)       // Lowercase, trim
function truncate(str, length)      // Truncate with ellipsis

// Date Utilities
function formatDate(timestamp)      // Human-readable date
function getRelativeTime(timestamp) // "2 days ago"
function getDayStart(date)          // Midnight of date

// Array Utilities
function shuffle(array)             // Fisher-Yates shuffle
function getRandomItems(array, n)   // Random sample

// Theme
function setTheme(theme)            // 'light' or 'dark'
function getTheme()                 // Get current theme
```

---

## 6. Data Model

### 6.1 Database Schema

QuizIt uses **IndexedDB** with 4 object stores:

#### 6.1.1 Sets

Stores study set metadata.

```javascript
{
    id: number,              // Auto-incrementing primary key
    name: string,            // Set name (required)
    description: string,     // Set description (optional)
    created: number,         // Unix timestamp
    modified: number,        // Unix timestamp
    starred: boolean         // Favorite flag
}
```

**Indexes**:
- Primary key: `id` (auto-increment)

**Relationships**:
- One-to-many with Cards
- One-to-many with Sessions

#### 6.1.2 Cards

Stores individual flashcards with SRS data.

```javascript
{
    id: number,              // Auto-incrementing primary key
    setId: number,           // Foreign key to Sets
    front: string,           // Question/term (required)
    back: string,            // Answer/definition (required)
    frontImage: string,      // Data URL for front image (optional)
    backImage: string,       // Data URL for back image (optional)

    // SRS (Spaced Repetition) Data
    easeFactor: number,      // Difficulty (default: 2.5)
    interval: number,        // Days until next review (default: 0)
    repetitions: number,     // Times reviewed correctly (default: 0)
    nextReview: number,      // Unix timestamp for next review (default: null)

    created: number          // Unix timestamp
}
```

**Indexes**:
- Primary key: `id` (auto-increment)
- Index: `setId` (for querying cards by set)

**Relationships**:
- Many-to-one with Sets
- One-to-many with CardPerformance

#### 6.1.3 Sessions

Stores study session records.

```javascript
{
    id: number,              // Auto-incrementing primary key
    setId: number,           // Foreign key to Sets
    mode: string,            // 'flashcards' | 'learn' | 'test' | 'match'
    startTime: number,       // Unix timestamp
    endTime: number,         // Unix timestamp
    cardsStudied: number,    // Total cards in session
    correctCount: number,    // Correctly answered
    incorrectCount: number   // Incorrectly answered
}
```

**Indexes**:
- Primary key: `id` (auto-increment)
- Index: `setId` (for querying sessions by set)

**Relationships**:
- Many-to-one with Sets
- One-to-many with CardPerformance

#### 6.1.4 CardPerformance

Stores individual card review records.

```javascript
{
    id: number,              // Auto-incrementing primary key
    cardId: number,          // Foreign key to Cards
    sessionId: number,       // Foreign key to Sessions
    correct: boolean,        // Was answer correct?
    timeSpent: number,       // Milliseconds spent on card
    confidence: number,      // 1-4 rating (flashcards mode)
    timestamp: number        // Unix timestamp
}
```

**Indexes**:
- Primary key: `id` (auto-increment)
- Index: `cardId` (for querying performance by card)
- Index: `sessionId` (for querying performance by session)

**Relationships**:
- Many-to-one with Cards
- Many-to-one with Sessions

### 6.2 Entity Relationship Diagram

```
┌─────────────┐
│    Sets     │
│─────────────│
│ id (PK)     │◄─────┐
│ name        │      │
│ description │      │
│ created     │      │
│ modified    │      │
│ starred     │      │
└─────────────┘      │
       ▲             │
       │             │
       │ 1:N         │ 1:N
       │             │
┌──────┴──────┐ ┌────┴────────────┐
│    Cards    │ │    Sessions     │
│─────────────│ │─────────────────│
│ id (PK)     │ │ id (PK)         │
│ setId (FK)  │ │ setId (FK)      │◄─────┐
│ front       │ │ mode            │      │
│ back        │ │ startTime       │      │
│ frontImage  │ │ endTime         │      │
│ backImage   │ │ cardsStudied    │      │
│ easeFactor  │ │ correctCount    │      │
│ interval    │ │ incorrectCount  │      │
│ repetitions │ └─────────────────┘      │
│ nextReview  │                          │
│ created     │◄─────┐                   │
└─────────────┘      │                   │
                     │ N:1               │ N:1
                     │                   │
              ┌──────┴──────────────┐    │
              │  CardPerformance    │    │
              │─────────────────────│    │
              │ id (PK)             │    │
              │ cardId (FK)         │────┘
              │ sessionId (FK)      │────┘
              │ correct             │
              │ timeSpent           │
              │ confidence          │
              │ timestamp           │
              └─────────────────────┘
```

### 6.3 Data Lifecycle

#### Creating a Study Set

1. User creates set via `create.html`
2. `CardSetManager.saveSet()` called
3. Set saved to `sets` object store
4. Cards saved to `cards` object store with `setId` reference
5. User redirected to home page

#### Studying Cards

1. User selects study mode
2. `StudyModesManager.startMode()` loads cards
3. Session created in `sessions` object store
4. As user reviews cards:
   - Performance recorded in `cardPerformance`
   - Card SRS data updated in `cards`
5. Session end time updated

#### Deleting a Set

Cascade delete ensures data integrity:

1. `QuizItApp.deleteSet()` called
2. Delete all cards with `setId`
3. Delete all sessions with `setId`
4. Delete all performance records for those cards
5. Delete the set itself
6. UI updated

---

## 7. Key Features

### 7.1 Study Modes

#### 7.1.1 Flashcards Mode

**Purpose**: Classic flashcard review with spaced repetition.

**User Flow**:
1. Select "Flashcards" mode
2. View front of card
3. Click "Flip" to see back
4. Rate performance:
   - **Again (1)**: Didn't remember, reset card
   - **Hard (2)**: Difficult, short interval
   - **Good (3)**: Remembered, normal interval
   - **Easy (4)**: Very easy, long interval
5. Move to next card
6. Review statistics at end

**Implementation Details**:
- File: `study-modes.js`
- Cards prioritized by due date
- SM-2 algorithm updates ease factor and interval
- Keyboard shortcuts: Space (flip), 1-4 (rate)
- Progress indicator shows cards remaining

**SRS Integration**:
```javascript
async rateCard(quality) {
    const card = this.currentCard;
    const updatedCard = SRSAlgorithm.calculateNextReview(card, quality);
    await this.db.updateCard(updatedCard);

    // Record performance
    await this.db.addPerformance({
        cardId: card.id,
        sessionId: this.sessionId,
        correct: quality >= 3,
        confidence: quality,
        timeSpent: this.cardStartTime - Date.now(),
        timestamp: Date.now()
    });
}
```

#### 7.1.2 Learn Mode

**Purpose**: Active recall through typing answers.

**User Flow**:
1. Select "Learn" mode
2. Read question
3. Type answer in text field
4. Submit answer
5. See instant feedback (correct/incorrect)
6. If incorrect, correct answer shown
7. Continue to next card

**Implementation Details**:
- File: `study-modes.js`
- Uses Levenshtein distance for fuzzy matching
- Similarity threshold: ~80% (configurable)
- Case-insensitive comparison
- Strips whitespace and punctuation
- Tracks accuracy percentage

**Answer Matching**:
```javascript
checkAnswer() {
    const userAnswer = normalizeString(this.userInput.value);
    const correctAnswer = normalizeString(this.currentCard.back);

    const distance = levenshteinDistance(userAnswer, correctAnswer);
    const similarity = 1 - (distance / Math.max(userAnswer.length, correctAnswer.length));

    const isCorrect = similarity >= 0.8;

    // Show feedback
    this.showFeedback(isCorrect, correctAnswer);
}
```

#### 7.1.3 Test Mode

**Purpose**: Assessment with scoring and question type options.

**Configuration Options**:
- **Question Count**: Same as cards, or specify custom number
- **Question Type**:
  - Mix (random multiple choice + written)
  - Multiple Choice only
  - Written only

**User Flow**:
1. Select "Test" mode
2. Configure options
3. Start test
4. Answer questions one by one
5. Submit test
6. View results with score percentage
7. Review incorrect answers

**Implementation Details**:
- File: `study-modes.js`
- Randomized question order
- Multiple choice: 1 correct + 3 random wrong answers
- Written: Fuzzy matching like Learn mode
- Incorrect answers added to retry queue
- Final score calculated and displayed
- Session data saved with accuracy

**Question Generation**:
```javascript
generateQuestion() {
    const card = this.getRandomCard();
    const questionType = this.getQuestionType(); // based on config

    if (questionType === 'multipleChoice') {
        const options = [card.back]; // Correct answer
        const wrongCards = this.getRandomCards(3, card.id);
        options.push(...wrongCards.map(c => c.back));
        shuffle(options);

        return {
            question: card.front,
            options: options,
            correct: card.back,
            type: 'multipleChoice'
        };
    } else {
        return {
            question: card.front,
            correct: card.back,
            type: 'written'
        };
    }
}
```

#### 7.1.4 Match Mode

**Purpose**: Quick, timed matching game.

**User Flow**:
1. Select "Match" mode
2. Game starts with timer
3. Click cards to select term/definition pairs
4. Match all pairs to complete
5. View final time

**Implementation Details**:
- File: `study-modes.js`
- Grid layout with shuffled cards
- Timer starts on game start
- Click to select, click again to match
- Visual feedback for correct/incorrect matches
- Game ends when all pairs matched

**Matching Logic**:
```javascript
handleCardClick(cardElement) {
    if (!this.selectedCard) {
        // First card selected
        this.selectedCard = cardElement;
        cardElement.classList.add('selected');
    } else {
        // Second card selected - check match
        const card1 = this.selectedCard.dataset;
        const card2 = cardElement.dataset;

        if (card1.cardId === card2.cardId && card1.side !== card2.side) {
            // Match found!
            this.markMatched(this.selectedCard, cardElement);
            this.matchedPairs++;

            if (this.matchedPairs === this.totalPairs) {
                this.endGame();
            }
        } else {
            // No match
            this.showMismatch(this.selectedCard, cardElement);
        }

        this.selectedCard = null;
    }
}
```

### 7.2 Spaced Repetition System

**Algorithm**: SM-2 (SuperMemo 2)

**Components**:
- **Ease Factor (EF)**: Difficulty multiplier (default: 2.5, min: 1.3)
- **Interval**: Days until next review
- **Repetitions**: Consecutive correct reviews
- **Next Review**: Scheduled review date

**Card States**:
- **New**: Never reviewed (interval = 0, repetitions = 0)
- **Learning**: Recently reviewed (interval < 7 days)
- **Review**: Established card (interval >= 7 days)

See [Section 8.1](#81-sm-2-spaced-repetition) for detailed algorithm.

### 7.3 Analytics & Performance Tracking

**Overview Statistics**:
- Total cards across all sets
- Total study sessions
- Total study time
- Overall accuracy percentage
- Mastery percentage (cards with interval > 21 days)

**Charts**:
1. **Performance Over Time**: Line chart showing correct/incorrect answers per day
2. **Accuracy by Mode**: Bar chart comparing accuracy across study modes
3. **Study Heatmap**: Calendar grid showing study frequency
4. **Card Mastery**: Grid showing individual card progress

**Session History**:
- Table of all sessions with date, mode, cards studied, accuracy
- Filterable by date range
- Sortable by columns

**Card Performance**:
- Per-card statistics
- Attempt history
- Current SRS status
- Next review date

### 7.4 Import/Export

**Supported Formats**:

1. **Simple JSON** (cards only):
   - Minimal format for sharing card content
   - No SRS data included
   - Easy to create/edit manually

2. **Full Backup** (complete data):
   - Includes set metadata
   - Includes all cards with SRS data
   - Includes session history
   - Includes performance records
   - Versioned format

**Use Cases**:
- **Simple**: Share study sets with others
- **Full**: Backup/restore with progress preserved
- **Full**: Transfer between devices

### 7.5 PWA Features

**Installation**:
- Install prompt shown on compatible browsers
- Installable on Android, iOS, Windows, macOS, Linux
- Runs in standalone window (no browser chrome)
- Appears in app launcher/home screen

**Offline Support**:
- Service Worker caches all assets
- Fully functional without internet
- Background sync for future updates

**Performance**:
- Fast load times via caching
- Instant navigation (no page reloads for cached content)
- Responsive on slow networks

### 7.6 Theming

**Themes**:
- Light (default)
- Dark

**Implementation**:
- CSS variables in `themes.css`
- Theme saved to localStorage
- Applies to all pages
- Smooth transitions between themes

**Customizable Properties**:
- Background colors
- Text colors
- Component colors (buttons, cards, etc.)
- Shadow intensities
- Border colors

### 7.7 Search, Sort, and Filter

**Search**:
- Real-time search across set names and descriptions
- Case-insensitive
- Updates results as you type

**Sort Options**:
- Last Modified (default)
- Date Created
- Name (A-Z)
- Card Count

**Filter**:
- Show all sets
- Show starred only

---

## 8. Algorithms

### 8.1 SM-2 Spaced Repetition

**Overview**: The SM-2 algorithm optimizes review scheduling based on memory retention patterns.

**Formula**:

```
For quality rating q (0-5):

If q < 3 (incorrect):
    interval = 0
    repetitions = 0
    (card resets to beginning)

Else (correct):
    repetitions = repetitions + 1

    If repetitions = 1:
        interval = 1 day
    Else if repetitions = 2:
        interval = 6 days
    Else:
        interval = previous_interval * easeFactor

    nextReview = today + interval

Ease Factor Update:
    EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    EF' = max(1.3, EF')
```

**Implementation** (`srs-algorithm.js:15-62`):

```javascript
static calculateNextReview(card, quality) {
    let { easeFactor, interval, repetitions } = card;

    // Default values for new cards
    easeFactor = easeFactor || 2.5;
    interval = interval || 0;
    repetitions = repetitions || 0;

    // Update ease factor based on quality
    easeFactor = this.updateEaseFactor(easeFactor, quality);

    // Calculate new interval
    if (quality < 3) {
        // Incorrect answer - reset card
        repetitions = 0;
        interval = 0;
    } else {
        // Correct answer - increase interval
        repetitions += 1;

        if (repetitions === 1) {
            interval = 1;
        } else if (repetitions === 2) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
    }

    // Calculate next review date
    const nextReview = interval === 0
        ? null
        : Date.now() + (interval * 24 * 60 * 60 * 1000);

    return {
        ...card,
        easeFactor,
        interval,
        repetitions,
        nextReview
    };
}

static updateEaseFactor(currentEF, quality) {
    // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    const newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Minimum ease factor is 1.3
    return Math.max(1.3, newEF);
}
```

**Quality Ratings**:

| Rating | Label | Meaning | Effect |
|--------|-------|---------|--------|
| 1 | Again | Complete failure | Reset to beginning |
| 2 | Hard | Difficult recall | Small EF decrease, short interval |
| 3 | Good | Correct with effort | Small EF increase, normal interval |
| 4 | Easy | Perfect recall | EF increase, long interval |

**Card Prioritization** (`srs-algorithm.js:88-119`):

Cards are sorted by priority score (lower = higher priority):

```javascript
static prioritizeCards(cards) {
    return cards.map(card => {
        let priority = 0;

        // Overdue cards get highest priority
        if (card.nextReview && card.nextReview < Date.now()) {
            const daysOverdue = (Date.now() - card.nextReview) / (24 * 60 * 60 * 1000);
            priority += daysOverdue * 10;
        }

        // Harder cards (lower EF) get priority
        const easeFactor = card.easeFactor || 2.5;
        priority += (3 - easeFactor) * 5;

        // New cards (fewer repetitions) get priority
        const repetitions = card.repetitions || 0;
        priority += (10 - repetitions) * 0.5;

        return { ...card, priority };
    }).sort((a, b) => a.priority - b.priority);
}
```

**Example Progression**:

```
Card: "What is 2+2?" → "4"

Review 1: Quality = 3 (Good)
    EF: 2.5 → 2.5
    Interval: 0 → 1 day
    Repetitions: 0 → 1
    Next Review: Tomorrow

Review 2: Quality = 3 (Good)
    EF: 2.5 → 2.5
    Interval: 1 → 6 days
    Repetitions: 1 → 2
    Next Review: 6 days from now

Review 3: Quality = 4 (Easy)
    EF: 2.5 → 2.6
    Interval: 6 → 16 days (6 * 2.6)
    Repetitions: 2 → 3
    Next Review: 16 days from now

Review 4: Quality = 1 (Again - forgot)
    EF: 2.6 → 2.18
    Interval: 16 → 0 (reset)
    Repetitions: 3 → 0
    Next Review: null (start over)
```

### 8.2 Levenshtein Distance

**Purpose**: Measure similarity between user answers and correct answers.

**Use Case**: Learn mode and Test mode (written questions)

**Algorithm**: Dynamic programming approach to calculate minimum edit distance.

**Implementation** (`utils.js:117-137`):

```javascript
function levenshteinDistance(a, b) {
    const matrix = [];

    // Initialize first column
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // Initialize first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}
```

**Similarity Calculation**:

```javascript
function calculateSimilarity(userAnswer, correctAnswer) {
    const normalized1 = normalizeString(userAnswer);
    const normalized2 = normalizeString(correctAnswer);

    const distance = levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);

    const similarity = 1 - (distance / maxLength);

    return similarity;
}

// Answer is considered correct if similarity >= 0.8 (80%)
```

**Examples**:

```
User: "photosynthesis"
Correct: "photosynthesis"
Distance: 0
Similarity: 100% ✓

User: "phototynthesis" (typo)
Correct: "photosynthesis"
Distance: 1
Similarity: 93% ✓

User: "photo"
Correct: "photosynthesis"
Distance: 9
Similarity: 38% ✗

User: "synthesis"
Correct: "photosynthesis"
Distance: 6
Similarity: 54% ✗
```

### 8.3 Fisher-Yates Shuffle

**Purpose**: Randomize card order for study modes.

**Implementation** (`utils.js:174-181`):

```javascript
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
```

**Properties**:
- Unbiased shuffle (each permutation equally likely)
- O(n) time complexity
- In-place operation (on a copy)

---

## 9. User Interface

### 9.1 Design System

**Colors** (Light Theme):
- Primary: `#6366f1` (Indigo)
- Success: `#10b981` (Green)
- Error: `#ef4444` (Red)
- Warning: `#f59e0b` (Amber)
- Background: `#ffffff` (White)
- Surface: `#f3f4f6` (Light Gray)
- Text: `#1f2937` (Dark Gray)

**Colors** (Dark Theme):
- Primary: `#818cf8` (Light Indigo)
- Success: `#34d399` (Light Green)
- Error: `#f87171` (Light Red)
- Warning: `#fbbf24` (Light Amber)
- Background: `#111827` (Dark Blue-Gray)
- Surface: `#1f2937` (Gray)
- Text: `#f9fafb` (Off-White)

**Typography**:
- Font Family: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- Base Size: `16px`
- Scale: 12px, 14px, 16px, 18px, 20px, 24px, 32px, 48px

**Spacing**:
- Scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- CSS Variables: `--spacing-xs` through `--spacing-4xl`

**Shadows**:
- Small: `0 1px 2px rgba(0,0,0,0.05)`
- Medium: `0 4px 6px rgba(0,0,0,0.1)`
- Large: `0 10px 15px rgba(0,0,0,0.1)`
- XL: `0 20px 25px rgba(0,0,0,0.15)`

**Border Radius**:
- Small: `4px`
- Medium: `8px`
- Large: `12px`
- Full: `9999px` (circular)

### 9.2 Component Library

#### Buttons

**Variants**:
- Primary: Filled with primary color
- Secondary: Outlined
- Danger: Red for destructive actions
- Icon: Icon-only button

**States**:
- Default
- Hover
- Active
- Disabled

**Code** (`components.css:1-68`):
```css
.btn {
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background: var(--primary);
    color: white;
}

.btn-primary:hover {
    background: var(--primary-dark);
}
```

#### Cards

**Variants**:
- Study Set Card: Home page grid items
- Flashcard: Study mode cards
- Analytics Card: Stat displays
- Match Card: Matching game tiles

**Features**:
- Hover effects
- Click states
- Shadow elevation
- Responsive sizing

#### Modals

**Components**:
- Overlay (backdrop)
- Modal container
- Header with close button
- Body content
- Footer with actions

**Behavior**:
- Center screen positioning
- Click outside to close
- ESC key to close
- Focus trap

#### Forms

**Elements**:
- Text inputs
- Textareas
- Select dropdowns
- Checkboxes
- File uploads

**Validation**:
- Required field indicators
- Error states
- Success states
- Helper text

#### Grids

**Layouts**:
- 2-column grid (tablet)
- 3-column grid (desktop)
- 4-column grid (large desktop)
- Responsive breakpoints

### 9.3 Responsive Design

**Breakpoints**:
```css
/* Mobile First */
/* Base: < 640px */

/* Small tablets */
@media (min-width: 640px) { ... }

/* Tablets */
@media (min-width: 768px) { ... }

/* Desktop */
@media (min-width: 1024px) { ... }

/* Large Desktop */
@media (min-width: 1280px) { ... }
```

**Mobile Optimizations**:
- Touch-friendly button sizes (min 44x44px)
- Simplified layouts
- Bottom navigation for study modes
- Swipe gestures for card navigation
- Reduced animations for performance

**Tablet Optimizations**:
- 2-column layouts
- Larger card previews
- Side-by-side study interface

**Desktop Optimizations**:
- 3-4 column layouts
- Hover effects
- Keyboard shortcuts
- Larger charts

### 9.4 Accessibility

**Keyboard Navigation**:
- Tab order follows visual flow
- Focus indicators on all interactive elements
- Keyboard shortcuts for study modes
- ESC to close modals

**Screen Readers**:
- ARIA labels on all controls
- ARIA live regions for dynamic content
- Semantic HTML (header, nav, main, article, etc.)
- Alt text for images

**Color Contrast**:
- WCAG AA compliance for all text
- High contrast mode support
- Color not sole indicator of meaning

**Reduced Motion**:
```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

---

## 10. PWA Implementation

### 10.1 Web App Manifest

**File**: `manifest.json`

```json
{
    "name": "QuizIt - Flashcard Learning App",
    "short_name": "QuizIt",
    "description": "Create and study flashcards with spaced repetition",
    "start_url": "/index.html",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#6366f1",
    "orientation": "any",
    "icons": [
        {
            "src": "/images/icon-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "/images/icon-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable"
        }
    ],
    "categories": ["education", "productivity"]
}
```

**Properties**:
- `name`: Full app name shown on install
- `short_name`: Name shown on home screen
- `start_url`: Entry point when launched
- `display: standalone`: Hides browser UI
- `theme_color`: Status bar color
- `icons`: App icons for various sizes

### 10.2 Service Worker

**File**: `service-worker.js`

**Strategy**: Cache-first with network fallback

**Cached Resources**:
- All HTML pages
- All CSS files
- All JavaScript modules
- Chart.js library
- Images and icons
- Web app manifest

**Implementation**:

```javascript
const CACHE_NAME = 'quizit-v3';
const urlsToCache = [
    '/',
    '/index.html',
    '/study.html',
    '/create.html',
    '/analytics.html',
    '/settings.html',
    '/css/main.css',
    '/css/components.css',
    '/css/analytics.css',
    '/css/create.css',
    '/css/themes.css',
    '/js/app.js',
    '/js/study-modes.js',
    '/js/card-set-manager.js',
    '/js/analytics.js',
    '/js/db.js',
    '/js/srs-algorithm.js',
    '/js/utils.js',
    '/lib/chart.min.js',
    '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
```

**Cache Versioning**:
- When assets change, increment version (`quizit-v4`)
- Old caches automatically cleaned up on activation
- Users get fresh content after service worker update

### 10.3 Installation Flow

**Desktop (Chrome/Edge)**:
1. User visits site
2. PWA criteria met (HTTPS, manifest, service worker)
3. Install banner appears
4. User clicks "Install"
5. App added to OS (Start Menu, Dock, etc.)
6. Launches in standalone window

**Mobile (Android/iOS)**:
1. User visits site
2. "Add to Home Screen" prompt shown
3. User accepts
4. Icon added to home screen
5. Launches like native app

**Installation Prompt** (`app.js:44-73`):

```javascript
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show custom install button
    const installPrompt = document.getElementById('install-prompt');
    if (installPrompt) {
        installPrompt.style.display = 'block';
    }
});

async function handlePWAInstall() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
        console.log('PWA installed');
    }

    deferredPrompt = null;
    document.getElementById('install-prompt').style.display = 'none';
}
```

### 10.4 Offline Functionality

**Fully Offline**:
- All HTML, CSS, JS cached
- IndexedDB works offline
- Study modes function normally
- Analytics generated from local data

**Limitations**:
- Cannot check for updates (requires network)
- Cannot import from external URLs
- Images must be added while online

**Online Detection**:
```javascript
window.addEventListener('online', () => {
    console.log('Back online');
    // Optionally sync data or check for updates
});

window.addEventListener('offline', () => {
    console.log('Now offline');
    // Show offline indicator
});
```

---

## 11. Data Flow

### 11.1 Application Initialization

```
Browser loads index.html
    ↓
Register Service Worker
    ↓
Load CSS (themes.css → apply saved theme)
    ↓
Load JavaScript Modules
    ↓
QuizItApp.init()
    ↓
QuizItDB.init()
    ↓
Open IndexedDB connection
    ↓
Create object stores if needed
    ↓
Load all sets from DB
    ↓
Render sets to DOM
    ↓
Attach event listeners
    ↓
Application ready
```

### 11.2 Creating a Study Set

```
User clicks "Create Set" button
    ↓
Navigate to create.html
    ↓
CardSetManager.init()
    ↓
User enters set name, description
    ↓
User adds cards (front/back)
    ↓
User optionally adds images
    ↓
User clicks "Save"
    ↓
CardSetManager.saveSet()
    ↓
Validate card data (front & back required)
    ↓
Create set record
    ↓
db.addSet(set) → Returns setId
    ↓
For each card:
    ↓
    Create card record with setId
    ↓
    db.addCard(card)
    ↓
Success message shown
    ↓
Redirect to index.html
    ↓
Set appears in library
```

### 11.3 Studying in Flashcards Mode

```
User clicks "Study" on a set
    ↓
Navigate to study.html?setId=X&mode=flashcards
    ↓
StudyModesManager.init()
    ↓
Parse URL parameters
    ↓
Load set from DB
    ↓
Load cards from DB
    ↓
Create session record
    ↓
db.addSession({setId, mode, startTime, ...}) → Returns sessionId
    ↓
Prioritize cards using SRSAlgorithm
    ↓
Display first card (front side)
    ↓
User clicks "Flip"
    ↓
Show back side of card
    ↓
User clicks rating button (1-4)
    ↓
StudyModesManager.rateCard(quality)
    ↓
Calculate new SRS values
    ↓
updatedCard = SRSAlgorithm.calculateNextReview(card, quality)
    ↓
Update card in DB
    ↓
db.updateCard(updatedCard)
    ↓
Record performance
    ↓
db.addPerformance({
    cardId,
    sessionId,
    correct: quality >= 3,
    confidence: quality,
    timeSpent,
    timestamp
})
    ↓
Move to next card
    ↓
Repeat until all cards reviewed
    ↓
Update session end time
    ↓
db.updateSession({...session, endTime, cardsStudied, correctCount, incorrectCount})
    ↓
Show session summary
    ↓
User returns to home
```

### 11.4 Viewing Analytics

```
User clicks "Analytics" on a set
    ↓
Navigate to analytics.html?setId=X
    ↓
AnalyticsManager.init()
    ↓
Load set from DB
    ↓
Load all cards for set
    ↓
Load all sessions for set
    ↓
Load all performance records for cards
    ↓
Calculate overview statistics:
    ├─ Total cards
    ├─ Total sessions
    ├─ Total study time
    ├─ Overall accuracy
    └─ Mastery percentage
    ↓
Render overview cards
    ↓
Generate performance chart:
    ├─ Group performance by date
    ├─ Count correct/incorrect per day
    └─ Render Chart.js line chart
    ↓
Generate accuracy chart:
    ├─ Group performance by mode
    ├─ Calculate accuracy per mode
    └─ Render Chart.js bar chart
    ↓
Generate study heatmap:
    ├─ Create calendar grid (52 weeks)
    ├─ Count cards studied per day
    └─ Apply color intensity
    ↓
Render session history table
    ↓
Render card performance table
    ↓
Charts and tables interactive
```

### 11.5 Import/Export Flow

#### Export

```
User clicks "Export" on a set
    ↓
Show export options modal
    ↓
User selects format:
    ├─ Simple (cards only)
    └─ Full Backup (with progress)
    ↓
CardSetManager.exportSet(fullBackup)
    ↓
Load set from DB
    ↓
Load cards from DB
    ↓
If full backup:
    ├─ Load sessions
    └─ Load performance records
    ↓
Construct JSON object
    ↓
Convert to JSON string
    ↓
Create Blob
    ↓
Create download link
    ↓
Trigger download (filename: setname.json)
    ↓
File saved to user's device
```

#### Import

```
User clicks "Import" button
    ↓
Show file picker
    ↓
User selects JSON file
    ↓
CardSetManager.importCards()
    ↓
Read file as text
    ↓
Parse JSON
    ↓
Detect format:
    ├─ Array → Simple format
    └─ Object with "version" → Full backup
    ↓
If simple format:
    ├─ Create new set
    ├─ Add cards with default SRS values
    └─ Save to DB
    ↓
If full backup:
    ├─ Create set with original metadata
    ├─ Add cards with SRS values
    ├─ Add sessions (optional)
    └─ Add performance records (optional)
    ↓
Success message shown
    ↓
Redirect to home
    ↓
Imported set appears in library
```

---

## 12. API Reference

### 12.1 QuizItDB API

#### Sets

```javascript
// Get all sets
const sets = await db.getAllSets();
// Returns: Promise<Array<Set>>

// Get single set
const set = await db.getSet(setId);
// Returns: Promise<Set | undefined>

// Add new set
const setId = await db.addSet({
    name: 'My Set',
    description: 'Description',
    created: Date.now(),
    modified: Date.now(),
    starred: false
});
// Returns: Promise<number> (new set ID)

// Update set
await db.updateSet({
    id: 1,
    name: 'Updated Name',
    modified: Date.now(),
    // ... other fields
});
// Returns: Promise<void>

// Delete set
await db.deleteSet(setId);
// Returns: Promise<void>
```

#### Cards

```javascript
// Get all cards for a set
const cards = await db.getCardsBySetId(setId);
// Returns: Promise<Array<Card>>

// Get single card
const card = await db.getCard(cardId);
// Returns: Promise<Card | undefined>

// Add new card
const cardId = await db.addCard({
    setId: 1,
    front: 'Question',
    back: 'Answer',
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: null,
    created: Date.now()
});
// Returns: Promise<number> (new card ID)

// Update card
await db.updateCard({
    id: 1,
    setId: 1,
    easeFactor: 2.6,
    interval: 6,
    repetitions: 2,
    // ... other fields
});
// Returns: Promise<void>

// Delete card
await db.deleteCard(cardId);
// Returns: Promise<void>

// Delete all cards for a set
await db.deleteCardsBySetId(setId);
// Returns: Promise<void>
```

#### Sessions

```javascript
// Add session
const sessionId = await db.addSession({
    setId: 1,
    mode: 'flashcards',
    startTime: Date.now(),
    endTime: null,
    cardsStudied: 0,
    correctCount: 0,
    incorrectCount: 0
});
// Returns: Promise<number> (new session ID)

// Get sessions for a set
const sessions = await db.getSessionsBySetId(setId);
// Returns: Promise<Array<Session>>

// Update session (to set end time)
await db.updateSession({
    id: sessionId,
    endTime: Date.now(),
    cardsStudied: 20,
    correctCount: 15,
    incorrectCount: 5
});
// Returns: Promise<void>

// Delete sessions for a set
await db.deleteSessionsBySetId(setId);
// Returns: Promise<void>
```

#### Performance

```javascript
// Add performance record
await db.addPerformance({
    cardId: 1,
    sessionId: 1,
    correct: true,
    timeSpent: 5000,
    confidence: 3,
    timestamp: Date.now()
});
// Returns: Promise<void>

// Get performance for a card
const performance = await db.getPerformanceByCardId(cardId);
// Returns: Promise<Array<Performance>>

// Get performance for a session
const performance = await db.getPerformanceBySessionId(sessionId);
// Returns: Promise<Array<Performance>>

// Delete performance for a card
await db.deletePerformanceByCardId(cardId);
// Returns: Promise<void>

// Delete performance for a set (via cards)
await db.deletePerformanceBySetId(setId);
// Returns: Promise<void>
```

### 12.2 SRSAlgorithm API

```javascript
// Calculate next review date and SRS values
const updatedCard = SRSAlgorithm.calculateNextReview(card, quality);
// Parameters:
//   card: Card object with SRS fields
//   quality: number (1-4)
// Returns: Card object with updated SRS values

// Update ease factor only
const newEF = SRSAlgorithm.updateEaseFactor(currentEF, quality);
// Parameters:
//   currentEF: number (current ease factor)
//   quality: number (1-4)
// Returns: number (new ease factor, min 1.3)

// Get card status
const status = SRSAlgorithm.getCardStatus(card);
// Returns: 'New' | 'Learning' | 'Review'

// Prioritize cards for study
const prioritizedCards = SRSAlgorithm.prioritizeCards(cards);
// Returns: Array<Card> sorted by priority

// Get due cards only
const dueCards = SRSAlgorithm.getDueCards(cards);
// Returns: Array<Card> filtered to overdue cards
```

### 12.3 Utility Functions

```javascript
// DOM Selectors
const element = $(selector);        // querySelector
const elements = $$(selector);      // querySelectorAll

// String Utilities
const distance = levenshteinDistance(str1, str2);
const normalized = normalizeString(str);  // lowercase, trim
const truncated = truncate(str, 50);      // "Long text..."

// Date Utilities
const formatted = formatDate(timestamp);       // "Nov 17, 2025"
const relative = getRelativeTime(timestamp);   // "2 days ago"
const dayStart = getDayStart(date);            // Midnight timestamp

// Array Utilities
const shuffled = shuffle(array);               // Randomize order
const sample = getRandomItems(array, 5);       // Get random subset

// Theme
setTheme('dark');                    // Apply theme
const theme = getTheme();            // Get current theme

// Image Handling
const dataUrl = await readFileAsDataURL(file);  // For image uploads
```

---

## 13. Development Guide

### 13.1 Getting Started

**Prerequisites**:
- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+)
- Text editor (VS Code, Sublime, etc.)
- Local HTTP server (Python, Node.js, or PHP)
- Basic knowledge of JavaScript, HTML, CSS

**Setup**:

```bash
# Clone repository
git clone https://github.com/yourusername/quizit.git
cd quizit

# Serve with Python
python -m http.server 8000

# Or with Node.js
npx http-server -p 8000

# Or with PHP
php -S localhost:8000

# Open in browser
# Visit http://localhost:8000
```

**No Build Step**: QuizIt has no build process. Edit files and refresh browser.

### 13.2 Project Structure

```
Core Application Logic:
    js/app.js              - Start here for home page functionality
    js/study-modes.js      - Study interface implementations
    js/card-set-manager.js - Card editing functionality

Database Layer:
    js/db.js               - All IndexedDB operations

Algorithms:
    js/srs-algorithm.js    - SM-2 spaced repetition

Utilities:
    js/utils.js            - Shared helper functions

Analytics:
    js/analytics.js        - Charts and statistics

Styling:
    css/main.css           - Core styles
    css/components.css     - UI components
    css/themes.css         - Theme variables
```

### 13.3 Adding a New Feature

**Example**: Add a "Study Goal" feature

**Step 1**: Database Schema
```javascript
// In db.js - add new object store
const objectStores = [
    // ... existing stores
    {
        name: 'goals',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
            { name: 'setId', keyPath: 'setId', unique: false }
        ]
    }
];
```

**Step 2**: Database Methods
```javascript
// In db.js - add CRUD methods
async addGoal(goal) {
    const tx = this.db.transaction(['goals'], 'readwrite');
    const store = tx.objectStore('goals');
    return await store.add(goal);
}

async getGoalsBySetId(setId) {
    const tx = this.db.transaction(['goals'], 'readonly');
    const store = tx.objectStore('goals');
    const index = store.index('setId');
    return await index.getAll(setId);
}
```

**Step 3**: UI Components
```html
<!-- In index.html or settings.html -->
<div class="goal-setting">
    <label for="daily-goal">Daily Study Goal (cards)</label>
    <input type="number" id="daily-goal" min="1" value="20">
    <button onclick="saveGoal()">Save Goal</button>
</div>
```

**Step 4**: Application Logic
```javascript
// In app.js or new goals.js module
async function saveGoal() {
    const goal = {
        setId: currentSetId,
        dailyCards: parseInt($('#daily-goal').value),
        created: Date.now()
    };

    await db.addGoal(goal);
    showNotification('Goal saved!');
}

async function checkGoalProgress() {
    const goals = await db.getGoalsBySetId(setId);
    const todaySessions = await getTodaySessions(setId);
    const cardsStudied = todaySessions.reduce((sum, s) => sum + s.cardsStudied, 0);

    if (goals[0] && cardsStudied >= goals[0].dailyCards) {
        showNotification('Daily goal reached! 🎉');
    }
}
```

**Step 5**: Styling
```css
/* In components.css */
.goal-setting {
    padding: var(--spacing-md);
    background: var(--surface);
    border-radius: var(--radius-md);
}

.goal-progress {
    width: 100%;
    height: 8px;
    background: var(--surface);
    border-radius: var(--radius-full);
    overflow: hidden;
}

.goal-progress-bar {
    height: 100%;
    background: var(--success);
    transition: width 0.3s ease;
}
```

**Step 6**: Test
- Create a goal
- Study some cards
- Verify progress tracking
- Test edge cases (no goal set, goal exceeded, etc.)

### 13.4 Code Style Guidelines

**JavaScript**:
- Use ES6+ features (const, let, arrow functions, classes)
- Async/await for asynchronous operations
- Descriptive variable names (camelCase)
- Comments for complex logic
- Error handling with try/catch

**HTML**:
- Semantic elements (header, nav, main, article, etc.)
- ARIA labels for accessibility
- Valid HTML5 markup
- Meaningful class names

**CSS**:
- CSS variables for theme values
- Mobile-first media queries
- BEM-like naming: `.component-element--modifier`
- Consistent spacing and indentation

**Naming Conventions**:
```javascript
// Classes: PascalCase
class QuizItApp {}

// Functions: camelCase
function calculateNextReview() {}

// Constants: UPPER_SNAKE_CASE
const MAX_CARDS = 100;

// CSS Classes: kebab-case
.study-card {}
.study-card--flipped {}
```

### 13.5 Debugging Tips

**IndexedDB Inspector**:
- Chrome DevTools: Application tab → IndexedDB
- View all object stores and records
- Manually edit/delete data for testing

**Console Logging**:
```javascript
// Add debugging to SRS calculations
console.log('Before SRS update:', card);
const updated = SRSAlgorithm.calculateNextReview(card, quality);
console.log('After SRS update:', updated);
```

**Network Tab**:
- Verify Service Worker caching
- Check which resources are cached vs. network

**Responsive Testing**:
- DevTools Device Mode
- Test at 375px (mobile), 768px (tablet), 1440px (desktop)

**Performance**:
- Lighthouse audit for PWA score
- Performance tab for bottlenecks
- Memory profiler for leaks

### 13.6 Common Development Tasks

#### Add a New Study Mode

1. Add mode UI in `study.html`
2. Implement mode logic in `study-modes.js`
3. Add mode selection button
4. Update session tracking to include new mode
5. Update analytics to handle new mode

#### Modify SRS Algorithm

1. Update `srs-algorithm.js`
2. Test with various quality ratings
3. Verify interval calculations
4. Update any dependent code

#### Add a New Chart

1. Create chart container in `analytics.html`
2. Add chart generation in `analytics.js`
3. Query necessary data from IndexedDB
4. Configure Chart.js options
5. Style chart container in `analytics.css`

#### Update Service Worker

1. Increment cache version in `service-worker.js`
2. Add new files to `urlsToCache`
3. Test offline functionality
4. Deploy update

---

## 14. Testing Strategy

### 14.1 Manual Testing Checklist

#### Core Functionality
- [ ] Create a new study set
- [ ] Add cards with text
- [ ] Add cards with images
- [ ] Edit existing set
- [ ] Delete set (verify cascade delete)
- [ ] Star/unstar sets
- [ ] Search sets
- [ ] Sort sets by all criteria
- [ ] Filter starred sets

#### Study Modes
- [ ] Flashcards: Flip cards, rate performance
- [ ] Learn: Type answers, check correctness
- [ ] Test: Multiple choice questions
- [ ] Test: Written questions
- [ ] Test: Mixed questions
- [ ] Match: Complete matching game

#### Analytics
- [ ] View overview statistics
- [ ] Check performance chart accuracy
- [ ] Verify accuracy by mode
- [ ] Review session history
- [ ] Check card performance details

#### Import/Export
- [ ] Export simple JSON
- [ ] Export full backup
- [ ] Import simple JSON
- [ ] Import full backup
- [ ] Verify SRS data preserved

#### PWA
- [ ] Install app on desktop
- [ ] Install app on mobile
- [ ] Verify offline functionality
- [ ] Test service worker caching

#### Theming
- [ ] Switch to dark mode
- [ ] Switch to light mode
- [ ] Verify theme persists on reload

### 14.2 Browser Compatibility Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### 14.3 Responsive Testing

Test at breakpoints:
- [ ] 375px (iPhone SE)
- [ ] 768px (iPad)
- [ ] 1024px (Desktop)
- [ ] 1440px (Large Desktop)

### 14.4 Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader announces content properly
- [ ] Focus indicators visible
- [ ] Color contrast sufficient
- [ ] ARIA labels present

### 14.5 Performance Testing

Run Lighthouse audit:
- [ ] Performance score > 90
- [ ] Accessibility score > 90
- [ ] Best Practices score > 90
- [ ] SEO score > 90
- [ ] PWA score = 100

### 14.6 Edge Cases

- [ ] Empty study set (0 cards)
- [ ] Very large set (1000+ cards)
- [ ] Very long card content
- [ ] Special characters in cards
- [ ] Identical front/back text
- [ ] Import malformed JSON
- [ ] Network offline during use
- [ ] Rapid button clicking
- [ ] Browser back button during study

### 14.7 Automated Testing (Future)

**Recommended Tools**:
- Jest: Unit testing
- Cypress: E2E testing
- Testing Library: Component testing

**Example Unit Test**:
```javascript
// srs-algorithm.test.js
import { SRSAlgorithm } from './srs-algorithm.js';

describe('SRSAlgorithm', () => {
    test('calculateNextReview with quality 3', () => {
        const card = {
            easeFactor: 2.5,
            interval: 0,
            repetitions: 0
        };

        const result = SRSAlgorithm.calculateNextReview(card, 3);

        expect(result.repetitions).toBe(1);
        expect(result.interval).toBe(1);
        expect(result.nextReview).toBeGreaterThan(Date.now());
    });

    test('updateEaseFactor maintains minimum', () => {
        const ef = SRSAlgorithm.updateEaseFactor(1.5, 1);
        expect(ef).toBeGreaterThanOrEqual(1.3);
    });
});
```

---

## 15. Deployment

### 15.1 Deployment Checklist

- [ ] Test all features in production environment
- [ ] Verify HTTPS enabled (required for PWA)
- [ ] Test service worker caching
- [ ] Confirm manifest.json accessible
- [ ] Validate all icons present
- [ ] Run Lighthouse audit
- [ ] Test on multiple devices
- [ ] Verify analytics work correctly

### 15.2 Hosting Options

#### Static Site Hosting (Recommended)

**GitHub Pages**:
```bash
# Push to gh-pages branch
git checkout -b gh-pages
git push origin gh-pages

# Enable in repository settings
# Visit https://username.github.io/quizit
```

**Netlify**:
1. Connect GitHub repository
2. Build command: (none)
3. Publish directory: `/`
4. Deploy

**Vercel**:
```bash
npm install -g vercel
vercel
```

**Cloudflare Pages**:
1. Connect GitHub repository
2. Framework: None
3. Build command: (none)
4. Build output: `/`

### 15.3 Custom Domain Setup

**DNS Configuration**:
```
CNAME record:
www.yourapp.com → your-hosting.netlify.app

A record:
yourapp.com → hosting-ip-address
```

**HTTPS**:
- Most hosts provide free SSL (Let's Encrypt)
- Ensure certificate auto-renewal enabled

### 15.4 Performance Optimization

**Pre-deployment**:
1. Minify CSS/JS (optional, already small)
2. Optimize images (compress PNGs)
3. Enable gzip compression on server
4. Set cache headers for static assets

**Server Configuration** (example for Apache):
```apache
# .htaccess
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html "access plus 1 hour"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
</IfModule>

<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>
```

### 15.5 Monitoring

**Key Metrics**:
- Page load time
- Time to interactive
- Service worker install rate
- PWA install rate
- Error rate (console errors)

**Tools**:
- Google Analytics (privacy-focused alternative: Plausible)
- Web Vitals monitoring
- Error tracking (Sentry)

### 15.6 Updates and Versioning

**Semantic Versioning**:
- MAJOR: Breaking changes (e.g., database schema change)
- MINOR: New features (e.g., new study mode)
- PATCH: Bug fixes (e.g., SRS calculation fix)

**Release Process**:
1. Update version in manifest.json
2. Increment service worker cache version
3. Test thoroughly
4. Create git tag: `git tag v1.2.0`
5. Push tag: `git push --tags`
6. Deploy to hosting
7. Monitor for errors

**User Communication**:
- Add "What's New" section in settings
- Show update notification on app launch
- Maintain changelog in repository

---

## 16. Contributing Guidelines

### 16.1 How to Contribute

**Bug Reports**:
1. Check existing issues
2. Create detailed bug report:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Browser/OS
   - Screenshots if applicable

**Feature Requests**:
1. Check existing feature requests
2. Describe use case
3. Explain expected behavior
4. Provide mockups if possible

**Code Contributions**:
1. Fork repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes following code style
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Create pull request

### 16.2 Pull Request Guidelines

**PR Title**:
- Clear, descriptive title
- Format: `[Type] Brief description`
- Types: Feature, Fix, Refactor, Docs, Style, Test

**PR Description**:
```markdown
## Description
Brief overview of changes

## Motivation
Why is this change needed?

## Changes
- Added X feature
- Fixed Y bug
- Refactored Z component

## Testing
- [ ] Tested on Chrome
- [ ] Tested on Firefox
- [ ] Tested on mobile
- [ ] Added/updated tests (if applicable)

## Screenshots
(if applicable)
```

**Code Review**:
- Be respectful and constructive
- Suggest improvements
- Explain reasoning
- Approve when ready

### 16.3 Development Workflow

```
1. Create issue for feature/bug
2. Assign to yourself
3. Create branch from main
4. Develop feature
5. Test thoroughly
6. Commit changes
7. Push to your fork
8. Open pull request
9. Address review feedback
10. Merge when approved
11. Delete branch
12. Close issue
```

### 16.4 Areas for Contribution

**High Priority**:
- [ ] Automated testing (Jest, Cypress)
- [ ] Additional study modes
- [ ] Improved analytics visualizations
- [ ] Accessibility improvements
- [ ] Performance optimizations

**Medium Priority**:
- [ ] Additional import formats (Anki, Quizlet)
- [ ] Card templates/formatting options
- [ ] Study statistics export
- [ ] Keyboard shortcuts customization
- [ ] Audio support for cards

**Low Priority**:
- [ ] Social features (share sets)
- [ ] Gamification (achievements, streaks)
- [ ] Additional themes
- [ ] Customizable card layouts
- [ ] Print-friendly views

---

## 17. Future Enhancements

### 17.1 Planned Features

#### Cloud Sync (Optional)
- End-to-end encrypted sync
- Multi-device support
- OAuth authentication
- Conflict resolution

#### Collaborative Sets
- Share sets with others
- Public set library
- Upvote/rating system
- Comments and discussions

#### Advanced SRS
- Custom SRS algorithm parameters
- Multiple algorithms (SM-2, SM-15, Leitner)
- Algorithm comparison
- Performance predictions

#### Enhanced Analytics
- Learning curve visualization
- Retention rate tracking
- Optimal study time recommendations
- Difficulty analysis

#### Mobile Apps
- Native iOS app
- Native Android app
- React Native or Flutter
- Share codebase with web

### 17.2 Technical Improvements

#### Performance
- Virtual scrolling for large sets
- Web Workers for heavy computations
- IndexedDB query optimization
- Lazy loading of images

#### Accessibility
- High contrast mode
- Larger text options
- Voice commands (Web Speech API)
- Screen reader improvements

#### Developer Experience
- TypeScript migration
- Component library/Storybook
- Automated testing suite
- Documentation generation

#### Infrastructure
- Backend API (optional)
- Database migration tools
- A/B testing framework
- Analytics dashboard

### 17.3 Community Requests

Track community feature requests and prioritize based on:
- Number of requests
- Alignment with project vision
- Implementation complexity
- Maintenance burden

---

## Appendix

### A. Glossary

**Card**: A flashcard with a front (question) and back (answer)

**Ease Factor (EF)**: SM-2 algorithm parameter indicating card difficulty (1.3-2.5+)

**IndexedDB**: Browser-based NoSQL database for client-side storage

**Interval**: Number of days until a card's next scheduled review

**Levenshtein Distance**: Edit distance between two strings

**PWA**: Progressive Web App - installable web application

**Repetitions**: Number of consecutive correct reviews for a card

**Service Worker**: Background script enabling offline functionality

**Session**: A single study period with start/end time

**SM-2**: SuperMemo 2 spaced repetition algorithm

**SRS**: Spaced Repetition System - algorithm for optimizing review timing

**Set**: A collection of related flashcards

### B. Resources

**Documentation**:
- [MDN Web Docs](https://developer.mozilla.org/) - Web standards
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Chart.js Docs](https://www.chartjs.org/docs/)

**Spaced Repetition**:
- [SM-2 Algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Anki Manual](https://docs.ankiweb.net/)

**PWA**:
- [web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [PWA Checklist](https://web.dev/pwa-checklist/)

### C. License

QuizIt is open source software. Please refer to the LICENSE file in the repository for licensing information.

### D. Contact

For questions, suggestions, or support:
- GitHub Issues: [github.com/yourusername/quizit/issues]
- Email: [your-email@example.com]
- Documentation: [yourapp.com/docs]

---

**Document Version**: 1.0
**Last Updated**: 2025-11-17
**Maintained by**: QuizIt Development Team

