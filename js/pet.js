import { run } from './canvas_2.js';
import { items } from './script.js';

const pet = document.querySelector('#pet');
const dialog = document.getElementById('dialog');

const dialogText = [
  '點我兩下即可開啟智能客服喔！',
  '哈囉！我是智能小幫手',
  '今天天氣真好',
  '祝你天天開心！！'
];

let isDragging = false;
let offsetX;
let prevX;
let prevOffsetX;
let offsetY;
let prevTime;


let lastTouchTime = 0;
const doubleTapInterval = 300;

const inputStart = (e, isTouch) => {
  e.preventDefault();

  const x = isTouch ? e.touches[0].clientX : e.clientX;
  const y = isTouch ? e.touches[0].clientY : e.clientY;

  isDragging = true;
  offsetX = x - pet.getBoundingClientRect().left;
  offsetY = y - pet.getBoundingClientRect().top;

  prevX = e.clientX;
  pet.style.cursor = 'grabbing';

  const currentTime = new Date().getTime();
  if (currentTime - lastTouchTime <= doubleTapInterval) {
    showMessenger();
  }

  lastTouchTime = currentTime;
};


const inputMove = (e, isTouch) => {
  if (isDragging) {
    const x = isTouch ? e.touches[0].clientX - offsetX : e.clientX - offsetX;
    const y = isTouch ? e.touches[0].clientY - offsetY : e.clientY - offsetY;

    const maxX = window.innerWidth - pet.offsetWidth;
    const maxY = window.innerHeight - pet.offsetHeight;

    const constrainedX = Math.max(0, Math.min(x, maxX));
    const constrainedY = Math.max(0, Math.min(y, maxY));

    if (constrainedX > prevOffsetX) {
      $('#pet .character').removeClass('right');
      dx = -1;
    } else if (constrainedX < prevOffsetX) {
      $('#pet .character').addClass('right');
      dx = 1;
    }

    prevOffsetX = constrainedX;

    const currentTime = new Date().getTime();
    const deltaTime = currentTime - prevTime;
    const distance = Math.sqrt(Math.pow(constrainedX - prevX, 2));

    const speed = distance / deltaTime;

    $('#pet .character').css('--rotate', `${Math.min(Math.floor(speed * (isTouch ? 20 : 10)), 90)}deg`);

    prevX = constrainedX;
    prevTime = currentTime;

    pet.style.left = constrainedX + 'px';
    pet.style.top = constrainedY + 'px';
  }
};

const inputEnd = () => {
  isDragging = false;
  pet.style.cursor = 'grab';
  $('#pet .character').css('--rotate', '0');
};

const showMessenger = () => $('#messenger').addClass('show');
const hideMessenger = () => $('#messenger').removeClass('show');

$('#pet').mousedown(e => inputStart(e, false));
$('#pet').on('touchstart', e => inputStart(e, true));

$(document).mousemove(e => inputMove(e, false));
$(document).on('touchmove', e => inputMove(e, true));

$(document).mouseup(() => inputEnd());
$(document).on('touchend', () => inputEnd());

$('#messenger header .close').click(() => hideMessenger());
$('#messenger header .close').on('touchend', () => hideMessenger());


const getNumRandom = (min, max) => {
  return Math.floor(Math.random()* (max - min + 1) + min);
}


let velocityX = 1; // 每次移動的水平距離
let velocityY = 0; // 每次移動的垂直距離
const gravity = 0.5; // 重力加速度
let dx = 1;

let moveTimer = 0;
let textTimer = 0;
let climbTimer = 0;
let jumpTimer = 0;
let changeDxTimer = 0;
let canChangeDx = true;
let nextChangeTime = getNumRandom(5000, 8000);
let resetMoveTimer = false;
let resetTextTimer = false;
let resetJumpTimer = false;
let isOnGround = false;
let lockItem = null;
let isClimb = false;
let lockClimbItem = null;
let isClimbTop = false;
let lockInsideItem = null; 

let showTextDuration = 0;
let hideTextDuration = 0;

let moveDuration;
let jumpDuration;
let stopDuration;

let isJump = false;
let isJumpTimer = 0;
let isFall = false;
let isFalling = true;
let isWalk = false;
let restState;
let prevRestState;

let textRandom;
let showText;
let changeText = false;

let dialogDx = 'left';


const petMove = (deltaTime) => {

  if (!isDragging) {
    $('#pet .character').removeClass('dragging');
    
    const petRect = pet.getBoundingClientRect();

    // 計算新的位置
    const newY = petRect.top + velocityY;

    const maxY = window.innerHeight - pet.offsetHeight;

    let x;
    let y;
    
    if (newY <= 0) {
      y = 0;
    } else if (maxY - newY < 0) {
      velocityY = 0;
      y = maxY;
      isOnGround = true;
    } else if (newY >= maxY) {
      isFalling = false;
      isOnGround = true;
    } else {
      y = newY;
      isFalling = true;
    }

    // 計算新的位置
    const newX = petRect.left;

    const maxX = window.innerWidth - pet.offsetWidth;
    
    if (newX <= 0) {
      x = 0;
      dx = 1;
    } else if (newX >= maxX) {
      x = maxX;
      dx = -1;
    } else {
      x = newX;
    }

    items.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        
        const collision = () => {
          return petRect.bottom + velocityY >= itemRect.top &&
          petRect.top <= itemRect.top - petRect.height + velocityY &&
          petRect.right >= itemRect.left &&
          petRect.left <= itemRect.right
        }

        if (collision()) {
          y = itemRect.top - petRect.height;
          velocityY = 0;
          isOnGround = true;
          lockItem = itemRect;
        }

        const checkIsInside = () => {
          // 如果角色在物件內
          return petRect.bottom <= itemRect.bottom &&
            petRect.top >= itemRect.top &&
            petRect.left >= itemRect.left &&
            petRect.right <= itemRect.right;
        }

        if (checkIsInside()) {
          lockInsideItem = itemRect;
        }

        const climb = () => {
          // 半個角色觸碰到物件外時攀爬
          return !isClimbTop &&
          petRect.bottom <= itemRect.bottom &&
          petRect.top >= itemRect.top &&
          !lockInsideItem &&
          (
            (petRect.left + petRect.width / 2 + 3 >= itemRect.right &&
            petRect.right - petRect.width / 2 - 3 <= itemRect.right)
            ||
            (petRect.left + petRect.width / 2 + 3 >= itemRect.left &&
            petRect.right - petRect.width / 2 - 3 <= itemRect.left)
          );
        }

        if (climb()) {
          lockClimbItem = itemRect;   
        }
    });

    
    if (lockItem) {
      if (
        petRect.right <= lockItem.left ||
        petRect.left >= lockItem.right ||
        petRect.bottom > lockItem.top
      ) {
        lockItem = null;
        if (y !== maxY) {
          isOnGround = false;
        }
      }
    }
    

    if (lockInsideItem) {
      if (
        petRect.right <= lockInsideItem.left ||
        petRect.left >= lockInsideItem.right ||
        petRect.bottom <= lockInsideItem.top ||
        petRect.top >= lockInsideItem.bottom
      ) {
        lockInsideItem = null;
      }
    }
    

    if (lockClimbItem) {
      if (
        petRect.top <= lockClimbItem.top - petRect.height / 3
      ) {
        lockClimbItem = null;
        isClimbTop = true;
        isClimb = false;
      } else {
        isClimb = true;
      }
    }

    
    if (isClimb) {
      isOnGround = false;
      velocityY = -1.5;
      $('#pet .character').removeClass('fall');
      $('#pet .character').addClass('climb');
    } else {
      $('#pet .character').removeClass('climb');
    }
    

    if (isOnGround) {
      $('#pet .character').removeClass('fall');

      climbTimer += deltaTime;

      if (climbTimer > 15000) { // 15秒爬一次
        isClimbTop = false;
      }
      changeDxTimer += deltaTime;
      moveTimer += deltaTime;
      textTimer += deltaTime;
      jumpTimer += deltaTime;

      if (canChangeDx && changeDxTimer >= nextChangeTime) {
        dx = Math.random() < 0.5 ? 1 : -1;
        changeDxTimer = 0;
        nextChangeTime = getNumRandom(7000, 15000);
      }

      if (!resetJumpTimer) {
        resetJumpTimer = true;
        jumpDuration = 3000;
      }

      if (!resetMoveTimer) {
        restState = Math.random();
        resetMoveTimer = true;
        moveDuration = getNumRandom(5000, 8000);
        stopDuration = getNumRandom(2000, 3000);
      }

      if (!resetTextTimer) {
        resetTextTimer = true;
        showTextDuration = getNumRandom(3000, 5000);
        hideTextDuration = getNumRandom(1000, 3000);

        textRandom = getNumRandom(0, dialogText.length - 1);
      }

      if (moveTimer > stopDuration && moveTimer < moveDuration + stopDuration) {
        isWalk = true;
        pet.style.left = `${x + velocityX * dx}px`;
      } else if (moveTimer > moveDuration + stopDuration) {
        resetMoveTimer = false;
        isWalk = false;
        moveTimer = 0;
        isJumpTimer = 0;
      }

      if (textTimer >= hideTextDuration && textTimer <= showTextDuration + hideTextDuration) {
        showText = true;
      } else if (textTimer >= showTextDuration + hideTextDuration) {
        showText = false;
        changeText = false;
        textTimer = 0;
        resetTextTimer = false;
      }


      if (isWalk) {
        canChangeDx = true;
        $('#pet .character').addClass('walk');
        $('#pet .character').removeClass('stand');
        $('#pet .character').removeClass('rest');
        $('#pet .character').removeClass('sit');
      } else if (!isWalk && resetMoveTimer) {
        if (restState < 0.33) {
          canChangeDx = true;
          $('#pet .character').removeClass('stand');
          $('#pet .character').removeClass('sit');
          $('#pet .character').addClass('rest');
        } else if (restState > 0.33 && restState < 0.66) {
          canChangeDx = false;
          $('#pet .character').removeClass('rest');
          $('#pet .character').removeClass('sit');
          $('#pet .character').addClass('stand');
        } else {
          canChangeDx = false;
          $('#pet .character').removeClass('stand');
          $('#pet .character').removeClass('rest');
          $('#pet .character').addClass('sit');
        }
        $('#pet .character').removeClass('walk');
      }

    } else {
      climbTimer = 0;
      
      $('#pet .character').removeClass('walk');
      if (!isClimb) {
        $('#pet .character').addClass('fall');
      }
    }


    if (showText && !changeText) {
      changeText = true;
      $('#dialog').css('display', 'block');
      $('#dialog p').text(`${dialogText[textRandom]}`);
    } else if (!showText) {
      $('#dialog').css('display', 'none');
      $('#dialog p').text('');
    }


    if ((x + velocityX * dx) + (petRect.width / 2 + dialog.clientWidth) >= innerWidth) {
      dialogDx = 'right';
    } else if ((x + velocityX * dx) - (dialog.clientWidth - petRect.width / 2) <= 0) {
      dialogDx = 'left';
    }


    if (dialogDx === 'left') {
      $('#dialog').addClass('left');
      $('#dialog').removeClass('right');
    } else {
      $('#dialog').addClass('right');
      $('#dialog').removeClass('left');
    }


    if (dx > 0) {
      $('#pet .character').addClass('right');
    } else {
      $('#pet .character').removeClass('right');
    }


    if (isFalling) {
      pet.style.top = y + 'px';
      velocityY += gravity;
    } else {
      velocityY = 0;
    }


  } else {
    isOnGround = false;
    lockClimbItem = null;
    isClimb = false;
    velocityY = 0;
    $('#pet .character').addClass('dragging');
    $('#pet .character').removeClass('walk');
    $('#pet .character').removeClass('fall');
    $('#pet .character').removeClass('squat');
    $('#pet .character').removeClass('climb');
    $('#pet .character').removeClass('stand');
    $('#pet .character').removeClass('rest');
    $('#pet .character').removeClass('sit');
  }
}

let lastTime = 0;

const animate = (timeStamp) => {
    run();

    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    petMove(deltaTime);
    requestAnimationFrame(animate);
}

animate();

document.addEventListener('scroll', () => {
  lockClimbItem = null;
  isClimb = false;
});