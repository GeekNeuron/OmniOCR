import { languages } from './languages.js';

export const UI = {
    // DOM Element Cache
    body: document.body,
    themeToggle: document.getElementById('theme-toggle'),
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    subtitle: document.getElementById('subtitle'),
    // Help Modal Elements
    helpIcon: document.getElementById('help-icon'),
    helpModalOverlay: document.getElementById('help-modal-overlay'),
    helpModalCloseBtn: document.getElementById('help-modal-close-btn'),
    
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
    
    // API Key Modal Elements
    apiKeyModalOverlay: document.getElementById('api-key-modal-overlay'),
    apiKeyModal: document.getElementById('api-key-modal'),
    googleKeyInput: document.getElementById('google-key-input'),
    cloudinaryNameInput: document.getElementById('cloudinary-name-input'),
    huggingfaceKeyInput: document.getElementById('huggingface-key-input'),
    confirmApiKeyBtn: document.getElementById('confirm-api-key-btn'),
    cancelApiKeyBtn: document.getElementById('cancel-api-key-btn'),

    // CodeMirror instance
    codeMirrorInstance: null,

    // --- Core Methods ---
    
    reset() {
        this.hide(this.statusContainer);
        this.hide(this.resultContainer);
        this.hide(this.errorContainer);
        this.statusText.textContent = 'Processing...';
        this.progressBar.style.width = '0%';
        if (this.codeMirrorInstance) {
            this.codeMirrorInstance.setValue('');
        }
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
        this.setDownloadButtonState(fileType);

        if (!this.codeMirrorInstance) {
            this.codeMirrorInstance = CodeMirror.fromTextArea(this.resultEditor, {
                lineNumbers: true,
                mode: 'text/plain',
                readOnly: true,
                lineWrapping: true,
            });
        }

        this.codeMirrorInstance.setValue(text.trim());
        
        const theme = this.body.classList.contains('dark-theme') ? 'material-darker' : 'default';
        this.codeMirrorInstance.setOption("theme", theme);

        const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        const direction = rtlRegex.test(text) ? 'rtl' : 'ltr';
        this.codeMirrorInstance.setOption('direction', direction);
        
        const editorElement = this.codeMirrorInstance.getWrapperElement();
        editorElement.style.fontFamily = direction === 'rtl' ? "var(--font-rtl)" : "var(--font-mono)";
        
        setTimeout(() => this.codeMirrorInstance.refresh(), 1);
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
    
    // --- API Key Modal Logic ---
    promptForApiKeys() {
        return new Promise((resolve) => {
            this.show(this.apiKeyModalOverlay);
            this.googleKeyInput.focus();

            const confirmHandler = () => {
                const keys = {
                    google: this.googleKeyInput.value.trim(),
                    cloudinaryCloudName: this.cloudinaryNameInput.value.trim(),
                    huggingFace: this.huggingfaceKeyInput.value.trim()
                };
                
                if (keys.google) {
                    sessionStorage.setItem('apiKeys', JSON.stringify(keys));
                    cleanup();
                    resolve(keys);
                } else {
                    this.googleKeyInput.style.borderColor = "red";
                    this.googleKeyInput.placeholder = "Google API Key is required!";
                }
            };

            const cancelHandler = () => {
                cleanup();
                resolve(null);
            };
            
            const keydownHandler = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmHandler();
                } else if (e.key === 'Escape') {
                    cancelHandler();
                }
            };

            const cleanup = () => {
                this.hide(this.apiKeyModalOverlay);
                this.googleKeyInput.style.borderColor = "";
                this.googleKeyInput.placeholder = "Enter your API key here...";
                this.confirmApiKeyBtn.removeEventListener('click', confirmHandler);
                this.cancelApiKeyBtn.removeEventListener('click', cancelHandler);
                this.apiKeyModal.removeEventListener('keydown', keydownHandler);
            };

            this.confirmApiKeyBtn.addEventListener('click', confirmHandler);
            this.cancelApiKeyBtn.addEventListener('click', cancelHandler);
            this.apiKeyModal.addEventListener('keydown', keydownHandler);
        });
    },
    
    getApiKeys() {
        const storedKeys = sessionStorage.getItem('apiKeys');
        return storedKeys ? JSON.parse(storedKeys) : {};
    },

    // --- Event Listeners Setup ---
    setupEventListeners() {
        this.loadTheme();
        this.loadAdvancedModePreference();
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
            if(this.codeMirrorInstance) {
                const newTheme = this.body.classList.contains('dark-theme') ? 'material-darker' : 'default';
                this.codeMirrorInstance.setOption("theme", newTheme);
            }
        });
        
        this.advancedToggle.addEventListener('change', async (e) => {
            const isEnabled = e.target.checked;
            localStorage.setItem('advancedMode', isEnabled);
            this.updateSubtitle();

            if (isEnabled && !this.getApiKeys().google) {
                const keys = await this.promptForApiKeys();
                if (!keys || !keys.google) {
                    e.target.checked = false;
                    localStorage.setItem('advancedMode', 'false');
                    this.updateSubtitle();
                }
            }
        });
        
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
        
        this.copyBtn.addEventListener('click', () => {
            if (!this.codeMirrorInstance) return;
            const textToCopy = this.codeMirrorInstance.getValue();
            navigator.clipboard.writeText(textToCopy).then(() => {
                const copySpan = this.copyBtn.lastElementChild;
                copySpan.textContent = 'Copied!';
                setTimeout(() => { copySpan.textContent = 'Copy'; }, 2000);
            });
        });
        
        this.downloadBtn.addEventListener('click', () => {
            if (!this.codeMirrorInstance) return;
            const textToDownload = this.codeMirrorInstance.getValue();
            
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
        // --- Help Modal Logic ---
        this.helpIcon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents the document click listener from closing it immediately
            this.show(this.helpModalOverlay);
        });

        this.helpModalCloseBtn.addEventListener('click', () => {
            this.hide(this.helpModalOverlay);
        });

        // Also close the modal if the user clicks on the overlay background
        this.helpModalOverlay.addEventListener('click', (e) => {
            if (e.target === this.helpModalOverlay) {
                this.hide(this.helpModalOverlay);
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
