import fs from "fs";
import path from "path";
import chalk from "chalk";
import boxen from "boxen";
import {prompt} from "enquirer";
import cliProgress from "cli-progress";
import dotenv from "dotenv";
import {searchVideo} from "./imvdbApi";
import {getAllVideoFiles} from "./utils";
import {generateNFO} from "./nfoGenerator";
import {fetchTrackInfoFromTheAudioDB} from "./theaudiodbApi";

dotenv.config();

const basePath = process.argv[2];
if (!basePath) {
    console.error(chalk.red("❌ Please add the path to your music videos folder as an argument.\n"));
    console.log(chalk.gray("Example:"));
    console.log(chalk.cyan("   npm start -- '/path/to/music-videos'"));
    process.exit(1);
}

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

const notFound: string[] = [];

async function main() {
    const files = await getAllVideoFiles(basePath);
    console.log(chalk.gray(`📁 ${files.length} video files found.\n`));

    if (files.length > 20) {
        const { proceed } = await prompt<{ proceed: boolean }>({
            type: "confirm",
            name: "proceed",
            message: `⚠️  This will process ${files.length} files. Continue?`,
            initial: true,
        });
        if (!proceed) {
            console.log(chalk.yellow("🚫 Operation cancelled by user."));
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
            console.log(chalk.gray(`⏭️  Skipping (NFO exists): ${fileName}`));
            continue;
        }

        const [artist, title] = fileName
            .replace(path.extname(file), "")
            .split(" - ");

        if (!artist || !title) {
            console.log(chalk.yellow(`⚠️  Invalid name: ${fileName}`));
            notFound.push(fileName);
            continue;
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));

        try {
            const video = await searchVideo(artist.trim(), title.trim());
            if (!video) {
                console.log(chalk.red(`❌ Not found: ${fileName}`));
                notFound.push(fileName);
                continue;
            }

            const artistName = video.artists?.[0]?.name || "";
            const audioDB = await fetchTrackInfoFromTheAudioDB(artistName, title);
            if (!audioDB) {
                console.log(chalk.yellow(`⚠️  [AudioDB] Not found: ${artistName} - ${title}`));
            }

            generateNFO({ outputDir: nfoPath, video, audioDB });
            console.log(chalk.green(`✅ NFO created: ${fileName}`));
        } catch (err) {
            console.error(chalk.red(`💥 Error at ${fileName}:`), err);
            notFound.push(fileName);
        }
    }

    bar.stop();

    console.log("\n");

    if (notFound.length > 0) {
        console.log(
            boxen(
                chalk.red("🚫 Some files could not be processed:") +
                "\n" +
                notFound.map((f) => chalk.gray(`- ${f}`)).join("\n"),
                { padding: 1, borderColor: "red", margin: 1 }
            )
        );
    } else {
        console.log(
            boxen(chalk.green("🎉 All files processed successfully!"), {
                padding: 1,
                borderColor: "green",
                margin: 1,
            })
        );
    }
}

main().catch((err) => console.error(chalk.red(err)));
