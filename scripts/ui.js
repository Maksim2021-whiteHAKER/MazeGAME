// ui.js
import { solidMap, items } from "./mapData.js";
import { playCoinSound, playDiamondSound } from "./soundManager.js";

let messageTimeout = null;

export const gameState = {
   score: 0,
   timeLeft: 60 * 1000,
   gameActive: true,
   mapHide: true,
   isPaused: false,
   isCutScene: false,
   controlMode: 'dpad',
   enemies: [],
   currentWallTexture: null,
   floorGradientTop: 'rgb(110, 73, 30)',
   floorGradientBottom: 'rgb(40, 20, 10)',
   ceilingColor: 'rgb(30, 25, 30)'
}

export function updateUI(){
    document.getElementById('score').innerHTML = gameState.score;
    if (gameState.timeLeft === null){
        document.getElementById('timer').innerText = '--:--';
    } else {
        let sec = Math.floor(gameState.timeLeft / 1000);
        let min = Math.floor(sec / 60);
        let secs = sec % 60;
        document.getElementById('timer').innerText = `${min.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

export function showMessage(text, time = 4000) {
    const msgDiv = document.getElementById('gameMessage');
    if (!msgDiv) return;
    msgDiv.innerText = text;
    msgDiv.style.opacity = '1';
    if (messageTimeout) clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
        msgDiv.style.opacity = '0';
    }, time);
}

export function showMenu(title, message, showResume = true) {
    const overlay = document.getElementById('menuOverlay');
    document.getElementById('menuTitle').innerText = title;
    document.getElementById('menuMessage').innerText = message;
    document.getElementById('resumeBtn').style.display = showResume ? 'block' : 'none';
    overlay.style.display = 'flex';
    gameState.isPaused = true;
}

export function collectionItemAt(x, y){
    const idx = items.findIndex(item => item.x === x && item.y === y)
    const interactObject = items.find(it => it.x === x && it.y === y && (it.type === 'portal' || it.type === 'door'));
    if (idx === -1 || interactObject) return false;
    const item = items[idx];
    items.splice(idx, 1); 
    
    switch (item.type) {
        case 'coin': gameState.score += item.value; playCoinSound(); break;
        case 'diamond': gameState.score += item.value; playDiamondSound(); break;
        case 'time': gameState.timeLeft += item.time * 1000; break;
        case 'secret_road': {
            gameState.score += item.value;
            solidMap[item.y][item.x] = 0;
            break;
        }
    }
    
    updateUI();
    return true;
}