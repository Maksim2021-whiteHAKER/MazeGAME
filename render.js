// render.js
import { halfFOV, maxDist, FOV } from "./gameConfig.js";
import { doorImageData, secretDoorImageData, secretSignImageData, signImageData, textures, wallImageData } from "./loadTextures.js"
import { items, signs, solidMap } from "./mapData.js";
import { gameState } from "./ui.js";
import { castRayWithSide } from "./raycast.js";

const wrap = (x) => ((x % 1) + 1) % 1;

// проверяет, виден ли объект в точке (tx, ty) из (px, py) на карте solidMap
function isVisible(px, py, tx, ty, solidMap){
    if (!solidMap || !solidMap.length || !solidMap[0].length) return true;
    const dx = tx - px;
    const dy = ty - py
    const distance = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.floor(distance * 8)) // ~8 проверок на клетку
    const stepX = dx / steps;
    const stepY = dy / steps;
    let x = px, y = py;
    for (let i = 0; i <= steps; i++){
        const mx = Math.floor(x);
        const my = Math.floor(y);
        if (mx < 0 || my < 0 || mx >= solidMap[0].length || my >= solidMap.length) break;
        // Если клетка - стена(1 или 2) или закрытая дверь (но не открытая = 3) то стена
        if (solidMap[my][mx] === 1 || solidMap[my][mx] === 2) return false;
        x += stepX;
        y += stepY;
    }
    return true;
}

function drawSprites(ctx, w, h, player, items, solidMap){
    const visibleItems = items.filter(it => it.type === 'coin' || it.type === 'diamond');
    if (visibleItems.length === 0) return;

    // Сортируем от дальних к ближним (чтобы ближние перекрывали дальние)
    visibleItems.sort((a, b) => {
        const da = Math.hypot(a.x - player.x, a.y - player.y);
        const db = Math.hypot(b.x - player.x, b.y - player.y);
        return db - da;
    });

    for (const item of visibleItems){
        const itemX = item.x + 0.5;
        const itemY = item.y + 0.5;
        const dx = item.x + 0.5 - player.x;
        const dy = item.y + 0.5 - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.2) continue;

        // угол относительно направления игрока
        let angle = Math.atan2(dy, dx) - player.dir;
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        if (Math.abs(angle) > FOV / 2) continue;

        // Проверка: нет ли стены между игроком и предметом
        if (!isVisible(player.x, player.y, itemX, itemY, solidMap)) continue;

        const size = (1 / (dist + 0.001)) * h * 0.4;
        const spriteX = (angle / (FOV / 2)) * w / 2 + w / 2;
        const spriteY = h / 2 - size / 2;

        let tex = item.type === 'coin' ? textures['coin'] : textures['diamond'];
        if (!tex || !tex.complete || tex.naturalWidth === 0) continue;

        ctx.drawImage(tex, spriteX - size / 2, spriteY, size, size);
    }
}

function getWallTextureForCell(cellX, cellY){
    const doorItem = items.find(it => it.x === cellX && it.y === cellY && ( it.type === 'fake_door' || it.type === 'true_door' || it.type === 'secret_door' ))
    const signItem = signs.find(s => s.x === cellX && s.y === cellY)
    // console.table(`texture: ${signItem}`); // undefined бесконечный
    
    if (doorItem) {
        switch (doorItem.type){
            case 'secret_door': return textures['s_door'];
            case 'fake_door': return textures['door'];
            case 'true_door': return textures['g_door'];
        }
    }
        // return doorItem.type === 'secret_door' ? textures['s_door'] : textures['door'];
    if (signItem) return signItem.type === 'secret' ? textures['s_sign'] : textures['sign'];
    
    return textures['wall'];
}

export function draw3D(canvas, ctx, solidMap, player) {
    const w = canvas.width;
    const h = canvas.height;
    const wallTex = textures['wall'];

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
        const textureToDraw = getWallTextureForCell(cellX, cellY);
        if (textureToDraw?.complete){
            let wallX = (side === 0) ? hitY: hitX;
            wallX = wrap(wallX);
            const texX = Math.floor(wallX * textureToDraw.width);
            ctx.drawImage(textureToDraw, texX, 0, 1, textureToDraw.height, col, wallTop, 1, wallBottom - wallTop);      
        } else {
            ctx.fillStyle = '#aaa';
            ctx.fillRect(col, wallTop, 1, wallBottom - wallTop);
        }
        // подсветка
        if (solidMap[cellY]?.[cellX] === 2) {
            ctx.fillStyle = `rgba(213, 15, 0, 0.027)`;
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

        // // запасной цвет
        // const brightness = Math.min(1, 1.2 / (distance * 0.3 + 0.5));
        // ctx.fillStyle = `rgb(${67 * brightness}, ${80 * brightness}, ${60 * brightness})`;
        // ctx.fillRect(col, wallTop, 1, wallBottom - wallTop);
        
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

    drawSprites(ctx, w, h, player, items, solidMap);
    
    if (gameState.mapHide){
        drawMinimap(ctx, w, h, solidMap, items, player);
    }
}

export function drawMinimap(ctx, w, h, solidMap, items, player){
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
        if (item.type === 'secret_road' || item.type === 'secret_door' || item.type === 'void_secret' || item.type === 'true_door'){
            ctx.fillStyle = '#444';
        } else if (item.type === 'fake_door'){
            ctx.fillStyle = 'green';
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
