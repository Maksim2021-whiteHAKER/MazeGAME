// gameConfig.js
export const MOVE_SPD = 1.0 // клеток в сек
export const ROT_SPD = 0.5 // поворот, радиан в сек
export const FOV = Math.PI / 3; // 60 гр.
export const halfFOV = FOV / 2;
export const WALL_OFFSET = 0.2;
export let maxDist = 7;
export function setMaxDist(value) { maxDist = value; }