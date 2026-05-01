// loadTextures.js
export let textures = {};
export let texturesLoaded = 0;
export const totalTextures = 2; // сколько всего текстур загружаем
export let floorImageData = null;
export let wallImageData = null;

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
        if (name === 'floor') {
            floorImageData = prepareTexture(img);
        }
        if (name === 'wall') {
            wallImageData = prepareTexture(img);
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
    loadTextures('floor', 'textures/floor.jpg');
}