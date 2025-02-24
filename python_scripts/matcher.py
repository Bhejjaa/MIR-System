import numpy as np
from scipy.spatial.distance import cosine
from typing import List, Tuple, Dict

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return 1 - cosine(a.flatten(), b.flatten())

def match_songs(query_features: Dict, database_features: List[Dict], threshold: float = 0.7) -> List[Tuple[float, str]]:
    matches = []
    
    for song in database_features:
        similarity_score = 0.0
        weight_sum = 0.0
        
        # Fingerprint matching (highest weight)
        if query_features.get('chromaprintFingerprint') and song.get('chromaprintFingerprint'):
            if query_features['chromaprintFingerprint'] == song['chromaprintFingerprint']:
                matches.append((1.0, song['id']))
                continue
        
        # MFCC matching
        if 'mfcc' in query_features and 'mfcc' in song:
            mfcc_sim = cosine_similarity(
                np.array(query_features['mfcc']).mean(axis=1),
                np.array(song['mfcc']).mean(axis=1)
            )
            similarity_score += mfcc_sim * 0.4
            weight_sum += 0.4
        
        # Audio embedding matching
        if 'audioEmbedding' in query_features and 'audioEmbedding' in song:
            embed_sim = cosine_similarity(
                np.array(query_features['audioEmbedding']),
                np.array(song['audioEmbedding'])
            )
            similarity_score += embed_sim * 0.6
            weight_sum += 0.6
        
        if weight_sum > 0:
            final_similarity = similarity_score / weight_sum
            if final_similarity > threshold:
                matches.append((final_similarity, song['id']))
    
    return sorted(matches, reverse=True)[:5]  # Return top 5 matches

if __name__ == "__main__":
    import sys
    import json
    
    query_features = json.loads(sys.argv[1])
    database_features = json.loads(sys.argv[2])
    threshold = float(sys.argv[3]) if len(sys.argv) > 3 else 0.7
    
    matches = match_songs(query_features, database_features, threshold)
    print(json.dumps(matches))

