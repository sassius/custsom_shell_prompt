const input = answer.slice(5).trim(); // Remove 'echo ' part

const matches = input.match(/'([^']*)'|\S+/g) || [];

let result = [];
let temp = "";
let prevWasQuoted = false;
let spaceBuffer = "";

for (let word of matches) {
    if (word.trim() === "") {
        spaceBuffer += word; // Store spaces to handle them properly
        continue;
    }

    if (word.startsWith("'") && word.endsWith("'")) {
        let unquoted = word.slice(1, -1); // Remove surrounding single quotes

        if (prevWasQuoted && spaceBuffer.length === 1) {
            temp += unquoted; // Stick together if exactly one space
        } else {
            if (temp) result.push(temp);
            if (spaceBuffer.length > 0) result.push(" "); // Preserve space before new quoted word
            temp = unquoted;
        }

        prevWasQuoted = true;
    } else {
        if (temp) {
            result.push(temp); // Push merged quoted content
            temp = "";
        }
        if (!prevWasQuoted && result.length > 0) {
            result.push(" "); // Ensure only a single space between unquoted words
        }
        result.push(word);
        prevWasQuoted = false;
    }

    spaceBuffer = ""; // Reset space buffer after processing a word
}

if (temp) result.push(temp);

console.log(result.join("").trim()); // Trim to handle any leading/trailing spaces
