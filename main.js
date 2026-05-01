// main.js
import { initMap, solidMap, items, startX, startY } from "./mapData.js";
import { player, handleMovement, keys } from "./player.js";
import { draw3D } from "./render.js";
import { updateUI, showMessage, gameState } from "./ui.js";
import { getTargetCell } from "./raycast.js";
import { initInput } from "./input.js";
import { startLoadingTextures } from "./loadTextures.js";

function onRead() {
    if (window.nearSign) showMessage(window.nearSign.text);
}

function onOpen() {
    const target = getTargetCell();
    if (target && target.distance < 2.5) {  // дальность открытия
        const { x, y } = target;
        if (solidMap[y][x] === 2) {
            // Убираем стену
            solidMap[y][x] = 0;
            // Ищем предмет в items (если есть) и удаляем, начисляем бонус
            const itemIndex = items.findIndex(it => it.x === x && it.y === y);
            if (itemIndex !== -1) {
                const item = items[itemIndex];
                // Начисляем бонус (если нужно)
                if (item.type === 'secret_road') gameState.score += item.value;
                // if (item.type === 'secret_door') {
                //     score += item.value;
                //     gameActive = false;
                //     showMessage(`Секретная дверь открыта! Победа! Очки: ${score}`);
                // }
                items.splice(itemIndex, 1);
            }
            showMessage("Секретная стена открыта!");
            updateUI();
        } else {
            showMessage("Это не секретная стена");
        }
    } else if (target && target.distance >= 2.5) {
        showMessage("Подойдите ближе к стене");
    }
}

function resizeCanvas(canvas) {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    // Логическое разрешение 16:9
    let LOGIC_WIDTH = isMobile ? 640 : 800;
    let LOGIC_HEIGHT = isMobile ? 360 : 450;
    
    canvas.width = LOGIC_WIDTH;
    canvas.height = LOGIC_HEIGHT;
    
    // Физический размер на экране (масштабируем, сохраняя пропорции)
    const maxWidth = window.innerWidth - 40;
    const maxHeight = window.innerHeight - 150;
    let displayWidth = LOGIC_WIDTH;
    let displayHeight = LOGIC_HEIGHT;
    
    const scaleX = maxWidth / LOGIC_WIDTH;
    const scaleY = maxHeight / LOGIC_HEIGHT;
    const scale = Math.min(scaleX, scaleY, 2.5); // максимум 2.5x, чтобы не было излишне крупно
    displayWidth = Math.floor(LOGIC_WIDTH * scale);
    displayHeight = Math.floor(LOGIC_HEIGHT * scale);
    
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
}

window.onload = () => {
    startLoadingTextures();
    initMap();
    player.x = startX;
    player.y = startY;

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    resizeCanvas(canvas);   // первоначальный размер
    
    window.addEventListener('resize', () => {
        resizeCanvas(canvas);
        // не нужно ничего пересоздавать – следующий кадр использует новые размеры
    });
    
    initInput(onRead, onOpen);

    let lastTimestamp = 0;
    let lastTimerUpdate = 0;
    gameState.mapHide = true;

    function gameLoop(now) {
        if (!lastTimestamp) lastTimestamp = now;
        const delta = Math.min(100, now - lastTimestamp) / 1000; // секунды 
        handleMovement(delta);
        if (now - lastTimerUpdate >= 1000 && gameState.gameActive) {
            gameState.timeLeft -= 1000;
            if (gameState.timeLeft <= 0) {
                gameState.gameActive = false;
                showMessage('Время вышло');
            }
            updateUI();
            lastTimerUpdate = now;
        }
        draw3D(canvas, ctx, solidMap, player);
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop)
};