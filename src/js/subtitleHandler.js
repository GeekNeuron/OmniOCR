import { UI } from './ui.js';
import { Postprocessor } from './postprocessor.js';

// --- FFmpeg Loader ---
let ffmpeg; // Use a global-like variable within the module to cache the loaded instance

/**
 * Loads the FFmpeg library dynamically and only once, with a robust polling mechanism.
 * @returns {Promise<FFmpeg>} The loaded and ready-to-use FFmpeg instance.
 */
async function loadFFmpeg() {
    // If FFmpeg is already loaded and ready, return it immediately.
    if (ffmpeg && ffmpeg.loaded) {
        console.log("Returning cached FFmpeg instance.");
        return ffmpeg;
    }

    // Dynamically load the main FFmpeg script if it's not already on the page
    if (!window.FFmpeg) {
        UI.updateProgress('Downloading FFmpeg library...', 0.05);
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'src/js/libraries/ffmpeg/ffmpeg.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load FFmpeg main script. Check file paths and network."));
            document.head.appendChild(script);
        });
    }

    // ** THE FIX: Poll with a longer timeout to wait for the script to execute **
    let retries = 0;
    const maxRetries = 300; // Poll for up to 30 seconds
    while (!window.FFmpeg && retries < maxRetries) {
        await new Promise(r => setTimeout(r, 100)); // wait 100ms
        retries++;
    }
    
    if (!window.FFmpeg) {
        throw new Error("FFmpeg library failed to initialize. This might be due to a slow connection or a browser issue. Please try refreshing the page.");
    }
    
    const { FFmpeg } = window.FFmpeg;
    ffmpeg = new FFmpeg();
    
    ffmpeg.on('log', ({ message }) => {
        // This log can be very verbose. Enable only when debugging FFmpeg issues.
        // console.log(message);
    });

    UI.updateProgress('Loading FFmpeg engine (~32MB)...', 0.1);
    
    // Logic to fetch and merge split WASM file
    const part1Url = 'src/js/libraries/ffmpeg/ffmpeg-core.wasm.part1';
    const part2Url = 'src/js/libraries/ffmpeg/ffmpeg-core.wasm.part2';

    const [part1Res, part2Res] = await Promise.all([fetch(part1Url), fetch(part2Url)]);
    
    if (!part1Res.ok || !part2Res.ok) {
        throw new Error("Failed to download FFmpeg core components. Please check the file paths.");
    }

    const part1Buffer = await part1Res.arrayBuffer();
    const part2Buffer = await part2Res.arrayBuffer();

    const combinedBuffer = new Uint8Array(part1Buffer.byteLength + part2Buffer.byteLength);
    combinedBuffer.set(new Uint8Array(part1Buffer), 0);
    combinedBuffer.set(new Uint8Array(part2Buffer), part1Buffer.byteLength);
    
    const wasmBlob = new Blob([combinedBuffer]);
    const wasmUrl = URL.createObjectURL(wasmBlob);
    
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
    /**
     * Processes a pair of .sub and .idx files by converting them to SRT format.
     * @param {File} subFile - The .sub file.
     * @param {File} idxFile - The .idx file.
     * @returns {Promise<string>} A promise that resolves with the full SRT content.
     */
    async process(subFile, idxFile) {
        const ffmpeg = await loadFFmpeg();
        
        UI.updateProgress('Loading files into virtual system...', 0.3);
        await ffmpeg.writeFile(idxFile.name, new Uint8Array(await idxFile.arrayBuffer()));
        await ffmpeg.writeFile(subFile.name, new Uint8Array(await subFile.arrayBuffer()));
        
        UI.updateProgress('Extracting subtitles with FFmpeg...', 0.6);
        await ffmpeg.exec(['-i', idxFile.name, 'output.srt']);
        
        UI.updateProgress('Reading result...', 0.9);
        const { data } = await ffmpeg.readFile('output.srt');
        
        await ffmpeg.deleteFile(idxFile.name);
        await ffmpeg.deleteFile(subFile.name);
        await ffmpeg.deleteFile('output.srt');
        
        const srtContent = new TextDecoder().decode(data);
        if (!srtContent) {
            throw new Error("FFmpeg failed to extract any subtitle text.");
        }

        return Postprocessor.cleanup(srtContent, 'eng'); // SRT is always treated as LTR
    }
};
