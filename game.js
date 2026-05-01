const textures = {};
let texturesLoaded = 0;
const totalTextures = 2;
const WALL_OFFSET = 0.2;
const wrap = (x) => ((x % 1) + 1) % 1;

function loadTextures(name, url){
    const img = new Image();
    img.onload = () => {
        texturesLoaded++;
        if (name === 'floor') floorImageData = prepareTexture(img);
        if (name === 'wall') wallImageData = prepareTexture(img);
        if (texturesLoaded === totalTextures) console.log('Все текстуры загружены');
    };
    img.src = url;
    textures[name] = img;
}

loadTextures('wall', 'textures/wall.jpg');
loadTextures('floor', 'textures/floor.jpg');

let floorImageData = null;
let wallImageData = null;

let messageTimeout = null;

function showMessage(text) {
    const msgDiv = document.getElementById('gameMessage');
    if (!msgDiv) return;
    msgDiv.innerText = text;
    msgDiv.style.opacity = '1';
    if (messageTimeout) clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
        msgDiv.style.opacity = '0';
    }, 2500);
}

function prepareTexture(img) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = img.width; 
    offCanvas.height = img.height;
    const offCtx = offCanvas.getContext('2d');
    
    offCtx.drawImage(img, 0, 0);  
    
    return offCtx.getImageData(0, 0, img.width, img.height);
}

const MOVE_SPD = 1.0 // клеток в сек
const ROT_SPD = 0.5 // поворот, радиан в сек

const FOV = Math.PI / 3; // 60 гр.
const halfFOV = FOV / 2;
const maxDist = 10;

const levelMap = [
    "WWWWWWWWWWWWWWWWWWWW",
    "WWWWWWW    C       D",
    "WWWWWWWCWWWWWWWRWWWW",
    "WWWWWWW WWWWWWWrWWWW",
    "WWWWWWW WWWrrrSrWWWW",
    "WWWWWWW WWWrWWWWWWWW",
    "WWWWWWW WWWrrWWWWWWW",
    "WWWWWWW WWWWrWWWWWWW",
    "WWWWWWW WWWWrWWWWWWW",
    "WWWWWWW WWWWRWWWWWWW",
    "WT     C     WWWWWWW",
    "WWWWWWWWWWWW WWWWWWW",
    "WWWWWWWWWWWW WWWWWWW",
    "WWWWd   C    RrrTWWW",
    "WWWWWWWWWWWW WWWWWWW",
    "WWN WWWWWWWW WWWWWWW",
    "WWW    WWWWW WWWWWWW",
    "WWWWWW WWWWW WWdWWWW",
    "WWP n    W        WW",
    "WWWWWWW       C WWWW",
    "WWWWWWWWWWWWWWWWWWWW"
];

const solidMap = levelMap.map(row => row.split('').map(ch => {
    if (ch === 'W') return 1;
    if (ch === 'R' || ch === 'S' || ch === 'D') return 2;
    return 0;
}));

let items = [];
let signs = [];
let startX = 2.5;
let startY = 2.5;

// поиск игрока и предметов на карте
for (let y = 0; y < levelMap.length; y++){
    for (let x = 0; x < levelMap[y].length; x++){
        let sh = levelMap[y][x] // sh - search
        if (sh === 'P'){
            startX = x + 0.5;
            startY = y + 0.5;
        } else if (sh === 'C'){
            items.push({x, y, type: 'coin', value: 100});
        } else if (sh === 'd'){
            items.push({x, y, type: 'diamond', value: 500});
        } else if (sh === 'T'){
            items.push({x, y, type: 'time', value: 5, time: 15});
        } else if (sh === 'R'){
            items.push({x, y, type: 'secret_road', value: 1});
        } else if (sh === 'r'){
            items.push({x, y, type: 'void_secret', value: 1});
        } else if (sh === 'D'){
            items.push({x, y, type: 'fake_door', value: 150, trap: true});
        } else if (sh === 'S'){
            items.push({x, y, type: 'secret_door', value: 15000, win: true});
        } else if (sh === 'G'){ // g/п т.е п - правильная дверь
            items.push({x, y, type: 'true_door', value: 500, win: true});
        } else if (sh === 'N'){
            signs.push({x, y, type: 'secret', text: "Мини подсказка: нажми на 'O' перед странной стеной", });
        } else if (sh === 'n'){
            signs.push({x, y, type: 'usually', text: "Добро пожаловать в лабиринт!\nСобери монеты и найди выход. \nчитать таблички 'e'"})
        }
    }
}

let nearSign = null;
let score = 0;
let timeLeft = 60 * 1000;
let gameActive = true;
let player = {x: startX, y: startY, dir: 0 }
let keys = {w: false, a: false, s: false, d: false}
let mapHide = true;

window.onload = () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;   // 70% быстрее!
    canvas.height = 300;
    canvas.style.width = '800px';   // Масштаб на экран
    canvas.style.height = '600px';
    canvas.style.imageRendering = 'pixelated';

    window.addEventListener('keydown', (e) => {
        switch(e.key){
            case 'w': case 'ArrowUp': keys.w = true; break
            case 'a': case 'ArrowLeft': keys.a = true; break
            case 's': case 'ArrowDown': keys.s = true; break
            case 'd': case 'ArrowRight': keys.d = true; break

        }
        e.preventDefault();
    })
    window.addEventListener('keyup', (e) => {
        switch(e.key){
            case 'w': case 'ArrowUp': keys.w = false; break
            case 'a': case 'ArrowLeft': keys.a = false; break
            case 's': case 'ArrowDown': keys.s = false; break
            case 'd': case 'ArrowRight': keys.d = false; break
            case 'e': if (window.nearSign) showMessage(window.nearSign.text); break;
            case 'o': {
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
                            if (item.type === 'secret_road') score += item.value;
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
                break;
            }
        }
        e.preventDefault();
    });

    mapHide = true;
    let lastTimestamp = 0;
    let lastTimerUpdate = 0;
    function gameLoop(now){
        if (!lastTimestamp) lastTimestamp = now;
        const delta = Math.min(100, now - lastTimestamp) / 1000; // секунды 
        handleMovement(delta, canvas, ctx);
        if (now - lastTimerUpdate >= 1000 && gameActive) {
            timeLeft -= 1000;
            if (timeLeft <= 0) {
                gameActive = false;
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

function tryMove(dx, dy) {
    let newX = player.x + dx;
    let stepX = Math.sign(dx);
    let gridXtarget = Math.floor(newX);
    let gridY = Math.floor(player.y);
    let canMoveX = false;

    if (gridY >= 0 && gridY < solidMap.length && gridXtarget >= 0 && gridXtarget < solidMap[0].length){
        let isWall = solidMap[gridY][gridXtarget] !== 0;
        if (!isWall){
            canMoveX = true;
        } else {
            if (stepX > 0){
                if (newX <= gridXtarget - WALL_OFFSET) canMoveX = true;
            } else if (stepX < 0){
                if (newX >= gridXtarget + 1 + WALL_OFFSET) canMoveX = true;
            }
        }
        if (canMoveX) player.x = newX;
    }    
    let newY = player.y + dy;
    let stepY = Math.sign(dy);
    let gridX = Math.floor(player.x);
    let gridYtarget = Math.floor(newY);
    let canMoveY = false;
    if (gridYtarget >= 0 && gridYtarget < solidMap.length && gridX >= 0 && gridX < solidMap[0].length){
        let isWall = solidMap[gridYtarget][gridX] !== 0;
        if (!isWall){
            canMoveY = true;
        } else {
            if (stepY > 0){
                if (newY <= gridYtarget - WALL_OFFSET) canMoveY = true;
            } else if (stepY < 0) {
                if (newY >= gridYtarget + 1 + WALL_OFFSET) canMoveY = true;
            }
        }
        if (canMoveY) player.y = newY;
    }
    let collected = collectionItemAt(Math.floor(player.x), Math.floor(player.y));
    let crntSign = signs.find(s => Math.floor(player.x) === s.x && Math.floor(player.y) === s.y);
    if (crntSign){
        window.nearSign = crntSign;
        if (crntSign.type === 'usually'){
            showMessage(crntSign.text);
        }
    } else {
        window.nearSign = null;
    }
}

function handleMovement(delta) {
    let dx = 0; let dy = 0;
    if (keys.w) {
        dx += Math.cos(player.dir) * MOVE_SPD * delta;
        dy += Math.sin(player.dir) * MOVE_SPD * delta;
    }
    if (keys.s) {
        dx += -Math.cos(player.dir) * MOVE_SPD * delta;
        dy += -Math.sin(player.dir) * MOVE_SPD * delta;
    }
    if (keys.a) player.dir -= ROT_SPD * delta;
    if (keys.d) player.dir += ROT_SPD * delta;

    if (dx !== 0 || dy !== 0){
        tryMove(dx, dy);
    }
}

function collectionItemAt(x, y){
    const idx = items.findIndex(item => item.x === x && item.y === y)
    if (idx === -1) return false;
    const item = items[idx];
    items.splice(idx, 1);

    if (item.win){
        gameActive = false;
        showMessage(`Альфа версия: Победа! очки ${score}`)
    
    } else {
        switch (item.type){
            case 'coin': score += item.value; break;
            case 'diamond': score += item.value; break;
            case 'time': timeLeft += item.time * 1000; break;
            case 'secret_road': { 
                score += item.value;
                solidMap[item.y][item.x] = 0;
                break;
            }
            case 'fake_door': {
                score -= item.value;
                if (score < 0) score = 0;
            } 
        }
    }
    updateUI();
    return true;
}

function castRayWithSide(playerX, playerY, rayAngle, solidMap, maxDist){
    let mapX = Math.floor(playerX);
    let mapY = Math.floor(playerY);
    const rayDirX = Math.cos(rayAngle);
    const rayDirY = Math.sin(rayAngle);

    const stepX = Math.sign(rayDirX) || 1;
    const stepY = Math.sign(rayDirY) || 1;

    const deltaDistX = rayDirX !== 0 ? Math.abs(1 / rayDirX) : 1e30;
    const deltaDistY = rayDirY !== 0 ? Math.abs(1 / rayDirY) : 1e30;

    let sideDistX = (stepX > 0) ? (mapX + 1 - playerX) * deltaDistX : (playerX - mapX) * deltaDistX;
    let sideDistY = (stepY > 0) ? (mapY + 1 - playerY) * deltaDistY : (playerY - mapY) * deltaDistY;

    let side = 0;
    let hit = false;

    while (!hit){
        if (sideDistX < sideDistY){
            sideDistX += deltaDistX;
            mapX += stepX;
            side = 0
        } else {
            sideDistY += deltaDistY
            mapY += stepY
            side = 1;
        }
        // проверка выхода за границы
        if (mapY < 0 || mapY >= solidMap.length || mapX < 0 || mapX >= solidMap[0].length){
            return {distance: maxDist, side, hitX: playerX, hitY: playerY};
        }

        if ((side === 0 && sideDistX > maxDist) || (side === 1 && sideDistY > maxDist))
            return {distance: maxDist, side, hitX: playerX, hitY: playerY};

        if (solidMap[mapY][mapX] !== 0){
            hit = true;
        }
    }
    
    // Расчёт перпендикулярного расстояния (исправлено: используем playerX/playerY)
    let perpWallDist, hitX, hitY;
    if (side === 0) {
        perpWallDist = (mapX - playerX + (1 - stepX) / 2) / rayDirX;
        hitX = playerX + perpWallDist * rayDirX;
        hitY = playerY + perpWallDist * rayDirY;
    } else {
        perpWallDist = (mapY - playerY + (1 - stepY) / 2) / rayDirY;
        hitX = playerX + perpWallDist * rayDirX;
        hitY = playerY + perpWallDist * rayDirY;
    }
    
    return { distance: perpWallDist, side, hitX, hitY, cellX: mapX, cellY: mapY };
}

function draw3D(canvas, ctx, solidMap, player) {
    const w = canvas.width;
    const h = canvas.height;
    const wallTex = textures['wall'];
    const floorTex = textures['floor'];
    const hasFloorTex = floorTex?.complete && floorImageData;

    if (!wallTex?.complete) {
        // Рисуем заглушку пока грузится
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.fillText('Загрузка...', w/2 - 40, h/2);
        return;
    }

    const rayAngles = new Array(w);
    const rayCos = new Array(w);
    const raySin = new Array(w);
    // Массив для хранения wallBottom
    const wallBottoms = new Array(w);

    for (let col = 0; col < w; col++){
        const angle = player.dir - halfFOV + (col / w) * FOV;
        rayAngles[col] = angle;
        rayCos[col] = Math.cos(angle);
        raySin[col] = Math.sin(angle);
    }
    // Рисуем стены (как раньше, только сохраняем wallBottom)
    for (let col = 0; col < w; col++) {
        let { distance, side, hitX, hitY, cellX, cellY } = castRayWithSide(player.x, player.y, rayAngles[col], solidMap, maxDist);
        
        const dist = Math.min(distance, maxDist);
        
        const wallHeight = (1 / (dist + 0.001)) * h;
        const wallTop = (h / 2) - wallHeight / 2;
        const wallBottom = (h / 2) + wallHeight / 2;
        wallBottoms[col] = wallBottom;

        // ... отрисовка стены (без изменений) ...
        if (wallTex?.complete && wallImageData) {
            let wallX = (side === 0) ? hitY: hitX;
            wallX = wrap(wallX);
            const texX = Math.floor(wallX * wallTex.width);
            // Рисуем через drawImage (так быстрее, чем пиксели)
            ctx.drawImage(wallTex, texX, 0, 1, wallTex.height, col, wallTop, 1, wallBottom - wallTop);

            if (solidMap[cellY]?.[cellX] === 2){
                ctx.fillStyle = `rgba(213, 15, 0, 0.025)`;
                ctx.fillRect(col, wallTop, 1, wallBottom - wallTop);
            }
            // затемнение
            const fog = Math.min(1, 1.2 / (distance * 0.5 + 0.3));
            if (fog < 1) {
                ctx.fillStyle = `rgba(0,0,0,${1 - fog})`;
                ctx.fillRect(col, wallTop, 1, wallBottom - wallTop);
            }
            if (side === 1) {
                ctx.fillStyle = `rgba(0,0,0,0.2)`;
                ctx.fillRect(col, wallTop, 1, wallBottom - wallTop);
            }
        } else {
            // запасной цвет
            const brightness = Math.min(1, 1.2 / (distance * 0.3 + 0.5));
            ctx.fillStyle = `rgb(${67 * brightness}, ${80 * brightness}, ${60 * brightness})`;
            ctx.fillRect(col, wallTop, 1, wallBottom - wallTop);
        }
    }

    for (let col = 0; col < w; col++) {
        const wallBottom = wallBottoms[col];
        if (wallBottom >= h) continue;
        
        const height = h - wallBottom;
        const step = 4; // рисуем полосками для скорости
        
        for (let y = wallBottom; y < h; y += step) {
            const t = (y - wallBottom) / height;
            const r = Math.floor(110 - 90 * t);
            const g = Math.floor(30 - 15 * t);
            const b = Math.floor(20 - 10 * t);
            
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(col, y, 1, step);
        }
    }

    ctx.fillStyle = 'rgb(30, 25, 120)';
    for (let col = 0; col < w; col++) {
        const wallTop = (h / 2) - (wallBottoms[col] - h / 2);
        if (wallTop > 0) {
            ctx.fillRect(col, 0, 1, wallTop);
        }
    }
    
    if (mapHide){
        drawMinimap(ctx, w, h, solidMap, items, player);
    }
}

function updateUI(){
    document.getElementById('score').innerHTML = score;
    let sec = Math.floor(timeLeft / 1000);
    let min = Math.floor(sec / 60);
    let secs = sec % 60;
    document.getElementById('timer').innerText = `${min.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function drawMinimap(ctx, w, h, solidMap, items, player){
    const mapW = solidMap[0].length;
    const mapH = solidMap.length;
    const cellSize = 4;
    const offsetX = 10; const offsetY = 10;
    for (let y = 0; y < mapH; y++){
        for (let x = 0; x < mapW; x++){
            if (solidMap[y][x] === 1){
                ctx.fillStyle = '#444';
                ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize-1, cellSize-1);
            } else {
                ctx.fillStyle = '#222';
                ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize-1, cellSize-1);
            }
        }
    }
    for (let item of items){
        if (item.type === 'secret_road' || item.type === 'secret_door' || item.type === 'void_secret'){
            ctx.fillStyle = '#444';
        } else {
            ctx.fillStyle = `gold`;
        }
        ctx.fillRect(offsetX + item.x * cellSize, offsetY + item.y * cellSize, cellSize-1, cellSize-1);
    }

    for (let sign of signs){
        if (sign.type === 'secret'){
            ctx.fillStyle = '#444';
        } else {
            ctx.fillStyle = '#88f';
        }
        ctx.fillRect(offsetX + sign.x * cellSize, offsetY + sign.y * cellSize, cellSize-1, cellSize-1);
    }
    ctx.fillStyle = `cyan`;
    ctx.fillRect(offsetX + player.x * cellSize -1, offsetY + player.y * cellSize -1, cellSize, cellSize)
}

function getTargetCell() {
    const rayAngle = player.dir;
    const rayResult = castRayWithSide(player.x, player.y, rayAngle, solidMap, maxDist);
    // Проверяем, что луч что-то нашёл (не ушёл в бесконечность)
    if (rayResult.distance >= maxDist) return null;
    const { cellX, cellY, distance } = rayResult;
    if (cellY >= 0 && cellY < solidMap.length && cellX >= 0 && cellX < solidMap[0].length) {
        return { x: cellX, y: cellY, distance };
    }
    return null;
}