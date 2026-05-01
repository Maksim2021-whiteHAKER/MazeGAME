// ui.js
import { solidMap, items } from "./mapData.js";

let messageTimeout = null;

export const gameState = {
   score: 0,
   timeLeft: 60 * 1000,
   gameActive: true,
   mapHide: true
}

export function updateUI(){
    document.getElementById('score').innerHTML = gameState.score;
    let sec = Math.floor(gameState.timeLeft / 1000);
    let min = Math.floor(sec / 60);
    let secs = sec % 60;
    document.getElementById('timer').innerText = `${min.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function showMessage(text) {
    const msgDiv = document.getElementById('gameMessage');
    if (!msgDiv) return;
    msgDiv.innerText = text;
    msgDiv.style.opacity = '1';
    if (messageTimeout) clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
        msgDiv.style.opacity = '0';
    }, 2500);
}

export function collectionItemAt(x, y){
    const idx = items.findIndex(item => item.x === x && item.y === y)
    if (idx === -1) return false;
    const item = items[idx];
    items.splice(idx, 1);

    if (item.win){
        gameState.gameActive = false;
        showMessage(`Альфа версия: Победа! очки ${gameState.score}`)
    
    } else {
        switch (item.type){
            case 'coin': gameState.score += item.value; break;
            case 'diamond': gameState.score += item.value; break;
            case 'time': gameState.timeLeft += item.time * 1000; break;
            case 'secret_road': { 
                gameState.score += item.value;
                solidMap[item.y][item.x] = 0;
                break;
            }
            case 'fake_door': {
                gameState.score -= item.value;
                if (gameState.score < 0) gameState.score = 0;
            } 
        }
    }
    updateUI();
    return true;
}