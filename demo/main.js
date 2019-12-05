// create a new scene
let gameScene = new Phaser.Scene('Game');

// some parameters for our scene
gameScene.init = function() {

  // player parameters
  this.playerSpeed = 150;
  this.jumpSpeed = -600;
};

// load asset files for our game
gameScene.preload = function() {

  // load images
  this.load.image('ground', 'assets/images/ground.png');
  this.load.image('platform', 'assets/images/platform.png');
  this.load.image('block', 'assets/images/block.png');
  this.load.image('goal', 'assets/images/gorilla3.png');
  this.load.image('barrel', 'assets/images/barrel.png');

  // load spritesheets
  this.load.spritesheet('player', 'assets/images/player_spritesheet.png', {
    frameWidth: 28,
    frameHeight: 30,
    margin: 1,
    spacing: 1
  });

  this.load.spritesheet('fire', 'assets/images/fire_spritesheet.png', {
    frameWidth: 20,
    frameHeight: 21,
    margin: 1,
    spacing: 1
  });

  this.load.json('levelData', 'assets/json/levelData.json');
};

// executed once, after assets were loaded
gameScene.create = function() {

  if(!this.anims.get('walking')) {
    // walking animation
    this.anims.create({
      key: 'walking',
      frames: this.anims.generateFrameNames('player', {
        frames: [0, 1, 2]
      }),
      frameRate: 12,
      yoyo: true,
      repeat: -1
    });
  }

  if(!this.anims.get('burning')) {
    // fire animation
    this.anims.create({
      key: 'burning',
      frames: this.anims.generateFrameNames('fire', {
        frames: [0, 1]
      }),
      frameRate: 4,
      repeat: -1
    });
  }

  // add all level elements
  this.setupLevel();

  // initiate barrel spawner
  this.setupSpawner();

  // collision detection
  this.physics.add.collider([this.player, this.goal, this.barrels], this.platforms);

  // overlap checks
  this.physics.add.overlap(this.player, [this.fires, this.goal, this.barrels], this.restartGame, null, this);

  // enable cursor keys
  this.cursors = this.input.keyboard.createCursorKeys();

  this.input.on('pointerdown', function(pointer) {
    console.log(pointer.x, pointer.y);
  });
};

// executed on every frame
gameScene.update = function() {
  // are we on the ground?
  let onGround = this.player.body.blocked.down || this.player.body.touching.down;

  // movement to the left
  if (this.cursors.left.isDown) {
    this.player.body.setVelocityX(-this.playerSpeed);

    this.player.flipX = false;

    // play animation if none is playing
    if (onGround && !this.player.anims.isPlaying)
      this.player.anims.play('walking');
  }

  // movement to the right
  else if (this.cursors.right.isDown) {
    this.player.body.setVelocityX(this.playerSpeed);

    this.player.flipX = true;

    // play animation if none is playing
    if (onGround && !this.player.anims.isPlaying)
      this.player.anims.play('walking');
  } else {
    // make the player stop
    this.player.body.setVelocityX(0);

    // stop walking animation
    this.player.anims.stop('walking');

    // set default frame
    if (onGround)
      this.player.setFrame(3);
  }

  // handle jumping
  if (onGround && (this.cursors.space.isDown || this.cursors.up.isDown)) {
    // give the player a velocity in Y
    this.player.body.setVelocityY(this.jumpSpeed);

    // stop the walking animation
    this.player.anims.stop('walking');

    // change frame
    this.player.setFrame(2);
  }
};

// sets up all the elements in the level
gameScene.setupLevel = function() {

  // load json data
  this.levelData = this.cache.json.get('levelData');

  // world bounds
  this.physics.world.bounds.width = this.levelData.world.width;
  this.physics.world.bounds.height = this.levelData.world.height;

  // create all the platforms
  this.platforms = this.physics.add.staticGroup();
  for (let i = 0; i < this.levelData.platforms.length; i++) {
    let curr = this.levelData.platforms[i];

    let newObj;

    // create object
    if(curr.numTiles == 1) {
      // create sprite
      newObj = this.add.sprite(curr.x, curr.y, curr.key).setOrigin(0);
    }
    else {
      // create tilesprite
      let width = this.textures.get(curr.key).get(0).width;
      let height = this.textures.get(curr.key).get(0).height;
      newObj = this.add.tileSprite(curr.x, curr.y, curr.numTiles * width , height ,curr.key).setOrigin(0);
    }

    // enable physics
    this.physics.add.existing(newObj, true);

    // add to the group
    this.platforms.add(newObj);
  }

  // create all the fire
  this.fires = this.physics.add.group({
    allowGravity: false,
    immovable: true
  });
  for (let i = 0; i < this.levelData.fires.length; i++) {
    let curr = this.levelData.fires[i];

    let newObj = this.add.sprite(curr.x, curr.y, 'fire').setOrigin(0);

    // play burning animation
    newObj.anims.play('burning');

    // add to the group
    this.fires.add(newObj);

    // this is for level creation
    newObj.setInteractive();
    this.input.setDraggable(newObj);
  }

  // for level creation
  this.input.on('drag', function(pointer, gameObject, dragX, dragY){
    gameObject.x = dragX;
    gameObject.y = dragY;

    console.log(dragX, dragY);

  });

  // player
  this.player = this.add.sprite(this.levelData.player.x, this.levelData.player.y, 'player', 3);
  this.physics.add.existing(this.player);

  // constraint player to the game bounds
  this.player.body.setCollideWorldBounds(true);

  // camera bounds
  this.cameras.main.setBounds(0, 0, this.levelData.world.width, this.levelData.world.height);
  this.cameras.main.startFollow(this.player);


  // goal
  this.goal = this.add.sprite(this.levelData.goal.x, this.levelData.goal.y, 'goal');
  this.physics.add.existing(this.goal);
};

// restart game (game over + you won!)
gameScene.restartGame = function(sourceSprite, targetSprite){
  // fade out
  this.cameras.main.fade(500);

  // when fade out completes, restart scene
  this.cameras.main.on('camerafadeoutcomplete', function(camera, effect){
    // restart the scene
    this.scene.restart();
  }, this);
};

// generation of barrels
gameScene.setupSpawner = function(){
  // barrel group
  this.barrels = this.physics.add.group({
    bounceY: 0.1,
    bounceX: 1,
    collideWorldBounds: true
  });

  // spawn barrels
  let spawningEvent = this.time.addEvent({
    delay: this.levelData.spawner.interval,
    loop: true,
    callbackScope: this,
    callback: function(){
      // create a barrel
      let barrel = this.barrels.get(this.goal.x, this.goal.y, 'barrel');

      // reactivate
      barrel.setActive(true);
      barrel.setVisible(true);
      barrel.body.enable = true;

      // set properties
      barrel.setVelocityX(this.levelData.spawner.speed);

      //console.log(this.barrels.getChildren().length);

      // lifespan
      this.time.addEvent({
        delay: this.levelData.spawner.lifespan,
        repeat: 0,
        callbackScope: this,
        callback: function(){
          this.barrels.killAndHide(barrel);
          barrel.body.enable = false;
        }
      });
    }
  });
};

// our game's configuration
let config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  scene: gameScene,
  title: 'Monster Kong',
  pixelArt: false,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        y: 1000
      },
      debug: false
    }
  }
};

// create the game, and pass it the configuration
let game = new Phaser.Game(config);
