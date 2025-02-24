const fs = require('fs');
const path = require('path');

// Maximum age for temporary files (1 hour)
const MAX_FILE_AGE = 3600000;

// Cleanup uploaded files older than MAX_FILE_AGE
exports.cleanupUploads = () => {
    const uploadsDir = path.join(__dirname, '../../uploads');
    
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
                    console.error(`Error getting stats for file ${file}:`, err);
                    return;
                }

                // Check if file is older than MAX_FILE_AGE
                if (now - stats.mtimeMs > MAX_FILE_AGE) {
                    fs.unlink(filePath, err => {
                        if (err) {
                            console.error(`Error deleting file ${file}:`, err);
                            return;
                        }
                        console.log(`Cleaned up old file: ${file}`);
                    });
                }
            });
        });
    });
}; 