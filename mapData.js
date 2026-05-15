// mapData.js
import { levelsData } from "./levelData.js";

export let solidMap = [];
export let items = [];
export let signs = [];
export let startX = 0, startY = 0;
export let startDir = 0;

export function initMap(levelMap){
    if (!levelMap){
        console.error('ОШИБКА: не передана карта уровня');
        return
    }

    solidMap.length = 0;
    items.length = 0;
    signs.length = 0

    for (let y = 0; y < levelMap.length; y++){
        solidMap[y] = [];
        const row = levelMap[y];
        for (let x = 0; x < row.length; x++){
            const sh = row[x];
            let tile = 0;
            if (sh === 'W' || sh === 'N' || sh === 'G' || sh === 'D' || sh === 'a' || sh === 'b' || sh === 'A') tile = 1;
            else if (sh === 'R' || sh === 'S' ) tile = 2;
            else tile = 0;
            solidMap[y][x] = tile;
            if (sh === 'P'){ 
                startX = x + 0.5; startY = y + 0.5;
            } else if (sh === '^'){
                startX = x + 0.5; startY = y + 0.5;
                startDir = -Math.PI / 2;
            } else if (sh === '>'){
                startX = x + 0.5; startY = y + 0.5;
                startDir = 0;
            } else if (sh === 'v'){
                startX = x + 0.5; startY = y + 0.5;
                startDir = Math.PI / 2;
            } else if (sh === '<'){
                startX = x + 0.5; startY = y + 0.5;
                startDir = Math.PI;
            } else if (sh === 'C'){
                items.push({x, y, type: 'coin', value: 100});
            } else if (sh === 'd'){
                items.push({x, y, type: 'diamond', value: 500});
            } else if (sh === 't'){
                items.push({x, y, type: 'time', value: 5, time: 15});
            } else if (sh === 'R'){
                items.push({x, y, type: 'secret_road', value: 1});
            } else if (sh === 'r'){
                items.push({x, y, type: 'void_secret', value: 1});
            } else if (sh === 'D'){
                items.push({x, y, type: 'fake_door', value: 150, trap: true, opened: false});
            } else if (sh === 'S'){
                items.push({x, y, type: 'secret_door', value: 15000, win: true, opened: false});
            } else if (sh === 'G'){ // g/п т.е п - правильная дверь
                items.push({x, y, type: 'true_door', value: 500, win: true, opened: false});
            } else if (sh === 'N'){
                signs.push({x, y, type: 'secret', text: "Мини подсказка: нажми на 'O' перед странной стеной", });
            } else if (sh === 'n'){
                signs.push({x, y, type: 'usually', text: "Добро пожаловать в лабиринт!\nСобери монеты и найди выход. \nчитать таблички 'e'"})
            } else if (sh === '0'){
                signs.push({x, y, type: 'usually', text: "Добро пожаловать в параллельный мир.\n Твоя задача: пройти 50 уровней лабиринта.\n У тебя сейчас две двери:\n'Альфа'- типа обучение, и\n'Бета' - мир где и начнётся твоё испытание\n*жуткий смех*", addTime: 9000});
            } else if (sh === 'a'){
                items.push({x, y, type: 'portal', target: 'alpha_lvl', value: 14, opened: false });
            } else if (sh === 'A'){
                items.push({x, y, type: 'portal', target: 'alpha_end', value: 99, opened: false});
            } else if (sh === 'b'){
                items.push({x, y, type: 'portal', target: 'beta_lvl', value: 15, opened: false }); // нет смысла городить новые двери т.е есть f,s,t двери
            }
        }
    }
    // Можно вывести в консоль для проверки
    console.log(`Карта загружена. Предметов: ${items.length}, табличек: ${signs.length}, старт: (${startX}, ${startY})`);
}