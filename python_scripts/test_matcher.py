import unittest
import os
from python_scripts.feature_utils import extract_audio_features
from python_scripts.matcher import match_songs

class TestMatcher(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Set up test database with both original and cover songs"""
        cls.original_audio = "test_data/test_song2.mp3"  # Beatles version
        cls.cover_audio = "test_data/test_song3.mp3"    # Cover version
        
        if not os.path.exists(cls.original_audio) or not os.path.exists(cls.cover_audio):
            raise FileNotFoundError("Test audio files not found")
            
        # Extract features for both songs
        cls.original_features = extract_audio_features(cls.original_audio)
        cls.original_features['id'] = 'test_song2.mp3'
        
        cls.cover_features = extract_audio_features(cls.cover_audio)
        cls.cover_features['id'] = 'test_song3.mp3'
        
        cls.database_features = [cls.original_features]  # Database contains original version
    
    def test_self_match(self):
        """Test that original song matches itself"""
        matches = match_songs(self.original_features, self.database_features)
        self.assertTrue(len(matches) > 0)
        best_match = matches[0]
        self.assertEqual(best_match[1], 'test_song2.mp3')
        self.assertGreater(best_match[0], 0.9)
    
    def test_cover_match(self):
        """Test that cover version matches original"""
        matches = match_songs(self.cover_features, self.database_features)
        self.assertTrue(len(matches) > 0)
        best_match = matches[0]
        self.assertEqual(best_match[1], 'test_song2.mp3')
        self.assertGreater(best_match[0], 0.7)  # Lower threshold for covers

if __name__ == '__main__':
    unittest.main()