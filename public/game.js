const config = {
  type: Phaser.AUTO,
  parent: 'content',
  width: 640,
  height: 512,
  scene: {
    key: 'main',
    preload: preload,
    create: create,
    update: update
  }
}

const game = new Phaser.Game(config);
let enemies;

const ENEMY_SPEED = 1/10000;

const Enemy = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,
  initialize:
  Enemy = (scene) => {
    Phaser.GameObjects.Image.call(this, scene, 0, 0, 'sprites', 'enemy');
    this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
  },
  startOnPath: () => {
    this.follower.t = 0;
    path.getPoint(this.follower.t, this.follower.vec);
    this.setPosition(this.follower.vec.x, this.follower.vec.y);
  },
  update: (time, delta) => {
    this.follower.t += ENEMY_SPEED * delta;
    path.getPoint(this.follower.t, this.follower.vec);
    this.setPosition(this.follower.vec.x, this.follower.vec.y);
    if (this.follower.t >= 1) {
      this.setActive(false);
      this.setVisible(false);
    }
  }
})

function preload () {
  this.load.atlas('sprites', 'assets/spritesheet.png', 'assets/spritesheet.json');
  this.load.image('bullet', 'assets/bullet.png');
}

function create () {
  const graphics = this.add.graphics();

  const path = this.add.path(96, -32);
  path.lineTo(96, 164);
  path.lineTo(480, 164);
  path.lineTo(480, 544);

  graphics.lineStyle(3, 0xffffff, 1);
  path.draw(graphics);

  enemies = this.add.group({ classType: Enemy, runChildUpdate: true });
  this.nextEnemy = 0;
}

function update (time, delta) {
  if (time > this.nextEnemy) {
    const enemy = enemies.get();
    if (enemy) {
      console.log('in update enemy')
      enemy.setActive(true);
      enemy.setVisible(true);
      enemy.startOnPath();
      this.nextEnemy = time + 2000;
    }
  }
}