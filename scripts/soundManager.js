// scripts/soundManager.js
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const sounds = {
    menu: 'sounds/lab_96kbps.mp3',
};

let menuMusic = null;
let menuMusicSource = null;
let isMenuMusicPlaying = false;
let isAudioUnlocked = false;

async function loadMenuMusic() {
    try {
        const response = await fetch(sounds.menu);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        menuMusic = audioBuffer;
        console.log('✅ Музыка меню загружена');
    } catch (err) {
        console.error('❌ Ошибка загрузки музыки:', err);
        playSilence(1000);
    }
}

function playSilence(duration){
    const buffer = audioContext.createBuffer(1, duration * 44100, 44100);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

function setupAudioSource(buffer) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.3;
    
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    return { source, gainNode };
}

function playMenuMusic() {
    if (!menuMusic || isMenuMusicPlaying) return;
    
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    if (menuMusicSource) {
        menuMusicSource.stop();
    }
    
    const { source } = setupAudioSource(menuMusic);
    menuMusicSource = source;
    menuMusicSource.start(0);
    isMenuMusicPlaying = true;
    console.log('🎵 Музыка меню играет');
}

function stopMenuMusic() {
    if (!menuMusicSource || !isMenuMusicPlaying) return;
    
    const gainNode = audioContext.createGain();
    menuMusicSource.disconnect();
    menuMusicSource.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
    
    setTimeout(() => {
        if (menuMusicSource) {
            menuMusicSource.stop();
            menuMusicSource = null;
        }
        isMenuMusicPlaying = false;
    }, 300);
}

// 🔓 Разблокировка звука по первому клику
function unlockAudio() {
    if (isAudioUnlocked) return;
    
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            isAudioUnlocked = true;
            console.log('🔓 Звук разблокирован');
            import("./ui.js").then(({gameState}) => {
                if (!gameState.gameActive) {
                    playMenuMusic();
                }
            });
        });
    } else {
        isAudioUnlocked = true;
        playMenuMusic();
    }
    
    // Убираем обработчики после первого клика
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
}

function handleVisibilityChange(isVisible){
    if (!isVisible){
        stopMenuMusic();
    } else {
        if (isAudioUnlocked){
            playMenuMusic();
        }
    }
}

// Экспортируем функции для использования в других файлах
export { playMenuMusic, stopMenuMusic, loadMenuMusic, unlockAudio, handleVisibilityChange };