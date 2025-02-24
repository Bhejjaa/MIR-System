const fs = require('fs');
const path = require('path');

const cleanupFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error(`Error cleaning up file ${filePath}:`, error);
    }
};

module.exports = { cleanupFile }; 