/* =========================================================
   POPIFY — data + player
   To hear real audio: drop matching .mp3 files into
   assets/songs/ using the filenames referenced below
   (or edit the `src` fields to point at your own files).
   ========================================================= */

const TRACKS = [
  { id: "1", Title: "Dracula (JENNIE Remix)",            artist: "Tame Impala",   album: "Dracula (Remix)",            duration: 330, cover: "assets/images/image1.jpg",            src: "assets/songs/Dracula (JENNIE Remix).mp3" },
  { id: "2", Title: "Fanaa by Sevashi",          artist: "SEVASHI",   album: "Fanaa",           duration: 346, cover: "assets/images/image2.jpg",          src: "assets/songs/Fanaa by Sevashi.mp3" },
  { id: "3", Title: "Let it happen",         artist: "Tame Impala",       album: "Let it happen",          duration: 747, cover: "assets/images/image3.jpg",         src: "assets/songs/Let it happen.mp3" },
  { id: "4", Title: "Long Way From House",           artist: "MC SQUARE",      album: "Long Way From House",             duration: 418, cover: "assets/images/image4.jpg",           src: "assets/songs/Long Way From House.mp3" },
  { id: "5", Title: "Moth to the Flame(with the weekend)",            artist: "Swedish House Mafia, The Weeknd",       album: "Dawn FM",              duration: 354, cover: "assets/images/image5.jpg",            src: "assets/songs/Moth to the Flame.mp3" },
  { id: "6", Title: "Powerhouse Tamil from (Coolie)",           artist: "Anirudh Ravichander, Arivu",    album: "Powerhouse (From Coolie) (Tamil)",             duration: 326, cover: "assets/images/image6.jpg",           src: "assets/songs/Powerhouse Tamil from (Coolie).mp3" },
];

const PLAYLISTS = [
  {Name: "Tame Impala",  cover: "assets/images/image3.jpg",   id: "1,3", Title: "Dracula (JENNIE Remix), Let it happen" },
  {Name: "The Weeknd",   cover: "assets/images/image5.jpg",   id: "5",  Title: "Moth to the Flame(with the weekend)" },
  {Name: "SEVASHI",    cover: "assets/images/image7.jpg",    id: "2", Title: "Fanaa by Sevashi" },
  {Name: "Anirudh Hits",    cover: "assets/images/image8.jpg",   id: "6", Title: "Powerhouse Tamil from (Coolie)" },
];

const LIKED_KEY = "popify_liked_ids";
let liked = new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || "[]"));

function saveLiked(){ localStorage.setItem(LIKED_KEY, JSON.stringify([...liked])); }
function trackById(id){ return TRACKS.find(t => t.id === id); }
function fmtTime(sec){
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* ---------------- Player state ---------------- */
const audio = document.getElementById("audio");
let queue = [...TRACKS];      // the currently active list of tracks to play through
let queueIndex = -1;
let isShuffled = false;
let repeatMode = "off";       // off | all | one
let currentAudioFailed = false;

const els = {
  npCoverImg: document.getElementById("npCoverImg"),
  npCover: document.getElementById("npCover"),
  npTitle: document.getElementById("npTitle"),
  npArtist: document.getElementById("npArtist"),
  likeBtn: document.getElementById("likeBtn"),
  playBtn: document.getElementById("playBtn"),
  playIcon: document.getElementById("playIcon"),
  pauseIcon: document.getElementById("pauseIcon"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  shuffleBtn: document.getElementById("shuffleBtn"),
  repeatBtn: document.getElementById("repeatBtn"),
  progressTrack: document.getElementById("progressTrack"),
  progressFill: document.getElementById("progressFill"),
  progressHandle: document.getElementById("progressHandle"),
  curTime: document.getElementById("curTime"),
  durTime: document.getElementById("durTime"),
  volTrack: document.getElementById("volTrack"),
  volFill: document.getElementById("volFill"),
  volHandle: document.getElementById("volHandle"),
  eq: document.getElementById("eqIndicator"),
};

function currentTrack(){ return queueIndex >= 0 ? queue[queueIndex] : null; }

function loadTrack(index, autoplay = true){
  if (index < 0 || index >= queue.length) return;
  queueIndex = index;
  const t = queue[queueIndex];
  currentAudioFailed = false;

  els.npCoverImg.src = t.cover;
  els.npCoverImg.alt = `${t.album} cover`;
  els.npTitle.textContent = t.title;
  els.npArtist.textContent = t.artist;
  els.likeBtn.classList.toggle("is-liked", liked.has(t.id));
  els.durTime.textContent = fmtTime(t.duration);
  els.progressFill.style.width = "0%";
  els.progressHandle.style.left = "0%";
  els.curTime.textContent = "0:00";

  audio.src = t.src;
  highlightActiveRow(t.id);

  if (autoplay){
    audio.play().catch(() => { currentAudioFailed = true; showPlaybackNotice(t); });
  }
}

function showPlaybackNotice(t){
  // Friendly, one-time-per-track notice when the mp3 file isn't present.
  els.npArtist.textContent = `${t.artist} · add ${t.src.split("/").pop()} to hear it`;
}

function playQueue(list, startIndex){
  queue = [...list];
  loadTrack(startIndex, true);
  setPlayingUI(true);
}

function playTrackById(id, contextList){
  const list = contextList || TRACKS;
  const idx = list.findIndex(t => t.id === id);
  if (idx === -1) return;
  playQueue(list, idx);
}

function togglePlay(){
  if (!currentTrack()){
    playQueue(TRACKS, 0);
    return;
  }
  if (audio.paused){
    audio.play().catch(() => { currentAudioFailed = true; showPlaybackNotice(currentTrack()); });
  } else {
    audio.pause();
  }
}

function setPlayingUI(playing){
  els.playIcon.hidden = playing;
  els.pauseIcon.hidden = !playing;
  els.eq.classList.toggle("is-playing", playing);
  els.npCover.classList.toggle("is-spinning", playing);
}

function goNext(userInitiated = false){
  if (!queue.length) return;
  if (repeatMode === "one" && !userInitiated){
    loadTrack(queueIndex, true);
    return;
  }
  let next = queueIndex + 1;
  if (next >= queue.length){
    if (repeatMode === "all"){ next = 0; }
    else { setPlayingUI(false); return; }
  }
  loadTrack(next, true);
}

function goPrev(){
  if (!queue.length) return;
  if (audio.currentTime > 3){ audio.currentTime = 0; return; }
  let prev = queueIndex - 1;
  if (prev < 0) prev = repeatMode === "all" ? queue.length - 1 : 0;
  loadTrack(prev, true);
}

function toggleShuffle(){
  isShuffled = !isShuffled;
  els.shuffleBtn.classList.toggle("is-on", isShuffled);
  const current = currentTrack();
  if (isShuffled){
    const rest = queue.filter((_, i) => i !== queueIndex);
    for (let i = rest.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    queue = current ? [current, ...rest] : rest;
    queueIndex = current ? 0 : -1;
  }
}

function cycleRepeat(){
  repeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
  els.repeatBtn.classList.toggle("is-on", repeatMode !== "off");
  els.repeatBtn.title = repeatMode === "one" ? "Repeat one" : repeatMode === "all" ? "Repeat all" : "Repeat";
}

function toggleLike(id){
  if (liked.has(id)) liked.delete(id); else liked.add(id);
  saveLiked();
  renderAll();
  const t = currentTrack();
  if (t && t.id === id) els.likeBtn.classList.toggle("is-liked", liked.has(id));
}

/* ---------------- Progress / volume ---------------- */
audio.addEventListener("timeupdate", () => {
  const dur = currentTrack()?.duration || audio.duration || 0;
  const pct = dur ? (audio.currentTime / dur) * 100 : 0;
  els.progressFill.style.width = `${pct}%`;
  els.progressHandle.style.left = `${pct}%`;
  els.curTime.textContent = fmtTime(audio.currentTime);
});
audio.addEventListener("loadedmetadata", () => {
  if (isFinite(audio.duration)) els.durTime.textContent = fmtTime(audio.duration);
});
audio.addEventListener("play", () => setPlayingUI(true));
audio.addEventListener("pause", () => setPlayingUI(false));
audio.addEventListener("ended", () => goNext(false));
audio.addEventListener("error", () => {
  if (currentTrack()){ currentAudioFailed = true; showPlaybackNotice(currentTrack()); }
  setPlayingUI(false);
});

function scrubTo(clientX, track, applyFn){
  const rect = track.getBoundingClientRect();
  let pct = (clientX - rect.left) / rect.width;
  pct = Math.min(1, Math.max(0, pct));
  applyFn(pct);
}
els.progressTrack.addEventListener("click", (e) => {
  scrubTo(e.clientX, els.progressTrack, (pct) => {
    const dur = currentTrack()?.duration || audio.duration || 0;
    if (dur){ audio.currentTime = pct * dur; }
  });
});

audio.volume = 0.7;
els.volFill.style.width = "70%";
els.volHandle.style.left = "70%";
els.volTrack.addEventListener("click", (e) => {
  scrubTo(e.clientX, els.volTrack, (pct) => {
    audio.volume = pct;
    els.volFill.style.width = `${pct * 100}%`;
    els.volHandle.style.left = `${pct * 100}%`;
  });
});

/* ---------------- Rendering ---------------- */
function highlightActiveRow(trackId){
  document.querySelectorAll(".track-row").forEach(row => {
    row.classList.toggle("is-active", Number(row.dataset.id) === trackId);
  });
}

function trackRowHTML(t, idx){
  const isLiked = liked.has(t.id);
  return `
  <button class="track-row" data-id="${t.id}" role="row">
    <span class="t-idx">
      <span class="idx-num">${idx}</span>
      <svg class="row-play-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l15 8-15 8z"/></svg>
    </span>
    <span class="t-main">
      <img src="${t.cover}" alt="">
      <span class="t-text">
        <span class="t-title">${t.title}</span>
        <span class="t-artist">${t.artist}</span>
      </span>
    </span>
    <span class="t-album">${t.album}</span>
    <span class="t-dur">${fmtTime(t.duration)}</span>
    <button class="t-like ${isLiked ? "is-liked" : ""}" data-like-id="${t.id}" title="Save">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.35-9.5-9A5.5 5.5 0 0112 5.5 5.5 5.5 0 0121.5 11c-2.5 4.65-9.5 9-9.5 9z" stroke="currentColor" stroke-width="1.7"/></svg>
    </button>
  </button>`;
}

function attachRowHandlers(container, list){
  container.querySelectorAll(".track-row").forEach(row => {
    row.addEventListener("click", (e) => {
      if (e.target.closest(".t-like")) return;
      playTrackById(Number(row.dataset.id), list);
    });
  });
  container.querySelectorAll(".t-like").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLike(Number(btn.dataset.likeId));
    });
  });
}

function renderQuickGrid(){
  const grid = document.getElementById("quickGrid");
  const items = [
    { name: "Liked Songs", cover: "assets/images/echo-district.svg", isLiked: true },
    ...PLAYLISTS.slice(0, 5),
  ];
  grid.innerHTML = items.map(p => `
    <button class="quick-card" data-open="${p.isLiked ? "liked" : p.id}">
      <img src="${p.cover}" alt="">
      <span>${p.name}</span>
    </button>`).join("");
  grid.querySelectorAll(".quick-card").forEach(btn => {
    btn.addEventListener("click", () => openPlaylist(btn.dataset.open));
  });
}

function renderMadeForYou(){
  const grid = document.getElementById("madeForYouGrid");
  grid.innerHTML = PLAYLISTS.map(p => `
    <button class="media-card" data-open="${p.id}">
      <div class="art-wrap">
        <img src="${p.cover}" alt="${p.name}">
        <span class="card-play-btn" data-play="${p.id}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l15 8-15 8z"/></svg>
        </span>
      </div>
      <h3>${p.name}</h3>
      <p>${p.description}</p>
    </button>`).join("");
  grid.querySelectorAll(".media-card").forEach(card => {
    card.addEventListener("click", () => openPlaylist(card.dataset.open));
  });
  grid.querySelectorAll("[data-play]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const pl = PLAYLISTS.find(p => p.id === btn.dataset.play);
      const list = pl.trackIds.map(trackById);
      playQueue(list, 0);
    });
  });
}

function renderAlbums(){
  const grid = document.getElementById("albumsGrid");
  grid.innerHTML = TRACKS.map(t => `
    <button class="media-card" data-play-single="${t.id}">
      <div class="art-wrap">
        <img src="${t.cover}" alt="${t.album}">
        <span class="card-play-btn" data-play="${t.id}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l15 8-15 8z"/></svg>
        </span>
      </div>
      <h3>${t.album}</h3>
      <p>${t.artist}</p>
    </button>`).join("");
  grid.querySelectorAll(".media-card").forEach(card => {
    card.addEventListener("click", () => playTrackById(Number(card.dataset.playSingle), TRACKS));
  });
}

function renderSidebarPlaylists(){
  const list = document.getElementById("playlistList");
  const items = [
    { id: "liked", name: "Liked Songs", cover: "assets/images/echo-district.svg", sub: `${liked.size} songs` },
    ...PLAYLISTS.map(p => ({ id: p.id, name: p.name, cover: p.cover, sub: "Playlist" })),
  ];
  list.innerHTML = items.map(p => `
    <li class="playlist-item" data-open="${p.id}">
      <img class="pl-thumb" src="${p.cover}" alt="">
      <span class="pl-info"><b>${p.name}</b><span>${p.sub}</span></span>
    </li>`).join("");
  list.querySelectorAll(".playlist-item").forEach(li => {
    li.addEventListener("click", () => openPlaylist(li.dataset.open));
  });
}

function openPlaylist(id){
  switchView("library");
  const header = document.getElementById("playlistHeader");
  const trackContainer = document.getElementById("libraryTracks");
  let list, name, cover, description, eyebrow;

  if (id === "liked"){
    list = TRACKS.filter(t => liked.has(t.id));
    name = "Liked Songs"; cover = "assets/images/echo-district.svg";
    description = `${list.length} liked song${list.length === 1 ? "" : "s"}`;
    eyebrow = "Playlist";
  } else {
    const pl = PLAYLISTS.find(p => p.id === id);
    if (!pl) return;
    list = pl.trackIds.map(trackById);
    name = pl.name; cover = pl.cover; description = pl.description; eyebrow = "Playlist";
  }

  header.innerHTML = `
    <img src="${cover}" alt="">
    <div class="ph-meta">
      <span class="eyebrow">${eyebrow}</span>
      <h1>${name}</h1>
      <p>${description}</p>
    </div>`;

  trackContainer.innerHTML = list.length
    ? list.map((t, i) => trackRowHTML(t, i + 1)).join("")
    : `<p class="hint">Nothing here yet. Heart a song to save it to Liked Songs.</p>`;
  attachRowHandlers(trackContainer, list);
  highlightActiveRow(currentTrack()?.id);

  document.querySelectorAll(".playlist-item").forEach(li => li.classList.toggle("is-active", li.dataset.open === id));
}

function renderAll(){
  renderQuickGrid();
  renderMadeForYou();
  renderAlbums();
  renderSidebarPlaylists();
}

/* ---------------- Search ---------------- */
const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  switchView("search");
  const hint = document.getElementById("searchHint");
  const results = document.getElementById("searchResults");
  if (!q){
    hint.hidden = false;
    results.innerHTML = "";
    return;
  }
  hint.hidden = true;
  const matches = TRACKS.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.artist.toLowerCase().includes(q) ||
    t.album.toLowerCase().includes(q)
  );
  results.innerHTML = matches.length
    ? matches.map((t, i) => trackRowHTML(t, i + 1)).join("")
    : `<p class="hint">No results for "${q}".</p>`;
  attachRowHandlers(results, matches);
  highlightActiveRow(currentTrack()?.id);
});
searchInput.addEventListener("focus", () => switchView("search"));

/* ---------------- Views / nav ---------------- */
function switchView(view){
  document.querySelectorAll(".view").forEach(v => v.hidden = true);
  document.getElementById(`view-${view}`).hidden = false;
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("is-active", b.dataset.view === view));
}
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

/* ---------------- Wire up controls ---------------- */
els.playBtn.addEventListener("click", togglePlay);
els.nextBtn.addEventListener("click", () => goNext(true));
els.prevBtn.addEventListener("click", goPrev);
els.shuffleBtn.addEventListener("click", toggleShuffle);
els.repeatBtn.addEventListener("click", cycleRepeat);
els.likeBtn.addEventListener("click", () => { const t = currentTrack(); if (t) toggleLike(t.id); });

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.activeElement.tagName !== "INPUT"){
    e.preventDefault();
    togglePlay();
  }
});

/* ---------------- Greeting ---------------- */
function setGreeting(){
  const h = new Date().getHours();
  const g = h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  document.getElementById("greeting").textContent = g;
}

/* ---------------- Init ---------------- */
setGreeting();
renderAll();
switchView("home");
