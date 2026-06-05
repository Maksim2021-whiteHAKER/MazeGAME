// levels.js
import { initMap, startDir, startX, startY } from "./mapData.js";
import { levelsData, levelDataA } from "./levelData.js";
import { player } from "./player.js";
import { gameState, showMessage, showMenu } from "./ui.js";
import { textures } from "./loadTextures.js";
import { Enemy } from "./enemy.js";
import { getENV } from "./env.js";
import { playClockSound, startAmbient, stopAmbient, stopClockSound } from "./soundManager.js";

export let currentLevelIndex = 0;
export let currentLevelConfig = null;
export let isBeta = false;

export function loadLevel(index, alpha = false) {  
    let level; 
    alpha ? level = levelDataA[0] : level = levelsData[index];
    alpha ? isBeta = false : isBeta = true;

    if (getENV().IS_BETA && index > 3){ // 0(дом) 0(альфа не поднимает индекс) 1(лаб ур 0), 2(лаб ур 1), индекс - 3(лаб ур 2) конец | 4(лаб ур 3) - для нормальной отработки но уровень для беты недоступен
        showMenu('РЕЖИМ БЕТА ЗАВЕРШЁН', 'Вы прошли 4 уровня:\n•И успешно завершили бету, ждите обновлений т.к еще тут будут тестироваться текстуры \nОстальное(больше врагов, больше карт и секретов) будет в релизе на Яндекс Играх', false);
        return false;
    }

    if (!level) return false;
    currentLevelConfig = level;
    // Загружаем карту, передавая level.map
    initMap(level.map);
    if (level.enemies?.length){
        gameState.enemies = level.enemies.map(e => new Enemy(e.x, e.y, e.type));
        playClockSound();
    } else {
        gameState.enemies = [];
        stopClockSound();
    }
    
    // Устанавливаем стартовые координаты игрока
    player.x = startX;
    player.y = startY;
    player.dir = startDir;
    gameState.timeLeft = level.timeLimit !== undefined ? level.timeLimit : 60000; // работает только так т.к может принить null, оператор ?? не подходит

    if (level.theme){
        gameState.currentWallTexture = textures[level.theme.wallTexture];
        gameState.floorGradientTop = level.theme.floorGradientTop;
        gameState.floorGradientBottom = level.theme.floorGradientBottom;
        gameState.ceilingColor = level.theme.ceilingColor;
    }
    // TODO: инициализация врагов из level.enemies
    console.log(`Загружен уровень: ${level.name}, ${level.theme?.wallTexture}`);
    // if (level.enemies?.length){
    //     console.table(level.enemies)
    // } else {
    //     console.log('Врагов нет, безопасно')
    // }
    stopAmbient();
    startAmbient(index);
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