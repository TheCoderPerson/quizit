# QuizIt - Flashcard Learning PWA

A powerful progressive web application for creating and studying flashcards with intelligent spaced repetition. Built with vanilla JavaScript, QuizIt helps you learn smarter, not harder.

## Features

### Core Functionality
- **Create & Edit Study Sets**: Build custom flashcard sets with terms and definitions
- **Four Study Modes**:
  - 📇 **Flashcards**: Classic flip-card study with confidence ratings
  - 📖 **Learn**: Type answers to test your recall
  - 📝 **Test**: Mix of multiple choice and written questions
  - 🎯 **Match**: Timed matching game for quick review

### Intelligent Learning
- **SM-2 Spaced Repetition Algorithm**: Cards are scheduled based on how well you know them
- **Performance Tracking**: Track accuracy, study time, and improvement over time
- **Card Priority System**: Focus on cards you struggle with most
- **Mastery Levels**: See which cards you've mastered and which need work

### Analytics & Insights
- **Performance Dashboard**: View detailed statistics for each study set
- **Progress Charts**: Visualize your improvement over time
- **Card-Level Analytics**: See performance metrics for individual cards
- **Study Heatmap**: Track your study activity over time
- **Session History**: Review past study sessions

### Progressive Web App
- **Offline Support**: Study anywhere, even without internet
- **Installable**: Add to your home screen for native app experience
- **Fast & Responsive**: Optimized performance on all devices
- **Data Persistence**: All data stored locally with IndexedDB
- **Dark Mode**: Easy on the eyes during late-night study sessions

### Additional Features
- **Import/Export**: Share card sets via JSON format
- **Search & Filter**: Quickly find your study sets
- **Star Favorites**: Mark important sets for quick access
- **Responsive Design**: Works great on desktop, tablet, and mobile

## Getting Started

### Installation

1. **Clone or download this repository**:
   ```bash
   git clone https://github.com/yourusername/quizit.git
   cd quizit
   ```

2. **Serve the application**:

   You need to serve the app through a web server (not just opening index.html directly) for the PWA features to work.

   **Option 1 - Python**:
   ```bash
   # Python 3
   python -m http.server 8000

   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option 2 - Node.js**:
   ```bash
   npx http-server -p 8000
   ```

   **Option 3 - PHP**:
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser**:
   Navigate to `http://localhost:8000`

### Installation as PWA

1. Open QuizIt in a modern browser (Chrome, Edge, Firefox, Safari)
2. Look for the install button in the app header or browser address bar
3. Click "Install" to add QuizIt to your device
4. Launch from your home screen or app menu

## Usage Guide

### Creating a Study Set

1. Click **"Create Set"** or the **+** button
2. Enter a title and optional description
3. Add cards by filling in terms and definitions
4. Click **"+ Add Card"** to add more cards
5. Click **"Save Set"** when done

### Studying

1. From the home page, select a study set
2. Choose your preferred study mode:
   - **Flashcards**: Click to flip, rate your confidence
   - **Learn**: Type answers and get instant feedback
   - **Test**: Answer multiple choice or written questions
   - **Match**: Match terms with definitions quickly

### Understanding the Algorithm

QuizIt uses the **SM-2 spaced repetition algorithm**:

- **New cards** start with no repetition history
- **Correct answers** increase the review interval
- **Incorrect answers** reset the interval
- **Ease factor** adjusts based on how easily you recall

Rating scale (Flashcards mode):
- 😔 **Again** (1): No recall, start over
- 🤔 **Hard** (3): Correct with difficulty
- 😊 **Good** (4): Correct with some hesitation
- 😄 **Easy** (5): Perfect, immediate recall

### Viewing Analytics

1. Click **"📊 Analytics"** on any study set
2. View overview statistics
3. Explore performance charts
4. Review individual card performance
5. Check your study heatmap

### Importing/Exporting Sets

**Export**:
1. Open a set for editing
2. Click **"📤 Export"**
3. Copy the JSON data

**Import**:
1. Create or edit a set
2. Click **"📥 Import"**
3. Paste JSON data
4. Cards will be added to your set

**JSON Format**:
```json
[
  {"front": "Term 1", "back": "Definition 1"},
  {"front": "Term 2", "back": "Definition 2"}
]
```

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Storage**: IndexedDB for local data persistence
- **Charts**: Chart.js for analytics visualization
- **PWA**: Service Worker API for offline functionality
- **Algorithm**: SM-2 Spaced Repetition (SuperMemo 2)

### Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Opera 67+

## Project Structure

```
quizit/
├── index.html              # Home page (library)
├── study.html              # Study modes interface
├── create.html             # Card set editor
├── analytics.html          # Performance dashboard
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for offline support
├── css/
│   ├── main.css           # Main styles
│   ├── components.css     # Component styles
│   ├── analytics.css      # Analytics page styles
│   └── themes.css         # Theme definitions
├── js/
│   ├── app.js             # Main application logic
│   ├── db.js              # IndexedDB wrapper
│   ├── srs-algorithm.js   # SM-2 algorithm implementation
│   ├── study-modes.js     # Study mode logic
│   ├── card-set-manager.js # CRUD operations
│   ├── analytics.js       # Analytics & charts
│   └── utils.js           # Utility functions
├── lib/
│   └── chart.min.js       # Chart.js library
├── images/
│   ├── icon-192.png       # PWA icon (192x192)
│   ├── icon-512.png       # PWA icon (512x512)
│   └── favicon.ico        # Favicon
└── README.md
```

## Development

### Customizing Icons

The included icons are placeholders (SVG-based). For production:

1. Create proper PNG icons at 192x192 and 512x512 pixels
2. Replace `images/icon-192.png` and `images/icon-512.png`
3. Create a proper favicon.ico file

### Modifying the Algorithm

The SM-2 algorithm is in `js/srs-algorithm.js`. You can adjust:
- Initial ease factor (default: 2.5)
- Minimum ease factor (default: 1.3)
- Interval multipliers
- Quality rating mappings

### Extending Study Modes

To add a new study mode:
1. Add HTML structure in `study.html`
2. Implement mode logic in `js/study-modes.js`
3. Add mode button in card template (`index.html`)
4. Update analytics to track new mode

## Known Limitations

- Icons are SVG placeholders (convert to PNG for better PWA support)
- No cloud sync (all data is local)
- No user authentication
- Limited to one device unless data is manually exported/imported

## Future Enhancements

- [ ] Cloud synchronization
- [ ] User accounts and sharing
- [ ] Audio pronunciation support
- [ ] Image support in cards
- [ ] Collaborative study sets
- [ ] Study reminders/notifications
- [ ] More study modes (writing practice, etc.)
- [ ] Statistics export (CSV, PDF)
- [ ] Themes customization

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- **SM-2 Algorithm**: Based on SuperMemo 2 by Piotr Wozniak
- **Chart.js**: For beautiful charts and visualizations
- **Inspiration**: Quizlet, Anki, and other flashcard apps

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Happy Learning! 📚**
