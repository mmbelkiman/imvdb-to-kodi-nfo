import fs from "fs";
import path from "path";
import chalk from "chalk";
import stripAnsi from "strip-ansi";
import boxen from "boxen";

type LogType = "log" | "error";
type BoxColor = "cyan" | "green" | "red";

/**
 * Centralized Logger (Singleton)
 * Handles console logging, ANSI stripping, and file output.
 */
export class Logger {
    private static instance: Logger;
    private logMessages: string[] = [];
    private basePath = "";
    private startTime = new Date();

    private constructor() {}

    /** Returns the singleton instance of the Logger. */
    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /** Initializes the logger with base path context. */
    public init(basePath: string): void {
        this.basePath = basePath;
        this.startTime = new Date();
    }

    /** Writes a log message to console and stores a clean version. */
    public log(message: string, type: LogType = "log"): void {
        this.logMessages.push(stripAnsi(message));
        type === "error" ? console.error(message) : console.log(message);
    }

    /** Creates a stylized box message and logs it. */
    public logBox(message: string, color: BoxColor = "cyan"): void {
        const box = boxen(message, {
            padding: 1,
            margin: 1,
            borderColor: color,
            borderStyle: color === "red" ? "double" : "round",
        });
        this.log(box);
    }

    /** Writes the log file to disk. */
    public saveLogFile(notFoundCount: number, totalFiles: number): void {
        const logFilePath = path.join(process.cwd(), "log.txt");
        const header = [
            "🎬 Music Video NFO Generator Log",
            "───────────────────────────────────────────────",
            `📅 Created at: ${this.startTime.toLocaleString()}`,
            `📂 Base path: ${this.basePath}`,
            `📊 Total files processed: ${totalFiles}`,
            `❌ Not found: ${notFoundCount}`,
            "───────────────────────────────────────────────",
            "",
        ].join("\n");

        fs.writeFileSync(logFilePath, header + this.logMessages.join("\n") + "\n", "utf-8");
        console.log(chalk.cyan(`\n📝 Log file saved at: ${logFilePath}\n`));
    }
}
