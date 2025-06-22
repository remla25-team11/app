const API_BASE_URL = window.APP_SERVICE_URL || '/api';
console.log("API_BASE_URL = ", API_BASE_URL);

const ENDPOINTS = {
    appVersion: '/version',
    modelVersion: '/model_version',
    analyze: '/analyze',
    feedback: '/feedback'
};

// DOM Elements
const elements = {
    appVersion: document.getElementById('app-version'),
    modelVersion: document.getElementById('model-version'),
    reviewInput: document.getElementById('review-input'),
    submitBtn: document.getElementById('submit-btn'),
    clearBtn: document.getElementById('clear-btn'),
    resultContainer: document.getElementById('result-container'),
    sentimentEmoji: document.getElementById('sentiment-emoji'),
    sentimentText: document.getElementById('sentiment-text'),
    correctBtn: document.getElementById('correct-btn'),
    incorrectBtn: document.getElementById('incorrect-btn'),
    charCounter: document.getElementById('char-counter')
};

const connectionStatus = document.getElementById('connection-status');

let requestQueue = JSON.parse(localStorage.getItem('requestQueue') || '[]');

function queueRequest(endpoint, method, data, onSuccess) {
    requestQueue.push({ endpoint, method, data });
    localStorage.setItem('requestQueue', JSON.stringify(requestQueue));
    console.warn(`Queued to: ${endpoint}`);
    if (onSuccess) onSuccess({ queued: true });
}

let cnt = 5;

setInterval(async () => {
    if (requestQueue.length === 0) {
        connectionStatus.classList.add('hidden');
        return;
    }

    const { endpoint, method, data } = requestQueue[0];

    connectionStatus.classList.remove('hidden');
    connectionStatus.textContent = `Offline: retrying in ${cnt} second(s)...`;

    if (cnt != 0) {
        cnt--;
        return;
    }

    cnt = 5;

    const result = await fetchFromAPI(endpoint, method, data);

    if (!result.error) {
        if (endpoint === ENDPOINTS.analyze) {
            updateUIWithSentiment(result);
        }

        requestQueue.shift();
        localStorage.setItem('requestQueue', JSON.stringify(requestQueue));

        connectionStatus.textContent = `Successful: ${endpoint}`;
        setTimeout(() => {
            connectionStatus.classList.add('hidden');
        }, 3000);
    } else {
        connectionStatus.textContent = `Attempt failed. Next attempt in ${cnt} second(s)...`;
        console.warn(`Attempt failed for: ${endpoint}`);
    }
}, 1000);

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
            connectionStatus.classList.remove('hidden');
            throw new Error(`API responded with status: ${response.status}\nURL: ${API_BASE_URL}${endpoint}`);
        }
        connectionStatus.classList.add('hidden');
        return await response.json();
    } catch (error) {
        connectionStatus.classList.remove('hidden');
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

    const package = { text: reviewText };

    try {
        const result = await fetchFromAPI(ENDPOINTS.analyze, 'POST', {
            text: reviewText
        });

        if (result.error) {
            queueRequest(ENDPOINTS.analyze, 'POST', package, () => {
                displayError('ERROR: Offline');
            });
        } else {
            updateUIWithSentiment(result);
        }
    } catch (error) {
         queueRequest(ENDPOINTS.analyze, 'POST', package, () => {
            displayError('ERROR: Offline');
        });
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

function clearInput() {
    elements.reviewInput.value = '';
    elements.sentimentEmoji.textContent = '😐';
    elements.sentimentText.textContent = 'No analysis yet';
    currentAnalysis = null;
}

// Initialize application
async function initApp() {
    try {
        // app version
        const appVersionData = await fetchFromAPI(ENDPOINTS.appVersion);
        if (appVersionData.error) {
            connectionStatus.classList.remove('hidden');
        } else {
            connectionStatus.classList.add('hidden');
            elements.appVersion.textContent = `App Version: ${appVersionData.version}`;
        }

        // model version
        const modelVersionData = await fetchFromAPI(ENDPOINTS.modelVersion);
        console.log(modelVersionData);
        if (!modelVersionData.error) {
            elements.modelVersion.textContent = `Model Version: ${modelVersionData.version}`;
        }
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

elements.reviewInput.addEventListener('input', () => {
    const len = elements.reviewInput.value.length;
    if (len > 50) {
        elements.charCounter.textContent = "Bro... You are yapping a lot!";
        elements.charCounter.style.color = '#ff0000';
    } else {
        elements.charCounter.textContent = `${len}/50`;
        elements.charCounter.style.color = '#000';
    }
});

elements.clearBtn.addEventListener('click', clearInput);
elements.submitBtn.addEventListener('click', handleSubmit);
elements.correctBtn.addEventListener('click', () => handleFeedback(true));
elements.incorrectBtn.addEventListener('click', () => handleFeedback(false));
elements.reviewInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        handleSubmit();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initApp();

    const darkToggle = document.getElementById('dark-toggle');
    if (darkToggle) {
        darkToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode', darkToggle.checked);
            fetch('/api/metrics/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toggled: darkToggle.checked })
            });
        });
    }

  
    fetch(`${API_BASE_URL}/metrics/visit`, {
        method: "POST"
    }).catch(error => {
        console.log('Visitor tracking failed:', error);
    });
});


  