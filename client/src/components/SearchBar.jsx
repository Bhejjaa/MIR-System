import React from 'react';
import { Input, Select, Button } from 'antd';
import './SearchBar.css';

const SearchBar = ({ onSearch, onTypeChange, searchType }) => {
    return (
        <div className="search-container">
            <Select defaultValue="audio" onChange={onTypeChange}>
                <Select.Option value="audio">Audio Search</Select.Option>
                <Select.Option value="lyrics">Lyrics Search</Select.Option>
            </Select>
            {searchType === 'lyrics' ? (
                <Input.TextArea 
                    placeholder="Enter lyrics..." 
                    onChange={(e) => onSearch(e.target.value)}
                />
            ) : (
                <div className="audio-inputs">
                    <input type="file" accept="audio/*" onChange={(e) => onSearch(e.target.files[0])} />
                    <Button onClick={() => onSearch('mic')}>Record Audio</Button>
                </div>
            )}
        </div>
    );
};

export default SearchBar; 