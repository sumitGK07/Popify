
# Popify 🎧

A music player website — dark UI, sidebar navigation, playlist
grids, a full now-playing bar (play/pause, next/prev, shuffle, repeat, seek,
volume, like), and live search.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure — sidebar, home/search/library views, now-playing bar |
| `style.css` | Spotify-style dark theme (lime accent, Space Grotesk + Inter type) |
| `script.js` | All player logic + the track/playlist data |
| `assets/images/` | Abstract album-cover art (generated placeholders, included) |
| `assets/songs/` | Where your MP3 files go (empty — see below) |

## Adding real audio

No audio files are bundled (I can't source or generate copyrighted music).
The player is fully wired up and ready — it just needs `.mp3` files. To hook
up real songs:

1. Drop your MP3s into `assets/songs/`.
2. Open `script.js` and look at the `TRACKS` array at the top. Each entry has
   an `src` field like `"assets/songs/neon-tide.mp3"` — either name your
   files to match, or edit the `src` values to point at your files.
3. Refresh the page. If a file is missing, Popify shows a small inline note
   next to the artist name instead of failing silently.

You can also edit `title`, `artist`, `album`, `duration` (seconds), and
`cover` (path to an image) for each track, and adjust the `PLAYLISTS` array
below it to group tracks however you like.

## Running it

No build step — just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Notes

- Liked songs persist in the browser via `localStorage`.
- Cover art is original placeholder SVGs — swap in your own images anytime
  by replacing files in `assets/images/` (keep the same filenames, or update
  the `cover` paths in `script.js`).
