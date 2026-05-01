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

window.onload = () => {
    startLoadingTextures();
    initMap();

    player.x = startX;
    player.y = startY;

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;   // 70% быстрее!
    canvas.height = 300;
    canvas.style.width = '1200px';   // Масштаб на экран
    canvas.style.height = '800px';
    canvas.style.imageRendering = 'pixelated';

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