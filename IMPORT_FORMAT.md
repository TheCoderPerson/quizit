# QuizIt Import Format Documentation

This document describes the JSON formats supported for importing flashcard data into QuizIt.

## Table of Contents

1. [CSV Import Format](#csv-import-format) (Simplest)
2. [Simple Card Import](#simple-card-import) (JSON)
3. [Full Set Backup Format](#full-set-backup-format)
4. [Image Data](#image-data)
5. [Examples](#examples)

---

## CSV Import Format

The simplest way to import flashcards is using CSV (Comma-Separated Values) format. Each line represents one flashcard with the term and definition separated by a comma.

### Format

```
term,definition
```

### Rules

- One flashcard per line
- Term and definition separated by a single comma
- Everything before the first comma is the term
- Everything after the first comma is the definition
- Empty lines are skipped
- Lines without a comma are skipped
- If your definition contains commas, they are preserved (only the FIRST comma is used as separator)

### Simple Example

```csv
What is the capital of France?,Paris
What is 2 + 2?,4
Who wrote Romeo and Juliet?,William Shakespeare
What is the largest planet in our solar system?,Jupiter
```

### Example with Commas in Definition

```csv
What is the speed of light?,"299,792,458 meters per second"
List the primary colors,"Red, Blue, Yellow"
Name three programming languages,"Python, JavaScript, Java"
```

### Advantages of CSV Format

- ✅ Easiest to create (use Excel, Google Sheets, or any text editor)
- ✅ One line per card - very simple format
- ✅ Can export from spreadsheets directly
- ✅ Easy to convert from other flashcard apps
- ✅ Human-readable and easy to edit

### Limitations of CSV Format

- ❌ Cannot include images
- ❌ Cannot include progress/SRS data
- ❌ No metadata (set name, description, etc.)

For images or full backup with progress, use the JSON formats below.

---

## Simple Card Import

Use this format when adding cards to an existing study set via the **Import** button on the Create/Edit Set page.

### Format

```json
[
  {
    "front": "Term or question text",
    "back": "Definition or answer text",
    "frontImage": "data:image/png;base64,..." (optional),
    "backImage": "data:image/jpeg;base64,..." (optional)
  },
  ...
]
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `front` | string | **Yes** | The term, question, or front side of the flashcard |
| `back` | string | **Yes** | The definition, answer, or back side of the flashcard |
| `frontImage` | string | No | Base64-encoded image data for the term side |
| `backImage` | string | No | Base64-encoded image data for the definition side |

### Simple Example

```json
[
  {
    "front": "Photosynthesis",
    "back": "The process by which plants convert sunlight into energy"
  },
  {
    "front": "Mitochondria",
    "back": "The powerhouse of the cell"
  },
  {
    "front": "DNA",
    "back": "Deoxyribonucleic acid - carries genetic information"
  }
]
```

### With Images Example

```json
[
  {
    "front": "What is this structure?",
    "frontImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
    "back": "The Eiffel Tower in Paris, France"
  }
]
```

---

## Full Set Backup Format

Use this format when importing a complete study set with progress data via the **Import Set** button on the main page. This format is automatically generated when you export a set.

### Format

```json
{
  "version": 1,
  "exportDate": 1234567890123,
  "set": {
    "name": "Study Set Name",
    "description": "Optional description",
    "created": 1234567890123,
    "modified": 1234567890123,
    "starred": false
  },
  "cards": [
    {
      "front": "Term text",
      "back": "Definition text",
      "frontImage": null,
      "backImage": null,
      "easeFactor": 2.5,
      "interval": 0,
      "repetitions": 0,
      "nextReview": 1234567890123,
      "created": 1234567890123
    }
  ],
  "sessions": [
    {
      "mode": "flashcards",
      "startTime": 1234567890123,
      "endTime": 1234567890123,
      "cardsStudied": 10,
      "correctCount": 8,
      "incorrectCount": 2
    }
  ],
  "performance": [
    {
      "cardId": 1,
      "sessionId": 1,
      "correct": true,
      "timeSpent": 5000,
      "confidence": 4,
      "timestamp": 1234567890123
    }
  ]
}
```

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | number | **Yes** | Format version number (currently 1) |
| `exportDate` | number | **Yes** | Unix timestamp when backup was created |
| `set` | object | **Yes** | Study set metadata |
| `cards` | array | **Yes** | Array of flashcard objects |
| `sessions` | array | No | Array of study session records |
| `performance` | array | No | Array of individual card performance records |

### Set Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | **Yes** | Name of the study set |
| `description` | string | No | Description of the study set |
| `created` | number | No | Unix timestamp when set was created |
| `modified` | number | No | Unix timestamp when set was last modified |
| `starred` | boolean | No | Whether the set is starred/favorited |

### Card Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `front` | string | **Yes** | Term or question text |
| `back` | string | **Yes** | Definition or answer text |
| `frontImage` | string/null | No | Base64-encoded image for front side |
| `backImage` | string/null | No | Base64-encoded image for back side |
| `easeFactor` | number | No | SM-2 algorithm ease factor (default: 2.5) |
| `interval` | number | No | Days until next review (default: 0) |
| `repetitions` | number | No | Consecutive correct answers (default: 0) |
| `nextReview` | number | No | Unix timestamp for next review |
| `created` | number | No | Unix timestamp when card was created |

### Session Object

| Field | Type | Description |
|-------|------|-------------|
| `mode` | string | Study mode: "flashcards", "learn", "test", or "match" |
| `startTime` | number | Unix timestamp when session started |
| `endTime` | number | Unix timestamp when session ended |
| `cardsStudied` | number | Number of cards studied in session |
| `correctCount` | number | Number of correct answers |
| `incorrectCount` | number | Number of incorrect answers |

### Performance Object

| Field | Type | Description |
|-------|------|-------------|
| `cardId` | number | ID of the card (will be remapped on import) |
| `sessionId` | number | ID of the session (will be remapped on import) |
| `correct` | boolean | Whether the answer was correct |
| `timeSpent` | number | Time spent on card in milliseconds |
| `confidence` | number | Confidence rating (1-5, where 5 is "Easy") |
| `timestamp` | number | Unix timestamp of the attempt |

---

## Image Data

Images must be encoded as Base64 data URIs with the format:

```
data:[MIME_TYPE];base64,[BASE64_DATA]
```

### Supported Image Formats

- PNG: `data:image/png;base64,...`
- JPEG: `data:image/jpeg;base64,...`
- GIF: `data:image/gif;base64,...`
- WebP: `data:image/webp;base64,...`

### Image Size Limit

- Maximum file size: **5 MB** per image
- Recommended: Keep images under 1 MB for best performance

### Converting Images to Base64

**Using JavaScript in browser:**
```javascript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const reader = new FileReader();
reader.onload = (e) => {
  console.log(e.target.result); // This is the Base64 data URI
};
reader.readAsDataURL(file);
```

**Using command line (Linux/Mac):**
```bash
base64 -i image.jpg -o image.txt
# Then prepend: data:image/jpeg;base64,
```

**Using online tools:**
- https://www.base64-image.de/
- https://base64.guru/converter/encode/image

---

## Examples

### Example 1: Simple Biology Cards

```json
[
  {
    "front": "What is the powerhouse of the cell?",
    "back": "Mitochondria"
  },
  {
    "front": "What is DNA?",
    "back": "Deoxyribonucleic acid - the molecule that carries genetic information"
  },
  {
    "front": "What is photosynthesis?",
    "back": "The process by which plants use sunlight to synthesize nutrients from CO2 and water"
  }
]
```

### Example 2: Language Learning with Progress

```json
{
  "version": 1,
  "exportDate": 1704067200000,
  "set": {
    "name": "Spanish Vocabulary - Week 1",
    "description": "Basic greetings and common phrases",
    "created": 1704000000000,
    "modified": 1704067200000,
    "starred": true
  },
  "cards": [
    {
      "front": "Hello",
      "back": "Hola",
      "frontImage": null,
      "backImage": null,
      "easeFactor": 2.6,
      "interval": 1,
      "repetitions": 2,
      "nextReview": 1704153600000,
      "created": 1704000000000
    },
    {
      "front": "Goodbye",
      "back": "Adiós",
      "frontImage": null,
      "backImage": null,
      "easeFactor": 2.5,
      "interval": 0,
      "repetitions": 0,
      "nextReview": 1704067200000,
      "created": 1704000000000
    },
    {
      "front": "Thank you",
      "back": "Gracias",
      "frontImage": null,
      "backImage": null,
      "easeFactor": 2.8,
      "interval": 3,
      "repetitions": 3,
      "nextReview": 1704326400000,
      "created": 1704000000000
    }
  ],
  "sessions": [
    {
      "mode": "flashcards",
      "startTime": 1704000000000,
      "endTime": 1704001800000,
      "cardsStudied": 3,
      "correctCount": 2,
      "incorrectCount": 1
    }
  ],
  "performance": []
}
```

### Example 3: Geography with Images

```json
[
  {
    "front": "What country is this?",
    "frontImage": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD...",
    "back": "Japan"
  },
  {
    "front": "Capital of France",
    "back": "Paris",
    "backImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."
  }
]
```

---

## Import Instructions

### Importing Cards (CSV or JSON)

1. Open an existing study set or create a new one
2. Click the **📥 Import** button
3. Either:
   - Click **📁 Choose File (JSON or CSV)** and select your file, OR
   - Paste JSON data directly into the text area (CSV paste not supported)
4. Click **Import**
5. Cards will be added to your set

**Supported file types:**
- `.csv` - Simple comma-separated format (term,definition)
- `.json` - JSON format with optional images and metadata

### Importing Full Set Backup

1. From the main page, click **📥 Import Set** in the navigation
2. Click **📁 Choose File**
3. Select your backup JSON file
4. A new study set will be created with all data and progress

---

## Notes

- **IDs are not preserved**: When importing, new IDs are automatically generated for sets, cards, sessions, and performance records
- **Duplicate handling**: Importing does not check for duplicates - cards will be added/created even if they already exist
- **Progress data**: Session and performance data in full backups are informational only during import - individual card progress (easeFactor, interval, etc.) is preserved and will affect SRS scheduling
- **Validation**: Both import formats validate the JSON structure and will show an error if required fields are missing
- **Compatibility**: Simple card format is compatible with basic flashcard export from other applications - just ensure `front` and `back` fields are present

---

## Troubleshooting

**Error: "Invalid JSON format"**
- Check that your JSON is properly formatted (use a JSON validator like jsonlint.com)
- Ensure all strings are in double quotes
- Verify all objects and arrays are properly closed with matching braces/brackets

**Error: "Invalid backup file format"**
- Ensure your file includes the required `set` and `cards` fields
- Verify `cards` is an array

**Error: "No valid cards found in data"**
- Check that each card has both `front` and `back` fields
- Ensure both fields contain non-empty strings

**Error: "Image size must be less than 5MB"**
- When creating cards with images, ensure each image is under 5MB
- Consider compressing large images before encoding to Base64

**Error: "Please select a JSON or CSV file"**
- Ensure your file has a `.json` or `.csv` extension
- Try renaming your file to end with `.json` or `.csv`

**CSV file imports but some cards are missing**
- Check that each line has a comma separating term and definition
- Lines without commas are automatically skipped
- Empty lines are automatically skipped
- Check browser console for warnings about skipped lines

---

## Version History

- **Version 1.1** (Current): Added CSV import format for simple term,definition pairs
- **Version 1.0**: Initial format with full backup support including images, SRS data, sessions, and performance tracking
