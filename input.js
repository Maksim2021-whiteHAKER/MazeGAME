// input.js
import { keys } from "./player.js";

export const joystick = {
    active: false,
    baseX: 0, baseY: 0,
    knobX: 0, knobY: 0,
    angle: 0, force: 0,
    zone: document.getElementById('joystickZone'),
    base: document.getElementById('joystickBase'),
    knob: document.getElementById('joystickKnob')
}

export function initJoystick(){
    joystick.zone.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const rect = joystick.base.getBoundingClientRect();
        joystick.baseX = rect.left + rect.width / 2;
        joystick.baseY = rect.top + rect.height / 2;
        joystick.active = true;
        updateJoystick(touch.clientX, touch.clientY);
    }, { passive: false });

    joystick.zone.addEventListener('touchmove', (e) => {
        if (!joystick.active) return
        updateJoystick(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false});

    joystick.zone.addEventListener('touchend', () => {
        joystick.active = false;
        joystick.force = 0;
        joystick.knob.style.transform = `translate(0, 0)`;

    })
}

function updateJoystick(clientX, clientY){
    const maxRad = 50;
    let dx = clientX - joystick.baseX;
    let dy = clientY - joystick.baseY;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRad) { dx *= maxRad/dist; dy *= maxRad/dist; }
  
  joystick.knob.style.transform = `translate(${dx}px, ${dy}px)`;
  joystick.angle = Math.atan2(dy, dx);
  joystick.force = Math.min(dist / maxRad, 1);   
}

export function initInput(onRead, onOpen){

    window.addEventListener('keydown', (e) => {
        switch(e.key){
            case 'w': case 'ArrowUp': keys.w = true; break
            case 'a': case 'ArrowLeft': keys.a = true; break
            case 's': case 'ArrowDown': keys.s = true; break
            case 'd': case 'ArrowRight': keys.d = true; break
            case 'e': case 'у': onRead?.(); break;
            case 'o': case 'щ': onOpen?.(); break;
        }
        e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
        switch(e.key){
            case 'w': case 'ArrowUp': keys.w = false; break
            case 'a': case 'ArrowLeft': keys.a = false; break
            case 's': case 'ArrowDown': keys.s = false; break
            case 'd': case 'ArrowRight': keys.d = false; break
        }
    });

    document.querySelectorAll('[data-key]').forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys[btn.dataset.key] = true;
        })
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys[btn.dataset.key] = false;
        })
    })

    const readBtn = document.getElementById('readBtn');
    const openBtn = document.getElementById('openBtn');

    if (readBtn){
        readBtn.addEventListener('click', () => onRead?.());
        readBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            onRead?.();
        });
    }

    if (openBtn){
        openBtn.addEventListener('click', () => onOpen?.());
        openBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            onOpen?.();
        });
    }
}