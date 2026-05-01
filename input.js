// input.js
import { keys } from "./player.js";

export function initInput(onRead, onOpen){

    window.addEventListener('keydown', (e) => {
        switch(e.key){
            case 'w': case 'ArrowUp': keys.w = true; break
            case 'a': case 'ArrowLeft': keys.a = true; break
            case 's': case 'ArrowDown': keys.s = true; break
            case 'd': case 'ArrowRight': keys.d = true; break
            case 'e': onRead?.(); break;
            case 'o': onOpen?.(); break;
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