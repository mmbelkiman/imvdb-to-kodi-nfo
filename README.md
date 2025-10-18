A command-line tool that automatically generates Kodi-compatible .nfo files for your music videos.
It fetches metadata from IMVDB and TheAudioDB
creating clean and fully formatted .nfo files ready for Kodi’s music video library.
---

## ✨ Features

- 🧠 Automatically detects artist and title from the video filename
- 🎥 Fetches detailed metadata (director, release date, labels, etc.) from IMVDB
- 🎵 Enriches artist and album info using TheAudioDB
- 💾 Generates Kodi-compatible .nfo files next to each video
- 🔁 Skips files that already have .nfo files
- 🧩 Logs all operations and creates a detailed log.txt 
- ⚙️ Configurable via .env file
---

## ⚙️ Requirements

- Node.js v18+
- A free API key from IMVDB
- Internet connection to fetch metadata
 
## 📦 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/mmbelkiman/imvdb-to-kodi-nfo.git
cd imvdb-to-kodi-nfo
npm install
```

### Setup

Before running the tool, you must create a .env file based on the provided example.
```bash 
cp .env.example .env
```

Edit `.env` and add your IMVDB API key.
You can obtain it by creating a free account at imvdb.com

### Running
Run the CLI tool with the path to your music videos folder:
```bash
npm start -- "/path/to/music-videos"
```
The script will:
- Scan all video files inside the folder.
- Fetch metadata for each one.
- Create a .nfo file next to the video (only if it doesn’t already exist).
- Generate a log.txt summarizing the whole operation.

For a file like:

`/MusicVideos/Adele - Rolling in the Deep.mp4`

The tool will generate:

`/MusicVideos/Adele - Rolling in the Deep.nfo`

### Notes

The filename must follow the format:
`Artist - Title.ext` (e.g., `Muse - Uprising.mp4`)

Files without this pattern will be skipped.

Video extensions supported: `.mp4`, `.avi`, `.mpg`, `.mpeg`, `.mov`, `mkv`
