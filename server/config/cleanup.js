const fs = require('fs');
const path = require('path');

const cleanupUploads = () => {
    const uploadsDir = path.join(__dirname, '../uploads');
    
    // Delete files older than 1 hour
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            console.error('Error reading uploads directory:', err);
            return;
        }

        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    return;
                }

                if (now - stats.mtimeMs > 3600000) { // 1 hour
                    fs.unlink(filePath, err => {
                        if (err) console.error('Error deleting file:', err);
                    });
                }
            });
        });
    });
};

module.exports = cleanupUploads; 