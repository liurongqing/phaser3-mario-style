import { BASE_URL, PATH_URL } from '@/const'
export default class Main extends Phaser.Scene {
  player: any
  platforms: any
  cursors: any
  playerSpeed: any
  jumpSpeed: any
  levelData: any
  barrels: any
  constructor() {
    super('mainScene')
  }

  init() {
    this.playerSpeed = 150
    this.jumpSpeed = -600
    this.levelData = {
      platforms: [
        {
          x: 72,
          y: 450,
          numTiles: 6,
          key: 'block'
        },
        {
          x: 0,
          y: 330,
          numTiles: 8,
          key: 'block'
        },
        {
          x: 72,
          y: 210,
          numTiles: 8,
          key: 'block'
        },
        { x: 0, y: 90, numTiles: 7, key: 'block' },
        { x: 0, y: 560, numTiles: 1, key: 'ground' }
      ]
    }
  }

  preload() {
    this.load.setBaseURL(BASE_URL)
    this.load.setPath(PATH_URL)
    this.load.image('ground', 'images/ground.png')
    this.load.image('platform', 'images/platform.png')
    this.load.image('block', 'images/block.png')
    this.load.image('goal', 'images/gorilla3.png')
    this.load.image('barrel', 'images/barrel.png')

    this.load.spritesheet('player', 'images/player_spritesheet.png', {
      frameWidth: 28,
      frameHeight: 30,
      margin: 1,
      spacing: 1
    })

    this.load.spritesheet('fire', 'images/fire_spritesheet.png', {
      frameWidth: 20,
      frameHeight: 21,
      margin: 1,
      spacing: 1
    })

    this.load.json('levelData', 'json/levelData.json')
  }

  create() {
    this.physics.world.bounds.width = 360
    this.physics.world.bounds.height = 700

    this.setupLevel()
    this.player = this.add.sprite(180, 400, 'player', 3)
    this.physics.add.existing(this.player)
    this.player.body.setCollideWorldBounds(true)

    this.physics.add.collider(this.player, this.platforms)

    this.cursors = this.input.keyboard.createCursorKeys()

    this.createAnims()

    this.input.on('pointerdown', (pointer: any) => {
      console.log(pointer.x, pointer.y)
    })
  }

  update() {
    const onGround =
      this.player.body.blocked.down || this.player.body.touching.down

    if (this.cursors.left.isDown) {
      this.player.flipX = false
      this.player.body.setVelocityX(-this.playerSpeed)
      if (!this.player.anims.isPlaying) {
        this.player.anims.play('walking')
      }
    } else if (this.cursors.right.isDown) {
      console.log('right...')
      this.player.flipX = true
      this.player.body.setVelocityX(this.playerSpeed)
      if (!this.player.anims.isPlaying) {
        this.player.anims.play('walking')
      }
    } else {
      this.player.anims.stop('walking')
      if (onGround) {
        this.player.setFrame(3)
      }

      if (onGround && (this.cursors.space.isDown || this.cursors.up.isDown)) {
        this.player.body.setVelocityY(this.jumpSpeed)
        this.player.anims.stop('walking')
        this.player.setFrame(2)
      }
    }
  }

  createAnims() {
    this.anims.create({
      key: 'walking',
      frames: this.anims.generateFrameNames('player', {
        frames: [0, 1, 2] as any
      }),
      frameRate: 12,
      yoyo: true,
      repeat: -1
    })
  }

  setupLevel() {
    this.platforms = this.add.group()
    for (let i = 0; i < this.levelData.platforms.length; i++) {
      let current = this.levelData.platforms[i]
      let newObj: any
      if (current.numTiles === 1) {
        newObj = this.add.sprite(current.x, current.y, current.key).setOrigin(0)
      } else {
        // newObj = null
        const width = this.textures.get(current.key).get(0).width
        const height = this.textures.get(current.key).get(0).height
        console.log('width height', width, height)
        newObj = this.add
          .tileSprite(
            current.x,
            current.y,
            current.numTiles * width,
            height,
            current.key
          )
          .setOrigin(0)
      }

      this.physics.add.existing(newObj, true)
      this.platforms.add(newObj)
    }
  }
}
