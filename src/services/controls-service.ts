import Phaser from "phaser";

class ControlsService {

  isTouchDevice = false;

  events = new Phaser.Events.EventEmitter();
  leftKeyPressed = false;
  rightKeyPressed = false;
  jumpKeyPressed = false;
  stopKeyPressed = false;

  constructor() {
    this.isTouchDevice = window.navigator.maxTouchPoints > 0;
  }

  init() {
    if (!this.isTouchDevice) return;
    const leftButton = document.getElementById('left');
    const rightButton = document.getElementById('right');
    const jumpButton = document.getElementById('jump');
    const stopButton = document.getElementById('stop');

    leftButton?.addEventListener('pointerdown', () => {
      this.leftKeyPressed = true;
      this.events.emit('left-control-clicked');
    });

    leftButton?.addEventListener('pointerup', () => {
      console.log('left up')
      this.leftKeyPressed = false;
      this.events.emit('left-control-released');
    });

    rightButton?.addEventListener('pointerdown', () => {
      this.rightKeyPressed = true;
      this.events.emit('right-control-clicked');
    });

    rightButton?.addEventListener('pointerup', () => {
      this.rightKeyPressed = false;
      this.events.emit('right-control-released');
    });

    jumpButton?.addEventListener('pointerdown', () => {
      this.jumpKeyPressed = true;
      this.events.emit('jump-control-clicked');
    });

    jumpButton?.addEventListener('pointerup', () => {
      this.jumpKeyPressed = false;
      this.events.emit('jump-control-released');
    });
    stopButton?.addEventListener('pointerdown', () => {
      this.stopKeyPressed = true;
      this.events.emit('stop-control-clicked');
    });

    stopButton?.addEventListener('pointerup', () => {
      this.stopKeyPressed = false;
      this.events.emit('stop-control-released');
    });
  }
}

export const controlsService = new ControlsService();