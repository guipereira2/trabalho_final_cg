// js/game.js

import { COURSE_CONSTANTS } from './models.js';

const TABLE_MIN_X = COURSE_CONSTANTS.platformStartX;
const TABLE_MAX_X = COURSE_CONSTANTS.rampEndX;
const TABLE_MIN_Z = COURSE_CONSTANTS.minZ;
const TABLE_MAX_Z = COURSE_CONSTANTS.maxZ;

export const BALL_RADIUS = 0.5;
const FRICTION      = 1.8;
const BOUNCE        = 0.5;
const POWER_GAIN    = 16.0;
const POWER_MAX     = 30.0;
const SPEED_EPSILON = 0.05;

// ---------- Estado do jogo ----------

export const gameState = {
  position: { x: COURSE_CONSTANTS.platformStartX + 2.0, y: BALL_RADIUS, z: 0.0 },
  velocity: { x: 0.0,  y: 0.0,         z: 0.0 },

  aimingAngle: 0.0,
  isCharging: false,
  power: 0.0,
  isMoving: false,

  strokes: 0,
  finished: false
};

// ---------- Input ----------

export function initGameInput() {
  window.addEventListener('keydown', (e) => {
    if (gameState.finished) return;

    if (!gameState.isMoving) {
      if (e.key === 'a' || e.key === 'ArrowLeft') {
        gameState.aimingAngle -= 0.09;
      } else if (e.key === 'd' || e.key === 'ArrowRight') {
        gameState.aimingAngle += 0.09;
      } else if (e.key === ' ' && !gameState.isCharging) {
        gameState.isCharging = true;
        gameState.power = 0.0;
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === ' ' && gameState.isCharging && !gameState.finished) {
      shoot();
    }
  });
}

function shoot() {
  if (gameState.power <= 0.0) {
    gameState.isCharging = false;
    return;
  }

  const dirX = Math.cos(gameState.aimingAngle);
  const dirZ = Math.sin(gameState.aimingAngle);

  gameState.velocity.x = dirX * gameState.power;
  gameState.velocity.z = dirZ * gameState.power;
  gameState.velocity.y = 0.0;

  gameState.isCharging = false;
  gameState.power = 0.0;
  gameState.isMoving = true;
  gameState.strokes += 1;
}

// ---------- Update ----------

export function updateGame(dt) {
  if (gameState.finished) return;

  if (gameState.isCharging && !gameState.isMoving) {
    gameState.power += POWER_GAIN * dt;
    if (gameState.power > POWER_MAX) gameState.power = POWER_MAX;
  }

  if (!gameState.isMoving) return;

  gameState.position.x += gameState.velocity.x * dt;
  gameState.position.z += gameState.velocity.z * dt;

  const frictionFactor = Math.exp(-FRICTION * dt);
  gameState.velocity.x *= frictionFactor;
  gameState.velocity.z *= frictionFactor;

  const speedSq = gameState.velocity.x * gameState.velocity.x +
                  gameState.velocity.z * gameState.velocity.z;
  if (speedSq < SPEED_EPSILON * SPEED_EPSILON) {
    gameState.velocity.x = 0;
    gameState.velocity.z = 0;
    gameState.isMoving = false;
  }

  // bordas em X
  if (gameState.position.x - BALL_RADIUS < TABLE_MIN_X) {
    gameState.position.x = TABLE_MIN_X + BALL_RADIUS;
    gameState.velocity.x *= -BOUNCE;
  } else if (gameState.position.x + BALL_RADIUS > TABLE_MAX_X) {
    gameState.position.x = TABLE_MAX_X - BALL_RADIUS;
    gameState.velocity.x *= -BOUNCE;
  }

  // bordas em Z
  if (gameState.position.z - BALL_RADIUS < TABLE_MIN_Z) {
    gameState.position.z = TABLE_MIN_Z + BALL_RADIUS;
    gameState.velocity.z *= -BOUNCE;
  } else if (gameState.position.z + BALL_RADIUS > TABLE_MAX_Z) {
    gameState.position.z = TABLE_MAX_Z - BALL_RADIUS;
    gameState.velocity.z *= -BOUNCE;
  }

  checkHole();
}

function checkHole() {
  const { holeX, holeZ, holeRadius } = COURSE_CONSTANTS;
  const dx = gameState.position.x - holeX;
  const dz = gameState.position.z - holeZ;
  const dist = Math.hypot(dx, dz);

  if (dist < holeRadius * 0.6 && !gameState.finished) {
    gameState.finished = true;
    gameState.isMoving = false;
    gameState.velocity.x = 0;
    gameState.velocity.z = 0;
  }
}

// ---------- Helpers para o main ----------

export function getBallXZ() {
  return [gameState.position.x, gameState.position.z];
}

export function getAimingAngle() {
  return gameState.aimingAngle;
}

export function getPower01() {
  return Math.min(gameState.power / POWER_MAX, 1.0);
}
