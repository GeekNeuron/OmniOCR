import { languages } from './languages.js';

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
    langOptionsPanel: document.getElementById('lang-options-panel'),
    langOptionsList: document.getElementById('lang-options-list'),
    langSearchInput: document.getElementById('lang-search-input'),
    
    // Advanced Mode
    advancedToggle: document.getElementById('advanced-toggle-switch'),
    
    // Status and Result elements
    statusContainer: document.getElementById('status-container'),
    statusText: document.getElementById('status-text'),
    progressBar: document.getElementById('progress-bar'),
    resultContainer: document.getElementById('result-container'),
    resultEditor: document.getElementById('result-editor'),
    copyBtn: document.getElementById('copy-btn'),
    downloadBtn: document.getElementById('download-btn'),
    downloadBtnText: document.getElementById('download-btn-text'),
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
        this.downloadBtnText.textContent = 'Download';
        this.updateSubtitle();
    },

    updateProgress(status, progress) {
        this.hide(this.resultContainer);
        this.hide(this.errorContainer);
        this.show(this.statusContainer);
        this.statusText.textContent = status;
        this.progressBar.style.width = `${Math.round(progress * 100)}%`;
    },

    displayResult(text, fileType = 'txt') {
        this.hide(this.statusContainer);
        this.show(this.resultContainer);
        this.resultEditor.innerHTML = '';
        
        this.setDownloadButtonState(fileType);

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
    
    setDownloadButtonState(fileType) {
        if (fileType === 'srt') {
            this.downloadBtnText.textContent = "SRT";
            this.downloadBtn.setAttribute('data-file-type', 'srt');
        } else {
            this.downloadBtnText.textContent = "TXT";
            this.downloadBtn.setAttribute('data-file-type', 'txt');
        }
    },
    
    updateSubtitle() {
        if (this.isAdvancedMode()) {
            this.subtitle.textContent = "Advanced mode enabled. Using powerful cloud APIs.";
            this.customSelect.classList.add('disabled');
        } else {
            this.subtitle.textContent = "Extract text from images and PDFs directly in your browser.";
            this.customSelect.classList.remove('disabled');
        }
    },

    isAdvancedMode() {
        return this.advancedToggle.checked;
    },
    
    promptForApiKey() {
        const key = prompt("Please enter your Google Cloud Vision API Key to use Advanced Mode:", "");
        if (key && key.trim()) {
            sessionStorage.setItem('cloudApiKey', key.trim());
            return key.trim();
        }
        return null;
    },
    
    getApiKey() {
        return sessionStorage.getItem('cloudApiKey');
    },

    // --- Event Listeners Setup ---
    setupEventListeners() {
        this.loadTheme();
        this.loadAdvancedModePreference();
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Advanced Mode Toggle
        this.advancedToggle.addEventListener('change', (e) => {
            const isEnabled = e.target.checked;
            localStorage.setItem('advancedMode', isEnabled);
            this.updateSubtitle();

            // ** NEW LOGIC: Prompt for API Key immediately if needed **
            if (isEnabled && !this.getApiKey()) {
                const apiKey = this.promptForApiKey();
                if (!apiKey) {
                    // If user cancels or enters nothing, turn the toggle back off
                    e.target.checked = false;
                    localStorage.setItem('advancedMode', 'false');
                    this.updateSubtitle();
                }
            }
        });
        
        // Custom Select Logic
        this.customSelect.addEventListener('click', (e) => {
            if (this.isAdvancedMode()) return;
            e.stopPropagation();
            this.langOptionsPanel.classList.toggle('hidden');
            this.customSelect.classList.toggle('open');
            if (!this.langOptionsPanel.classList.contains('hidden')) {
                this.langSearchInput.focus();
                this.langSearchInput.value = '';
                this.filterLanguages('');
            }
        });

        document.addEventListener('click', () => {
            this.langOptionsPanel.classList.add('hidden');
            this.customSelect.classList.remove('open');
        });

        this.langOptionsList.addEventListener('click', (e) => {
            if (e.target && e.target.tagName === 'LI') {
                e.stopPropagation();
                const value = e.target.getAttribute('data-value');
                localStorage.setItem('selectedLang', value);
                this.updateSelectedOption(value);
                this.langOptionsPanel.classList.add('hidden');
                this.customSelect.classList.remove('open');
            }
        });

        this.langSearchInput.addEventListener('input', (e) => {
            this.filterLanguages(e.target.value);
        });
        this.langSearchInput.addEventListener('click', e => e.stopPropagation());
        
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
        
        // Download Button Logic
        this.downloadBtn.addEventListener('click', () => {
            const lines = Array.from(this.resultEditor.querySelectorAll('.code-line'));
            const textToDownload = lines.map(line => line.textContent.replace(/\u00A0/g, '')).join('\n');
            
            if (!textToDownload) return;

            const fileType = this.downloadBtn.getAttribute('data-file-type') || 'txt';
            const fileName = fileType === 'srt' ? 'OmniOCR-Subtitle.srt' : 'OmniOCR-text.txt';
            const mimeType = fileType === 'srt' ? 'application/x-subrip' : 'text/plain';

            const blob = new Blob([textToDownload], { type: `${mimeType};charset=utf-8` });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
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
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                this.fileInput.files = e.dataTransfer.files;
                this.fileInput.dispatchEvent(new Event('change'));
            }
        });
    },

    // --- Language Preference Management ---
    populateLanguageOptions() {
        this.langOptionsList.innerHTML = '';
        languages.forEach(lang => {
            const li = document.createElement('li');
            li.setAttribute('data-value', lang.code);
            li.textContent = lang.name;
            this.langOptionsList.appendChild(li);
        });
    },
    
    filterLanguages(searchTerm) {
        const term = searchTerm.toLowerCase();
        const options = this.langOptionsList.getElementsByTagName('li');
        for (const option of options) {
            const text = option.textContent.toLowerCase();
            option.classList.toggle('hidden', !text.includes(term));
        }
    },

    updateSelectedOption(langCode) {
        const option = this.langOptionsList.querySelector(`li[data-value="${langCode}"]`);
        if(option) {
            this.langOptionsList.querySelector('.selected')?.classList.remove('selected');
            option.classList.add('selected');
            this.selectedLangText.textContent = option.textContent;
            this.customSelect.setAttribute('data-value', langCode);
        }
    },

    loadLanguagePreference() {
        const savedLang = localStorage.getItem('selectedLang') || 'eng';
        this.updateSelectedOption(savedLang);
    },
    
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

    loadAdvancedModePreference() {
        const savedMode = localStorage.getItem('advancedMode') === 'true';
        this.advancedToggle.checked = savedMode;
        this.updateSubtitle();
    },
    
    getSelectedLanguage() {
        return this.customSelect.getAttribute('data-value') || 'eng';
    }
};
