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
    resultEditor: document.getElementById('result-editor'), // Changed from resultText
    copyBtn: document.getElementById('copy-btn'),
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
        this.resultEditor.innerHTML = ''; // Clear the editor
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
     * Displays the final OCR result in the code-like editor.
     * @param {string} text - The extracted text.
     */
    displayResult(text) {
        this.statusContainer.classList.add('hidden');
        this.resultContainer.classList.remove('hidden');
        this.resultEditor.innerHTML = ''; // Clear previous content

        const lineNumbersCol = document.createElement('div');
        lineNumbersCol.className = 'line-numbers';

        const codeContentCol = document.createElement('div');
        codeContentCol.className = 'code-content';

        const lines = text.trim().split('\n');

        lines.forEach((line, index) => {
            const numberEl = document.createElement('div');
            numberEl.textContent = index + 1;
            lineNumbersCol.appendChild(numberEl);

            const codeEl = document.createElement('div');
            codeEl.className = 'code-line';
            // Use a non-breaking space for empty lines to ensure height is maintained
            codeEl.textContent = line || '\u00A0'; 
            codeContentCol.appendChild(codeEl);
        });

        this.resultEditor.appendChild(lineNumbersCol);
        this.resultEditor.appendChild(codeContentCol);
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
            // Reconstruct text from the code editor divs for copying
            const lines = Array.from(this.resultEditor.querySelectorAll('.code-line'));
            const textToCopy = lines.map(line => line.textContent.replace(/\u00A0/g, '')).join('\n');

            navigator.clipboard.writeText(textToCopy).then(() => {
                const copySpan = this.copyBtn.lastElementChild;
                copySpan.textContent = 'Copied!';
                setTimeout(() => { copySpan.textContent = 'Copy'; }, 2000);
            });
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
