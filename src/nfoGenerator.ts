import fs from "fs";
import {TheAudioDBTrack} from "./api/theAudiodbApi";
import {IMVDBVideo} from "./api/imvdbApi";


function escapeXML(str?: string): string {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

export function generateNFO({video, outputDir, audioDB}: {
    video?: IMVDBVideo | null;
    audioDB?: TheAudioDBTrack;
    outputDir: string;
}) {
    const id = video?.id || "";
    const released_at = video?.released_at || audioDB?.intYearReleased || null;
    const title = video?.title || audioDB?.strTrack || "Unknown Title";
    const artistName = video?.artists?.[0]?.name || audioDB?.strArtist|| "";
    const album = audioDB?.strAlbum || "";
    const director = audioDB?.strMusicVidDirector || "";
    const studio = audioDB?.strMusicVidCompany || "";

    const plot =
        video?.description ||
        audioDB?.strDescriptionEN ||
        "This Music Video could not be identified.";

    const year =
        typeof released_at === "number"
            ? released_at
            : String(released_at || "").slice(0, 4) || "";

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
  <director>${escapeXML(director)}</director>
  <album>${escapeXML(album)}</album>
${genreXML || "  <genre></genre>"}
  <track></track>
  <runtime></runtime>
  <plot>${escapeXML(plot)}</plot>
  <studio>${escapeXML(studio)}</studio>
  <id>${id }</id>
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
