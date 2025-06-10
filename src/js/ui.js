export const UI = {
    // DOM Element Cache
    body: document.body,
    themeToggle: document.getElementById('theme-toggle'),
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    langSelect: document.getElementById('lang-select'),
    statusContainer: document.getElementById('status-container'),
    statusText: document.getElementById('status-text'),
    progressBar: document.getElementById('progress-bar'),
    resultContainer: document.getElementById('result-container'),
    resultText: document.getElementById('result-text'),
    copyBtn: document.getElementById('copy-btn'),
    downloadBtn: document.getElementById('download-btn'),
    errorContainer: document.getElementById('error-container'),
    errorText: document.getElementById('error-text'),

    /**
     * Toggles the theme between light and dark mode.
     */
    toggleTheme() {
        this.body.classList.toggle('dark-theme');
        this.body.classList.toggle('light-theme');
        const isDark = this.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    },

    /**
     * Loads the saved theme from localStorage.
     */
    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.body.classList.replace('light-theme', 'dark-theme');
        }
    },

    /**
     * Resets the UI to its initial state.
     */
    reset() {
        this.statusContainer.classList.add('hidden');
        this.resultContainer.classList.add('hidden');
        this.errorContainer.classList.add('hidden');
        this.progressBar.style.width = '0%';
        this.resultText.value = '';
        this.copyBtn.lastElementChild.textContent = 'Copy';
    },

    /**
     * Updates the progress bar and status text.
     * @param {string} status - The status message to display.
     * @param {number} progress - The progress value (0 to 1).
     */
    updateProgress(status, progress) {
        this.statusContainer.classList.remove('hidden');
        this.errorContainer.classList.add('hidden');
        this.resultContainer.classList.add('hidden');
        this.statusText.textContent = status;
        this.progressBar.style.width = `${Math.round(progress * 100)}%`;
    },

    /**
     * Displays the final OCR result.
     * @param {string} text - The extracted text.
     */
    displayResult(text) {
        this.statusContainer.classList.add('hidden');
        this.resultContainer.classList.remove('hidden');
        this.resultText.value = text.trim();
    },

    /**
     * Displays an error message.
     * @param {string} message - The error message to display.
     */
    displayError(message) {
        this.statusContainer.classList.add('hidden');
        this.errorContainer.classList.remove('hidden');
        this.errorText.textContent = message;
    },

    /**
     * Sets up all necessary event listeners for the UI.
     */
    setupEventListeners() {
        // Theme toggling
        this.loadTheme();
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Copy button
        this.copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(this.resultText.value).then(() => {
                const copySpan = this.copyBtn.lastElementChild;
                copySpan.textContent = 'Copied!';
                setTimeout(() => { copySpan.textContent = 'Copy'; }, 2000);
            });
        });

        // Download button
        this.downloadBtn.addEventListener('click', () => {
            const text = this.resultText.value;
            if (!text) return;

            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'omniocr_output.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        
        this.dropZone.addEventListener('dragenter', () => this.dropZone.classList.add('drag-over'));
        this.dropZone.addEventListener('dragover', () => this.dropZone.classList.add('drag-over'));
        this.dropZone.addEventListener('dragleave', () => this.dropZone.classList.remove('drag-over'));
        this.dropZone.addEventListener('drop', (e) => {
            this.dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                this.fileInput.files = e.dataTransfer.files;
                this.fileInput.dispatchEvent(new Event('change'));
            }
        });
    }
};
