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
// BPM TEMPO CHECKER APPLICATION
// ========================================
class BPMTempoChecker {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.audioElement = null;
        this.isAnalyzing = false;
        this.initializeElements();
        this.createStars();
        this.bindEvents();
    }

    // Initialize DOM elements
    initializeElements() {
        this.fileInput = document.getElementById('audio-file');
        this.fileInfo = document.getElementById('file-info');
        this.fileName = document.getElementById('file-name');
        this.fileSize = document.getElementById('file-size');
        this.analyzeBtn = document.getElementById('analyze-btn');
        this.playBtn = document.getElementById('play-btn');
        this.resultDisplay = document.getElementById('result-display');
        this.formulaDisplay = document.getElementById('formula-display');
        this.audioControls = document.getElementById('audio-controls');
        this.audioPlayer = document.getElementById('audio-player');
        this.progressText = document.getElementById('progress-text');
        this.resetBtn = document.getElementById('reset-btn');
        this.vinylDisc = document.getElementById('vinyl-disc');
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

    // Initialize Web Audio API
    async initializeAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    // Handle file upload
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Show file info
        this.fileName.textContent = `File: ${file.name}`;
        this.fileSize.textContent = `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
        this.fileInfo.style.display = 'block';

        // Enable buttons
        this.analyzeBtn.disabled = false;
        this.playBtn.disabled = false;

        // Create audio element for playback
        const url = URL.createObjectURL(file);
        this.audioPlayer.src = url;
        this.audioControls.style.display = 'block';

        // Load audio buffer for analysis
        this.loadAudioBuffer(file);
    }

    // Load audio buffer for analysis
    async loadAudioBuffer(file) {
        try {
            await this.initializeAudioContext();
            
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.resultDisplay.textContent = 'Audio loaded! Click "Analyze BPM" to detect tempo.';
        } catch (error) {
            console.error('Error loading audio:', error);
            this.resultDisplay.textContent = 'Error loading audio file. Please try a different format.';
        }
    }

    // Analyze BPM using Web Audio API
    async analyzeBPM() {
        if (!this.audioBuffer || this.isAnalyzing) return;

        this.isAnalyzing = true;
        this.analyzeBtn.disabled = true;
        this.resultDisplay.innerHTML = '<span class="analyzing">Analyzing audio...</span>';

        try {
            await this.initializeAudioContext();
            
            // Get audio data
            const channelData = this.audioBuffer.getChannelData(0);
            const sampleRate = this.audioBuffer.sampleRate;
            
            // Detect BPM using onset detection
            const bpm = await this.detectBPM(channelData, sampleRate);
            
            // Display result
            this.resultDisplay.innerHTML = `<span class="bpm-result">${Math.round(bpm)} BPM</span>`;
            this.formulaDisplay.textContent = `Detected tempo: ${Math.round(bpm)} beats per minute`;
            
        } catch (error) {
            console.error('Error analyzing BPM:', error);
            this.resultDisplay.textContent = 'Error analyzing audio. Please try again.';
        } finally {
            this.isAnalyzing = false;
            this.analyzeBtn.disabled = false;
        }
    }

    // BPM detection algorithm using onset detection
    async detectBPM(channelData, sampleRate) {
        // Downsample for faster processing
        const downsampleFactor = 4;
        const downsampledData = this.downsample(channelData, downsampleFactor);
        const downsampledRate = sampleRate / downsampleFactor;

        // Calculate onset strength
        const onsetStrength = this.calculateOnsetStrength(downsampledData);
        
        // Find peaks in onset strength
        const peaks = this.findPeaks(onsetStrength);
        
        // Calculate intervals between peaks
        const intervals = this.calculateIntervals(peaks, downsampledRate);
        
        // Find most common interval (tempo)
        const bpm = this.calculateBPM(intervals);
        
        return bpm;
    }

    // Downsample audio data
    downsample(data, factor) {
        const result = [];
        for (let i = 0; i < data.length; i += factor) {
            result.push(data[i]);
        }
        return result;
    }

    // Calculate onset strength using spectral flux
    calculateOnsetStrength(data) {
        const windowSize = 1024;
        const hopSize = 512;
        const onsetStrength = [];

        for (let i = 0; i < data.length - windowSize; i += hopSize) {
            const window = data.slice(i, i + windowSize);
            const fft = this.fft(window);
            const magnitude = fft.map(complex => Math.sqrt(complex.real * complex.real + complex.imag * complex.imag));
            
            if (onsetStrength.length > 0) {
                const flux = magnitude.reduce((sum, mag, idx) => {
                    const diff = mag - (onsetStrength[onsetStrength.length - 1].magnitude[idx] || 0);
                    return sum + Math.max(0, diff);
                }, 0);
                onsetStrength.push({ flux, magnitude });
            } else {
                onsetStrength.push({ flux: 0, magnitude });
            }
        }

        return onsetStrength.map(frame => frame.flux);
    }

    // Simple FFT implementation
    fft(data) {
        const N = data.length;
        const result = [];
        
        for (let k = 0; k < N; k++) {
            let real = 0;
            let imag = 0;
            
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                real += data[n] * Math.cos(angle);
                imag += data[n] * Math.sin(angle);
            }
            
            result.push({ real, imag });
        }
        
        return result;
    }

    // Find peaks in onset strength
    findPeaks(data) {
        const peaks = [];
        const threshold = Math.max(...data) * 0.3;
        
        for (let i = 1; i < data.length - 1; i++) {
            if (data[i] > threshold && data[i] > data[i - 1] && data[i] > data[i + 1]) {
                peaks.push(i);
            }
        }
        
        return peaks;
    }

    // Calculate intervals between peaks
    calculateIntervals(peaks, sampleRate) {
        const intervals = [];
        
        for (let i = 1; i < peaks.length; i++) {
            const interval = (peaks[i] - peaks[i - 1]) / sampleRate;
            if (interval > 0.1 && interval < 4.0) { // Reasonable tempo range
                intervals.push(interval);
            }
        }
        
        return intervals;
    }

    // Calculate BPM from intervals
    calculateBPM(intervals) {
        if (intervals.length === 0) return 120; // Default BPM
        
        // Find most common interval
        const intervalCounts = {};
        intervals.forEach(interval => {
            const rounded = Math.round(interval * 10) / 10;
            intervalCounts[rounded] = (intervalCounts[rounded] || 0) + 1;
        });
        
        const mostCommonInterval = Object.keys(intervalCounts).reduce((a, b) => 
            intervalCounts[a] > intervalCounts[b] ? a : b
        );
        
        return 60 / parseFloat(mostCommonInterval);
    }

    // Play audio
    playAudio() {
        if (this.audioPlayer.paused) {
            this.audioPlayer.play();
            this.playBtn.textContent = 'Pause Audio';
            this.startVinylSpinning();
        } else {
            this.audioPlayer.pause();
            this.playBtn.textContent = 'Play Audio';
            this.stopVinylSpinning();
        }
    }

    // Start vinyl disc spinning
    startVinylSpinning() {
        if (this.vinylDisc) {
            this.vinylDisc.classList.add('spinning');
        }
    }

    // Stop vinyl disc spinning
    stopVinylSpinning() {
        if (this.vinylDisc) {
            this.vinylDisc.classList.remove('spinning');
        }
    }

    // Update progress display
    updateProgress() {
        const current = this.formatTime(this.audioPlayer.currentTime);
        const duration = this.formatTime(this.audioPlayer.duration);
        this.progressText.textContent = `${current} / ${duration}`;
    }

    // Format time in MM:SS
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Reset application
    reset() {
        this.fileInput.value = '';
        this.fileInfo.style.display = 'none';
        this.audioControls.style.display = 'none';
        this.analyzeBtn.disabled = true;
        this.playBtn.disabled = true;
        this.resultDisplay.textContent = 'Upload an audio file to analyze its BPM';
        this.formulaDisplay.textContent = 'BPM (Beats Per Minute) represents the tempo of your music';
        this.audioPlayer.pause();
        this.audioPlayer.src = '';
        this.audioBuffer = null;
        this.isAnalyzing = false;
        this.stopVinylSpinning();
    }

    // Bind all event listeners
    bindEvents() {
        // File upload
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Analysis button
        this.analyzeBtn.addEventListener('click', () => this.analyzeBPM());
        
        // Play button
        this.playBtn.addEventListener('click', () => this.playAudio());
        
        // Reset button
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Audio progress updates
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('loadedmetadata', () => this.updateProgress());
        
        // Audio end events
        this.audioPlayer.addEventListener('ended', () => {
            this.playBtn.textContent = 'Play Audio';
            this.stopVinylSpinning();
        });
        
        this.audioPlayer.addEventListener('pause', () => {
            this.playBtn.textContent = 'Play Audio';
            this.stopVinylSpinning();
        });
        
        this.audioPlayer.addEventListener('play', () => {
            this.playBtn.textContent = 'Pause Audio';
            this.startVinylSpinning();
        });
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
        new BPMTempoChecker();
    }
});