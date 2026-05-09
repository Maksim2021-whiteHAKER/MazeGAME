// main.js
import { initMap, solidMap, items, startX, startY, signs } from "./mapData.js";
import { player, handleMovement, keys } from "./player.js";
import { draw3D } from "./render.js";
import { updateUI, showMessage, gameState } from "./ui.js";
import { getTargetCell } from "./raycast.js";
import { initInput } from "./input.js";
import { startLoadingTextures } from "./loadTextures.js";

async function lockLandscapeOrientation(){
    try {
        // полноэкранный режим (требуеться для lock())
        const elem = document.documentElement;
        if (elem.requestFullscreen){
            await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen){
            await elem.webkitRequestFullscreen({navigationUI: 'hide'});
        }

        // блок ориентации
        if (screen.orientation?.lock){
            await screen.orientation.lock('landscape');
            console.log('✅ Ориентация заблокирована: альбомная');
        }
    } catch (err){
        console.warn('⚠️ Не удалось заблокировать ориентацию:', err);
        showOrientationOverlay(); // Показываем визуальную подсказку
    } 
}

function showOrientationOverlay(){
    if (document.getElementById('orientation-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'orientation-overlay';
    overlay.innerHTML = `
        <div class="rotate-hint" style="max-width: 320px; text-align: center;">
         <div style="font-size: 3rem; margin-bottom: 1rem;">📱🔁</div>
         <p>Для лучшего опыта поверните устройство в горизонтальное положение</p>
         <button id="continue-anyway" style="margin-top: 1rem; padding: 0.5rem 1rem; cursor: pointer;">играть как есть(удачи)</button>
        </div>`;
    document.body.append(overlay);
    
    // Кнопка "Играть как есть"
    document.getElementById('continue-anyway')?.addEventListener('click', () => {
        overlay.style.display = 'none';
    });

    // Авто-скрытие при повороте в ландшафт
    window.addEventListener('resize', () => {
        if (window.innerWidth > window.innerHeight) {
            overlay.style.display = 'none';
        }
    }, { once: false });
}

function hideOrientationOverlay() {
    const overlay = document.getElementById('orientation-overlay');
    if (overlay) overlay.style.display = 'none';
}  

let gameLoopId = null;
let isPaused = false;
let menu = document.getElementById('mainMenu');

function hideShowMainMenu(on){
    if (on === 'show'){
        menu.style.display = 'flex';
    } else if (on === 'off'){
        menu.style.display = 'none';
    }
}

window.mainMenuGame = function(){
    gameState.score = 0;
    gameState.timeLeft = 60 * 1000;
    gameState.gameActive = false;
    hideShowMainMenu('show');
    gameState.mapHide = true;
    isPaused = false;

    initMap();
    player.x = startX;
    player.y = startY;
    player.dir = 0;
    keys.w = false; keys.s = false; keys.a = false; keys.d = false;
    updateUI();
    document.getElementById('menuOverlay').style.display = 'none';
}

window.restartGame = function(){
    // Сбрасываем состояние
    gameState.score = 0;
    gameState.timeLeft = 60 * 1000;
    gameState.gameActive = true;
    gameState.mapHide = true;
    isPaused = false;
    
    // Перезагружаем карту, предметы, таблички
    initMap();
    player.x = startX;
    player.y = startY;
    player.dir = 0;
    keys.w = false; keys.s = false; keys.a = false; keys.d = false;
    
    updateUI();
    document.getElementById('menuOverlay').style.display = 'none';
};

window.resumeGame = function() {
    if (!gameState.gameActive) return;
    isPaused = false;
    document.getElementById('menuOverlay').style.display = 'none';
};

function showMenu(title, message, showResume = true) {
    const overlay = document.getElementById('menuOverlay');
    document.getElementById('menuTitle').innerText = title;
    document.getElementById('menuMessage').innerText = message;
    document.getElementById('resumeBtn').style.display = showResume ? 'block' : 'none';
    overlay.style.display = 'flex';
    isPaused = true;
}

function onRead() {
    const target = getTargetCell();
    if (target){
        const {x, y} = target;
        const sign = signs.find(s => s.x === x && s.y === y)
        if (sign){
            showMessage(sign.text);
            return;
        }
    }
    if (window.nearSign) showMessage(window.nearSign.text);
}

function onOpen() {
    const target = getTargetCell();
    
    if (!target || target.distance >= 2.5) { 
        showMessage("Подойдите ближе к объекту");
        return;
    }

    const { x, y } = target;
    const wallType = solidMap[y][x]; // Тип клетки (0 - пусто, 1 - стена, 2 - секрет)

    // Ищем предмет-дверь в этой клетке
    const doorItem = items.find(it => it.x === x && it.y === y);

    // ЛОГИКА ДЛЯ ДВЕРЕЙ (тип клетки может быть 1 или 2, но главное - наличие предмета)
    if (doorItem) {
        if (doorItem.type === 'true_door') { // Реальная дверь (желтый треугольник)
            solidMap[y][x] = 3; // Убираем стену (или оставляем как портал, если хочешь эффект)
            gameState.score += doorItem.value;
            gameState.gameActive = false; // временно для альфы
            showMenu('Победа!', `Альфа версия 2 завершена. Ваш счёт: ${gameState.score}`, false);
            // showMessage("Выход найден! Переход на следующий уровень...");           
            // Здесь логика перехода на новый уровень
            // loadNextLevel(); 
            
            // Удаляем дверь из списка предметов
            items.splice(items.indexOf(doorItem), 1);
            updateUI();
            
        } else if (doorItem.type === 'fake_door') { // Ловушка (темный треугольник)
            gameState.score -= doorItem.value;
            showMessage("Пока в разработке");
            
            // Опционально: телепортируем игрока назад или в бесконечный лабиринт
            // player.x = startX; player.y = startY; 
            
            // Удаляем дверь, чтобы не спамить
            items.splice(items.indexOf(doorItem), 1);
            updateUI();
            
        } else if (doorItem.type === 'secret_road' || doorItem.type === 'void_secret') { // Секретные проходы
            solidMap[y][x] = 0; // Открываем проход
            gameState.score += doorItem.value;
            showMessage("Секретный проход открыт!");
            items.splice(items.indexOf(doorItem), 1);
            updateUI();
        }
        
    } 
    // ЛОГИКА ДЛЯ СЕКРЕТНЫХ СТЕН (без предмета-двери, но тип клетки 2)
    else if (wallType === 2) {
        solidMap[y][x] = 0; // Просто убираем стену
        showMessage("Секретная стена открыта!");
        updateUI();
    } 
    // Если игрок нажал O на обычной стене или пустоте
    else {
        // showMessage("Здесь ничего нет");
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

document.getElementById('restartBtn').addEventListener('click', () => window.restartGame());
document.getElementById('resumeBtn').addEventListener('click', () => window.resumeGame());
document.getElementById('backToMainMenu').addEventListener('click', () => window.mainMenuGame())

window.onload = () => {
    let startBtn = document.getElementById('startBtn'); 
    hideShowMainMenu('show');
    gameState.gameActive = false;
    startLoadingTextures();
    initMap();
    player.x = startX;
    player.y = startY;

    startBtn.addEventListener('click', async () => {
        await lockLandscapeOrientation();
        hideOrientationOverlay();

        hideShowMainMenu('off');
        gameState.gameActive = true;
        gameState.score = 0;
        gameState.timeLeft = 60 * 1000;
        updateUI();
        player.x = startX;
        player.y = startY;
        player.dir = 0;
        keys.w = false; keys.a = false; keys.s = false; keys.d = false;
        initMap();
        lastTimestamp = 0;
        lastTimerUpdate = 0;
    })

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    resizeCanvas(canvas);   // первоначальный размер
    
    window.addEventListener('resize', () => {
        resizeCanvas(canvas);
        // не нужно ничего пересоздавать – следующий кадр использует новые размеры
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (gameState.gameActive && !isPaused) {
                showMenu('Пауза', 'Игра приостановлена', true);
            } else if (isPaused) {
                resumeGame();
            }
            e.preventDefault();
        }
    });
    
    initInput(onRead, onOpen);

    let lastTimestamp = 0;
    let lastTimerUpdate = 0;
    gameState.mapHide = true;
    function gameLoop(now) {
        if (isPaused) {
            requestAnimationFrame(gameLoop);
            return;
        }
        if (!lastTimestamp) lastTimestamp = now;
        const delta = Math.min(100, now - lastTimestamp) / 1000;
        if (gameState.gameActive) {
            handleMovement(delta);
        }
        // Таймер обновляется только если игра активна и не на паузе
        if (now - lastTimerUpdate >= 1000 && gameState.gameActive && !isPaused) {
            gameState.timeLeft -= 1000;
            if (gameState.timeLeft <= 0) {
                gameState.gameActive = false;
                showMessage('Время вышло');
                showMenu('Игра окончена', 'Время вышло!', false);
            }
            updateUI();
            lastTimerUpdate = now;
        }
        draw3D(canvas, ctx, solidMap, player);
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop)
};