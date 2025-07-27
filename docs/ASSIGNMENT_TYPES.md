# Assignment Types Guide

## Overview
The English Foundation Learning Platform supports a comprehensive range of assignment types designed to provide engaging and varied learning experiences. Each type includes auto-scoring capabilities where applicable and detailed feedback mechanisms.

---

## Auto-Scored Assignment Types

### 1. Multiple Choice
**Description:** Traditional multiple choice questions with single or multiple correct answers.

**Configuration:**
```json
{
  "type": "multiple_choice",
  "content": "What is the capital of France?",
  "options": ["London", "Paris", "Berlin", "Madrid"],
  "answer": "Paris",
  "allowMultiple": false,
  "scoring": {
    "points": 1,
    "partialCredit": false
  }
}
```

**Auto-Scoring:** ✅ Full auto-scoring
**Implementation:** Direct answer comparison

---

### 2. True/False
**Description:** Simple true or false questions.

**Configuration:**
```json
{
  "type": "true_false",
  "content": "The Earth is round.",
  "answer": true,
  "scoring": {
    "points": 1
  }
}
```

**Auto-Scoring:** ✅ Full auto-scoring
**Implementation:** Boolean comparison

---

### 3. Fill-in-the-Blank
**Description:** Text input questions with exact answer matching.

**Configuration:**
```json
{
  "type": "fill_in_blank",
  "content": "The capital of France is _____.",
  "answer": "Paris",
  "caseSensitive": false,
  "allowPartial": true,
  "scoring": {
    "points": 1,
    "partialCredit": true
  }
}
```

**Auto-Scoring:** ✅ Full auto-scoring
**Implementation:** Text matching with configurable sensitivity

---

### 4. Matching Pairs
**Description:** Match items from two columns.

**Configuration:**
```json
{
  "type": "matching_pairs",
  "content": "Match the countries with their capitals:",
  "options": {
    "pairs": [
      {"left": "France", "right": "Paris"},
      {"left": "Germany", "right": "Berlin"},
      {"left": "Spain", "right": "Madrid"}
    ]
  },
  "scoring": {
    "points": 3,
    "partialCredit": true
  }
}
```

**Auto-Scoring:** ✅ Full auto-scoring
**Implementation:** Pair-by-pair comparison

---

### 5. Sequencing/Ordering
**Description:** Arrange items in correct order.

**Configuration:**
```json
{
  "type": "sequencing",
  "content": "Arrange the events in chronological order:",
  "options": {
    "items": ["World War II", "World War I", "Cold War"],
    "correctOrder": [1, 0, 2]
  },
  "scoring": {
    "points": 3,
    "partialCredit": true
  }
}
```

**Auto-Scoring:** ✅ Full auto-scoring
**Implementation:** Order comparison with partial credit

---

### 6. Drag and Drop
**Description:** Drag items to arrange them correctly.

**Configuration:**
```json
{
  "type": "drag_and_drop",
  "content": "Drag the words to form a sentence:",
  "options": {
    "items": ["The", "cat", "sat", "on", "the", "mat"],
    "correctOrder": [0, 1, 2, 3, 4, 5]
  },
  "scoring": {
    "points": 6,
    "partialCredit": true
  }
}
```

**Auto-Scoring:** ✅ Full auto-scoring
**Implementation:** Order comparison with partial credit

---

### 7. Categorization
**Description:** Sort items into categories.

**Configuration:**
```json
{
  "type": "categorization",
  "content": "Categorize the following animals:",
  "options": {
    "categories": ["Mammals", "Birds", "Fish"],
    "items": [
      {"item": "Lion", "category": "Mammals"},
      {"item": "Eagle", "category": "Birds"},
      {"item": "Shark", "category": "Fish"}
    ]
  },
  "scoring": {
    "points": 3,
    "partialCredit": true
  }
}
```

**Auto-Scoring:** ✅ Full auto-scoring
**Implementation:** Category assignment comparison

---

### 8. Hotspot/Clickable Image
**Description:** Click on specific areas of an image.

**Configuration:**
```json
{
  "type": "hotspot",
  "content": "Click on the capital of France on the map:",
  "options": {
    "imageUrl": "/images/france-map.jpg",
    "hotspots": [
      {
        "id": "paris",
        "x": 150,
        "y": 200,
        "radius": 20,
        "label": "Paris"
      }
    ]
  },
  "scoring": {
    "points": 1
  }
}
```

**Auto-Scoring:** ✅ Full auto-scoring
**Implementation:** Coordinate-based click detection

---

### 9. Connect-the-Dots
**Description:** Draw connections between related items.

**Configuration:**
```json
{
  "type": "connect_dots",
  "content": "Connect the words with their definitions:",
  "options": {
    "connections": [
      {"from": "word1", "to": "def1"},
      {"from": "word2", "to": "def2"}
    ]
  },
  "scoring": {
    "points": 2,
    "partialCredit": true
  }
}
```

**Auto-Scoring:** ✅ Full auto-scoring
**Implementation:** Connection validation

---

### 10. Labeling
**Description:** Label parts of an image or diagram.

**Configuration:**
```json
{
  "type": "labeling",
  "content": "Label the parts of the human body:",
  "options": {
    "imageUrl": "/images/body-diagram.jpg",
    "labels": [
      {"id": "head", "x": 100, "y": 50, "text": "Head"},
      {"id": "arm", "x": 200, "y": 150, "text": "Arm"}
    ]
  },
  "scoring": {
    "points": 2,
    "partialCredit": true
  }
}
```

**Auto-Scoring:** ✅ Full auto-scoring
**Implementation:** Label position and text validation

---

### 11. Gap Fill with Word Bank
**Description:** Fill gaps using words from a provided bank.

**Configuration:**
```json
{
  "type": "gap_fill_word_bank",
  "content": "Complete the sentence using words from the bank:",
  "options": {
    "text": "The ___ is a large ___ that lives in the ___.",
    "gaps": ["elephant", "animal", "jungle"],
    "wordBank": ["elephant", "animal", "jungle", "ocean", "mountain"]
  },
  "scoring": {
    "points": 3,
    "partialCredit": true
  }
}
```

**Auto-Scoring:** ✅ Full auto-scoring
**Implementation:** Gap-by-gap word matching

---

### 12. Sentence Building
**Description:** Construct sentences from word fragments.

**Configuration:**
```json
{
  "type": "sentence_building",
  "content": "Build a grammatically correct sentence:",
  "options": {
    "words": ["The", "cat", "sat", "on", "the", "mat"],
    "correctOrder": [0, 1, 2, 3, 4, 5]
  },
  "scoring": {
    "points": 6,
    "partialCredit": true
  }
}
```

**Auto-Scoring:** ✅ Full auto-scoring
**Implementation:** Word order validation

---

## Manual Grading Assignment Types

### 13. Short Answer
**Description:** Brief text responses requiring manual review.

**Configuration:**
```json
{
  "type": "short_answer",
  "content": "Explain why the sky appears blue in 2-3 sentences.",
  "options": {
    "maxLength": 200,
    "keywords": ["scattering", "light", "atmosphere"]
  },
  "scoring": {
    "points": 5,
    "manualGrading": true
  }
}
```

**Auto-Scoring:** ❌ Manual grading required
**Implementation:** Keyword detection for assistance

---

### 14. Audio Recording Upload
**Description:** Students record and upload audio responses.

**Configuration:**
```json
{
  "type": "audio_recording",
  "content": "Record yourself reading the following passage:",
  "options": {
    "passage": "The quick brown fox jumps over the lazy dog.",
    "maxDuration": 60,
    "allowedFormats": ["mp3", "wav", "ogg"]
  },
  "scoring": {
    "points": 10,
    "manualGrading": true
  }
}
```

**Auto-Scoring:** ❌ Manual grading required
**Implementation:** File upload with duration validation

---

### 15. Image Upload
**Description:** Students upload images of their work.

**Configuration:**
```json
{
  "type": "image_upload",
  "content": "Take a photo of your completed math worksheet.",
  "options": {
    "maxFileSize": 10485760, // 10MB
    "allowedFormats": ["jpg", "png", "gif"],
    "instructions": "Ensure the image is clear and well-lit"
  },
  "scoring": {
    "points": 15,
    "manualGrading": true
  }
}
```

**Auto-Scoring:** ❌ Manual grading required
**Implementation:** File upload with format validation

---

### 16. Video Upload
**Description:** Students upload video responses.

**Configuration:**
```json
{
  "type": "video_upload",
  "content": "Record a 2-minute presentation on your research topic.",
  "options": {
    "maxDuration": 120,
    "maxFileSize": 52428800, // 50MB
    "allowedFormats": ["mp4", "webm", "mov"]
  },
  "scoring": {
    "points": 20,
    "manualGrading": true
  }
}
```

**Auto-Scoring:** ❌ Manual grading required
**Implementation:** File upload with duration and format validation

---

### 17. Drawing/Annotation
**Description:** Students draw or annotate on images.

**Configuration:**
```json
{
  "type": "drawing_annotation",
  "content": "Draw arrows to show the water cycle on this diagram.",
  "options": {
    "baseImage": "/images/water-cycle.jpg",
    "tools": ["pen", "arrow", "text", "eraser"],
    "canvasSize": {"width": 800, "height": 600}
  },
  "scoring": {
    "points": 12,
    "manualGrading": true
  }
}
```

**Auto-Scoring:** ❌ Manual grading required
**Implementation:** Canvas-based drawing tool

---

### 18. Open-Ended Essay
**Description:** Extended written responses.

**Configuration:**
```json
{
  "type": "open_ended_essay",
  "content": "Write a 500-word essay on the impact of technology on education.",
  "options": {
    "minLength": 400,
    "maxLength": 1000,
    "rubric": {
      "content": 40,
      "organization": 30,
      "grammar": 20,
      "creativity": 10
    }
  },
  "scoring": {
    "points": 25,
    "manualGrading": true
  }
}
```

**Auto-Scoring:** ❌ Manual grading required
**Implementation:** Rich text editor with word count

---

## Implementation Guidelines

### Frontend Components
Each assignment type requires:
- **Input Component:** For student interaction
- **Preview Component:** For teacher creation
- **Scoring Logic:** For auto-scored types
- **Validation:** For data integrity

### Backend API
- **Question Creation:** Support all configuration options
- **Answer Submission:** Handle various data formats
- **Auto-Scoring:** Implement scoring algorithms
- **File Upload:** Handle media submissions

### Database Schema
```sql
-- Question model supports all types
model Question {
  id            String   @id @default(uuid())
  content       String
  type          String   // All assignment types
  options       Json?    // Type-specific configuration
  answer        Json?    // Correct answer(s)
  points        Int      @default(1)
  scoring       Json?    // Scoring configuration
  feedback      Json?    // Feedback configuration
  // ... other fields
}
```

### Scoring Configuration
```json
{
  "scoring": {
    "points": 10,
    "partialCredit": true,
    "autoScore": true,
    "manualGrading": false,
    "rubric": {
      "criteria1": 40,
      "criteria2": 30,
      "criteria3": 30
    }
  }
}
```

---

## Future Enhancements

### AI-Powered Features
- **Essay Grading:** AI-assisted scoring for written responses
- **Audio Analysis:** Speech recognition for pronunciation assessment
- **Image Recognition:** Automated checking of handwritten work
- **Plagiarism Detection:** Content similarity analysis

### Advanced Interactions
- **Virtual Labs:** Interactive science experiments
- **3D Modeling:** Three-dimensional object manipulation
- **Simulations:** Real-world scenario simulations
- **Collaborative Tasks:** Multi-student assignments

### Accessibility Features
- **Screen Reader Support:** Full accessibility compliance
- **Voice Input:** Speech-to-text for all text inputs
- **High Contrast Mode:** Visual accessibility options
- **Keyboard Navigation:** Complete keyboard accessibility 