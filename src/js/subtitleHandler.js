import { UI } from './ui.js';
import { Postprocessor } from './postprocessor.js';

// --- FFmpeg Loader ---
let ffmpeg; // Use a module-level variable to cache the loaded instance

/**
 * A helper function to fetch a file while reporting its download progress.
 * @param {string} url - The URL of the file to fetch.
 * @param {(progress: number) => void} onProgress - A callback function to report progress (0-1).
 * @returns {Promise<ArrayBuffer>} A promise that resolves with the file's ArrayBuffer.
 */
async function fetchWithProgress(url, onProgress) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const contentLength = +response.headers.get('Content-Length');
    let loaded = 0;

    const reader = response.body.getReader();
    const chunks = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        chunks.push(value);
        loaded += value.length;
        if (contentLength) {
            onProgress(loaded / contentLength);
        }
    }

    const buffer = new Uint8Array(loaded);
    let position = 0;
    for (const chunk of chunks) {
        buffer.set(chunk, position);
        position += chunk.length;
    }

    return buffer.buffer;
}

/**
 * Loads the FFmpeg library dynamically and only once, with robust progress reporting.
 * This function also handles the merging of the split .wasm file.
 * @returns {Promise<FFmpeg>} The loaded and ready-to-use FFmpeg instance.
 */
async function loadFFmpeg() {
    if (ffmpeg && ffmpeg.loaded) {
        console.log("Returning cached FFmpeg instance.");
        return ffmpeg;
    }

    if (!window.FFmpeg) {
        UI.updateProgress('Downloading FFmpeg library...', 0.01);
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'src/js/libraries/ffmpeg/ffmpeg.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load FFmpeg main script."));
            document.head.appendChild(script);
        });
    }

    if (!window.FFmpeg) {
        throw new Error("FFmpeg library failed to initialize.");
    }
    
    const { FFmpeg } = window.FFmpeg;
    ffmpeg = new FFmpeg();
    
    ffmpeg.on('log', ({ message }) => {
        // console.log(message);
    });

    UI.updateProgress('Downloading FFmpeg Core (~32MB)...', 0.05);

    // Fetch and merge the split WASM file with progress
    const part1Url = 'src/js/libraries/ffmpeg/ffmpeg-core.wasm.part1';
    const part2Url = 'src/js/libraries/ffmpeg/ffmpeg-core.wasm.part2';

    let loaded1 = 0, total1 = 0;
    let loaded2 = 0, total2 = 0;

    const updateCombinedProgress = () => {
        const total = total1 + total2;
        if (total > 0) {
            const progress = (loaded1 + loaded2) / total;
            // Scale progress from 0.05 to 0.8 for the download phase
            UI.updateProgress(`Downloading FFmpeg Core... ${Math.round(progress * 100)}%`, 0.05 + (progress * 0.75));
        }
    };
    
    const part1Res = await fetch(part1Url);
    total1 = +part1Res.headers.get('Content-Length');
    const part1Buffer = await fetchWithProgress(part1Url, (p) => { loaded1 = p * total1; updateCombinedProgress(); });
    
    const part2Res = await fetch(part2Url);
    total2 = +part2Res.headers.get('Content-Length');
    const part2Buffer = await fetchWithProgress(part2Url, (p) => { loaded2 = p * total2; updateCombinedProgress(); });
    
    const combinedBuffer = new Uint8Array(part1Buffer.byteLength + part2Buffer.byteLength);
    combinedBuffer.set(new Uint8Array(part1Buffer), 0);
    combinedBuffer.set(new Uint8Array(part2Buffer), part1Buffer.byteLength);
    
    const wasmBlob = new Blob([combinedBuffer]);
    const wasmUrl = URL.createObjectURL(wasmBlob);
    
    UI.updateProgress('Initializing FFmpeg Engine...', 0.85);
    await ffmpeg.load({
        coreURL: 'src/js/libraries/ffmpeg/ffmpeg-core.js',
        wasmURL: wasmUrl, 
        workerURL: 'src/js/libraries/ffmpeg/ffmpeg-core.worker.js',
    });
    
    return ffmpeg;
}


/**
 * Handles .sub/.idx file processing using the FFmpeg.wasm library.
 */
export const SubtitleHandler = {
    async process(subFile, idxFile) {
        const ffmpeg = await loadFFmpeg();
        
        UI.updateProgress('Loading files into virtual system...', 0.9);
        await ffmpeg.writeFile(idxFile.name, new Uint8Array(await idxFile.arrayBuffer()));
        await ffmpeg.writeFile(subFile.name, new Uint8Array(await subFile.arrayBuffer()));
        
        UI.updateProgress('Extracting subtitles with FFmpeg...', 0.95);
        await ffmpeg.exec(['-i', idxFile.name, 'output.srt']);
        
        const { data } = await ffmpeg.readFile('output.srt');
        
        await ffmpeg.deleteFile(idxFile.name);
        await ffmpeg.deleteFile(subFile.name);
        await ffmpeg.deleteFile('output.srt');
        
        const srtContent = new TextDecoder().decode(data);
        if (!srtContent) {
            throw new Error("FFmpeg failed to extract any subtitle text.");
        }

        return Postprocessor.cleanup(srtContent, 'eng');
    }
};
