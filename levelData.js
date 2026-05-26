// levelData.js
const alphaMap = [
    "WWWWWWWWWWWWWWWWWWWW",
    "WWWWWWW    C       D",
    "WWWWWWWCWWWWWWWRWWWW",
    "WWWWWWW WWWWWWWrWWWW",
    "WWWWWWW WWWrrrSrWWWW",
    "WWArrrR WWWrWWWWWWWW",
    "WWWWWWW WWWrrWWWWWWW",
    "WWWWWWW WWWWrWWWWWWW",
    "WWWWWWW WWWWrWWWWWWW",
    "WWWWWWW WWWWRWWWWWWW",
    "Wt     C     WWWWWWW",
    "WWWWWWWWWWWW WWWWWWW",
    "WWWWWWWWWWWW WWWWWWW",
    "WWWWd   C    RrrtWWW",
    "WWWWWWWWWWWW WWWWWWW",
    "WN     WWWWW WWWWWWW",
    "WWWWWW WWWWW WWWWWWW",
    "WWWWWW WWWWW WWdWWWW",
    "WW> n    W        WW",
    "WWWWWWW       C WWWW",
    "WWWWWWWWWWWWWWWWWWWW"
];

const houseMap = [
    "WWaWbWW",
    "W     W",
    "W     W",
    "W  0  W",
    "W  ^  W",
    "W     W",
    "WWWWWWW",
]

const labyrinthLv0 = [
    "WWWWWWWWWWWWWWWWWW",
    "WGrrr  W   WWWWWWW",
    "WWWWWrWWWW WWWWWWW",
    "WWWWWRWWWW WWWWWWW",
    "WWWWt   C   CWWWWW",
    "N CWWW WW WW WWWWW",
    "WW WWW WWRWWC  DWW",
    "WWn d  WWrWWW WWWW",
    "WW^WWW WW  SWWWWWW",
    "WWWWWWWWWWWWWWWWWW",
]

const labyrinthLv1 = [
    "WWWWWWWWWWWW",
    "W        WGW",
    "W          W",
    "W          W",
    "W          W",
    "W          W",
    "W          W",
    "W >        W",
    "WWWWWWWWWWWW",
]

const labLv2 = [
    "WWWWWWWWWWW",
    "WvWWWW    W",
    "W WWWW WWWW",
    "W  W   WWWW",
    "W WW WWWWWW",
    "W      WWWW",
    "W W WRWWWWW",
    "WWW WrWWWWW",
    "WWD WrrrGWW",
    "WWWWWWWWWWW", 
]

const labLv3 = [
    "WWWWWWWWWWWW",
    "W          W",
    "W          W",
    "W ^        W",
    "WWWWWWWWWWWW",
]

export const levelDataA = [
    {
        name: "альфа", map: alphaMap, startX: 3, startY: 18.5, timeLimit: 90*1000, enemies: [],
        theme: {
            wallTexture: 'wall_rune',
            floorGradientTop: 'rgb(110, 30, 20)',
            floorGradientBottom: 'rgb(65, 15, 10)',
            ceilingColor: 'rgb(30, 25, 120)'
        }
    }
]

// levelData.js
export const levelsData = [
    { // 0 уровень: дом
        name: "дом",
        map: houseMap, 
        dir: 0, timeLimit: null, enemies: [], 
        theme: {
            wallTexture: 'wall_wood',
            floorGradientTop: 'rgb(110, 70, 30)',
            floorGradientBottom: 'rgb(40, 20, 10)',
            ceilingColor: 'rgb(30, 25, 30)'
        }
    },
    { // 1 уровень: лабиринт ур 0
        name: "Лабиринт ур 0", map: labyrinthLv0,
        // startX: 15, startY: 15, 
        timeLimit: 90 * 1000, enemies: [],
        theme: {
            wallTexture: 'wall_rune', // original rune_wall
            floorGradientTop: 'rgb(110, 30, 20)',
            floorGradientBottom: 'rgb(65, 15, 10)',
            ceilingColor: 'rgb(30, 25, 120)'
        }
    },
    { // 2 уровень: лабиринт ур 1
        name: "Лабиринт ур 1", map: labyrinthLv1, timeLimit: 120 * 1000, enemies: [{ x: 8, y: 3, type: 'skeleton' }],
        theme: {
            wallTexture: 'wall_rune',
            floorGradientTop: 'rgb(60, 40, 70)',
            floorGradientBottom: 'rgb(20, 15, 30)',
            ceilingColor: 'rgb(10, 10, 14)'

        }
    },
    {
        // 3 уровень: лабиринт ур 2
        name: "Лаб ур 2", map: labLv2, timeLimit: 140 * 1000, enemies: [{ x: 8, y: 1, type: 'skeleton' }],
        theme: {
            wallTexture: 'wall_rune',
            floorGradientTop: 'rgb(60, 40, 70)',
            floorGradientBottom: 'rgb(20, 15, 30)',
            ceilingColor: 'rgb(10, 10, 14)'

        }
    },
    {
        // 4 уровень: лабиринт ур 2
        name: "Лаб ур 3", map: labLv3, timeLimit: 140 * 1000, enemies: [{ x: 8, y: 1, type: 'skeleton' }],
        theme: {
            wallTexture: 'wall_rune',
            floorGradientTop: 'rgb(60, 40, 70)',
            floorGradientBottom: 'rgb(20, 15, 30)',
            ceilingColor: 'rgb(10, 10, 14)'

        }
    },    
    { // Ловушка: бесконечный лабиринт (без таймера)
        // name: "Бесконечный лабиринт", map: generateInfiniteLabyrinth(), startX: 1.5, startY: 1.5, timeLimit: null, enemies: [{ x: 5, y: 5, type: 'chaser' }]
    }
]