const API_BASE_URL = window.APP_SERVICE_URL || 'http://localhost:8080';
const ENDPOINTS = {
    appVersion: '/version',
    modelVersion: '/model/version',
    analyze: '/analyze'
};

// DOM Elements
const elements = {
    appVersion: document.getElementById('app-version'),
    modelVersion: document.getElementById('model-version'),
    reviewInput: document.getElementById('review-input'),
    submitBtn: document.getElementById('submit-btn'),
    resultContainer: document.getElementById('result-container'),
    sentimentEmoji: document.getElementById('sentiment-emoji'),
    sentimentText: document.getElementById('sentiment-text'),
    correctBtn: document.getElementById('correct-btn'),
    incorrectBtn: document.getElementById('incorrect-btn')
};


let currentAnalysis = null;

async function fetchFromAPI(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return { error: error.message };
    }
}

function updateUIWithSentiment(sentiment) {
    // Store current analysis in state
    currentAnalysis = sentiment;

    // Update UI
    if (sentiment.score > 0.6) {
        elements.sentimentEmoji.textContent = '😃';
        elements.sentimentText.textContent = 'Positive';
        elements.sentimentText.style.color = '#2ecc71';
    } else if (sentiment.score < 0.4) {
        elements.sentimentEmoji.textContent = '😞';
        elements.sentimentText.textContent = 'Negative';
        elements.sentimentText.style.color = '#e74c3c';
    } else {
        elements.sentimentEmoji.textContent = '😐';
        elements.sentimentText.textContent = 'Neutral';
        elements.sentimentText.style.color = '#f39c12';
    }
}

function displayError(message) {
    elements.sentimentEmoji.textContent = '❌';
    elements.sentimentText.textContent = message || 'Error processing request';
    elements.sentimentText.style.color = '#e74c3c';
}

// Event handlers
async function handleSubmit() {
    const reviewText = elements.reviewInput.value.trim();

    if (!reviewText) {
        alert('Please enter a review first!');
        return;
    }

    // Show loading state
    elements.submitBtn.disabled = true;
    elements.submitBtn.innerHTML = '<span class="loading"></span> Analyzing...';

    try {
        const result = await fetchFromAPI(ENDPOINTS.analyze, 'POST', {
            text: reviewText
        });

        if (result.error) {
            displayError(result.error);
        } else {
            updateUIWithSentiment(result);
        }
    } catch (error) {
        displayError('Failed to analyze text');
        console.error(error);
    } finally {
        elements.submitBtn.disabled = false;
        elements.submitBtn.textContent = 'Analyze Sentiment';
    }
}

// send feedback to app service
function handleFeedback(isCorrect) {
    if (!currentAnalysis) return;

    fetchFromAPI('/feedback', 'POST', {
        analysisId: currentAnalysis.id,
        text: elements.reviewInput.value,
        predictedSentiment: currentAnalysis.sentiment,
        isCorrect: isCorrect
    }).then(response => {
        alert(isCorrect ? 'Thank you for confirming!' : 'Thank you for your feedback!');
    }).catch(error => {
        console.error('Error sending feedback:', error);
    });
}

// Initialize application
async function initApp() {
    try {
        // app version
        const appVersionData = await fetchFromAPI(ENDPOINTS.appVersion);
        if (!appVersionData.error) {
            elements.appVersion.textContent = `App Version: ${appVersionData.version}`;
        }

        // model version
        const modelVersionData = await fetchFromAPI(ENDPOINTS.modelVersion);
        if (!modelVersionData.error) {
            elements.modelVersion.textContent = `Model Version: ${modelVersionData.version}`;
        }
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}


elements.submitBtn.addEventListener('click', handleSubmit);
elements.correctBtn.addEventListener('click', () => handleFeedback(true));
elements.incorrectBtn.addEventListener('click', () => handleFeedback(false));
elements.reviewInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        handleSubmit();
    }
});

document.addEventListener('DOMContentLoaded', initApp);