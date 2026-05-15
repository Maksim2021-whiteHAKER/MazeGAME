// player.js
import { WALL_OFFSET, MOVE_SPD, ROT_SPD } from './gameConfig.js'
import { loadLevel, nextLevel } from './levels.js';
import { showMenu } from './main.js';
import { solidMap, signs, startX, startY, items } from './mapData.js'
import { collectionItemAt, gameState, showMessage, updateUI } from './ui.js'

export let player = {x: startX, y: startY, dir: 0 };
export let keys = {w: false, a: false, s: false, d: false};

export function tryMove(dx, dy) {
    let newX = player.x + dx;
    let stepX = Math.sign(dx);
    let gridXtarget = Math.floor(newX);
    let gridY = Math.floor(player.y);
    let canMoveX = false;

    if (gridY >= 0 && gridY < solidMap.length && gridXtarget >= 0 && gridXtarget < solidMap[0].length){
        let isWall = solidMap[gridY][gridXtarget] !== 0 && solidMap[gridY][gridXtarget] !== 3;
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
        let isWall = solidMap[gridYtarget][gridX] !== 0 && solidMap[gridYtarget][gridX] !== 3;
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
    collectionItemAt(Math.floor(player.x), Math.floor(player.y));
    let crntSign = signs.find(s => Math.floor(player.x) === s.x && Math.floor(player.y) === s.y);
    if (crntSign){
        window.nearSign = crntSign;
        if (crntSign.type === 'usually' && crntSign?.addTime){
            showMessage(crntSign.text, crntSign.addTime);
        } else {
            showMessage(crntSign.text);
        }
    } else {
        window.nearSign = null;
    }
    activateDoor(Math.floor(player.x), Math.floor(player.y));
}

export function handleMovement(delta) {
    if (gameState.gameActive === false) return;
    
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

function activateDoor(x, y){
    const doorItem = items.find(it => it.x === x && it.y === y && it.opened === true);
    if (!doorItem) return
    items.splice(items.indexOf(doorItem), 1);
    if (doorItem.type === 'true_door') {
        gameState.score += doorItem.value;
        nextLevel();
    } else if (doorItem.type === 'fake_door') {
        gameState.score -= doorItem.value;
        // тп в бесконечный лаб
    } else if (doorItem.type === 'secret_door'){
        gameState.score += doorItem.value;
        // пока не придумал
    } else if (doorItem.type === 'portal'){
        switch (doorItem.target){
            case 'alpha_lvl': loadLevel(0, true); break
            case 'alpha_end': gameState.gameActive = false; showMenu("Альфа-версия: завершена", `Счет: ${gameState.score}`, false); break;
            case 'beta_lvl': nextLevel(); break;              
        }
    }
    updateUI();
}