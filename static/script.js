
// Home
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});


// Sentiments
// script.js

// Example: Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Example: Sentiment Analysis
document.getElementById('analyzeButton').addEventListener('click', () => {
    const text = document.getElementById('sentimentInput').value;
    
    if (text.trim() === '') {
        alert('Please enter some text for analysis.');
        return;
    }

    // Example API request (replace with your API endpoint)
    fetch('/api/analyze-sentiment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('sentimentResult').innerHTML = `
            <h3>Analysis Result</h3>
            <p><strong>Sentiment:</strong> ${data.sentiment}</p>
            <p><strong>Score:</strong> ${data.score}</p>
            <p><strong>Details:</strong> ${data.details}</p>
        `;
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while analyzing the sentiment.');
    });
});


// Recomandation

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Example: Sentiment Analysis
document.getElementById('analyzeButton')?.addEventListener('click', () => {
    const text = document.getElementById('sentimentInput')?.value;
    
    if (text?.trim() === '') {
        alert('Please enter some text for analysis.');
        return;
    }

// Example API request 
    fetch('/api/analyze-sentiment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('sentimentResult').innerHTML = `
            <h3>Analysis Result</h3>
            <p><strong>Sentiment:</strong> ${data.sentiment}</p>
            <p><strong>Score:</strong> ${data.score}</p>
            <p><strong>Details:</strong> ${data.details}</p>
        `;
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while analyzing the sentiment.');
    });
});
// example
document.getElementById('recommendButton')?.addEventListener('click', () => {
    const preferences = document.getElementById('recommendationInput')?.value;
    
    if (preferences?.trim() === '') {
        alert('Please enter your preferences.');
        return;
    }

    // Example API request (replace with your API endpoint)
    fetch('/api/get-recommendations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('recommendationResult').innerHTML = `
            <h3>Recommendations</h3>
            <ul>
                ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        `;
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while fetching recommendations.');
    });
});

