// main.js
import { solidMap, items, startX, startY, signs } from "./mapData.js";
import { player, handleMovement, keys } from "./player.js";
import { draw3D } from "./render.js";
import { updateUI, showMessage, showMenu, gameState } from "./ui.js";
import { getTargetCell } from "./raycast.js";
import { initInput, initJoystick } from "./input.js";
import { startLoadingTextures } from "./loadTextures.js";
import { playMenuMusic, stopMenuMusic, unlockAudio, handleVisibilityChange, startAmbient, stopAmbient, loadAmbientSounds, loadAllsounds } from "./soundManager.js";
import { setMaxDist } from "./gameConfig.js";
import { currentLevelConfig, currentLevelIndex, isBeta, loadLevel, startGameFromFirstLevel } from "./levels.js";
import { getENV } from "./env.js";

// Вместо этого — добавьте только ОДИН раз при загрузке:
window.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
});

const betaBadge = document.getElementById('betaBadge')
betaBadge.style.display = 'flex';

window.addEventListener('ysdk-ready', () => {
    const newEnv = getENV();
    document.getElementById('betaBadge').style.display = newEnv.IS_BETA ? 'flex' : 'none';
})

const menuBtn = document.getElementById('menuBtn');

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
    gameState.gameActive = false;
    hideShowMainMenu('show');
    gameState.mapHide = true;
    gameState.isPaused = false;
    startGameFromFirstLevel();
    player.x = startX;
    player.y = startY;
    keys.w = false; keys.s = false; keys.a = false; keys.d = false;
    updateUI();
    document.getElementById('menuOverlay').style.display = 'none';
    stopAmbient();
    setTimeout(() => {
        playMenuMusic();
    }, 300)
}

window.restartGame = function(){
    // Сбрасываем состояние
    gameState.score = 0;
    gameState.gameActive = true;
    gameState.mapHide = true;
    gameState.isPaused = false;

    player.speedMult = 1;
    player.isStunned = false;
    player.lastTurnDelta = 0;
    
    // Перезагружаем карту, предметы, таблички
    loadLevel(currentLevelIndex);
    player.x = startX;
    player.y = startY;
    // player.dir = 0;
    keys.w = false; keys.s = false; keys.a = false; keys.d = false;
    
    updateUI();
    document.getElementById('menuOverlay').style.display = 'none';
};

window.resumeGame = function() {
    if (!gameState.gameActive) return;
    gameState.isPaused = false;
    document.getElementById('menuOverlay').style.display = 'none';
};

function showMenuBtn(show){
    if (menuBtn) {
        menuBtn.style.display = show ? 'flex' : 'none';
    }
}

// Функции управления модалками
function showModal(modal){
    // console.log(modal)
    if (modal){
        // Скрываем все модалки перед показом новой
        document.querySelectorAll('.modal, .modal_set').forEach(m => m.style.display = 'none');
        modal.style.display = 'block';       
    }
}

function hideModals() {
    document.querySelectorAll('.modal, .modal_set, .wheel-container').forEach(m => m.style.display = 'none');
}

// Закрытие по клику вне окна
window.addEventListener('click', (event) => {
    if ((event.target.classList.contains('modal') || event.target.classList.contains('modal_set')) && !event.target.closest('#pause-menu')) {
        hideModals();
    }
});

document.querySelectorAll('.close-btn, .close-btnWF').forEach(btn => {
    if (btn.className === 'close-btn'){
        btn.addEventListener('click', hideModals);
    }
});

function lookBehindDoor(doorX, doorY){
    gameState.isCutScene = true;
    gameState.mapHide = false;

    const safeDistanceDoor = 3.5;
    const saveDx = player.x;
    const saveDy = player.y;
    const distToDoor = Math.hypot(player.x - doorX, player.y - doorY);

    if (distToDoor < safeDistanceDoor){
        const dx = player.x - doorX;
        const dy = player.y - doorY;
        
        let len = Math.hypot(dx, dy) || 1

        player.x = doorX + (dx / len) * safeDistanceDoor;
        player.y = doorY + (dy / len) * safeDistanceDoor;
    }

    function rotateTo(targetDir, duration, callback){
        const startDir = player.dir;
        let startTime = performance.now();
        function animate(time){
            let elapsed = (time - startTime) / duration;
            if (elapsed > 1) elapsed = 1;
            let diff = targetDir - startDir;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            player.dir = startDir + diff * elapsed;
            if (elapsed < 1){
                requestAnimationFrame(animate);
            } else {
                player.dir = targetDir;
                if (callback) callback();
            }
        }
        requestAnimationFrame(animate);
    }

    const originalDir = player.dir;
    rotateTo(originalDir + Math.PI, 400, () => {
        setTimeout(() => {
            solidMap[doorY][doorX] = 3;
            rotateTo(originalDir, 400, () => {
                gameState.isCutScene = false;
                gameState.mapHide = true;
                player.x = saveDx;
                player.y = saveDy;
                updateUI();
                rotateTo(originalDir + 2*Math.PI, 400, () =>{
                    rotateTo(originalDir, 400, () => {
                        updateUI();
                    })
                })
            });
        }, 1000);
    });
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
        if (doorItem.variant === 'true_door') { // Реальная дверь (желтый треугольник)
            const doorX = x;
            const doorY = y;
            lookBehindDoor(doorX, doorY);
            doorItem.opened = true;
            
            updateUI();
            return;
            
        } else if (doorItem.variant === 'fake_door') { // Ловушка (темный треугольник)
            if (isBeta){
                const doorX = x;
                const doorY = y;
                lookBehindDoor(doorX, doorY);
                doorItem.opened = true;
                
                // gameState.score -= doorItem.value;
                // showMessage('тут будет ловушка');

            } else {
                // gameState.score -= doorItem.value;
                showMessage("Уже будет или реалиализован в бэте или выше");
            }
            
            // Опционально: телепортируем игрока назад или в бесконечный лабиринт
            updateUI();
            
        } else if (doorItem.type === 'secret_road' || doorItem.type === 'void_secret') { // Секретные проходы
            solidMap[y][x] = 0; // Открываем проход
            gameState.score += doorItem.value;
            showMessage("Секретный проход открыт!");
            items.splice(items.indexOf(doorItem), 1);
            updateUI();
        } else if (doorItem.type === 'portal'){
            switch (doorItem.target){
                case 'alpha_lvl':{
                    const doorX = x;
                    const doorY = y;
                    lookBehindDoor(doorX, doorY);
                    doorItem.opened = true; //loadLevel(0, true); break;
                    break;
                } 
                case 'alpha_end':{
                    const doorX = x;
                    const doorY = y;
                    lookBehindDoor(doorX, doorY);
                    doorItem.opened = true;
                    // console.log('main.js: alpha_end -',doorItem.opened, "SM:", solidMap)
                    // gameState.gameActive = false;   
                    // showMenu("Альфа-версия: завершена", `Счет: ${gameState.score}`, false);
                    break;
                } 
                case 'beta_lvl': {
                    // переход на бета-уровни (с врагами)
                    const doorX = x;
                    const doorY = y;
                    lookBehindDoor(doorX, doorY);
                    doorItem.opened = true;
                    break;
                }
                // default: nextLevel();
            }            
            // items.splice(items.indexOf(doorItem), 1);
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

function applyHandednessLayout() {
    const container = document.getElementById('touchControls');
    const conBtn = document.getElementById('act-btns');
    const readBtn = document.getElementById('readBtn');
    const openBtn = document.getElementById('openBtn');

    if (!container || !readBtn || !openBtn) return;

    if (gameState.controlMode === 'dpad'){
        isRightHand === true ? container.classList.add('right-hand') : container.classList.remove('right-hand');
        isRightHand === true ? conBtn.classList.add('right-hand') : conBtn.classList.remove('right-hand');
    } else if (gameState.controlMode === 'joystick') {
        isRightHand === true ? joystickZone.classList.add('right-hand') : joystickZone.classList.remove('right-hand');
        isRightHand === true ? conBtn.classList.add('right-hand') : conBtn.classList.remove('right-hand');
    }
    if (screen.orientation.type === 'landscape-primary'){
        isRightHand === true ? readBtn.style.transform = 'rotateY(180deg)' : readBtn.style.transform = 'rotateY(0)';
        isRightHand === true ? openBtn.style.transform = 'rotateY(180deg)' : openBtn.style.transform = 'rotateY(0)';
        isRightHand === true ? readBtn.textContent = 'E📖' : readBtn.textContent = '📖E';
        isRightHand === true ? openBtn.textContent = 'O🔓' : openBtn.textContent = '🔓O';
    }
}

function resizeCanvas(canvas) {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const sw = window.innerWidth; // s = screen 
    const sh = window.innerHeight;
    const aspect = sw / sh;
    // console.log(`ш/в: ${sw} ${sh}: ${aspect}`)

    let LOGIC_WIDTH, LOGIC_HEIGHT;

    if (isMobile){
        setMaxDist(6);
        // для телефонов бывает разное соотношение, по этому для производительности ограничим ширину до 720 пкс
        LOGIC_WIDTH = Math.min(800, Math.floor(sw * 0.9));
        // console.log(`ш: ${LOGIC_WIDTH}`);
        LOGIC_HEIGHT = Math.floor(LOGIC_WIDTH / aspect);
        // чтобы не терять качество не опускаемся ниже 360
        if (LOGIC_HEIGHT < 360){
            LOGIC_HEIGHT = 360;
            LOGIC_WIDTH = Math.floor(LOGIC_HEIGHT * aspect);
            // console.log(`< 360 ш: ${LOGIC_WIDTH}`);
        }
    } else {
        // пк 
        setMaxDist(8);
        LOGIC_WIDTH = 854;
        LOGIC_HEIGHT = 480;
    }

    // console.log(`Логические ш/в: ${LOGIC_WIDTH} x ${LOGIC_HEIGHT}`);
   
    canvas.width = LOGIC_WIDTH;
    canvas.height = LOGIC_HEIGHT;
    
    // Физический размер на экране (масштабируем, сохраняя пропорции)
    const maxDisplayWidth = sw - 20;
    const maxDisplayHeight = sh - 75;
        
    const scaleX = maxDisplayWidth / LOGIC_WIDTH;
    const scaleY = maxDisplayHeight / LOGIC_HEIGHT;
    const scale = Math.min(scaleX, scaleY, 2.5); // максимум 2.5x, чтобы не было излишне крупно

    canvas.style.width = `${Math.floor(LOGIC_WIDTH * scale)}px`;
    canvas.style.height = `${Math.floor(LOGIC_HEIGHT * scale)}px`;

    // console.log(`ш/в: ${canvas.style.width = Math.floor(LOGIC_WIDTH * scale)}x${canvas.style.height = Math.floor(LOGIC_HEIGHT * scale)}`)
}

const creatorModal = document.getElementById('aboutOurs');
const settingsModal = document.getElementById('settingsModal');
const rightHandToggle = document.getElementById('rightHandToggle');
const joystickToggle = document.getElementById('joystickToggle');
const touchControls = document.getElementById('touchControls');
const joystickZone = document.getElementById('joystickZone')
const dpadZone = document.getElementById('dpad');
const btnZone = document.getElementById('act-btns');

const isTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window || navigator.userAgent.includes('Mobile');
function updateControlsVisibility() {
    if (!isTouch) {
        // 🖥️ ПК: скрываем всё тач-управление
        if (touchControls) touchControls.style.display = 'none';
        if (joystickZone) joystickZone.style.display = 'none';
        if (dpadZone) dpadZone.style.display = 'none';
        if (btnZone) btnZone.style.display = 'none';
        gameState.controlMode = 'dpad';
        document.getElementById('jT').style.background = `rgb(90, 90, 0)`;
        document.getElementById('jTText1').style.display = 'none';
        document.getElementById('jTText2').style.display = 'none';
        document.getElementById('jTPC').style.display = 'flex';
        joystickToggle.disabled = true;
        return;
    }
    
    // 📱 Мобилка: показываем только выбранный режим
    const mode = gameState.controlMode;
    joystickToggle.disabled = false;
    document.getElementById('jTText1').style.display = 'block';
    document.getElementById('jTText2').style.display = 'block';
    document.getElementById('jTPC').style.display = 'none';
    document.getElementById('jT').style.background = `rgb(0, 0, 255)`;
    if (touchControls) touchControls.style.display = (mode === 'dpad') ? 'flex' : 'none';
    if (joystickZone) joystickZone.style.display = (mode === 'joystick') ? 'block' : 'none';
}

// Вызываем при старте
updateControlsVisibility();

const controlMode = localStorage.getItem('controlMode') || ('dpad');
gameState.controlMode = controlMode;

let isRightHand = true;
const saved = localStorage.getItem('Hand')
if (saved !== null){
    isRightHand = saved === 'true';
    if (rightHandToggle) rightHandToggle.checked = isRightHand;
}

if (rightHandToggle) {
    rightHandToggle.addEventListener('change', (e) => {
        isRightHand = e.target.checked;
        localStorage.setItem('Hand', isRightHand)
        applyHandednessLayout();
    })
}

if (joystickToggle){
    joystickToggle.checked = controlMode === 'joystick'
}

if (touchControls){
    touchControls.style.display = controlMode === 'dpad' ? 'flex' : 'none';
}

if (joystickZone){
    joystickZone.style.display = controlMode === 'joystick' ? 'block' : 'none';
}

document.getElementById('restartBtn').addEventListener('click', () => window.restartGame());
document.getElementById('resumeBtn').addEventListener('click', () => window.resumeGame());
document.getElementById('backToMainMenu').addEventListener('click', () => window.mainMenuGame());
document.getElementById('aboutOursBtn').addEventListener('click', () => showModal(creatorModal));
document.getElementById('settingBtn').addEventListener('click', () => showModal(settingsModal));
joystickToggle.addEventListener('change', (e) => {
    const mode = e.target.checked ? 'joystick' : 'dpad';
    localStorage.setItem('controlMode', mode);
    gameState.controlMode = mode;
    updateControlsVisibility(); // ✅ Обновляем видимость
})

menuBtn.addEventListener('click', () => {
    if (gameState.gameActive && !gameState.isPaused) {
        showMenu('Пауза', 'Игра приостановлена', true);
    } else if (gameState.isPaused) {
        resumeGame();
    }
})

window.onload = async () => {
    initJoystick();
    applyHandednessLayout();
    startLoadingTextures();    
    let startBtn = document.getElementById('startBtn'); 
    hideShowMainMenu('show');
    gameState.gameActive = false;
    await loadAmbientSounds();
    await loadAllsounds();
    startGameFromFirstLevel();
    player.x = startX;
    player.y = startY;

    startBtn.addEventListener('click', async () => {
        await lockLandscapeOrientation();
        hideOrientationOverlay();
        stopMenuMusic();

        hideShowMainMenu('off');
        showMenuBtn(true);
        gameState.gameActive = true;
        gameState.score = 0;
        updateUI();
        keys.w = false; keys.a = false; keys.s = false; keys.d = false;
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
            if (gameState.gameActive && !gameState.isPaused) {
                showMenu('Пауза', 'Игра приостановлена', true);
            } else if (gameState.isPaused) {
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
        if (gameState.isPaused) {
            requestAnimationFrame(gameLoop);
            return;
        }
        if (gameState.isCutScene){
            draw3D(canvas, ctx, solidMap, player);
            requestAnimationFrame(gameLoop);
            return
        }

        if (!lastTimestamp) lastTimestamp = now;
        const delta = Math.min(100, now - lastTimestamp) / 1000;
        if (gameState.gameActive) {
            handleMovement(delta);
        }
        // Таймер обновляется только если игра активна и не на паузе
        if (now - lastTimerUpdate >= 1000 && gameState.gameActive && !gameState.isPaused) {
            if (currentLevelConfig?.timeLimit !== null && currentLevelConfig?.timeLimit !== undefined) {
                gameState.timeLeft -= 1000;
                if (gameState.timeLeft <= 0) {
                    gameState.gameActive = false;
                    showMessage('Время вышло');
                    showMenu('Игра окончена', 'Время вышло!', false);
                }
            }
            updateUI();
            lastTimerUpdate = now;
        }
        if (gameState.gameActive && !gameState.isPaused && gameState.enemies?.length){
            gameState.enemies.forEach(enemy => {
                enemy.update(player, delta, solidMap, now);
            })
        }
        draw3D(canvas, ctx, solidMap, player);
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop)
};

document.addEventListener('visibilitychange', () => {
    handleVisibilityChange(!document.hidden);
    if (!document.hidden && gameState.gameActive === true){
        startAmbient(currentLevelIndex);
    }
});