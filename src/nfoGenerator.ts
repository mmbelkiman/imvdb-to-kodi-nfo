import fs from "fs";
import {TheAudioDBTrack} from "./theaudiodbApi";
import {IMVDBVideo} from "./imvdbApi";

interface GenerateNFOOptions {
    video: IMVDBVideo;
    audioDB?: TheAudioDBTrack;
    outputDir: string;
}

function escapeXML(str?: string): string {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

export function generateNFO({video, outputDir, audioDB}: GenerateNFOOptions) {
    const {
        title,
        released_at,
        artists,
        description,
        id,
    } = video;

    const artistName = artists?.[0]?.name || "";
    const year =
        typeof released_at === "number"
            ? released_at
            : String(released_at || "").slice(0, 4) || "";

    const plot =
        audioDB?.strDescriptionEN ||
        description ||
        "This Music Video could not be identified.";

    const album = audioDB?.strAlbum || "";

    const genreList = Array.from(
        new Set(
            [audioDB?.strGenre, audioDB?.strStyle]
                .filter(Boolean)
                .map((g) => g!.trim())
        )
    );
    const genreXML = genreList.map((g) => `  <genre>${escapeXML(g)}</genre>`).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<musicvideo>
  <title>${escapeXML(title)}</title>
  <year>${year}</year>
  <artist>${escapeXML(artistName)}</artist>
  <director></director>
  <album>${escapeXML(album)}</album>
${genreXML || "  <genre></genre>"}
  <track></track>
  <runtime></runtime>
  <plot>${escapeXML(plot)}</plot>
  <studio></studio>
  <id>${id || ""}</id>
  <createdate>${getCurrentDate()}</createdate>
</musicvideo>`;

    fs.writeFileSync(outputDir, xml, "utf-8");
    console.log(`✅ NFO Done: ${outputDir}`);
}

function getCurrentDate(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
        now.getFullYear().toString() +
        pad(now.getMonth() + 1) +
        pad(now.getDate()) +
        pad(now.getHours()) +
        pad(now.getMinutes()) +
        pad(now.getSeconds())
    );
}
