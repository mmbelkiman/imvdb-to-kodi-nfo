export interface TheAudioDBTrack {
    /**Music Title*/
    strTrack: string;
    idTrack: string;

    /**Album Title*/
    strAlbum: string;
    idAlbum: string | null,

    /**Artist Name*/
    strArtist: string | null,
    idArtist:  string | null,

    strGenre: string;
    strStyle: string;
    strDescriptionEN: string;
    intYearReleased: string;

    idLyric: string,
    idIMVDB: string | null,
    strArtistAlternate: string | null,
    intCD: string | null,
    intDuration: string | null,
    strMood: string | null,
    strTheme: string | null,
    strMusicVid: string |null,
    strMusicVidDirector: string | null,
    strMusicVidCompany: string | null,
}

export interface TheAudioDBResponse {
    track?: TheAudioDBTrack[];
}

export async function fetchTrackInfoFromTheAudioDB(
    artistName: string,
    trackTitle: string
): Promise<TheAudioDBTrack | undefined> {
    if (!artistName || !trackTitle) {
        console.warn("⚠️ Missing artist or track name for TheAudioDB lookup.");
        return undefined;
    }

    const encodedArtist = encodeURIComponent(artistName);
    const encodedTrack = encodeURIComponent(trackTitle);
    const url = `https://theaudiodb.com/api/v1/json/2/searchtrack.php?s=${encodedArtist}&t=${encodedTrack}`;

    try {
        const res = await fetch(url);
        const data = (await res.json()) as TheAudioDBResponse;

        const track = data?.track?.[0];
        if (!track) {
            return undefined;
        }

        return track;
    } catch (err) {
        console.error(" ❌ Error fetching from TheAudioDB:", err);
        return undefined;
    }
}
