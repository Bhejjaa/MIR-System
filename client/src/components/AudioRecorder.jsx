import React, { useState, useRef, useEffect } from 'react';
import { Button, message, Progress } from 'antd';
import './AudioRecorder.css';

const MAX_DURATION = 30; // 30 seconds max

const AudioRecorder = ({ onRecordingComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const timerRef = useRef(null);

    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setDuration(prev => {
                    if (prev >= MAX_DURATION) {
                        stopRecording();
                        return 0;
                    }
                    return prev + 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [isRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            
            mediaRecorder.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            mediaRecorder.current.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
                onRecordingComplete(audioBlob);
                audioChunks.current = [];
                setDuration(0);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            message.error('Microphone access denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
            mediaRecorder.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    return (
        <div className="recorder-container">
            <div className="recorder-controls">
                <Button 
                    type={isRecording ? "danger" : "primary"}
                    onClick={isRecording ? stopRecording : startRecording}
                >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
                {isRecording && (
                    <div className="recording-indicator">
                        <Progress 
                            type="circle" 
                            percent={Math.round((duration / MAX_DURATION) * 100)} 
                            format={() => `${MAX_DURATION - duration}s`}
                            size="small"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AudioRecorder; 