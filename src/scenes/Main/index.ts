import { BASE_URL, PATH_URL } from '@/const'
export default class Main extends Phaser.Scene {
  player: any
  platforms: any
  cursors: any
  playerSpeed: any
  jumpSpeed: any
  levelData: any
  barrels: any
  fires: any // 火
  goal: any // 目标
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
    this.levelData = this.cache.json.get('levelData')

    // 创建动画
    this.createAnims()

    // 设置层级
    this.setupLevel()

    // 设置子弹
    this.setupSpawner()

    this.physics.add.collider(
      [this.player, this.goal, this.barrels],
      this.platforms
    )

    this.physics.add.overlap(
      this.player,
      [this.fires, this.goal, this.barrels],
      this.restartGame,
      null,
      this
    )
    this.cursors = this.input.keyboard.createCursorKeys()
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
      this.player.body.setVelocityX(0)
      this.player.anims.stop('walking')
      if (onGround) {
        this.player.setFrame(3)
      }
    }
    if (onGround && (this.cursors.space.isDown || this.cursors.up.isDown)) {
      this.player.body.setVelocityY(this.jumpSpeed)
      this.player.anims.stop('walking')
      this.player.setFrame(2)
    }
  }

  createAnims() {
    // 人物动画
    if (!this.anims.get('walking')) {
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

    // 火动画
    if (!this.anims.get('burning')) {
      this.anims.create({
        key: 'burning',
        frames: this.anims.generateFrameNames('fire', {
          frames: [0, 1] as any
        }),
        frameRate: 4,
        repeat: -1
      })
    }
  }

  //设置地板与火
  setupLevel() {
    // world bounds
    this.physics.world.bounds.width = this.levelData.world.width
    this.physics.world.bounds.height = this.levelData.world.height

    // 添加地板
    // this.platforms = this.add.group()
    this.platforms = this.physics.add.staticGroup()
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

    // 添加火
    // this.fires = this.add.group()
    this.fires = this.physics.add.group({
      allowGravity: false,
      immovable: true
    })
    for (let i = 0; i < this.levelData.fires.length; i++) {
      let current = this.levelData.fires[i]
      // let newObj = this.fires.create(current.x, current.y, 'fire').setOrigin(0)
      let newObj = this.add.sprite(current.x, current.y, 'fire').setOrigin(0)
      newObj.anims.play('burning')
      this.fires.add(newObj)
      newObj.setInteractive()
      this.input.setDraggable(newObj)
    }

    this.input.on(
      'drag',
      (pointer: any, gameObject: any, dragX: any, dragY: any) => {
        gameObject.x = dragX
        gameObject.y = dragY
      }
    )

    this.player = this.add.sprite(
      this.levelData.player.x,
      this.levelData.player.y,
      'player',
      3
    )
    this.physics.add.existing(this.player)
    this.player.body.setCollideWorldBounds(true)

    // camera bounds
    this.cameras.main.setBounds(
      0,
      0,
      this.levelData.world.width,
      this.levelData.world.height
    )
    this.cameras.main.startFollow(this.player)

    // 目标
    this.goal = this.add.sprite(
      this.levelData.goal.x,
      this.levelData.goal.y,
      'goal'
    )
    this.physics.add.existing(this.goal)
  }

  // 设置子弹
  setupSpawner() {
    this.barrels = this.physics.add.group({
      bounceY: 0.1,
      bounceX: 1,
      collideWorldBounds: true
    })

    const spawningEvent = this.time.addEvent({
      delay: this.levelData.spawner.interval,
      loop: true,
      callback: () => {
        let barrel = this.barrels.get(this.goal.x, this.goal.y, 'barrel')
        // let barrel = this.barrels.create(this.goal.x, this.goal.y, 'barrel')
        // 重新激活
        barrel.setActive(true)
        barrel.setVisible(true)
        barrel.body.enable = true

        barrel.setVelocityX(this.levelData.spawner.speed)
        //console.log(this.barrels.getChildren().length)

        // lifespan
        this.time.addEvent({
          delay: this.levelData.spawner.lifespan,
          repeat: 0,
          callback: () => {
            // barrel.destroy()
            this.barrels.killAndHide(barrel)
            barrel.body.enable = false
          }
        })
      }
    })
  }

  restartGame(sourceSprite: any, targetSprite: any) {
    this.cameras.main.fade(500)
    this.cameras.main.on(
      'camerafadeoutcomplete',
      (camera: any, effect: any) => {
        this.scene.restart()
      }
    )
  }
}
