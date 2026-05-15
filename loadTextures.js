// loadTextures.js
export let textures = {};
export let texturesLoaded = 0;
export const totalTextures = 14; // сколько всего текстур загружаем
export let wallRuneImageData = null;
export let doorImageData = null;
export let gDoorImage = null;
export let secretDoorImageData = null;
export let openDoorImageData = null;
export let openWoodDoorImageData = null;
export let signImageData = null;
export let secretSignImageData = null;
export let coinImageData = null;
export let diamondImageData = null;
export let timeImageData = null;
export let wallWoodImageData = null;
export let aDoorImageData = null;
export let aDoorRuneImageData = null;
export let bDoorImageData = null;

export function prepareTexture(img) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = img.width;
    offCanvas.height = img.height;
    const offCtx = offCanvas.getContext('2d');
    offCtx.drawImage(img, 0, 0);
    return offCtx.getImageData(0, 0, img.width, img.height);
}

export function loadTextures(name, url) {
    const img = new Image();
    img.onload = () => {
        texturesLoaded++;
        switch (name){
            case 'wall_rune': wallRuneImageData = prepareTexture(img); break; // руны
            case 'door': doorImageData = prepareTexture(img); break; // fake
            case 'g_door': gDoorImage = prepareTexture(img); break; // real
            case 'o_door': openDoorImageData = prepareTexture(img); break; // open doors
            case 'o_door_wood': openWoodDoorImageData = prepareTexture(img); break;
            case 's_door': secretDoorImageData = prepareTexture(img); break;
            case 'sign': signImageData = prepareTexture(img); break;
            case 's_sign': secretSignImageData = prepareTexture(img); break;
            case 'coin': coinImageData = prepareTexture(img); break;
            case 'diamond': diamondImageData = prepareTexture(img); break;
            case 'time': timeImageData = prepareTexture(img); break;
            case 'wall_wood': wallWoodImageData = prepareTexture(img); break; // дерево
            case 'aDoor': aDoorImageData = prepareTexture(img); break;
            case 'aDoor_rune': aDoorRuneImageData = prepareTexture(img); break;
            case 'bDoor': bDoorImageData = prepareTexture(img); break;
        } 
        if (texturesLoaded === totalTextures -1) { // - sign
            console.log('✅ Все текстуры загружены');
        }
    };
    img.src = url;
    textures[name] = img;
}

// Удобная функция для старта загрузки всех текстур
export function startLoadingTextures() {
    loadTextures('wall_rune', 'textures/wall_rune.jpg');
    loadTextures('door', 'textures/door.png'); // fake
    loadTextures('g_door', 'textures/real_door.png')
    loadTextures('s_door', 'textures/door_secret.jpg');
    loadTextures('o_door', 'textures/open_door.png');
    loadTextures('o_door_wood', 'textures/openWood_door.png');
    // loadTextures('sign', 'textures/sign.jpg');
    loadTextures('s_sign', 'textures/s_sign.jpg');
    loadTextures('coin', 'textures/coin512.png');
    loadTextures('diamond', 'textures/diamond512.png');
    loadTextures('time', 'textures/plus_time.png');
    loadTextures('wall_wood', 'textures/wall_wood.webp');
    loadTextures('aDoor', 'textures/door_alpha.jpg');
    loadTextures('aDoor_rune', 'textures/door_alpha_end.jpg')
    loadTextures('bDoor', 'textures/door_beta.jpg');
}