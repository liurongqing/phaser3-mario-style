import { BASE_URL, PATH_URL } from '@/const'
export default class Main extends Phaser.Scene {
  player: any
  platforms: any
  cursors: any
  playerSpeed: any
  jumpSpeed: any
  constructor() {
    super('mainScene')
  }

  init() {
    this.playerSpeed = 150
    this.jumpSpeed = -600
  }

  preload() {
    this.load.setBaseURL(BASE_URL)
    this.load.setPath(PATH_URL)
    this.load.image('ground', 'images/ground.png')
    this.load.image('block', 'images/block.png')
    // this.load.spritesheet('player', 'images/player_spritesheet.png')
  }

  create() {
    // platforms
    this.platforms = this.add.group()
    this.cursors = this.input.keyboard.createCursorKeys()

    // ground
    const ground = this.add.sprite(180, 604, 'ground')
    this.physics.add.existing(ground, true)
    this.platforms.add(ground)

    // platform
    const platform = this.add.tileSprite(180, 500, 4 * 36, 1 * 30, 'block')
    this.physics.add.existing(platform, true)
    this.platforms.add(platform)

    // player
    this.player = this.add.sprite(180, 400, 'player', 3)
    this.physics.add.existing(this.player)

    // @ts-ignore
    // ground.body.allowGravity = false

    // // @ts-ignore
    // ground.body.immovable = true

    this.physics.add.collider(this.player, this.platforms)
    // const ground2 = this.add.sprite(180, 200, 'ground')
    // this.physics.add.collider(ground, ground2)

    this.player.body.setCollideWorldBounds(true)
    this.physics.world.bounds.width = 360
    this.physics.world.bounds.height = 700

    this.createAnims()
  }

  update() {
    if (this.cursors.left.isDown) {
      this.player.flipX = false
      this.player.body.setVelocityX(-this.playerSpeed)
      if (!this.player.anims.isPlaying) {
        this.player.anims.play('walking')
      }
    } else if (this.cursors.right.isDown) {
      this.player.flipX = true
      this.player.body.setVelocityX(this.playerSpeed)
      if (!this.player.anims.isPlaying) {
        this.player.anims.play('walking')
      }
    } else if (this.cursors.space.isDown || this.cursors.up.isDown) {
      // this.player.body.setVelocityX(0)
      this.player.body.setVelocityY(this.jumpSpeed)
      this.player.anims.stop('walking')
      this.player.setFrame(2)
    }
  }

  createAnims() {
    this.anims.create({
      key: 'walking',
      frames: this.anims.generateFrameNames('plaer', {
        frames: [0, 1, 2] as any
      }),
      frameRate: 12,
      yoyo: true,
      repeat: -1
    })
  }
}
