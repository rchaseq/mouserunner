let game;

// global game options
let gameOptions = {
    platformStartSpeed: 350,
    spawnRange: [50, 350],
    platformSizeRange: [50, 350],
    playerGravity: 900,
    jumpForce: 400,
    playerStartPosition: 200,
    jumps: 2,
    localStorageName: 'mouserunner',
}

window.onload = function() {

    // object containing configuration options
    let gameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        scene: titleScene, playGame, //these should be in order of play
        backgroundColor: 0x87CEEB,

    // physics settings
        physics: {
            default: "arcade"
        }
    }

    game = new Phaser.Game(gameConfig);

    window.focus();
    resize();
    window.addEventListener("resize", resize, false);
}

// titleScene scene
class titleScene extends Phaser.Scene{
    constructor(){
    //super() inherits all the characteristics of the Phaser "scene" class
        super("TitleScene");
    }

    preload(){
        this.load.image('player', 'player.png');
        this.load.audio('squeak', 'squeak.mp3');
        this.load.audio('origins', 'origins.mp3');
    }
    create(){

        this.centerX = game.config.width/2;
        this.centerY = game.config.height/2;

    //adding background music that will not restart upon game over and will loop when finished
            this.sound.play('origins', {
                volume: 0.5,
                loop: true
            });

        this.add.text(this.centerX, this.centerY -100, 'Mouse Runner', { font: '50px arial', fill: 'black' }).setOrigin(0.5, 0.5);

        const mouse = this.add.image(this.centerX - 10, this.centerY - 25, 'player');
        
        mouse.setScale(3); // Resize the image

        //just for fun mouseover effects
            mouse.on('pointerover', function (pointer)
            {
                mouse.setScale(4);
            });

            mouse.on('pointerout', function (pointer)
            {
                mouse.setScale(3);
            });


        this.add.text(this.centerX - 10, this.centerY + 50, 'Click mouse to start', { font: '20px arial', fill: 'black' }).setOrigin(0.5, 0.5);

        this.add.text(this.centerX + 100, this.centerY + 200, 'by Rowan Quinn', { font: '15px arial', fill: 'black' }).setOrigin(0.5, 0.5);

        //squeaks and starts the game once clicked
        mouse.setInteractive({cursor: 'pointer'}).on('pointerdown', function(pointer){
            this.sound.play('squeak');
            this.scene.remove('TitleScene', titleScene, true);
            this.scene.add('PlayGame', playGame, true);
            },this);

}}

// playGame scene
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }

    preload(){
        this.load.image('platform', 'platform.png');
        this.load.image('player', 'player.png');
        this.load.image('pause', 'pause.png');
        this.load.image('mute', 'mute.png');
        this.load.audio('squeak', 'squeak.mp3');
    }

    create(){


        //score
        let score = 0;
        let highestScore = 0;
        var scoreText = this.add.text(24, 24, 'Score: ', { font: '20px arial', fill: 'black' });
        var topScoreText = this.add.text(24, 54, 'Top score: ', { font: '20px arial', fill: 'black' });
        //const pauseButton = this.add.image(750, 70, 'pause');
        //const muteButton = this.add.image(752, 30, 'mute');

        getHighestScore();
        displayHighestScore();

        // Function to retrieve the highest score
        function getHighestScore() {
            highestScore = localStorage.getItem('highestScore') || 0;
            return parseInt(highestScore);
        };

        // Function to display the highest score
        function displayHighestScore() {
            topScoreText.setText('Top score: ' + highestScore);
        };

        // Function to save the highest score
        function saveHighestScore(score) {
            if (score > highestScore) {
                highestScore = score;
                localStorage.setItem('highestScore', highestScore);
            }
        };

        // Function to update the highest score
        function updateHighScore(){
            if (score > getHighestScore()){
                saveHighestScore(score)
            }
        };

        /* Function to toggle mute/unmute
        function toggleMute() {
            audio.setMute(!audio.isMuted);
        };

        // Function to toggle pause/resume
        function togglePause() {
            if (this.scene.isPaused()) {
                this.scene.resume();
            } else {
                this.scene.pause();
            }
        };

        //adding mute & unmute functionality
        muteButton.setInteractive({cursor: 'pointer'}).on('pointerdown', toggleMute);

        //adding pause & resume functionality
        pauseButton.setInteractive({cursor: 'pointer'}).on('pointerdown', togglePause);
        */

        // group with all active platforms
        this.platformGroup = this.add.group({

        // once a platform is removed, it's added to the pool
            removeCallback: function(platform){
                platform.scene.platformPool.add(platform)

        //score is how many platforms successfully cleared
                score ++;
                scoreText.setText('Score: ' + score);
                updateHighScore();
            }
        });


        // platform pool
        this.platformPool = this.add.group({

        // once a platform is removed from the pool, it's added to the active platforms group
            removeCallback: function(platform){
                platform.scene.platformGroup.add(platform)
            }
        });
        
        // number of consecutive jumps made by the player
        this.playerJumps = 0;

        // adding a platform to the game, the arguments are platform width and x position
        this.addPlatform(game.config.width, game.config.width / 2);

        

        // adding the player
        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, game.config.height / 2, 'player');
        this.player.setGravityY(gameOptions.playerGravity);

        // setting collisions between the player and the platform group
        this.physics.add.collider(this.player, this.platformGroup);

        // checking for input
        this.input.on('pointerdown', this.jump, this);

    
    }

        // the core of the script - platforms are added from the pool or created on the fly
        addPlatform(platformWidth, posX){
            let platform;
            if(this.platformPool.getLength()){
                platform = this.platformPool.getFirst();
                platform.x = posX;
                platform.active = true;
                platform.visible = true;
                this.platformPool.remove(platform);
            }
            else{
                platform = this.physics.add.sprite(posX, game.config.height * 0.8, "platform");
                platform.setImmovable(true);
                platform.setVelocityX(gameOptions.platformStartSpeed * -1);
                this.platformGroup.add(platform);
            }
        platform.displayWidth = platformWidth;
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);
    }

    

        // the player jumps when on the ground, or once in the air as long as there are jumps left and the first jump was on the ground
        jump(){
            if(this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps)){
                if(this.player.body.touching.down){
                    this.playerJumps = 0;
                }
                this.player.setVelocityY(gameOptions.jumpForce * -1);
                this.playerJumps ++;
                this.sound.play('squeak');
        }
    }
    
    
    update(){


        // game over
        if(this.player.y > game.config.height + 200){ 
            this.scene.start('PlayGame');
        }
        this.player.x = gameOptions.playerStartPosition;


        // recycling platforms
        let minDistance = game.config.width;
        this.platformGroup.getChildren().forEach(function(platform){
            let platformDistance = game.config.width - platform.x - platform.displayWidth / 2;
            minDistance = Math.min(minDistance, platformDistance);
            if(platform.x < - platform.displayWidth / 2){
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        }, this);

        // adding new platforms
        if(minDistance > this.nextPlatformDistance){
            var nextPlatformWidth = Phaser.Math.Between(gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1]);
            this.addPlatform(nextPlatformWidth, game.config.width + nextPlatformWidth / 2);
        }

    }

};

/*
// levelTwo scene
class levelTwo extends Phaser.Scene{
    constructor(){
        super("LevelTwo");
    }

    preload(){
    }

    create(){

    }
    update(){

    }
*/

/*
// gameOver scene
class gameOver extends Phaser.Scene{
    constructor(){
        super("GameOver");
    }

    preload(){
    }

    create(){

    }
    update(){

    }
*/

function resize(){
    let canvas = document.querySelector("canvas");
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}
