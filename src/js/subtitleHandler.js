import { UI } from './ui.js';
import { Postprocessor } from './postprocessor.js';

// --- FFmpeg Loader Singleton ---
// This ensures FFmpeg is only ever loaded once, preventing race conditions.
let ffmpegInstance = null;
let ffmpegLoadingPromise = null;

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
 * Loads the FFmpeg library dynamically and only once, with a robust polling mechanism.
 * @returns {Promise<FFmpeg>} The loaded and ready-to-use FFmpeg instance.
 */
async function loadFFmpeg() {
    if (ffmpegInstance) {
        return ffmpegInstance;
    }

    if (ffmpegLoadingPromise) {
        return ffmpegLoadingPromise;
    }

    const load = async () => {
        // Dynamically load the main FFmpeg script if it's not already on the page
        if (!window.FFmpeg) {
            UI.updateProgress('Downloading FFmpeg library...', 0.02);
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'src/js/libraries/ffmpeg/ffmpeg.min.js';
                script.onload = resolve;
                script.onerror = () => reject(new Error("Failed to load FFmpeg main script. Check file paths and browser's network tab for 404 errors."));
                document.head.appendChild(script);
            });
        }
        
        if (!window.FFmpeg || typeof window.FFmpeg.FFmpeg !== 'function') {
             throw new Error("FFmpeg library loaded but did not initialize correctly. This might be a browser compatibility issue.");
        }

        const { FFmpeg } = window.FFmpeg;
        const ffmpeg = new FFmpeg();
        
        ffmpeg.on('log', ({ message }) => {
            // console.log(message); // Verbose logging
        });

        UI.updateProgress('Downloading FFmpeg Core (~32MB)...', 0.1);
        
        const part1Url = 'src/js/libraries/ffmpeg/ffmpeg-core.wasm.part1';
        const part2Url = 'src/js/libraries/ffmpeg/ffmpeg-core.wasm.part2';

        const [part1Buffer, part2Buffer] = await Promise.all([
            fetchWithProgress(part1Url, (p) => UI.updateProgress(`Downloading FFmpeg Core... ${Math.round(p * 50)}%`, 0.1 + p * 0.35)),
            fetchWithProgress(part2Url, (p) => UI.updateProgress(`Downloading FFmpeg Core... ${Math.round(50 + p * 50)}%`, 0.45 + p * 0.35))
        ]);
    
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
        
        ffmpegInstance = ffmpeg;
        return ffmpeg;
    };

    ffmpegLoadingPromise = load();
    return ffmpegLoadingPromise;
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
