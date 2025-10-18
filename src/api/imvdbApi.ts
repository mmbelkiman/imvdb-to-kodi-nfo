import {normalize, stringSimilarity} from "../utils";

const BASE_URL = "https://imvdb.com/api/v1";

export interface IMVDBVideo {
    id?: number | string;
    title: string;
    released_at?: string | null | number;
    artists?: { name: string; slug?: string }[] | null;
    description?: string | null;
}


const resultMatchesTitle = (result: any, titleNorm: string) => {
    const song = normalize(result.song_title);
    if (!song) return false;
    const altSong = song.replace(/\(.*?\)/g, "").replace(/version\s*\d+/g, "").trim();
    const altTitle = titleNorm.replace(/\(.*?\)/g, "").replace(/version\s*\d+/g, "").trim();

    return (
        song === titleNorm ||
        song.includes(titleNorm) ||
        titleNorm.includes(song) ||
        (altSong && altTitle && (altSong === altTitle || altSong.includes(altTitle) || altTitle.includes(altSong)))
    );
};

const resultMatchesArtist = (result: any, artistName: string) =>
    result.artists?.some((a: any) => {
        const name = normalize(a?.name);
        return name === artistName || name.includes(artistName);
    });


export async function searchVideo(
    artist: string,
    title: string
): Promise<IMVDBVideo | null> {
    try {
        //region fetch
        const q = encodeURIComponent(`${artist} ${title}`);
        const url = `${BASE_URL}/search/videos?q=${q}`;

        const res = await fetch(url, {
            headers: {
                "X-Imvdb-App-Key": process.env.IMVDB_API_KEY || "",
            },
        });

        if (!res.ok) {
            console.error("Error at IMVDb:", res.status, res.statusText);
            return null;
        }

        const data = await res.json();

        if (!data?.results?.length) return null;
        //endregion

        //region identify
        let chosen: any = null;
        let maxSimilarity = 0;
        for (const r of data.results) {
            const artistOk = resultMatchesArtist(r, normalize(artist));

            const titleOk = resultMatchesTitle(r, normalize(title));


            //Best match is when both artist and title match
            if (artistOk && titleOk) {
                chosen = r;
                break;
            }

            // If only artist matches, check similarity with title to consider smaller variations
            if (artistOk) {
                const similarity = stringSimilarity(title, r.song_title || "");
                if (maxSimilarity < similarity) {
                    maxSimilarity = similarity;
                    chosen = r;
                }
            }

            //Fallback to title match if no artist match
            if (!chosen && titleOk && maxSimilarity === 0) chosen = r;
        }

        if (!chosen) return null;

        // if match by similarity, check if it's too low
        if (maxSimilarity > 0 && maxSimilarity < 70) return null;
        //endregion

        return {
            id: chosen.id,
            title: chosen.song_title || title,
            released_at: chosen.year || null,
            artists: chosen.artists || null,
            description: "This Music Video could not be identified.",
        };
    } catch (err) {
        console.error("Error IMVDb:", err);
        return null;
    }
}
