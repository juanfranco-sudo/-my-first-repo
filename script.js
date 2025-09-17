// ========================================
// INDEX PAGE FUNCTIONALITY
// ========================================
class IndexPageManager {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.initializeAnimations();
    }

    initializeElements() {
        this.content = document.querySelector('.index-content');
    }

    bindEvents() {
        // Smooth scroll animation for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    initializeAnimations() {
        // Add subtle animation on page load
        if (this.content) {
            setTimeout(() => {
                this.content.classList.add('loaded');
            }, 100);
        }
    }
}

// ========================================
// TEMPERATURE CONVERTER APPLICATION
// ========================================
class TemperatureConverter {
    constructor() {
        this.isCelsiusMode = true;
        this.initializeElements();
        this.createStars();
        this.bindEvents();
        this.updateMode();
    }

    // Initialize DOM elements
    initializeElements() {
        this.temperatureInput = document.getElementById('temperature-input');
        this.resultDisplay = document.getElementById('result-display');
        this.formulaDisplay = document.getElementById('formula-display');
        this.inputLabel = document.getElementById('input-label');
        this.celsiusToFahrenheitBtn = document.getElementById('celsius-to-fahrenheit');
        this.fahrenheitToCelsiusBtn = document.getElementById('fahrenheit-to-celsius');
        this.switchModeBtn = document.getElementById('switch-mode');
    }

    // Create animated stars background
    createStars() {
        const starsContainer = document.getElementById('stars');
        const numStars = 100;
        
        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.width = Math.random() * 3 + 1 + 'px';
            star.style.height = star.style.width;
            star.style.animationDelay = Math.random() * 2 + 's';
            starsContainer.appendChild(star);
        }
    }

    // Conversion functions
    celsiusToFahrenheit(celsius) {
        return (celsius * 9/5) + 32;
    }

    fahrenheitToCelsius(fahrenheit) {
        return (fahrenheit - 32) * 5/9;
    }

    // Update UI based on current mode
    updateMode() {
        if (this.isCelsiusMode) {
            this.inputLabel.textContent = 'Celsius';
            this.temperatureInput.placeholder = 'Enter Celsius temperature';
            this.formulaDisplay.textContent = 'Formula: °F = (°C × 9/5) + 32';
        } else {
            this.inputLabel.textContent = 'Fahrenheit';
            this.temperatureInput.placeholder = 'Enter Fahrenheit temperature';
            this.formulaDisplay.textContent = 'Formula: °C = (°F - 32) × 5/9';
        }
    }

    // Convert temperature based on current mode
    convertTemperature() {
        const inputValue = parseFloat(this.temperatureInput.value);
        
        if (isNaN(inputValue)) {
            this.resultDisplay.textContent = 'Please enter a valid number';
            return;
        }
        
        let result, unit;
        
        if (this.isCelsiusMode) {
            result = this.celsiusToFahrenheit(inputValue);
            unit = '°F';
            this.resultDisplay.innerHTML = `${inputValue}°C = <span style="color: #ff00ff;">${result.toFixed(2)}${unit}</span>`;
        } else {
            result = this.fahrenheitToCelsius(inputValue);
            unit = '°C';
            this.resultDisplay.innerHTML = `${inputValue}°F = <span style="color: #ff00ff;">${result.toFixed(2)}${unit}</span>`;
        }
    }

    // Switch between Celsius and Fahrenheit mode
    switchMode() {
        this.isCelsiusMode = !this.isCelsiusMode;
        this.updateMode();
        this.temperatureInput.value = '';
        this.resultDisplay.textContent = 'Result will appear here';
    }

    // Set mode to Celsius
    setCelsiusMode() {
        this.isCelsiusMode = true;
        this.updateMode();
        this.convertTemperature();
    }

    // Set mode to Fahrenheit
    setFahrenheitMode() {
        this.isCelsiusMode = false;
        this.updateMode();
        this.convertTemperature();
    }

    // Handle Enter key press
    handleKeyPress(event) {
        if (event.key === 'Enter') {
            this.convertTemperature();
        }
    }

    // Bind all event listeners
    bindEvents() {
        // Conversion button events
        this.celsiusToFahrenheitBtn.addEventListener('click', () => this.setCelsiusMode());
        this.fahrenheitToCelsiusBtn.addEventListener('click', () => this.setFahrenheitMode());
        
        // Switch mode button event
        this.switchModeBtn.addEventListener('click', () => this.switchMode());
        
        // Input events
        this.temperatureInput.addEventListener('input', () => this.convertTemperature());
        this.temperatureInput.addEventListener('keypress', (e) => this.handleKeyPress(e));
    }
}

// ========================================
// APPLICATION INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Check which page we're on and initialize accordingly
    if (document.body.classList.contains('index-page')) {
        new IndexPageManager();
    } else if (document.body.classList.contains('converter-page')) {
        new TemperatureConverter();
    }
});
