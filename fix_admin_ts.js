const fs = require('fs');
const path = 'e:\\Dev\\web\\00\\src\\lib\\dictionaries\\admin.ts';

try {
    const content = fs.readFileSync(path, 'utf8');
    // Split by newline
    let lines = content.split(/\r?\n/);

    console.log('Total lines:', lines.length);

    // Filter out lines that contain null bytes or are just the garbage line
    const cleanLines = lines.filter(line => !line.includes('\u0000'));

    // Check if the last line is empty and remove it if so (optional, but good for cleanup)
    while (cleanLines.length > 0 && cleanLines[cleanLines.length - 1].trim() === '') {
        cleanLines.pop();
    }

    // Ensure it ends with };
    const lastLine = cleanLines[cleanLines.length - 1];
    if (lastLine.trim() !== '};') {
        console.log('Warning: File does not end with "};", it ends with:', lastLine);
        // Depending on the state, we might want to append it, but let's just see.
        // If the garbage lines were removed, the previous line should be };
    }

    console.log('Cleaned lines count:', cleanLines.length);
    console.log('Last 3 lines:', cleanLines.slice(-3));

    fs.writeFileSync(path, cleanLines.join('\n'), 'utf8');
    console.log('File fixed.');

} catch (e) {
    console.error('Error:', e);
}
