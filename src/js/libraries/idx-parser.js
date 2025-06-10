/**
 * .idx File Parser Module
 * Reads the content of an .idx file and extracts timestamps and file positions.
 */
export const IDXParser = {
    /**
     * Parses the text content of an .idx file.
     * @param {string} fileContent - The full text content of the .idx file.
     * @returns {Array<{timestamp: string, filepos: number}>} An array of subtitle metadata objects.
     */
    parse(fileContent) {
        const lines = fileContent.split('\n');
        const metadata = [];
        
        // Regex to find lines containing timestamp and filepos information.
        // It captures the timestamp string and the hexadecimal file position.
        const regex = /^timestamp: (\d{2}:\d{2}:\d{2},\d{3}), filepos: ([\da-fA-F]+)/;

        for (const line of lines) {
            const match = line.trim().match(regex);
            if (match) {
                const timestamp = match[1];
                const filepos = parseInt(match[2], 16); // Convert hex string to a number

                metadata.push({ timestamp, filepos });
            }
        }
        
        if (metadata.length === 0) {
            throw new Error("Could not find any valid timestamp data in the .idx file.");
        }

        return metadata;
    }
};

