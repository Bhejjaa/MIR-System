import sys
import json
import os
import librosa
import numpy as np
from chromaprint import generate_fingerprint
from feature_utils import extract_audio_features

def validate_audio_file(audio_path):
    """Validate audio file exists and is in supported format"""
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
    # Get file extension
    _, ext = os.path.splitext(audio_path)
    supported_formats = ['.mp3', '.wav', '.m4a', '.flac', '.ogg']
    
    if ext.lower() not in supported_formats:
        raise ValueError(f"Unsupported audio format: {ext}. Supported formats: {', '.join(supported_formats)}")
    
    try:
        # Try loading first few seconds to validate format
        y, sr = librosa.load(audio_path, duration=1.0)
        if y.size == 0:
            raise ValueError("Audio file appears to be empty")
    except Exception as e:
        raise ValueError(f"Error loading audio file: {str(e)}")

def process_audio(audio_path):
    try:
        # Validate audio file
        validate_audio_file(audio_path)
        
        # Extract features
        features = extract_audio_features(audio_path)
        
        # Validate fingerprint generation
        if features['chromaprintFingerprint'] is None:
            print(json.dumps({
                'warning': 'Fingerprint generation failed, falling back to feature-based matching',
                'features': features,
                'status': 'partial'
            }))
        else:
            print(json.dumps({
                'features': features,
                'status': 'success'
            }))
            
    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'status': 'error',
            'type': e.__class__.__name__
        }))
        sys.exit(1)

def extract_audio_features(audio_path):
    # Load audio file
    y, sr = librosa.load(audio_path, sr=22050)
    
    # Extract MFCC features
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    
    # Generate Chromaprint fingerprint
    fingerprint = generate_fingerprint(y, sr)
    
    # Extract audio embedding (using mean of MFCC as simple embedding)
    audio_embedding = np.mean(mfcc, axis=1)
    
    # Convert numpy arrays to lists for JSON serialization
    features = {
        'mfcc': mfcc.tolist(),
        'chromaprintFingerprint': fingerprint,
        'audioEmbedding': audio_embedding.tolist(),
        'metadata': {
            'duration': float(librosa.get_duration(y=y, sr=sr)),
            'sampleRate': sr
        }
    }
    
    print(json.dumps(features))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Audio file path required")
    
    audio_path = sys.argv[1]
    process_audio(audio_path)