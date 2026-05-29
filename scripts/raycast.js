// raycast.js
import { player } from "./player.js";
import { maxDist } from "./gameConfig.js";
import { solidMap } from "./mapData.js";

export function castRayWithSide(playerX, playerY, rayAngle, solidMap, maxDist){
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

export function getTargetCell() {
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