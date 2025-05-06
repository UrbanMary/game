document.addEventListener('DOMContentLoaded', () => {
    // Основные элементы
    const game = document.getElementById('game');
    const player = document.createElement('div');
    const scoreDisplay = document.createElement('div');
    const gameOverDisplay = document.createElement('div');

    // Настройка игры на весь экран
    game.style.width = '100vw';
    game.style.height = '100vh';
    game.style.overflow = 'hidden';
    game.style.position = 'fixed';
    game.style.backgroundImage = "url('фон.jpg')";
    game.style.backgroundSize = "cover";

    // Размеры объектов (визуальные)
    const PLAYER_WIDTH = 120;
    const PLAYER_HEIGHT = 100;
    const OBSTACLE_WIDTH = 113;
    const OBSTACLE_HEIGHT = 78;
    
    // Размеры хитбоксов (меньше визуальных)
    const PLAYER_HITBOX_WIDTH = 70;  // Уменьшил на 30%
    const PLAYER_HITBOX_HEIGHT = 60;
    const OBSTACLE_HITBOX_WIDTH = 90;
    const OBSTACLE_HITBOX_HEIGHT = 60;

    // Настройка игрока
    player.id = 'player';
    player.style.width = `${PLAYER_WIDTH}px`;
    player.style.height = `${PLAYER_HEIGHT}px`;
    player.style.backgroundImage = "url('bee1.png')";
    player.style.backgroundSize = "contain";
    player.style.position = 'absolute';
    player.style.left = '200px';
    player.style.bottom = '50%';

    // Настройка интерфейса
    scoreDisplay.id = 'score';
    scoreDisplay.textContent = '0';
    scoreDisplay.style.position = 'fixed';
    scoreDisplay.style.top = '20px';
    scoreDisplay.style.right = '20px';
    scoreDisplay.style.color = 'white';
    scoreDisplay.style.fontSize = '24px';
    scoreDisplay.style.textShadow = '2px 2px 4px black';

    gameOverDisplay.id = 'gameOver';
    gameOverDisplay.textContent = 'GAME OVER';
    gameOverDisplay.style.display = 'none';
    gameOverDisplay.style.position = 'fixed';
    gameOverDisplay.style.top = '50%';
    gameOverDisplay.style.left = '50%';
    gameOverDisplay.style.transform = 'translate(-50%, -50%)';
    gameOverDisplay.style.color = 'red';
    gameOverDisplay.style.fontSize = '48px';

    // Добавление элементов
    game.append(player, scoreDisplay, gameOverDisplay);

    // Состояние игры
    let playerY = window.innerHeight / 2;
    let score = 0;
    let isGameOver = false;
    let obstacles = [];
    let animationId;
    const PLAYER_SPEED = 15;
    const DEBUG_MODE = false; // Включить для отладки хитбоксов

    document.addEventListener('keydown', (e) => {
        if (isGameOver) return;

        if (e.key === 'ArrowUp') {
            playerY = Math.min(playerY + PLAYER_SPEED, window.innerHeight - PLAYER_HEIGHT);
        } else if (e.key === 'ArrowDown') {
            playerY = Math.max(playerY - PLAYER_SPEED, 0);
        }

        player.style.bottom = `${playerY}px`;
        if (DEBUG_HITBOXES) drawDebugBoxes();
    });

    // Создание препятствия
    function createObstacle() {
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle';
        obstacle.style.width = `${OBSTACLE_WIDTH}px`;
        obstacle.style.height = `${OBSTACLE_HEIGHT}px`;
        obstacle.style.backgroundImage = "url('fair.png')";
        obstacle.style.backgroundSize = "contain";
        obstacle.style.position = 'absolute';
        obstacle.style.right = '0';
        
        const randomY = Math.random() * (window.innerHeight - OBSTACLE_HEIGHT);
        obstacle.style.bottom = `${randomY}px`;
        
        game.appendChild(obstacle);
        obstacles.push({
            element: obstacle,
            x: window.innerWidth,
            y: randomY,
            speed: 5 + Math.floor(score / 10)
        });
    }

    // Точная проверка столкновений
    function checkCollision() {
        const playerBox = {
            x: 200 + (PLAYER_WIDTH - PLAYER_HITBOX_WIDTH)/2,
            y: (window.innerHeight - playerY - PLAYER_HEIGHT) + (PLAYER_HEIGHT - PLAYER_HITBOX_HEIGHT)/2,
            width: PLAYER_HITBOX_WIDTH,
            height: PLAYER_HITBOX_HEIGHT
        };

        return obstacles.some(obs => {
            const obsBox = {
                x: obs.x + (OBSTACLE_WIDTH - OBSTACLE_HITBOX_WIDTH)/2,
                y: (window.innerHeight - obs.y - OBSTACLE_HEIGHT) + (OBSTACLE_HEIGHT - OBSTACLE_HITBOX_HEIGHT)/2,
                width: OBSTACLE_HITBOX_WIDTH,
                height: OBSTACLE_HITBOX_HEIGHT
            };

            return (
                playerBox.x < obsBox.x + obsBox.width &&
                playerBox.x + playerBox.width > obsBox.x &&
                playerBox.y < obsBox.y + obsBox.height &&
                playerBox.y + playerBox.height > obsBox.y
            );
        });
    }

    // Отображение хитбоксов (для отладки)
    function drawHitboxes() {
        // Удаляем старые
        document.querySelectorAll('.hitbox-debug').forEach(el => el.remove());
        
        // Хитбокс игрока
        const playerBox = document.createElement('div');
        playerBox.className = 'hitbox-debug';
        playerBox.style.cssText = `
            position: absolute;
            left: ${200 + (PLAYER_WIDTH - PLAYER_HITBOX_WIDTH)/2}px;
            bottom: ${playerY + (PLAYER_HEIGHT - PLAYER_HITBOX_HEIGHT)/2}px;
            width: ${PLAYER_HITBOX_WIDTH}px;
            height: ${PLAYER_HITBOX_HEIGHT}px;
            border: 2px solid green;
            background: rgba(0,255,0,0.2);
            z-index: 1000;
        `;
        game.appendChild(playerBox);

        // Хитбоксы препятствий
        obstacles.forEach(obs => {
            const box = document.createElement('div');
            box.className = 'hitbox-debug';
            box.style.cssText = `
                position: absolute;
                right: ${window.innerWidth - obs.x - (OBSTACLE_WIDTH - OBSTACLE_HITBOX_WIDTH)/2}px;
                bottom: ${obs.y + (OBSTACLE_HEIGHT - OBSTACLE_HITBOX_HEIGHT)/2}px;
                width: ${OBSTACLE_HITBOX_WIDTH}px;
                height: ${OBSTACLE_HITBOX_HEIGHT}px;
                border: 2px solid red;
                background: rgba(255,0,0,0.2);
                z-index: 1000;
            `;
            game.appendChild(box);
        });
    }

    // Игровой цикл
    function gameLoop(timestamp) {
        if (isGameOver) return;

        // Спавн препятствий каждые 1.5 секунды
        if (!lastObstacleTime || timestamp - lastObstacleTime > 1500) {
            createObstacle();
            lastObstacleTime = timestamp;
        }

        // Движение препятствий
        obstacles.forEach((obs, index) => {
            obs.x -= obs.speed;
            obs.element.style.right = `${window.innerWidth - obs.x}px`;

            // Удаление вышедших за границы
            if (obs.x < -OBSTACLE_WIDTH) {
                obs.element.remove();
                obstacles.splice(index, 1);
                score++;
                scoreDisplay.textContent = score;
            }
        });

        // Проверка столкновений
        if (checkCollision()) {
            isGameOver = true;
            gameOverDisplay.style.display = 'block';
            return;
        }

        if (DEBUG_MODE) drawHitboxes();
        animationId = requestAnimationFrame(gameLoop);
    }

    // Рестарт игры
    function startGame() {
        playerY = window.innerHeight / 2;
        player.style.bottom = `${playerY}px`;
        score = 0;
        scoreDisplay.textContent = '0';
        isGameOver = false;
        gameOverDisplay.style.display = 'none';
        obstacles.forEach(o => o.element.remove());
        obstacles = [];
        lastObstacleTime = 0;
        animationId = requestAnimationFrame(gameLoop);
    }

    // Обработчики событий
    game.addEventListener('click', () => isGameOver && startGame());
    window.addEventListener('resize', () => {
        playerY = Math.min(playerY, window.innerHeight - PLAYER_HEIGHT);
        player.style.bottom = `${playerY}px`;
    });

    // Запуск игры
    startGame();
});