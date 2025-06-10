export const UI = {
    // DOM Element Cache
    body: document.body,
    themeToggle: document.getElementById('theme-toggle'),
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    subtitle: document.getElementById('subtitle'),
    
    // Custom Select elements
    customSelect: document.getElementById('custom-lang-select'),
    selectedLangText: document.getElementById('selected-lang-text'),
    langOptions: document.getElementById('lang-options'),
    
    // Status and Result elements
    statusContainer: document.getElementById('status-container'),
    statusText: document.getElementById('status-text'),
    progressBar: document.getElementById('progress-bar'),
    resultContainer: document.getElementById('result-container'),
    resultEditor: document.getElementById('result-editor'),
    copyBtn: document.getElementById('copy-btn'),
    errorContainer: document.getElementById('error-container'),
    errorText: document.getElementById('error-text'),

    // --- Core Methods ---
    
    reset() {
        this.hide(this.statusContainer);
        this.hide(this.resultContainer);
        this.hide(this.errorContainer);
        this.statusText.textContent = 'Processing...';
        this.progressBar.style.width = '0%';
        this.resultEditor.innerHTML = '';
        this.copyBtn.lastElementChild.textContent = 'Copy';
        this.subtitle.textContent = 'Extract text from images and PDFs directly in your browser.';
    },

    updateProgress(status, progress) {
        this.hide(this.resultContainer);
        this.hide(this.errorContainer);
        this.show(this.statusContainer);
        this.statusText.textContent = status;
        this.progressBar.style.width = `${Math.round(progress * 100)}%`;
    },

    displayResult(text) {
        this.hide(this.statusContainer);
        this.show(this.resultContainer);
        this.resultEditor.innerHTML = '';

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
            codeEl.textContent = line || '\u00A0';
            codeContentCol.appendChild(codeEl);
        });

        this.resultEditor.appendChild(lineNumbersCol);
        this.resultEditor.appendChild(codeContentCol);
    },

    displayError(message) {
        this.hide(this.statusContainer);
        this.hide(this.resultContainer);
        this.show(this.errorContainer);
        this.errorText.textContent = message;
    },

    // --- Smart Subtitle Guide ---
    showSubtitlePrompt(message) {
        this.hide(this.resultContainer);
        this.hide(this.errorContainer);
        this.show(this.statusContainer);
        this.statusText.textContent = message;
        this.progressBar.style.width = '0%';
    },

    // --- UI Helpers ---
    show(element) {
        element.classList.remove('hidden');
    },

    hide(element) {
        element.classList.add('hidden');
    },

    // --- Event Listeners Setup ---
    setupEventListeners() {
        this.loadTheme();
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Custom Select Logic
        this.customSelect.addEventListener('click', () => {
            this.langOptions.classList.toggle('hidden');
            this.customSelect.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!this.customSelect.contains(e.target)) {
                this.langOptions.classList.add('hidden');
                this.customSelect.classList.remove('open');
            }
        });

        this.langOptions.addEventListener('click', (e) => {
            if (e.target && e.target.tagName === 'LI') {
                const value = e.target.getAttribute('data-value');
                this.selectedLangText.textContent = e.target.textContent;
                this.customSelect.setAttribute('data-value', value);
                localStorage.setItem('selectedLang', value);
                this.langOptions.querySelector('.selected')?.classList.remove('selected');
                e.target.classList.add('selected');
            }
        });
        
        // Copy button
        this.copyBtn.addEventListener('click', () => {
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
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                this.fileInput.files = e.dataTransfer.files;
                this.fileInput.dispatchEvent(new Event('change'));
            }
        });
    },

    // --- Preference Management ---
    toggleTheme() {
        this.body.classList.toggle('dark-theme');
        this.body.classList.toggle('light-theme');
        localStorage.setItem('theme', this.body.classList.contains('dark-theme') ? 'dark' : 'light');
    },

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.body.classList.replace('light-theme', 'dark-theme');
        }
    },

    loadLanguagePreference() {
        const savedLang = localStorage.getItem('selectedLang') || 'eng';
        const option = this.langOptions.querySelector(`li[data-value="${savedLang}"]`);
        if (option) {
            this.selectedLangText.textContent = option.textContent;
            this.customSelect.setAttribute('data-value', savedLang);
            option.classList.add('selected');
        }
    },
    
    getSelectedLanguage() {
        return this.customSelect.getAttribute('data-value') || 'eng';
    }
};
