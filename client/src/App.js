import React, { useState } from 'react';
import { Container, Paper, Alert, Snackbar } from '@mui/material';
import SearchBar from './components/SearchBar';
import AudioRecorder from './components/AudioRecorder';
import SearchResults from './components/SearchResults';
import axios from 'axios';

// Create axios instance with configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

function App() {
    const [searchType, setSearchType] = useState('audio');
    const [results, setResults] = useState([]);
    const [showRecorder, setShowRecorder] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showError, setShowError] = useState(false);

    const handleSearch = async (input) => {
        setLoading(true);
        setError(null);
        try {
            if (searchType === 'lyrics') {
                if (!input || input.length < 10) {
                    throw new Error('Please enter at least 10 characters of lyrics');
                }
                const response = await api.post('/search/lyrics', { lyrics: input });
                setResults(response.data.matches);
            } else {
                if (!input) {
                    throw new Error('Please select an audio file or record audio');
                }
                const formData = new FormData();
                formData.append('audioType', input === 'mic' ? 'stream' : 'file');
                if (input instanceof File) {
                    formData.append('audio', input);
                } else if (input instanceof Blob) {
                    formData.append('audioData', input);
                }
                const response = await api.post('/search/audio', formData);
                setResults(response.data.matches);
            }
        } catch (error) {
            const errorMessage = error.code === 'ERR_NETWORK' 
                ? 'Server connection failed' 
                : error.response?.data?.message || error.message;
            setError(errorMessage);
            setShowError(true);
            setResults([]);
        }
        setLoading(false);
    };

    const handleRecordingComplete = async (audioBlob) => {
        try {
            await handleSearch(audioBlob);
        } catch (error) {
            setError('Failed to process audio recording');
            setShowError(true);
        } finally {
            setShowRecorder(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ padding: '2rem', marginTop: '2rem' }}>
                <SearchBar 
                    onSearch={input => {
                        if (input === 'mic') {
                            setShowRecorder(true);
                        } else {
                            handleSearch(input);
                        }
                    }}
                    onTypeChange={setSearchType}
                    searchType={searchType}
                />
                {showRecorder && (
                    <AudioRecorder onRecordingComplete={handleRecordingComplete} />
                )}
                <SearchResults 
                    results={results} 
                    loading={loading} 
                    error={error}
                />
            </Paper>
            <Snackbar 
                open={showError} 
                autoHideDuration={6000} 
                onClose={() => setShowError(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setShowError(false)} 
                    severity="error" 
                    sx={{ width: '100%' }}
                    variant="filled"
                >
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default App;
