import fs from "fs/promises";
import path from "path";

const videoExtensions = [".mp4", ".avi", ".mpg", ".mpeg", ".mov", ".mkv"];

export async function getAllVideoFiles(dir: string): Promise<string[]> {
    let files: string[] = [];
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            const subFiles = await getAllVideoFiles(fullPath);
            files = files.concat(subFiles);
        } else if (videoExtensions.includes(path.extname(item.name).toLowerCase())) {
            files.push(fullPath);
        }
    }

    return files;
}

export function stringSimilarity(str1: string, str2: string) {
    if (!str1.length && !str2.length) return 100;
    if (!str1.length || !str2.length) return 0;

    const s1 = normalize(str1.toLowerCase());
    const s2 = normalize(str2.toLowerCase());

    const len1 = s1.length;
    const len2 = s2.length;

    const matrix = Array.from({length: len1 + 1}, () => new Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    const similarity = ((maxLen - distance) / maxLen) * 100;

    return Math.max(0, Math.min(100, similarity));
}

/**
 * Normalizes a string by removing accents, converting it to lowercase, and trimming extra spaces.
 *
 * @param {string} [str] - The input string to normalize. If not provided, it defaults to an empty string.
 * @returns {string} The normalized string without accents, in lowercase, and trimmed.
 *
 * @example
 * normalize("Árvore "); // Returns "arvore"
 * normalize(" João  "); // Returns "joao"
 * normalize();          // Returns ""
 */
export function normalize(str?: string): string {
    return (str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}
