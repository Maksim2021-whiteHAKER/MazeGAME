// levels.js
import { initMap, startDir, startX, startY } from "./mapData.js";
import { levelsData, levelDataA } from "./levelData.js";
import { player } from "./player.js";
import { gameState, showMessage } from "./ui.js";
import { textures } from "./loadTextures.js";

export let currentLevelIndex = 0;
export let currentLevelConfig = null;
export let isBeta = false;

export function loadLevel(index, alpha = false) {
    let level; 
    alpha === true ? level = levelDataA[0] : level = levelsData[index];
    alpha === true ? isBeta = false : isBeta = true;

    if (!level) return false;
    currentLevelConfig = level;
    // Загружаем карту, передавая level.map
    initMap(level.map);
    // Устанавливаем стартовые координаты игрока
    player.x = startX;
    player.y = startY;
    player.dir = startDir;
    gameState.timeLeft = level.timeLimit !== undefined ? level.timeLimit : 60000;

    if (level.theme){
        gameState.currentWallTexture = textures[level.theme.wallTexture];
        gameState.floorGradientTop = level.theme.floorGradientTop;
        gameState.floorGradientBottom = level.theme.floorGradientBottom;
        gameState.ceilingColor = level.theme.ceilingColor;
    }
    // TODO: инициализация врагов из level.enemies
    console.log(`Загружен уровень: ${level.name}, ${level.theme?.wallTexture}`);
    return true;
}

export function nextLevel() {
    if (currentLevelIndex + 1 < levelsData.length) {
        currentLevelIndex++;
        loadLevel(currentLevelIndex);
    } else {
        showMessage("Поздравляю с прохождением демо-версии", `Пока это все уровни, но планируется 50. Пройдено: ${currentLevelIndex + 1}`, false);
    }
}

// Загружаем первый уровень при старте игры
export function startGameFromFirstLevel() {
    currentLevelIndex = 0;
    loadLevel(0);
}