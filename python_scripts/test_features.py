from feature_utils import extract_audio_features, extract_lyrics_features
import os

def test_audio_features():
    """Test audio feature extraction"""
    test_audio = "test_data/test_song2.mp3"
    
    if not os.path.exists(test_audio):
        print(f"Error: Test audio file not found at {test_audio}")
        return
        
    try:
        features = extract_audio_features(test_audio)
        print("\nAudio Features:")
        print(f"MFCC shape: {len(features['mfcc'])}x{len(features['mfcc'][0])}")
        print(f"Spectral Contrast shape: {len(features['spectralContrast'])}x{len(features['spectralContrast'][0])}")
        print(f"Audio embedding shape: {len(features['audioEmbedding'])}x{len(features['audioEmbedding'][0])}")
        print(f"Chromaprint fingerprint: {'Present' if features['chromaprintFingerprint'] else 'Not generated'}")
        print(f"Duration: {features['metadata']['duration']:.2f}s")
    except Exception as e:
        print(f"Error extracting audio features: {str(e)}")

def test_lyrics_features():
    """Test lyrics feature extraction"""
    test_lyrics = """
    This is a test song
    With some sample lyrics
    To check if features work
    """
    
    try:
        features = extract_lyrics_features(test_lyrics)
        print("\nLyrics Features:")
        print(f"BERT embedding shape: {len(features['bertEmbedding'])}x{len(features['bertEmbedding'][0])}")
        print(f"Emotion: {features['emotions']['label']} (score: {features['emotions']['score']:.2f})")
    except Exception as e:
        print(f"Error extracting lyrics features: {str(e)}")

if __name__ == "__main__":
    print("Testing Feature Extraction")
    print("-------------------------")
    test_audio_features()
    test_lyrics_features() 