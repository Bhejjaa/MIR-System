const cosinesim = require('cosine-similarity');

exports.calculateFeatureSimilarity = (feature1, feature2) => {
    if (!feature1 || !feature2) return 0;
    
    try {
        // Flatten arrays if needed
        const f1 = Array.isArray(feature1[0]) ? feature1.flat() : feature1;
        const f2 = Array.isArray(feature2[0]) ? feature2.flat() : feature2;
        
        return cosinesim(f1, f2);
    } catch (error) {
        console.error('Error calculating feature similarity:', error);
        return 0;
    }
};

exports.calculateThemeOverlap = (themes1, themes2) => {
    if (!themes1 || !themes2) return 0;
    
    const set1 = new Set(themes1);
    const set2 = new Set(themes2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    return intersection.size / Math.max(set1.size, set2.size);
};

exports.normalizeFeatures = (features) => {
    if (!features || !Array.isArray(features)) return [];
    
    const mean = features.reduce((a, b) => a + b, 0) / features.length;
    const std = Math.sqrt(features.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / features.length);
    
    return features.map(x => (x - mean) / (std || 1));
};

function calculateCosineSimilarity(vec1, vec2) {
    const flatVec1 = Array.isArray(vec1[0]) ? vec1.flat() : vec1;
    const flatVec2 = Array.isArray(vec2[0]) ? vec2.flat() : vec2;
    
    return calculateFeatureSimilarity(flatVec1, flatVec2);
} 