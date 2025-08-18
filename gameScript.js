// Themes
const themes = {
  nature: ["🌎","🌷","🌼","🍄","☀️","❄️","🌕","☁️","🪐","🧊"],
  sports: ["⚽️","🏀","🏐","🎱","🎯","🎲","🎮","🎻","🎸","⚾️"],
  misc: ["🚗","🚕","🚙","📀","💿","⚙️","📷","🔴","🟡","♣️"]
};
let currentTheme = "nature";

// Game variables
let pre="", pID, ppID=0, turn=0, flip="rotateY(180deg)", flipBack="rotateY(0deg)";
let time, min=0, sec=0, moves=0, rem, noItems, mode;
let paused=false, items=[];

// Sounds
const flipSound = new Audio('sounds/click.mp3');
const matchSound = new Audio('sounds/match.mp3');
const winSound = new Audio('sound/win.mp3');
const buttonSound = new Audio('sounds/button.mp3');

// Init
window.onload = function() {
  showInstructions();
  document.getElementById("pauseBtn").onclick = togglePause;
  document.getElementById("restartBtn").onclick = () => start(...mode.split("x").map(Number));
  document.getElementById("themeToggle").onclick = toggleTheme;
  loadScores();
};

function showInstructions() {
  $("#ol").show().html(`
    <div id="inst">
      <h2>🎮 Matching Tiles</h2>
      <p><b>How to Play:</b></p>
      <ul style="text-align:left; max-width:400px; margin:0 auto;">
        <li>Click tiles to flip them.</li>
        <li>Match pairs to keep them open.</li>
        <li>Clear all pairs to win!</li>
      </ul>
      
      <p><b>Choose a Theme:</b></p>
      <div id="themeButtons">
        <button onclick="setTheme('nature')" id="theme-nature">🌱 Nature</button>
        <button onclick="setTheme('sports')" id="theme-sports">⚽ Sports</button>
        <button onclick="setTheme('misc')" id="theme-misc">🎲 Misc</button>
      </div>

      <p><b>Then Select Difficulty:</b></p>
      <div id="difficultyButtons">
        <button onclick="start(3,4)">3x4</button>
        <button onclick="start(4,4)">4x4</button>
        <button onclick="start(4,5)">4x5</button>
        <button onclick="start(5,6)">5x6</button>
        <button onclick="start(6,6)">6x6</button>
      </div>
    </div>
  `);

  // Make sure the currently active theme is highlighted
  highlightTheme();
}

function setTheme(theme) {
  currentTheme = theme;
  buttonSound.play();
  highlightTheme();
}

function highlightTheme() {
  document.querySelectorAll("#themeButtons button").forEach(btn => {
    btn.style.background = "rgba(255,255,255,0.25)";
  });
  const active = document.getElementById("theme-" + currentTheme);
  if (active) {
    active.style.background = "limegreen";
    active.style.color = "#000";
    active.style.fontWeight = "bold";
  }
}

// Start game
function start(r,l) {
  clearInterval(time);
  min=0; sec=0; moves=0; turn=0; pre=""; pID=null; ppID=0;
  $("#time").html("Time: 00:00");
  $("#moves").html("Moves: 0");
  rem=r*l/2; noItems=rem; mode = r+"x"+l;

  // Items
  items = [];
  let pool = [...themes[currentTheme]];
  for (let i=0;i<noItems;i++) items.push(pool[i % pool.length]);
  items = [...items, ...items];
  shuffle(items);

  // Timer
  time = setInterval(function(){
    if(!paused){
      sec++;
      if(sec==60){ min++; sec=0; }
      let s = sec<10? "0"+sec: sec;
      let m = min<10? "0"+min: min;
      $("#time").html(`Time: ${m}:${s}`);
    }
  },1000);

  // Grid
  $("table").html("");
  let n=1;
  for(let i=0;i<r;i++){
    $("table").append("<tr>");
    for(let j=0;j<l;j++){
      $("table").append(`<td id='${n}' onclick="change(${n})"><div class='inner'><div class='front'></div><div class='back'><p>${items[n-1]}</p></div></div></td>`);
      n++;
    }
    $("table").append("</tr>");
  }

  $("#ol").fadeOut(500);
  updateProgress();
}

function shuffle(arr){
  let tmp, c, p = arr.length;
  while(--p){
    c = Math.floor(Math.random() * (p+1));
    tmp = arr[c];
    arr[c]=arr[p];
    arr[p]=tmp;
  }
}

// Flip logic
function change(x){
  if(paused) return;
  let i = "#"+x+" .inner";
  let b = "#"+x+" .inner .back";

  if(turn==2 || $(i).attr("flip")=="block" || ppID==x) return;

  $(i).css("transform", flip);
  flipSound.play();

  if(turn==1){
    turn=2;
    if(pre!=$(b).text()){
      setTimeout(function(){
        $(pID).css("transform", flipBack);
        $(i).css("transform", flipBack);
        ppID=0;
      },800);
    } else {
      rem--;
      matchSound.play();
      $("#"+x).addClass("matched");
      $(pID).closest("td").addClass("matched");
      $(i).attr("flip","block");
      $(pID).attr("flip","block");
      updateProgress();
    }
    setTimeout(function(){
      turn=0;
      moves++;
      $("#moves").html("Moves: "+moves);
    },850);
  } else {
    pre = $(b).text();
    ppID=x;
    pID = "#"+x+" .inner";
    turn=1;
  }

  if(rem==0) gameWon();
}

function gameWon(){
  clearInterval(time);
  winSound.play();
  confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });

  let finalTime = `${min}:${sec<10? "0"+sec: sec}`;
  saveScore(mode, moves, finalTime);

  setTimeout(function(){
    $("#ol").html(`
      <div id="inst">
        <h2>🎉 Congratulations!</h2>
        <p>You completed ${mode} in ${moves} moves.<br/>Time: ${finalTime}</p>
        <button onclick="start(3,4)">3x4</button>
        <button onclick="start(4,4)">4x4</button>
        <button onclick="start(4,5)">4x5</button>
        <button onclick="start(5,6)">5x6</button>
        <button onclick="start(6,6)">6x6</button>
      </div>
    `);
    $("#ol").fadeIn(700);
    loadScores();
  },1000);
}

// Pause/Resume
function togglePause(){
  paused=!paused;
  document.getElementById("pauseBtn").innerText = paused? "▶ Resume" : "⏸ Pause";
  buttonSound.play();
  if (paused) {
        bgMusic.pause();
    } else {
        bgMusic.play();
    }
}

// Theme toggle
function toggleTheme(){
  document.body.classList.toggle("light");
  buttonSound.play();
}

// Progress bar
function updateProgress(){
  let done = (noItems - rem)/noItems * 100;
  document.getElementById("progressBar").style.width = done+"%";
}

// Leaderboard
function saveScore(mode, moves, time){
  let scores = JSON.parse(localStorage.getItem("scores")) || [];
  scores.push({mode,moves,time,date:new Date().toLocaleString()});
  scores = scores.slice(-5);
  localStorage.setItem("scores", JSON.stringify(scores));
}
function loadScores(){
  let scores = JSON.parse(localStorage.getItem("scores")) || [];
  let list = document.getElementById("scoresList");
  list.innerHTML="";
  scores.forEach(s=>{
    let li=document.createElement("li");
    li.textContent=`${s.mode} - ${s.moves} moves in ${s.time} (${s.date})`;
    list.appendChild(li);
  });
}
// ===== BACKGROUND MUSIC =====
const bgMusic = new Audio('sounds/bg-music.mp3');
bgMusic.loop = true;      // Loop the music
bgMusic.volume = 0.4;     // Adjust volume

// Start music on first user interaction (to avoid browser autoplay restrictions)
document.addEventListener('click', function startMusic() {
    bgMusic.play();
    document.removeEventListener('click', startMusic);
});