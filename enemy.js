// enemy.js

export class Enemy {
    constructor(x, y, type){
        this.x = x;
        this.y = y;
        this.type = type;
        this.lastSeentime = 0;
        this.isVisible = false;
        this.teleportCooldown = 0;
        this.angle = 0;
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

    teleportBehindWall(player, solidMap){

    }

    draw(ctx, w, h, player){
        
    }
}