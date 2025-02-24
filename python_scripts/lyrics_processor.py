import sys
import json
import torch
from transformers import AutoTokenizer, AutoModel, pipeline
import numpy as np
from langdetect import detect, DetectorFactory, detect_langs
from langdetect.lang_detect_exception import LangDetectException

# Set seed for consistent language detection
DetectorFactory.seed = 0

# Extended language mapping
LANGUAGE_MAP = {
    'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
    'it': 'Italian', 'pt': 'Portuguese', 'ja': 'Japanese', 'ko': 'Korean',
    'zh': 'Chinese', 'hi': 'Hindi', 'ar': 'Arabic', 'ru': 'Russian',
    'tr': 'Turkish', 'nl': 'Dutch', 'pl': 'Polish', 'vi': 'Vietnamese',
    'th': 'Thai', 'sv': 'Swedish', 'da': 'Danish', 'fi': 'Finnish'
}

# Multi-language theme keywords
THEME_KEYWORDS = {
    'love': {
        'en': ['love', 'heart', 'romance'],
        'es': ['amor', 'corazón', 'romance'],
        'fr': ['amour', 'coeur', 'romance'],
        'de': ['liebe', 'herz', 'romantik']
    },
    'sadness': {
        'en': ['sad', 'cry', 'tears'],
        'es': ['triste', 'llorar', 'lágrimas'],
        'fr': ['triste', 'pleurer', 'larmes'],
        'de': ['traurig', 'weinen', 'tränen']
    },
    'joy': {
        'en': ['happy', 'joy', 'smile'],
        'es': ['feliz', 'alegría', 'sonrisa'],
        'fr': ['heureux', 'joie', 'sourire'],
        'de': ['glücklich', 'freude', 'lächeln']
    }
}

# Load BERT model for lyrics embedding
tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
model = AutoModel.from_pretrained('bert-base-uncased')

def detect_language_with_confidence(text):
    try:
        # Get language probabilities
        langs = detect_langs(text)
        primary_lang = langs[0]
        
        return {
            'language': LANGUAGE_MAP.get(primary_lang.lang, primary_lang.lang),
            'confidence': primary_lang.prob,
            'secondary_languages': [
                {
                    'language': LANGUAGE_MAP.get(l.lang, l.lang),
                    'confidence': l.prob
                } for l in langs[1:]
            ]
        }
    except LangDetectException:
        return {
            'language': 'unknown',
            'confidence': 0.0,
            'secondary_languages': []
        }

def get_bert_embedding(text):
    # Tokenize and prepare input
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
    
    # Get BERT embeddings
    with torch.no_grad():
        outputs = model(**inputs)
        embeddings = outputs.last_hidden_state.mean(dim=1)
    
    return embeddings[0].numpy().tolist()

def extract_themes_multilingual(text, lang_info):
    themes = []
    primary_lang = lang_info['language'][:2].lower()  # Get ISO code
    
    # If language not in our theme keywords, fallback to English
    if primary_lang not in list(next(iter(THEME_KEYWORDS.values())).keys()):
        primary_lang = 'en'
    
    text_lower = text.lower()
    for theme, lang_keywords in THEME_KEYWORDS.items():
        if any(keyword in text_lower for keyword in lang_keywords.get(primary_lang, lang_keywords['en'])):
            themes.append(theme)
    
    return themes

def process_lyrics(lyrics):
    # Detect language with confidence
    lang_info = detect_language_with_confidence(lyrics)
    
    # Extract BERT embedding
    bert_embedding = get_bert_embedding(lyrics)
    
    # Extract themes with language support
    themes = extract_themes_multilingual(lyrics, lang_info)
    
    features = {
        'bertEmbedding': bert_embedding,
        'themes': themes,
        'language': lang_info['language'],
        'languageConfidence': lang_info['confidence'],
        'secondaryLanguages': lang_info['secondary_languages']
    }
    
    print(json.dumps(features))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Lyrics text required")
    
    lyrics = sys.argv[1]
    process_lyrics(lyrics) 