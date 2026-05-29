// enemy.js
import { WALL_OFFSET } from "./gameConfig.js";
import { textures } from "./loadTextures.js";
import { gameState, updateUI, showMenu } from "./ui.js";
import { ENEMY_CONFIG } from "./enemyConfig.js";

export class Enemy {
    constructor(x, y, type){
        this.x = x;
        this.y = y;
        this.type = type;
        const enemy_con = ENEMY_CONFIG[type] || {};
        this.config = {
            speed: enemy_con.speed ?? 1.0,
            canPassDoors: enemy_con.canPassDoors ?? false,
            canPassWalls: enemy_con.canPassWalls ?? false,
            behavior: enemy_con.behavior ?? 'skeleton',
            ...enemy_con
        };

        this.lastSeentime = 0;
        this.isVisible = false;
        this.teleportCooldown = 0;
        this.stateTimer = 0;
        this.illusionActive = false; // для хранителя рун

        // animate
        this.totalFrames = 3;
        this.frameIndex = 0;
        this.animTimer = 0;
        this.frameDuration = 0.75;
    }

    update(player, delta, solidMap, currentTime){
        // проверка видимости (луч из player в enemy)
        const visible = this.isPlayerLookingAt(player, solidMap);

        const shouldStop = visible && this.config.stopWhenWatching;

        if (shouldStop){
            this.lastSeentime += delta;
            this.isVisible = true;
            // Guard - scp173(прототип) - базовая логика
            if (this.config.behavior === 'guard' && this.lastSeentime > this.config.lookThreshold && this.teleportCooldown <= 0) {
                this.teleportBehindWall(player, solidMap);
                this.teleportCooldown = this.config.teleportCooldown;
                this.lastSeentime = 0;
            }
            this.handleEyeEffect(player);
        } else {
            this.isVisible = false;
            this.lastSeentime = Math.max(0, this.lastSeentime - delta * 0.5);
            // Движение к игроку (поиск пути или прямое смещение с проверкой стен)
            this.moveTowards(player, delta, solidMap);
        }

        this.animTimer += delta;
        if (this.animTimer >= this.frameDuration){
            this.animTimer = 0;
            this.frameIndex = (this.frameIndex + 1) % this.totalFrames;
        }

        this.teleportCooldown = Math.max(0, this.teleportCooldown - delta);
        this.stateTimer += delta;

        // диспетчер: вызов специфичной логики поведения
        const method = this[this.config.behavior + 'Tick'];
        if (typeof method === 'function'){
            method.call(this, player, delta, solidMap, currentTime);
        }

        const distToPlayer = Math.hypot(this.x - player.x, this.y - player.y);
        if (distToPlayer < 0.3 && gameState.gameActive !== false){
            gameState.gameActive = false;
            switch (this.type){
                case 'axeos_meo': showMenu('ТИХИЙ СТРАЖ', 'Ты нарушил покой стража, он оборвал твою жизнь', false); break;
                case 'passer': showMenu('ТЕНЬ ЖИЗНИ', 'Ты не первая, не последняя жертва этого лабиринта, но теперь ты стал частью тропы', false); break;
                case 'stalker': showMenu('ШЁПОТ ТЕНИ', 'Жуткий вопль и скрежет... один неверный поворот — и вот твоя смерть.', false); break;
                case 'spirit_leya': showMenu('КЛЕТКА ДУХОВ', 'Одинокая Лейя вытянула твой дух из тела. Другого выхода больше нет — ты здесь навечно.', false); break;
                case 'time_eater': showMenu('ЖИЗНЬ ОПУСТОШЕНА', 'Из тебя высосали даже последние секунды жизни', false); break; 
                case 'eye_fear': showMenu('ВЗГЛЯД СМЕРТИ', 'Око страха поглотило твой разум и душу... не стоило смотреть слишком долго', false); break;
                case 'fog_death': showMenu('КИСЛОТНЫЙ ТУМАН', 'Туман растворил тебя, кости обратились в жижу кальция', false); break;
                case 'skeleton': showMenu('КОСТЯНОЕ БРАТСТВО', 'Тебя разорвали скелеты, вырвав кости из плоти. Теперь ты невольный страж лабиринта.', false); break;
                case 'rune_keeper': showMenu('ЖИВАЯ СТЕНА', 'Ты вошёл в мнимую стену, но так и не вышел. Тебя разорвал камень изнутри.', false); break;
                case 'mimic': showMenu('КТО Я?', 'Мимик стал тобой и живёт. А существовал ли ты? Уже неважно, теперь ты копия-ловушка следующего человека.', false); break;
            }
        }
    }

    // 👁 проверка на зрительный контакт
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
    }

    // движение к игроку с учётом флагов
    moveTowards(player, delta, solidMap){
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.15) return;

        const speed = this.config.speed;
        const moveX = (dx / dist) * speed * delta;
        const moveY = (dy / dist) * speed * delta;

        // проверка по X
        const nextCellX = Math.floor(this.x + moveX + (moveX > 0 ? WALL_OFFSET : -WALL_OFFSET));
        const cellY = Math.floor(this.y);
        if (cellY >= 0 && cellY < solidMap.length && nextCellX >= 0 && nextCellX < solidMap[0].length) {
            const tileX = solidMap[cellY][nextCellX]
            const passable = (tileX === 0 || (this.config.canPassDoors && tileX === 3) || (this.config.canPassWalls && tileX !== 1 && tileX !== 2));
            if (passable) this.x += moveX;
        }

        // проверка по Y
        const cellX = Math.floor(this.x);
        const nextCellY = Math.floor(this.y + moveY + (moveY > 0 ? WALL_OFFSET : -WALL_OFFSET));
        if (nextCellY >= 0 && nextCellY < solidMap.length && cellX >= 0 && cellX < solidMap[0].length){
            const tileY = solidMap[nextCellY][cellX];
            const passable = (tileY === 0 || (this.config.canPassDoors && tileY === 3) || (this.config.canPassWalls && tileY !== 1 && tileY !== 2));
            if (passable) this.y += moveY;
        }
    }

    // телепорт за стену для Guard
    teleportBehindWall(player, solidMap){
        const behindPlayerAngle = player.dir + Math.PI + (Math.random() - 0.5) * 0.2;       
        const distance = 2 + Math.random() * 2;
        // вычисление координат телепорта
        const tpX = Math.floor(player.x + Math.cos(behindPlayerAngle) * distance);
        const tpY = Math.floor(player.y + Math.sin(behindPlayerAngle) * distance);

        const isBounds = tpY >= 0 && tpY < solidMap.length && tpX >= 0 && tpX < solidMap[0].length;
        if ((isBounds && (solidMap[tpY][tpX] === 1 || solidMap[tpY][tpX] === 2))){ 
            this.x = tpX; this.y = tpY; return;
        } 
        for (let r = 1; r <= 2; r++) {
            for (let a = 0; a < Math.PI * 2; a += 0.5) {
                const checkX = Math.floor(tpX + Math.cos(a) * r)
                const checkY = Math.floor(tpY + Math.sin(a) * r)

                if (checkY >= 0 && checkY < solidMap.length && checkX >= 0 && checkX < solidMap[0].length) {
                    if (solidMap[checkY][checkX] === 1 || solidMap[checkY][checkX] === 2) {
                        this.x = checkX; this.y = checkY; return;
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
        
        const tex = textures[this.type] || textures['enemy'];
        const frameW = tex.width / this.totalFrames;
        const sx = this.frameIndex * frameW;
        if (tex?.complete) ctx.drawImage(
            tex, sx, 0, frameW, tex.height, 
            screenX - spriteH/2, screenY, 
            spriteH, spriteH);
    }

    handleEyeEffect(player){
        if (!this.config.effects) return;
        for (const [time, fx] of Object.entries(this.config.effects)){
            if (this.lastSeentime >= Number(time)){
                if (fx.type === 'slow'){
                    player.speedMult = 0.4;
                    setTimeout(() => { if (gameState.gameActive) player.speedMult = 1}, (fx.duration || 2) * 1000);
                } else if (fx.type === 'stun'){
                    player.isStunned = true;
                    setTimeout(() => { player.isStunned = false}, (fx.duration || 2) * 1000);
                } else if (fx.type === 'death'){
                    gameState.gameActive = false;
                    // showMenu('(концовка №?: ВЗГЛЯД СМЕРТИ)', 'Глаз страха, поглотил твой разум...', false);
                }
            }
        }
    }

    // Методы поведения * behaviorTick *
    // axeos_meo комбинация одного типа что есть у scp173 и плачущего ангела(из доктора кто) - двигается пока никто не видит
    guardTick(player, delta, solidMap, now){

    }

    // passer - проходчик
    passerTick(player, delta, solidMap, now){
        if (player.passedDoor && Math.hypot(this.x - player.x, this.y - player.y) > 3){
            this.x = player.x + (Math.random() - 0.5) * 2;
            this.y = player.y + (Math.random() - 0.5) * 2;
        }
    }

    // stalker - радак\крик если потерял игрока
    stalkerTick(player, delta, solidMap, now){
        const dist = Math.hypot(this.x - player.x, this.y - player.y);
        if (dist > this.config.radar_range && !this.isVisible && this.stateTimer % 4 < 0.1){
            
        }
        if (player.lastTurnDelta && Math.abs(player.lastTurnDelta) > 0.3){
            this.config.speed *= 0.7;
            setTimeout(() => {
                if (ENEMY_CONFIG.stalker) this.config.speed = ENEMY_CONFIG.stalker.speed; }, 800);
        }
    }

    // spirit_leya - 
    spiritTick(player, delta, solidMap, now){

    }

    timeEaterTick(player, delta, solidMap, now){
        const d = Math.hypot(this.x - player.x, this.y - player.y);
        const drain = this.config.drain[Math.floor(d)];
        if (drain && gameState.timeLeft > 0){
            gameState.timeLeft -= drain * 1000 * delta;
            updateUI();
            if (gameState.timeLeft <= 0){
                gameState.timeLeft = 0;
                gameState.gameActive = false;
                // showMenu('(Концовка №: Твоё время жизни окончено)', 'из тебя высосали даже последние секунды жизни', false);
            }
        }
    }

    // eyeFearTick(player, delta, solidMap, now){}

    fogDeathTick(player, delta, solidMap, now){
        if (this.stateTimer > this.config.spawn_time){
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * this.config.fog_teleport_range;
            const newX = Math.floor(this.x + Math.cos(angle) * dist);
            const newY = Math.floor(this.y + Math.sin(angle) * dist);
            if (newY >= 0 && newY < solidMap.length && newX >= 0 && newX < solidMap[0].length){
                this.x = newX; this.y = newY;
            }
            this.stateTimer = -this.config.despawn_time;
        }
        if (this.stateTimer > 0 && Math.hypot(this.x - player.x, this.y - player.y)< 0.7){
            gameState.gameActive = false;
            // showMenu('(Концовка №: растворён в тумане)', 'туман растворил тебя, даже костей не осталось', false);
        }
    }

    skeletonTick(player, delta, solidMap, now){

    }

    runeKeeperTick(player, delta, solidMap, now){
        if (!this.illusionActive && this.stateTimer > 5 && Math.random() < 0.01) {

        }
    }

    mimicTick(player, delta, solidMap, now) {
        const delay = this.config.delay;
        if (this.stateTimer > delay) {
            const targetX = player.x - (player.x - this.x) * 0.1;
            const targetY = player.y - (player.y - this.y) * 0.1;
            this.x += (targetX - this.x) * 0.05 * delta;
            this.y += (targetY - this.y) * 0.05 * delta;
        }
    }
}