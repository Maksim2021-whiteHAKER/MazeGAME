// loadTextures.js
export let textures = {};
export let texturesLoaded = 0;
export const totalTextures = 7; // сколько всего текстур загружаем
export let wallImageData = null;
export let doorImageData = null;
export let gDoorImage = null;
export let secretDoorImageData = null;
export let openDoorImageData = null;
export let signImageData = null;
export let secretSignImageData = null

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
            case 'wall': wallImageData = prepareTexture(img); break;
            case 'door': doorImageData = prepareTexture(img); break; // fake
            case 'g_door': gDoorImage = prepareTexture(img); break; // real
            case 'o_door': openDoorImageData = prepareTexture(img); break; // open doors
            case 's_door': secretDoorImageData = prepareTexture(img); break;
            case 'sign': signImageData = prepareTexture(img); break;
            case 's_sign': secretSignImageData = prepareTexture(img); break;
        } 
        if (texturesLoaded === totalTextures) {
            console.log('✅ Все текстуры загружены');
        }
    };
    img.src = url;
    textures[name] = img;
}

// Удобная функция для старта загрузки всех текстур
export function startLoadingTextures() {
    loadTextures('wall', 'textures/wall.jpg');
    loadTextures('door', 'textures/door.png'); // fake
    loadTextures('g_door', 'textures/real_door.png')
    loadTextures('s_door', 'textures/s_door.jpg');
    loadTextures('o_door', 'textures/open_door.png')
    loadTextures('sign', 'textures/sign.jpg');
    loadTextures('s_sign', 'textures/s_sign.jpg');
}