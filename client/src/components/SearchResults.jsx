import React from 'react';
import { List, Card, Tag, Alert, Descriptions } from 'antd';
import './SearchResults.css';
import './LoadingAnimations.css';

const LoadingWave = () => (
    <div className="loading-wave">
        <span></span>
        <span></span>
        <span></span>
    </div>
);

const SearchResults = ({ results = [], loading, error }) => {
    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <LoadingWave />
                <p>Analyzing audio patterns...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                style={{ marginTop: '1rem' }}
            />
        );
    }

    return (
        <div className="results-container">
            {results.length === 0 ? (
                <Alert
                    message="No matches found"
                    type="info"
                    showIcon
                    style={{ marginTop: '1rem' }}
                />
            ) : (
                <>
                    <List
                        dataSource={results}
                        renderItem={song => (
                            <Card style={{ marginBottom: '1rem' }}>
                                <Descriptions title={song.title} bordered>
                                    <Descriptions.Item label="Artist">{song.artist}</Descriptions.Item>
                                    <Descriptions.Item label="Album">{song.album}</Descriptions.Item>
                                    <Descriptions.Item label="Year">{song.year}</Descriptions.Item>
                                    <Descriptions.Item label="Genre">{song.genres?.primary}</Descriptions.Item>
                                    <Descriptions.Item label="Match Confidence">
                                        {Math.round(song.confidence * 100)}%
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        )}
                    />
                </>
            )}
        </div>
    );
};

export default SearchResults; 