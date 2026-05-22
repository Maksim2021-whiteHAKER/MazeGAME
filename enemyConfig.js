// enemyConfig.js

export const ENEMY_CONFIG = {
    axeos_meo: { speed: 1.5, canPassDoors: false, canPassWalls: false, behavior: 'guard', lookThreshold: 5, teleportCooldown: 3, stopWhenWatching: true}, // SCP173 + Плачущий ангел(ИЗ ДОКТОРА КТО)
    passer: { speed: 1.2, canPassDoors: true, canPassWalls: false, behavior: 'passer', stopWhenWatching: false}, // проходчик
    stalker: { speed: 1.8, canPassDoors: false, canPassWalls: false, behavior: 'stalker', radar_range: 5, stopWhenWatching: false}, // преследователь
    spirit_leya: { speed: 0.6, canPassDoors: true, canPassWalls: true, behavior: 'spirit', stopWhenWatching: false}, // дух Лейя
    time_eater: { speed: 1.0, canPassDoors: false, canPassWalls: false, behavior: 'time_eater', drain: {3: 10, 1: 14}, stopWhenWatching: false}, // пожиратель времени
    eye_fear: {speed: 0.3, canPassDoors: false, canPassWalls: false, behavior: 'eye_fear', effects: {10: { type: 'slow', duration: 2 }, 15: { type: 'stun', duration: 2 }, 30: { type: 'death' }}, stopWhenWatching: false},
    fog_death: { speed: 0, canPassDoors: false, canPassWalls: false, behavior: 'fog_death', spawn_time: 6, despawn_time: 4, spawnRadius: 4, fog_teleport_range: 10, stopWhenWatching: false},
    skeleton: { speed: 0.5, canPassDoors: false, canPassWalls: false, behavior: 'skeleton', stopWhenWatching: false},
    rune_keeper: { speed: 1.3, canPassDoors: false, canPassWalls: false, behavior: 'rune_keeper', duration: 5, stopWhenWatching: false}, // хранитель рун
    mimic: { speed: 1.0, canPassDoors: false, canPassWalls: false, behavior: 'mimic', delay: 1.5, stopWhenWatching: false} // подражатель
}