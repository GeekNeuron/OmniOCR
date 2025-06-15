import { UI } from './ui.js';
import { Postprocessor } from './postprocessor.js';

let ffmpeg; // Module-level cache for the FFmpeg instance

/**
 * Initializes the FFmpeg instance. This function ensures FFmpeg is loaded
 * and ready, merging the split WASM files. It will only perform the heavy
 * loading process once.
 * @returns {Promise<FFmpeg>} The loaded and ready-to-use FFmpeg instance.
 */
async function getFFmpeg() {
    if (ffmpeg && ffmpeg.loaded) {
        return ffmpeg;
    }

    // Since ffmpeg.min.js is now loaded via a script tag with defer,
    // we can be sure window.FFmpeg exists when this code runs.
    if (!window.FFmpeg) {
        throw new Error("FFmpeg library script did not load correctly. Please check the file path in index.html and browser's network tab.");
    }

    const { FFmpeg } = window.FFmpeg;
    ffmpeg = new FFmpeg();
    
    ffmpeg.on('log', ({ message }) => {
        // console.log(message); // Verbose logging
    });
    
    UI.updateProgress('Loading FFmpeg Engine (~32MB)...', 0.1);
    
    const part1Url = 'src/js/libraries/ffmpeg/ffmpeg-core.wasm.part1';
    const part2Url = 'src/js/libraries/ffmpeg/ffmpeg-core.wasm.part2';

    const [part1Res, part2Res] = await Promise.all([fetch(part1Url), fetch(part2Url)]);
    if (!part1Res.ok || !part2Res.ok) {
        throw new Error("Failed to download FFmpeg core components.");
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
        const ffmpeg = await getFFmpeg();
        
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

        return Postprocessor.cleanup(srtContent, 'eng');
    }
};
