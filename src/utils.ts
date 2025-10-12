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
