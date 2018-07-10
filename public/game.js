const config = {
  type: Phaser.AUTO,
  parent: 'content',
  width: 640,
  height: 512,
  physics: {
    default: 'arcade'
  },
  scene: {
    key: 'main',
    preload: preload,
    create: create,
    update: update
  }
}

const game = new Phaser.Game(config)
let enemies
let turrets
let bullets
let path

const map = [
  [0, -1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, -1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, -1, -1, -1, -1, -1, -1, -1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, -1, 0, 0]
]

const ENEMY_SPEED = 1 / 10000
const BULLET_DAMAGE = 50

const Enemy = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,

  initialize: function Enemy (scene) {
    Phaser.GameObjects.Image.call(this, scene, 0, 0, 'sprites', 'enemy')
    this.follower = {t: 0, vec: new Phaser.Math.Vector2()}
  },
  startOnPath: function () {
    this.follower.t = 0
    path.getPoint(this.follower.t, this.follower.vec)
    this.setPosition(this.follower.vec.x, this.follower.vec.y)
    this.hp = 100
  },
  update: function (time, delta) {
    this.follower.t += ENEMY_SPEED * delta
    path.getPoint(this.follower.t, this.follower.vec)
    this.setPosition(this.follower.vec.x, this.follower.vec.y)
    if (this.follower.t >= 1) {
      this.setActive(false)
      this.setVisible(false)
    }
  },
  receiveDamage: function (damage) {
    this.hp -= damage
    if (this.hp <= 0) {
      this.setActive(false)
      this.setVisible(false)
    }
  }
})

const Turret = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,

  initialize: function Turret (scene) {
    Phaser.GameObjects.Image.call(this, scene, 0, 0, 'sprites', 'turret')
    this.nextTic = 0
  },
  place: function (i, j) {
    this.y = i * 64 + 64 / 2
    this.x = j * 64 + 64 / 2
    map[i][j] = 1
  },
  update: function (time, delta) {
    if (time > this.nextTic) {
      this.fire()
      this.nextTic = time + 1000
    }
  },
  fire: function () {
    const enemy = getEnemy(this.x, this.y, 100)
    if (enemy) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y)
      addBullet(this.x, this.y, angle)
      this.angle = (angle + Math.PI / 2) * Phaser.Math.RAD_TO_DEG
    }
  }
})

const Bullet = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,

  initialize: function Bullet (scene) {
    Phaser.GameObjects.Image.call(this, scene, 0, 0, 'bullet')
    this.dx = 0
    this.dy = 0
    this.lifespan = 0
    this.speed = Phaser.Math.GetSpeed(600, 1)
  },
  fire: function (x, y, angle) {
    this.setActive(true)
    this.setVisible(true)
    this.setPosition(x, y)
    this.dx = Math.cos(angle)
    this.dy = Math.sin(angle)
    this.lifespan = 300
  },
  update: function (time, delta) {
    this.lifespan -= delta
    this.x += this.dx * (this.speed * delta)
    this.y += this.dy * (this.speed * delta)
    if (this.lifespan <= 0) {
      this.setActive(false)
      this.setVisible(false)
    }
  }
})

function preload () {
  this.load.atlas('sprites', 'assets/spritesheet.png', 'assets/spritesheet.json')
  this.load.image('bullet', 'assets/bullet.png')
}

function create () {
  const graphics = this.add.graphics()
  drawGrid(graphics)

  path = this.add.path(96, -32)
  path.lineTo(96, 164)
  path.lineTo(480, 164)
  path.lineTo(480, 544)

  graphics.lineStyle(3, 0xffffff, 1)
  path.draw(graphics)

  enemies = this.physics.add.group({classType: Enemy, runChildUpdate: true})
  turrets = this.add.group({classType: Turret, runChildUpdate: true})
  bullets = this.physics.add.group({classType: Bullet, runChildUpdate: true})

  this.input.on('pointerdown', placeTurret)

  this.nextEnemy = 0

  this.physics.add.overlap(enemies, bullets, damageEnemy)
}

function update (time, delta) {
  if (time > this.nextEnemy) {
    const enemy = enemies.get()
    if (enemy) {
      console.log('in update enemy')
      enemy.setActive(true)
      enemy.setVisible(true)
      enemy.startOnPath()
      this.nextEnemy = time + 2000
    }
  }
}

function drawGrid (graphics) {
  graphics.lineStyle(1, 0x0000ff, 0.8)
  for (let i = 0; i < 8; i++) {
    graphics.moveTo(0, i * 64)
    graphics.lineTo(640, i * 64)
  }
  for (let j = 0; j < 10; j++) {
    graphics.moveTo(j * 64, 0)
    graphics.lineTo(j * 64, 512)
  }
  graphics.strokePath()
}

function placeTurret (pointer) {
  let i = Math.floor(pointer.y / 64)
  let j = Math.floor(pointer.x / 64)
  if (canPlaceTurret(i, j)) {
    const turret = turrets.get()
    if (turret) {
      turret.setActive(true)
      turret.setVisible(true)
      turret.place(i, j)
    }
  }
}

function canPlaceTurret (i, j) {
  return map[i][j] === 0
}

function addBullet (x, y, angle) {
  const bullet = bullets.get()
  if (bullet) {
    bullet.fire(x, y, angle)
  }
}

function getEnemy (x, y, distance) {
  const enemyUnits = enemies.getChildren()
  for (let i = 0; i < enemyUnits.length; i++) {
    if (enemyUnits[i].active && Phaser.Math.Distance.Between(x, y, enemyUnits[i].x, enemyUnits[i].y) <= distance) {
      return enemyUnits[i];
    }
  }
  return false
}

function damageEnemy (enemy, bullet) {
  if (enemy.active && bullet.active) {
    bullet.setActive(false)
    bullet.setVisible(false)
    enemy.receiveDamage(BULLET_DAMAGE)
  }
}