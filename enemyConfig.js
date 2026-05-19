// enemyConfig.js

export const ENEMY_CONFIG = {
    axseos_meo: { speed: 1.5, canPassDoors: false, canPassWalls: false, behavior: 'guard', lookThreshold: 5, teleportCooldown: 3}, // scp173+плачущий ангел
    passer: { speed: 1.2, canPassDoors: true, canPassWalls: false, behavior: 'passer'}, // проходчик
    stalker: { speed: 1.8, canPassDoors: false, canPassWalls: false, behavior: 'stalker', radar_range: 5}, // преследователь
    spirit_leya: { speed: 0.6, canPassDoors: true, canPassWalls: true, behavior: 'spirit'}, // дух Лейя
    time_eater: { speed: 1.0, canPassDoors: false, canPassWalls: false, behavior: 'time_eater', drain: {3: 10, 1: 14}}, // пожиратель времени
    eye_fear: {speed: 0.3, canPassDoors: false, canPassWalls: false, behavior: 'eye_fear', effects: {10: { type: 'slow', duration: 2 }, 15: { type: 'stun', duration: 2 }, 30: { type: 'death' }}},
    fog_death: { speed: 0, canPassDoors: false, canPassWalls: false, behavior: 'fog_death', spawn_time: 6, despawn_time: 4, spawnRadius: 4, fog_teleport_range: 10},
    skeleton: { speed: 0.9, canPassDoors: false, canPassWalls: false, behavior: 'skeleton'},
    rune_keeper: { speed: 1.3, canPassDoors: false, canPassWalls: false, behavior: 'rune_keeper', duration: 5}, // хранитель рун
    mimic: { speed: 1.0, canPassDoors: false, canPassWalls: false, behavior: 'mimic', delay: 1.5} // подражатель
}