import numpy as np
import librosa
import acoustid
import torchaudio
import torch
from transformers import AutoTokenizer, AutoModel, pipeline

# Audio processing constants
SAMPLE_RATE = 22050
HOP_LENGTH = 512
N_MFCC = 20

def extract_audio_features(audio_path):
    """Extract features needed for song identification"""
    # Load audio file
    y, sr = librosa.load(audio_path, sr=SAMPLE_RATE)
    
    # Generate Chromaprint fingerprint
    try:
        # First try using dynamic library
        duration, fingerprint = acoustid.fingerprint_file(audio_path)
    except acoustid.NoBackendError:
        try:
            # Fall back to fpcalc command-line tool
            duration, fingerprint = acoustid.fingerprint_file(audio_path, force_fpcalc=True)
        except acoustid.FingerprintGenerationError as e:
            print(f"Error generating fingerprint with fpcalc: {str(e)}")
            fingerprint = None
            duration = len(y) / sr
    except Exception as e:
        print(f"Unexpected error during fingerprint generation: {str(e)}")
        fingerprint = None
        duration = len(y) / sr
    
    # Extract MFCC
    mfcc = librosa.feature.mfcc(
        y=y, 
        sr=sr,
        n_mfcc=N_MFCC,
        hop_length=HOP_LENGTH,
        lifter=0.6
    )
    
    # Extract spectral contrast
    spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr, hop_length=HOP_LENGTH)
    
    # Add chroma features
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    
    # Add tempo and beat features
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    
    # Extract torchaudio embedding
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    waveform = torch.from_numpy(y).unsqueeze(0).to(device)
    bundle = torchaudio.pipelines.WAV2VEC2_BASE
    model = bundle.get_model().to(device)
    with torch.no_grad():
        emission, _ = model(waveform)
        emb = emission.mean(dim=1).cpu().numpy()
    
    features = {
        'mfcc': mfcc.tolist(),
        'spectralContrast': spectral_contrast.tolist(),
        'chromaprintFingerprint': fingerprint,
        'audioEmbedding': emb.tolist(),
        'chroma': chroma.tolist(),
        'tempo': float(tempo),
        'beats': beat_frames.tolist(),
        'metadata': {
            'duration': float(duration),
            'sampleRate': sr
        }
    }
    
    return features

def extract_lyrics_features(lyrics_text):
    """Extract features needed for lyrics matching"""
    # Initialize BERT model and tokenizer
    model = AutoModel.from_pretrained('bert-base-uncased')
    tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
    
    # Get BERT embedding
    inputs = tokenizer(lyrics_text, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = model(**inputs)
    embedding = outputs.last_hidden_state.mean(dim=1).numpy()
    
    # Emotion analysis
    classifier = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base")
    emotions = classifier(lyrics_text)[0]
    
    return {
        'bertEmbedding': embedding.tolist(),
        'emotions': {
            'label': emotions['label'],
            'score': float(emotions['score'])
        }
    } 