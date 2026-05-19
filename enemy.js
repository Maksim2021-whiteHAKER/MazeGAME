// enemy.js
import { maxDist, WALL_OFFSET } from "./gameConfig.js";
import { textures } from "./loadTextures.js";
import { castRayWithSide } from "./raycast.js";
import { gameState } from "./ui.js";
import { showMenu } from './main.js';

export class Enemy {
    constructor(x, y, type){
        this.x = x;
        this.y = y;
        this.type = type;
        this.lastSeentime = 0;
        this.isVisible = false;
        this.teleportCooldown = 0;
    }

    update(player, delta, solidMap, currentTime){
        // проверка видимости (луч из player в enemy)
        const visible = this.isPlayerLookingAt(player, solidMap);
        if (visible){
            this.lastSeentime += delta;
            this.isVisible = true;
            if (this.lastSeentime > 5.0 && this.teleportCooldown <= 0){
                this.teleportBehindWall(player, solidMap);
                this.teleportCooldown = 2.0;
                this.lastSeentime = 0;
            }
        } else {
            this.isVisible = false;
            this.lastSeentime = Math.max(0, this.lastSeentime - delta);
            // Движение к игроку (поиск пути или прямое смещение с проверкой стен)
            this.moveTowards(player, delta, solidMap);
        }
        if (this.teleportCooldown > 0) this.teleportCooldown -= delta;
    }

    isPlayerLookingAt(player, solidMap){
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 6) return false;

        let viewAngle = (Math.atan2(dy, dx) - player.dir)
        while (viewAngle < -Math.PI) viewAngle += 2 * Math.PI;
        while (viewAngle > Math.PI) viewAngle -= 2 * Math.PI;
        if (Math.abs(viewAngle) > 0.5) return false;

        let hasLOS = true;
        const steps = Math.max(1, Math.ceil(dist * 8));
        for (let i = 1; i < steps; i++){
            const checkX = Math.floor(player.x + (dx / steps) * i);
            const checkY = Math.floor(player.y + (dy / steps) * i);

            if (checkY >= 0 && checkY < solidMap.length && checkX >= 0 && checkX < solidMap[0].length){
                const tile = solidMap[checkY][checkX];
                if (tile === 1 || tile === 2) { hasLOS = false; break};
            }
        }
        return hasLOS;               
        // let rayResult = castRayWithSide(player.x, player.y, Math.atan2(dy, dx), solidMap, dist);
        // return rayResult.cellX === Math.floor(this.x) && rayResult.cellY === Math.floor(this.y) && rayResult.distance <= dist && rayResult.distance !== maxDist;
    }

    moveTowards(player, delta, solidMap){
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.5 && gameState.gameActive !== false) {
            gameState.gameActive = false;
            showMenu('Тебя поймали','будущая твоя судьба неизвестна... (концовка: поймали)', false);
        };

        const speed = 1.5;
        const moveX = (dx / dist) * speed * delta;
        const moveY = (dy / dist) * speed * delta;

        const canPassDoors = this.type === 'проходец';

        const nextCellX = Math.floor(this.x + moveX + (moveX > 0 ? WALL_OFFSET : -WALL_OFFSET));
        const cellY = Math.floor(this.y);
        if (cellY >= 0 && cellY < solidMap.length && nextCellX >= 0 && nextCellX < solidMap[0].length && solidMap[cellY][nextCellX]) {
            const tileX = solidMap[cellY][nextCellX]
            if (tileX === 0 || ( canPassDoors && tileX === 3)) this.x += moveX;
        }

        const cellX = Math.floor(this.x);
        const nextCellY = Math.floor(this.y + moveY + (moveY > 0 ? WALL_OFFSET : -WALL_OFFSET));
        if (nextCellY >= 0 && nextCellY < solidMap.length && cellX >= 0 && cellX < solidMap[0].length && solidMap[nextCellY][cellX]){
            const tileY = solidMap[nextCellY][cellX];
            if (tileY === 0 || ( canPassDoors && tileY === 3)) this.y += moveY;
        }
    }

    teleportBehindWall(player, solidMap){
        const behindPlayerAngle = player.dir + Math.PI + (Math.random() - 0.5) * 0.2;
        
        const distance = 2 + Math.random() * 2;

        // вычисление координат телепорта
        const tpX = Math.floor(player.x + Math.cos(behindPlayerAngle) * distance);
        const tpY = Math.floor(player.y + Math.sin(behindPlayerAngle) * distance);

        const isBounds = tpY >= 0 && tpY < solidMap.length && tpX >= 0 && tpX < solidMap[0].length;

        let isWall = (isBounds && (solidMap[tpY][tpX] === 1 || solidMap[tpY][tpX] === 2));
        if (isWall){
            this.x = tpX;
            this.y = tpY;
            // console.log(`Телепорт: x:y>${this.x}:${this.y}`)
            return;
        } else {
            for (let r = 1; r <= 2; r++){
                for (let a = 0; a < Math.PI * 2; a += 0.5){
                    const checkX = Math.floor(tpX + Math.cos(a) * r)
                    const checkY = Math.floor(tpY + Math.sin(a) * r)

                    if (checkY >= 0 && checkY < solidMap.length && checkX >= 0 && checkX < solidMap[0].length){
                        if (solidMap[checkY][checkX] === 1 || solidMap[checkY][checkX] === 2){
                            this.x = checkX;
                            this.y = checkY;
                            // console.log(`Телепорт: x:y>${this.x}:${this.y}`)
                            return;
                        }
                    }
                }
            }             
        }
    }

    draw(ctx, w, h, player){
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 7 || dist < 0.3) return;
        
        let angle = Math.atan2(dy, dx) - player.dir;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        while (angle > Math.PI) angle -= 2 * Math.PI;

        if (Math.abs(angle) > Math.PI / 3) return;

        const spriteH = (h / dist) * 0.8;

        const screenX = (0.5 + angle / (Math.PI / 3)) * w;
        const screenY = (h - spriteH) / 2;

        const tex = textures['enemy'];
        if (tex?.complete) ctx.drawImage(tex, screenX - (spriteH/2), screenY, spriteH, spriteH);
    }
}