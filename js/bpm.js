// BPM Tempo Checker page only
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

    async initializeAudioContext() {
        if (!this.audioContext) this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioContext.state === 'suspended') await this.audioContext.resume();
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        this.fileName.textContent = `File: ${file.name}`;
        this.fileSize.textContent = `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
        this.fileInfo.style.display = 'block';
        this.analyzeBtn.disabled = false;
        this.playBtn.disabled = false;
        const url = URL.createObjectURL(file);
        this.audioPlayer.src = url;
        this.audioControls.style.display = 'block';
        this.loadAudioBuffer(file);
    }

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

    async analyzeBPM() {
        if (!this.audioBuffer || this.isAnalyzing) return;
        this.isAnalyzing = true;
        this.analyzeBtn.disabled = true;
        this.resultDisplay.innerHTML = '<span class="analyzing">Analyzing audio...</span>';
        try {
            await this.initializeAudioContext();
            const channelData = this.audioBuffer.getChannelData(0);
            const sampleRate = this.audioBuffer.sampleRate;
            const bpm = await this.detectBPM(channelData, sampleRate);
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

    async detectBPM(channelData, sampleRate) {
        const downsampleFactor = 4;
        const downsampledData = this.downsample(channelData, downsampleFactor);
        const downsampledRate = sampleRate / downsampleFactor;
        const onsetStrength = this.calculateOnsetStrength(downsampledData);
        const peaks = this.findPeaks(onsetStrength);
        const intervals = this.calculateIntervals(peaks, downsampledRate);
        return this.calculateBPM(intervals);
    }

    downsample(data, factor) { const result = []; for (let i = 0; i < data.length; i += factor) result.push(data[i]); return result; }

    calculateOnsetStrength(data) {
        const windowSize = 1024, hopSize = 512, onsetStrength = [];
        for (let i = 0; i < data.length - windowSize; i += hopSize) {
            const window = data.slice(i, i + windowSize);
            const fft = this.fft(window);
            const magnitude = fft.map(c => Math.sqrt(c.real * c.real + c.imag * c.imag));
            if (onsetStrength.length > 0) {
                const flux = magnitude.reduce((sum, mag, idx) => { const diff = mag - (onsetStrength[onsetStrength.length - 1].magnitude[idx] || 0); return sum + Math.max(0, diff); }, 0);
                onsetStrength.push({ flux, magnitude });
            } else {
                onsetStrength.push({ flux: 0, magnitude });
            }
        }
        return onsetStrength.map(f => f.flux);
    }

    fft(data) {
        const N = data.length, result = [];
        for (let k = 0; k < N; k++) {
            let real = 0, imag = 0;
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                real += data[n] * Math.cos(angle);
                imag += data[n] * Math.sin(angle);
            }
            result.push({ real, imag });
        }
        return result;
    }

    findPeaks(data) {
        const peaks = [], threshold = Math.max(...data) * 0.3;
        for (let i = 1; i < data.length - 1; i++) if (data[i] > threshold && data[i] > data[i-1] && data[i] > data[i+1]) peaks.push(i);
        return peaks;
    }

    calculateIntervals(peaks, sampleRate) {
        const intervals = [];
        for (let i = 1; i < peaks.length; i++) {
            const interval = (peaks[i] - peaks[i - 1]) / sampleRate;
            if (interval > 0.1 && interval < 4.0) intervals.push(interval);
        }
        return intervals;
    }

    calculateBPM(intervals) {
        if (intervals.length === 0) return 120;
        const counts = {};
        intervals.forEach(interval => { const r = Math.round(interval * 10) / 10; counts[r] = (counts[r] || 0) + 1; });
        const mostCommon = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        return 60 / parseFloat(mostCommon);
    }

    playAudio() {
        if (this.audioPlayer.paused) { this.audioPlayer.play(); this.playBtn.textContent = 'Pause Audio'; this.startVinylSpinning(); }
        else { this.audioPlayer.pause(); this.playBtn.textContent = 'Play Audio'; this.stopVinylSpinning(); }
    }
    startVinylSpinning() { if (this.vinylDisc) this.vinylDisc.classList.add('spinning'); }
    stopVinylSpinning() { if (this.vinylDisc) this.vinylDisc.classList.remove('spinning'); }
    updateProgress() { const current = this.formatTime(this.audioPlayer.currentTime); const duration = this.formatTime(this.audioPlayer.duration); this.progressText.textContent = `${current} / ${duration}`; }
    formatTime(seconds) { if (isNaN(seconds)) return '0:00'; const mins = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60); return `${mins}:${secs.toString().padStart(2,'0')}`; }
    reset() { this.fileInput.value = ''; this.fileInfo.style.display = 'none'; this.audioControls.style.display = 'none'; this.analyzeBtn.disabled = true; this.playBtn.disabled = true; this.resultDisplay.textContent = 'Upload an audio file to analyze its BPM'; this.formulaDisplay.textContent = 'BPM (Beats Per Minute) represents the tempo of your music'; this.audioPlayer.pause(); this.audioPlayer.src=''; this.audioBuffer = null; this.isAnalyzing=false; this.stopVinylSpinning(); }
    bindEvents() {
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.analyzeBtn.addEventListener('click', () => this.analyzeBPM());
        this.playBtn.addEventListener('click', () => this.playAudio());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('loadedmetadata', () => this.updateProgress());
        this.audioPlayer.addEventListener('ended', () => { this.playBtn.textContent = 'Play Audio'; this.stopVinylSpinning(); });
        this.audioPlayer.addEventListener('pause', () => { this.playBtn.textContent = 'Play Audio'; this.stopVinylSpinning(); });
        this.audioPlayer.addEventListener('play', () => { this.playBtn.textContent = 'Pause Audio'; this.startVinylSpinning(); });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('converter-page')) new BPMTempoChecker();
});


