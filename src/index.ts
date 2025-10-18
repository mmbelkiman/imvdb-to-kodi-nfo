import fs from "fs";
import path from "path";
import chalk from "chalk";
import boxen from "boxen";
import {prompt} from "enquirer";
import cliProgress from "cli-progress";
import dotenv from "dotenv";
import ora from "ora";
import {getAllVideoFiles, stringSimilarity} from "./utils";
import {generateNFO} from "./nfoGenerator";
import {fetchTrackInfoFromTheAudioDB} from "./api/theAudiodbApi";
import {searchVideo} from "./api/imvdbApi";
import {Logger} from "./logger";

dotenv.config();

const basePath = process.argv[2];
if (!basePath) {
    console.error(chalk.red("❌ Please add the path to your music videos folder as an argument.\n"));
    console.log(chalk.gray("Example:"));
    console.log(chalk.cyan("   npm start -- '/path/to/music-videos'"));
    process.exit(1);
}
const logger = Logger.getInstance();
logger.init(basePath);

console.log(
    boxen(
        chalk.bold("🎬 Music Video NFO Generator") +
        "\n\n" +
        chalk.gray("Automatically generates Kodi-compatible NFOs for your music videos.") +
        "\n\n" +
        chalk.cyan("📂 Folder: ") +
        chalk.white(basePath),
        {
            padding: 1,
            margin: 1,
            borderColor: "cyan",
            borderStyle: "round",
        }
    )
);

logger.log(chalk.yellow("\n🔍 Reading files, please wait. This process may take a while...\n"));

const notFound: string[] = [];

async function main() {
    const spinner = ora({
        text: "🔍 Reading files, please wait. This process may take a while...",
        color: "yellow",
        spinner: "dots",
    }).start();

    let files = await getAllVideoFiles(basePath);
    files = files.filter((f) => !path.basename(f).startsWith("._"));

    spinner.succeed(`📁 ${files.length} video files found (after filtering).\n`);

    if (files.length > 20) {
        const {proceed} = await prompt<{ proceed: boolean }>({
            type: "confirm",
            name: "proceed",
            message: `⚠️  This will process ${files.length} files. Continue?`,
            initial: true,
        });
        if (!proceed) {
            logger.log(chalk.yellow("🚫 Operation cancelled by user."));
            process.exit(0);
        }
    }

    const bar = new cliProgress.SingleBar(
        {
            format: `${chalk.cyan("Progress")} |${chalk.magenta("{bar}")}| {percentage}% || {value}/{total} files`,
            barCompleteChar: "█",
            barIncompleteChar: "░",
            hideCursor: true,
        },
        cliProgress.Presets.shades_classic
    );

    bar.start(files.length, 0);

    for (const file of files) {
        const nfoPath = file.replace(path.extname(file), ".nfo");
        const fileName = path.basename(file);
        bar.increment();

        if (fs.existsSync(nfoPath)) {
            logger.log(chalk.gray(`⏭️  Skipping (NFO exists): ${fileName}`));
            continue;
        }

        const [artist, title] = fileName.replace(path.extname(file), "").split(" - ");

        if (!artist || !title) {
            logger.log(chalk.yellow(`⚠️  Invalid name: ${fileName}`));
            notFound.push(fileName);
            continue;
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));

        try {
            const videoData = await searchVideo(artist.trim(), title.trim());
            const artistName = videoData?.artists?.[0]?.name || artist.trim();
            const folderArtist = path.basename(path.dirname(file));

            const audioData = await fetchTrackInfoFromTheAudioDB(artistName, title);
            if (!audioData) {
                logger.log(chalk.yellow(`⚠️  [AudioDB] Not found: ${artistName} - ${title}`));
            }

            if (!videoData && !audioData) {
                logger.log(chalk.red(`❌ Not found: ${fileName}`));
                notFound.push(fileName);
                continue;
            }

            const similarity = stringSimilarity(folderArtist, artistName);
            if (similarity < 80) {
                const msg =
                    chalk.red(
                        `❌ Artist not match: ${fileName}\n   Folder: "${folderArtist}" | API: "${artistName}", similarity: ${similarity.toFixed(2)}%`
                    );
                logger.log(msg);
                notFound.push(fileName);
                continue;
            }

            generateNFO({outputDir: nfoPath, video: videoData, audioDB: audioData});
            logger.log(chalk.green(`✅ NFO created: ${fileName}`));
        } catch (err) {
            logger.log(chalk.red(`💥 Error at ${fileName}: ${err instanceof Error ? err.message : err}`), "error");
            notFound.push(fileName);
        }
    }

    bar.stop();
    console.log("\n");

    if (notFound.length > 0) {
        logger.logBox(
            chalk.red("🚫 Some files could not be processed:") +
            "\n" +
            notFound.map((f) => chalk.gray(`- ${f}`)).join("\n"),
            "red"
        );
    } else {
        logger.logBox(chalk.green("🎉 All files processed successfully!"), "green");
    }

    logger.saveLogFile(notFound.length, files.length);
}

main().catch((err) => console.error(chalk.red(err)));
