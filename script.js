// ==================== CONFIG ====================
const FALL_DURATION_MS = 2000;    // deve casar com a animação CSS
const HIT_LINE_PERCENT = 0.85;    // posição da hit-line (85% da altura do jogo)
const PERFECT_WINDOW  = 35;       // px da hit-line → PERFECT
const GOOD_WINDOW     = 65;       // px → GOOD
const BAD_WINDOW      = 100;      // px → BAD

// ==================== STATE ====================
let actualSong;
let audio;
let startTime;
let score    = 0;
let combo    = 0;
let gameRunning = false;
let keysHeld    = {};   // teclas atualmente pressionadas
let animId;

const scoreText    = document.getElementById("score");
const feedbackText = document.getElementById("feedback");
const rankingList  = document.getElementById("ranking");
const selector     = document.getElementById("songSelector");
const game         = document.getElementById("game");
const hitLine      = document.querySelector(".hit-line");

// ==================== NOTES GENERATION ====================
function generateNotes(bpm, totalBeats) {
  const keys      = ["a", "s", "d", "f"];
  const notes     = [];
  const beatMs    = 60000 / bpm;
  const divisions = [1, 0.5];   // batida inteira, colcheia, semicolcheia seria 0.25, mas fica muito difícil
  let   beat      = 4;                 // começa depois de 4 batidas (intro)

  while (beat < totalBeats) {
    const div  = divisions[Math.floor(Math.random() * divisions.length)];
    const isLong = div >= 1 && Math.random() < 0.2;
    notes.push({
      time:     beat * beatMs,
      keyw:     keys[Math.floor(Math.random() * keys.length)],
      duration: isLong ? beatMs * 2 : 0,
      hit:      false,
      created:  false,
      element:  null,
      holdActive: false,
      holdInterval: null
    });
    beat += div;
  }

  return notes;
}

// ==================== SONGS ====================
const songs = [
  {
    name:       "Electro World",
    file:       "Assets/Music/Electro World - Perfume.mp3",
    bpm:        100,
    totalBeats: 200,
    notes:      null   
  },
  {
    name:       "Join Me In Death",
    file:       "Assets/Music/Join Me In Death.mp3",
    bpm:        86,
    totalBeats: 180,
    notes:      null
  },
  {
    name:       "HEADBANGER",
    file:       "Assets/Music/BABYMETAL - Headbanger.mp3",
    bpm:        110,
    totalBeats: 180,
    notes:      null    
  },
  {
    name:       "TikTok",
    file:       "Assets/Music/Tik Tok (Kesha).mp3",
    bpm:        113,
    totalBeats: 180,
    notes:      null    
  }
];

songs.forEach((song, index) => {
  const option = document.createElement("option");
  option.value = index;
  option.textContent = song.name;
  selector.appendChild(option);
});

// ==================== INPUT ====================
document.addEventListener("keydown", (e) => {
  if (!gameRunning) return;
  const key = e.key.toLowerCase();
  if (keysHeld[key]) return;   // ignora auto-repeat do SO
  keysHeld[key] = true;
  verifyHit(key);
});

document.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  keysHeld[key] = false;
  // encerra hold de qualquer nota longa dessa tecla
  if (actualSong) {
    actualSong.notes.forEach(note => {
      if (note.keyw === key && note.holdActive) {
        endHold(note);
      }
    });
  }
});

// ==================== HIT DETECTION ====================
function getHitLineY() {
  return hitLine.getBoundingClientRect().top;
}

function verifyHit(key) {
  const lineY = getHitLineY();

  const candidates = actualSong.notes.filter(n =>
    n.keyw === key && !n.hit && n.element
  );

  if (candidates.length === 0) {
    showFeedback("MISS", false);
    combo = 0;
    updateScore();
    return;
  }

  // ordena pela proximidade com a hit-line
  candidates.sort((a, b) => {
    const da = Math.abs(a.element.getBoundingClientRect().top - lineY);
    const db = Math.abs(b.element.getBoundingClientRect().top - lineY);
    return da - db;
  });

  const note     = candidates[0];
  const noteRect = note.element.getBoundingClientRect();
  const distance = Math.abs(noteRect.top - lineY);

  if (distance <= PERFECT_WINDOW) {
    showFeedback(".✦ ݁˖PERFECT!.✦ ݁˖", true);
    score += 5 * (1 + combo * 0.1);
    combo++;
    markHit(note, true);

  } else if (distance <= GOOD_WINDOW) {
    showFeedback(".ᐟ.ᐟGOOD!.ᐟ.ᐟ", true);
    score += 3 * (1 + combo * 0.05);
    combo++;
    markHit(note, true);

  } else if (distance <= BAD_WINDOW) {
    showFeedback("BAD", false);
    combo = 0;
    markHit(note, false);

  } else {
    showFeedback("MISS", false);
    combo = 0;
  }

  updateScore();
}

function markHit(note, success) {
  note.hit = true;
  hitEffect(note.element.parentElement, success);

  if (note.duration > 0 && success) {
    // inicia hold
    startHold(note);
  } else {
    note.element.remove();
    note.element = null;
  }
}

/*/ ==================== HOLD NOTES ====================
function startHold(note) {
  if (!note.element) return;
  note.holdActive  = true;
  note.element.classList.add("hold-active");

  // enquanto mantiver pressionado, pontua a cada 100 ms
  note.holdInterval = setInterval(() => {
    if (!keysHeld[note.keyw] || !note.holdActive) {
      endHold(note);
      return;
    }
    score += 0.5;
    combo++;
    updateScore();
  }, 100);

  // encerra automaticamente quando a duração da nota acabar
  setTimeout(() => endHold(note), note.duration);
}

function endHold(note) {
  if (!note.holdActive) return;
  note.holdActive = false;
  clearInterval(note.holdInterval);
  if (note.element) {
    note.element.remove();
    note.element = null;
  }
}
*/

// ==================== FEEDBACK ====================
let feedbackTimer;
function showFeedback(text, good) {
  feedbackText.textContent = text;
  feedbackText.style.color = good ? "#0ff" : "#f55";
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => feedbackText.textContent = "", 600);
}

function hitEffect(column, success) {
  column.style.background = success ? "rgba(0,255,255,0.25)" : "rgba(255,80,80,0.2)";
  setTimeout(() => column.style.background = "", 150);
}

// ==================== CREATE NOTE ====================
function createNote(noteData) {
  const column = document.querySelector(`.column[data-key="${noteData.keyw}"]`);
  if (!column) return;

  const note = document.createElement("div");
  note.classList.add("note");

  /*if (noteData.duration > 0) {
    note.classList.add("long-note");
    // altura proporcional à duração relativa ao tempo de queda
    const extraHeight = (noteData.duration / FALL_DURATION_MS) * column.clientHeight;
    note.style.height = Math.min(extraHeight, 120) + "px";
  }*/

  column.appendChild(note);
  noteData.element = note;

  // remove automaticamente se não for acertada
  const removeDelay = FALL_DURATION_MS + noteData.duration + 200;
  setTimeout(() => {
    if (!noteData.hit) {
      combo = 0;
      updateScore();
    }
    if (noteData.element === note) {
      note.remove();
      noteData.element = null;
    }
  }, removeDelay);
}

// ==================== GAME LOOP ====================
function gameLoop() {
  if (!gameRunning) return;

  const elapsed = Date.now() - startTime;

  actualSong.notes.forEach(note => {
    if (!note.created && elapsed >= note.time) {
      createNote(note);
      note.created = true;
    }
  });

  animId = requestAnimationFrame(gameLoop);
}

// ==================== SCORE ====================
function updateScore() {
  scoreText.textContent = "Score: " + Math.floor(score) + " | Combo: " + combo;
}

// ==================== Total Beats ==================
function getTotalBeatsFromDuration(durationSec, bpm) {
  const beatMs = 60000 / bpm;
  const durationMs = durationSec * 1000;
  return durationMs / beatMs;
}

// ==================== START ====================
function startGame() {
  document.getElementById("endScreen").style.display = "none";
  game.style.display = "flex";

  score = 0;
  combo = 0;
  keysHeld = {};
  cancelAnimationFrame(animId);

  feedbackText.textContent = "";
  updateScore();

  document.querySelectorAll(".note").forEach(n => n.remove());

  actualSong = songs[selector.value];
  if (!actualSong) return;

  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  audio = new Audio(actualSong.file);

  // ⚠️ AGORA ESPERA CARREGAR A DURAÇÃO REAL
  audio.onloadedmetadata = () => {
    const duration = audio.duration; // segundos

    // calcula quantos beats cabem na música
    const totalBeats = getTotalBeatsFromDuration(duration, actualSong.bpm);

    // gera notas com base na duração real
    actualSong.notes = generateNotes(actualSong.bpm, totalBeats);

    startTime = Date.now();
    gameRunning = true;

    audio.play().catch(() => {});

    // termina quando a música terminar
    audio.onended = endGame;

    gameLoop();
  };
}

// ==================== LETTER GRADE ====================
function getGrade(finalScore, totalNotes) {
  // usa a pontuação máxima possível (todas PERFECT) como referência
  const maxScore = totalNotes * 5;
  const ratio = maxScore > 0 ? finalScore / maxScore : 0;

  if (ratio >= 0.95) return "SSS";
  if (ratio >= 0.80) return "S";
  if (ratio >= 0.65) return "A";
  if (ratio >= 0.45) return "B";
  return "C";
}

// ==================== END ====================
function endGame() {
  gameRunning = false;
  cancelAnimationFrame(animId);
  if (audio) audio.pause();

  // remove notas que ainda estão na tela
  document.querySelectorAll(".note").forEach(n => n.remove());

  const finalScore = Math.floor(score);
  const grade      = getGrade(finalScore, actualSong.notes.length);

  const data = JSON.parse(localStorage.getItem("ranking")) || [];
  data.push({ 
    song: actualSong.name, 
    score: finalScore,
    grade: grade
  });
  data.sort((a, b) => b.score - a.score);
  localStorage.setItem("ranking", JSON.stringify(data));

  renderRanking();

  document.getElementById("finalScore").textContent =
    "Score final: " + finalScore + "  |  TIMEOUT: " + grade;
  document.getElementById("endScreen").style.display = "block";
}

// ==================== RANKING ====================
function renderRanking() {
  const data = JSON.parse(localStorage.getItem("ranking")) || [];
  rankingList.innerHTML = "";
  data.slice(0, 10).forEach((item, i) => {
    const li = document.createElement("li");
    const gradeSpan = document.createElement("span");
    gradeSpan.textContent = " " + item.grade;

    // aplica classe baseada na letra
    gradeSpan.classList.add("grade-" + item.grade);

    li.innerHTML = `${i + 1}. ${item.song} - ${item.score} `;
    li.appendChild(gradeSpan);
    rankingList.appendChild(li);
  });
}

renderRanking();