// mapData.js
export let solidMap = [];
export let items = [];
export let signs = [];
export let startX = 2.5, startY = 2.5;

export function initMap(){
    const levelMap = [
        "WWWWWWWWWWWWWWWWWWWW",
        "WWWWWWW    C       D",
        "WWWWWWWCWWWWWWWRWWWW",
        "WWWWWWW WWWWWWWrWWWW",
        "WWWWWWW WWWrrrSrWWWW",
        "WWGrrrR WWWrWWWWWWWW",
        "WWWWWWW WWWrrWWWWWWW",
        "WWWWWWW WWWWrWWWWWWW",
        "WWWWWWW WWWWrWWWWWWW",
        "WWWWWWW WWWWRWWWWWWW",
        "WT     C     WWWWWWW",
        "WWWWWWWWWWWW WWWWWWW",
        "WWWWWWWWWWWW WWWWWWW",
        "WWWWd   C    RrrTWWW",
        "WWWWWWWWWWWW WWWWWWW",
        "WN     WWWWW WWWWWWW",
        "WWWWWW WWWWW WWWWWWW",
        "WWWWWW WWWWW WWdWWWW",
        "WWP n    W        WW",
        "WWWWWWW       C WWWW",
        "WWWWWWWWWWWWWWWWWWWW"
    ];

    solidMap.length = 0;
    items.length = 0;
    signs.length = 0

    for (let y = 0; y < levelMap.length; y++){
        solidMap[y] = [];
        const row = levelMap[y];
        for (let x = 0; x < row.length; x++){
            const sh = row[x];
            let tile = 0;
            if (sh === 'W' || sh === 'N' || sh === 'G' || sh === 'D') tile = 1;
            else if (sh === 'R' || sh === 'S' ) tile = 2;
            else tile = 0;
            solidMap[y][x] = tile;
            if (sh === 'P'){ startX = x + 0.5; startY = y + 0.5;
            } else if (sh === 'C'){
                items.push({x, y, type: 'coin', value: 100});
            } else if (sh === 'd'){
                items.push({x, y, type: 'diamond', value: 500});
            } else if (sh === 'T'){
                items.push({x, y, type: 'time', value: 5, time: 15});
            } else if (sh === 'R'){
                items.push({x, y, type: 'secret_road', value: 1});
            } else if (sh === 'r'){
                items.push({x, y, type: 'void_secret', value: 1});
            } else if (sh === 'D'){
                items.push({x, y, type: 'fake_door', value: 150, trap: true});
            } else if (sh === 'S'){
                items.push({x, y, type: 'secret_door', value: 15000, win: true});
            } else if (sh === 'G'){ // g/п т.е п - правильная дверь
                items.push({x, y, type: 'true_door', value: 500, win: true});
            } else if (sh === 'N'){
                signs.push({x, y, type: 'secret', text: "Мини подсказка: нажми на 'O' перед странной стеной", });
            } else if (sh === 'n'){
                signs.push({x, y, type: 'usually', text: "Добро пожаловать в лабиринт!\nСобери монеты и найди выход. \nчитать таблички 'e'"})
            }
        }
    }
    // Можно вывести в консоль для проверки
    console.log(`Карта загружена. Предметов: ${items.length}, табличек: ${signs.length}, старт: (${startX}, ${startY})`);
}