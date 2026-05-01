// render.js
import { halfFOV, maxDist, FOV } from "./gameConfig.js";
import { textures, wallImageData, floorImageData} from "./loadTextures.js"
import { solidMap, items, signs } from "./mapData.js";
import { gameState } from "./ui.js";
import { castRayWithSide } from "./raycast.js";

const wrap = (x) => ((x % 1) + 1) % 1;

export function draw3D(canvas, ctx, solidMap, player) {
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
