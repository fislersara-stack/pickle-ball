const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const leftScoreEl = document.getElementById('left-score');
const rightScoreEl = document.getElementById('right-score');
const statusTextEl = document.getElementById('status-text');
const winnerTextEl = document.getElementById('winner-text');
const finalScoreTextEl = document.getElementById('final-score-text');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const WIN_SCORE = 7;
let animationId = null;
let running = false;

const state = {
  leftScore: 0,
  rightScore: 0,
  leftPaddle: { x: 18, y: 220, w: 14, h: 92 },
  rightPaddle: { x: 328, y: 220, w: 14, h: 92 },
  ball: { x: 180, y: 270, vx: 3.2, vy: 2.2, r: 18 },
};

function showScreen(screen) {
  [startScreen, gameScreen, gameOverScreen].forEach(el => el.classList.remove('active'));
  screen.classList.add('active');
}

function resetBall(direction = 1) {
  state.ball.x = canvas.width / 2;
  state.ball.y = canvas.height / 2;
  state.ball.vx = 3.2 * direction;
  state.ball.vy = (Math.random() * 3 - 1.5) || 1.4;
  statusTextEl.textContent = direction > 0 ? 'Your serve return!' : 'Computer serves!';
}

function resetGame() {
  state.leftScore = 0;
  state.rightScore = 0;
  state.leftPaddle.y = 220;
  state.rightPaddle.y = 220;
  updateScore();
  resetBall(Math.random() > 0.5 ? 1 : -1);
}

function updateScore() {
  leftScoreEl.textContent = state.leftScore;
  rightScoreEl.textContent = state.rightScore;
}

function clampPaddle(paddle) {
  paddle.y = Math.max(0, Math.min(canvas.height - paddle.h, paddle.y));
}

function moveComputer() {
  const target = state.ball.y - state.leftPaddle.h / 2;
  const diff = target - state.leftPaddle.y;
  state.leftPaddle.y += Math.sign(diff) * Math.min(Math.abs(diff), 3.2);
  clampPaddle(state.leftPaddle);
}

function intersects(paddle, ball) {
  return (
    ball.x - ball.r < paddle.x + paddle.w &&
    ball.x + ball.r > paddle.x &&
    ball.y - ball.r < paddle.y + paddle.h &&
    ball.y + ball.r > paddle.y
  );
}

function bounceOffPaddle(paddle, isRight) {
  const relativeIntersectY = (paddle.y + paddle.h / 2) - state.ball.y;
  const normalized = relativeIntersectY / (paddle.h / 2);
  state.ball.vx = (isRight ? -1 : 1) * Math.min(Math.abs(state.ball.vx) + 0.25, 7.2);
  state.ball.vy = -normalized * 4.8;
  statusTextEl.textContent = isRight ? 'Nice return!' : 'Computer got it!';
}

function scorePoint(side) {
  if (side === 'left') {
    state.leftScore += 1;
    statusTextEl.textContent = 'Computer scores!';
    resetBall(1);
  } else {
    state.rightScore += 1;
    statusTextEl.textContent = 'You score!';
    resetBall(-1);
  }
  updateScore();

  if (state.leftScore >= WIN_SCORE || state.rightScore >= WIN_SCORE) {
    endGame();
  }
}

function endGame() {
  running = false;
  cancelAnimationFrame(animationId);
  winnerTextEl.textContent = state.rightScore > state.leftScore ? 'You Win!' : 'Computer Wins';
  finalScoreTextEl.textContent = `Final Score: You ${state.rightScore} - ${state.leftScore} Computer`;
  showScreen(gameOverScreen);
}

function drawCourt() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#8fc175';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 12);
  ctx.lineTo(canvas.width / 2, canvas.height - 12);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#fff6da';
  [state.leftPaddle, state.rightPaddle].forEach(p => {
    ctx.fillRect(p.x, p.y, p.w, p.h);
  });

  drawPickleSlice(state.ball.x, state.ball.y, state.ball.r);
}

function drawPickleSlice(x, y, r) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#5e8c3b';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#98c55c';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#cfe59a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 / 6) * i;
    const sx = Math.cos(angle) * 5;
    const sy = Math.sin(angle) * 5;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 3.5, 6, angle, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function update() {
  if (!running) return;

  moveComputer();

  state.ball.x += state.ball.vx;
  state.ball.y += state.ball.vy;

  if (state.ball.y - state.ball.r <= 0 || state.ball.y + state.ball.r >= canvas.height) {
    state.ball.vy *= -1;
  }

  if (intersects(state.leftPaddle, state.ball) && state.ball.vx < 0) {
    bounceOffPaddle(state.leftPaddle, false);
  }

  if (intersects(state.rightPaddle, state.ball) && state.ball.vx > 0) {
    bounceOffPaddle(state.rightPaddle, true);
  }

  if (state.ball.x + state.ball.r < 0) {
    scorePoint('right');
  }

  if (state.ball.x - state.ball.r > canvas.width) {
    scorePoint('left');
  }

  drawCourt();
  animationId = requestAnimationFrame(update);
}

function startGame() {
  resetGame();
  showScreen(gameScreen);
  running = true;
  cancelAnimationFrame(animationId);
  drawCourt();
  animationId = requestAnimationFrame(update);
}

function setPlayerPaddle(clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleY = canvas.height / rect.height;
  const y = (clientY - rect.top) * scaleY;
  state.rightPaddle.y = y - state.rightPaddle.h / 2;
  clampPaddle(state.rightPaddle);
}

canvas.addEventListener('pointerdown', (e) => {
  if (!running) return;
  setPlayerPaddle(e.clientY);
});

canvas.addEventListener('pointermove', (e) => {
  if (!running || e.pointerType === 'mouse' && e.buttons === 0) return;
  setPlayerPaddle(e.clientY);
});

startBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', startGame);

drawCourt();
