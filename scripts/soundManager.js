// scripts/soundManager.js
import { gameState } from "./ui.js";

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const sounds = {
    menu: 'sounds/lab_96kbps.mp3',
    coin: 'sounds/coin.mp3',
    time: 'sounds/time_0.mp3',
    diamond: 'sounds/diamond.mp3'
};

const ambientSounds = {
    wind: 'sounds/wind_edit.mp3',
    whisper: 'sounds/whispers_edit.mp3',
    breath: 'sounds/breath.mp3',
    drip: 'sounds/water_drip.mp3',
    distFootstep: 'sounds/footsteps.mp3'
};

let menuMusic = null;
let menuMusicSource = null;
let clockSource = null;
let ambientInterval = null;
let isPlaying = false;
let isMenuMusicPlaying = false;
let isAudioUnlocked = false;

let loadedSounds = {};

async function loadAllsounds(){
    try {
        await loadMenuMusic();
        await loadCoinDiamondSound();
        await loadClockSound();        
    } catch (err) {
        console.error(`ошибка загрузки звука: ${err}`)
    }
}

async function loadAmbientSounds() {
    console.log('🔊 Загрузка атмосферы...');
    let loaded = 0;
    const total = Object.keys(ambientSounds).length;

    for (const [name, path] of Object.entries(ambientSounds)){
        try {
            const response = await fetch(path);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            loadedSounds[name] = audioBuffer;
            loaded++;
        } catch (err){
            console.warn(`⚠️ Не загружен: ${name}`, err);
        }
    }
    console.log(`✅ Загружена атмосфера: ${loaded}/${total}`);
}

async function loadCoinDiamondSound(){
    try {
        const response_coin = await fetch(sounds.coin);
        const response_diamond = await fetch(sounds.diamond);
        if (!response_coin.ok && !response_diamond.ok) throw new Error(`HTTP error! status_coin: ${response_coin.status}, status_diamond: ${response_diamond.status}`);
        let arrayBuffer
        let audioBuffer
        if (response_coin.ok){
            arrayBuffer = await response_coin.arrayBuffer();
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            sounds.coinBuffer = audioBuffer;        
        }
        if (response_diamond.ok){
            arrayBuffer = await response_diamond.arrayBuffer();
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            sounds.diamondBuffer = audioBuffer;    
        }
    } catch (err) {
        console.error(`Ошибка звуков алмаза и монеты: ${err}`)
    }
}

async function loadClockSound(){
    try {
        const response = await fetch(sounds.time);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        sounds.timeBuffer = audioBuffer;
    } catch (err) {
        console.error(`Ошибка звука времени: ${err}`)
    }
}

function playRandomEmbient(currentLevelIndex){
    if ((!isPlaying || Object.keys(loadedSounds).length === 0)) return;
    // console.log(`cLVLI: ${currentLevelIndex}`)
    if (currentLevelIndex < 1) return;

    const soundsNames = Object.keys(loadedSounds);
    const randomName = soundsNames[Math.floor(Math.random() * soundsNames.length)];
    const soundBuffer = loadedSounds[randomName];

    const source = audioContext.createBufferSource();
    source.buffer = soundBuffer;

    const gainNode = audioContext.createGain();
    let randomVolume;
    switch (randomName){
        case 'wind': randomVolume = 0.15 + Math.random() * 0.2; break;
        case 'whisper': randomVolume = 0.25 + Math.random() * 0.2; break;
        case 'breath': randomVolume = 0.50 + Math.random() * 0.2; break;
        case 'drip': randomVolume = 0.25 + Math.random() * 0.10; break;
        case 'distFootstep': randomVolume = 0.30 + Math.random() * 0.10; break;
        default: randomVolume = 0.25;
    }

    gainNode.gain.value = randomVolume;

    source.playbackRate.value = 0.8 + Math.random() * 0.4;
    
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    source.start(0);
    console.log(`🔊 Звук: ${randomName} (громкость: ${randomVolume.toFixed(2)})`);

    const nextDelay = 3000 + Math.random() * 7000;
    ambientInterval = setTimeout(() => playRandomEmbient(currentLevelIndex), nextDelay);
}

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
    // console.log('🎵 Музыка меню играет');
}

function playCoinSound(){
    if (!sounds.coinBuffer) return;
    if (audioContext.state === 'suspended') audioContext.resume();

    const source = audioContext.createBufferSource();
    source.buffer = sounds.coinBuffer;

    const gainNode = audioContext.createGain();

    gainNode.gain.value = 0.2;
   
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
}

function playDiamondSound(){
    if (!sounds.diamondBuffer) return;
    if (audioContext.state === 'suspended') audioContext.resume();

    const source = audioContext.createBufferSource();
    source.buffer = sounds.diamondBuffer;
    source.connect(audioContext.destination);
    source.start(0);
}

function playClockSound(){
    if (!sounds.timeBuffer) return;
    if (audioContext.state === 'suspended') audioContext.resume();

    if (clockSource) try { clockSource.stop() } catch (e) {}

    clockSource = audioContext.createBufferSource();
    clockSource.buffer = sounds.timeBuffer;
    clockSource.loop = true;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.1;

    clockSource.connect(gainNode);
    gainNode.connect(audioContext.destination);

    clockSource.start(0);
}

function startAmbient(currentLevelIndex = 0){
    if (isPlaying) return;
    isPlaying = true;
    playRandomEmbient(currentLevelIndex);
}

function stopAmbient(){
    isPlaying = false;
    if (ambientInterval){
        clearTimeout(ambientInterval);
        ambientInterval = null;
    }
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

function stopClockSound(){
    if (clockSource){
        try {
            clockSource.stop();
            clockSource.disconnect();
        } catch (e) {}
        clockSource = null;
        console.log(`часы остановлены`);
    }
}

// 🔓 Разблокировка звука по первому клику
function unlockAudio() {
    if (isAudioUnlocked) return;
    
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            isAudioUnlocked = true;
            console.log('🔓 Звук разблокирован');
            if (!gameState.gameActive) {
                playMenuMusic();
            }
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
        stopAmbient();
        stopClockSound();
    } else {
        if (isAudioUnlocked && gameState.gameActive === false){
            playMenuMusic();
        }
        if (gameState.gameActive === true && gameState.enemies?.length > 0){
            playClockSound();
        }

    }
}

// Экспортируем функции для использования в других файлах
export { playMenuMusic, stopMenuMusic, unlockAudio, handleVisibilityChange, startAmbient, stopAmbient, loadAmbientSounds, loadAllsounds, playCoinSound, playClockSound, playDiamondSound, stopClockSound, loadClockSound};