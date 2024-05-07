// Copyright (c) 2013 dissimulate at codepen

// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.


// const worker = new Worker('worker.js');

// // 獲取 OffscreenCanvas 對象
// const offscreenCanvas = document.getElementById('canvas').transferControlToOffscreen();

// // 向 Worker 傳遞 OffscreenCanvas 對象
// worker.postMessage({ canvas: offscreenCanvas }, [offscreenCanvas]);

// // 在主線程中渲染其他內容
// const ctx = document.getElementById('canvas').getContext('2d');



/* Settings */
let tiltX = 0; // 左右傾斜角度
let tiltY = 0; // 前後傾斜角度

let prevTiltY = 0;
let initialTiltY = null;

function handleOrientation(event) {
  tiltX = event.gamma || 0; // 左右傾斜
  tiltY = event.beta || 0; // 前後傾斜

  // 如果還未設置初始Y軸傾斜角度，則保存當前角度
  if (initialTiltY === null) {
    initialTiltY = tiltY;
  }
}

const MOUSE_INFLUENCE = 5;
const GRAVITY_X = 0;
const GRAVITY_Y = 0;
const MOUSE_REPEL = false;
const GROUPS = [10, 10, 10];
const GROUP_COLORS = ['rgba(254,52,66'];

window.requestAnimFrame =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };

const fluid = (() => {
  let ctx;
  let width;
  let height;
  let num_x;
  let num_y;
  let particles;
  let grid;
  let meta_ctx;
  let threshold = 200;
  let play = false;
  let spacing = window.innerWidth * window.innerHeight / 7000;
  let radius = window.innerWidth * window.innerHeight / 10000;

  spacing = Math.max(radius, 70);
  spacing = Math.min(radius, 180); 
  radius = Math.max(radius, 50);
  radius = Math.min(radius, 150);  

  let limit = radius * 0.66;
  let textures;
  let num_particles;

  const mouse = {
    down: false,
    x: 0,
    y: 0,
  };

  const process_image = () => {
    const imageData = meta_ctx.getImageData(0, 0, width, height);
    const pix = imageData.data;

    for (let i = 0, n = pix.length; i < n; i += 4) {
      (pix[i + 3] < threshold) && (pix[i + 3] /= 15);
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const run = () => {
    meta_ctx.clearRect(0, 0, width, height);

    for (let i = 0, l = num_x * num_y; i < l; i++) grid[i].length = 0;

    let i = num_particles;
    while (i--) particles[i].first_process();
    i = num_particles;
    while (i--) particles[i].second_process();

    process_image();

    if (play) requestAnimFrame(run);
  };

  class Particle {
    constructor(type, x, y) {
      this.type = type;
      this.x = x;
      this.y = y;
      this.px = x;
      this.py = y;
      this.vx = 0;
      this.vy = 0;
    }

    first_process() {
      const g = grid[Math.round(this.y / spacing) * num_x + Math.round(this.x / spacing)];

      if (g) g.close[g.length++] = this;

      this.vx = this.x - this.px;
      this.vy = this.y - this.py;

      if (mouse.down) {
        const dist_x = this.x - mouse.x;
        const dist_y = this.y - mouse.y;
        const dist = Math.sqrt(dist_x * dist_x + dist_y * dist_y);

        if (dist < radius * MOUSE_INFLUENCE / 3) {
          const cos = dist_x / dist;
          const sin = dist_y / dist;
          this.vx += (MOUSE_REPEL) ? cos : -cos;
          this.vy += (MOUSE_REPEL) ? sin : -sin;
        }
      }

      const tiltDifference = tiltY - initialTiltY;

      if (tiltY > initialTiltY + 2.5) {
        this.vy += tiltDifference / 300;
      } else if (tiltY < initialTiltY - 2.5) {
        this.vy += tiltDifference / 300;
      }

      this.x += tiltX / 10;
      
      this.vx += GRAVITY_X;
      this.vy += GRAVITY_Y;
      this.px = this.x;
      this.py = this.y;
      this.x += this.vx;
      this.y += this.vy;
    }

    second_process() {
      let force = 0;
      let force_b = 0;
      const cell_x = Math.round(this.x / spacing);
      const cell_y = Math.round(this.y / spacing);
      const close = [];

      for (let x_off = -1; x_off < 2; x_off++) {
        for (let y_off = -1; y_off < 2; y_off++) {
          const cell = grid[(cell_y + y_off) * num_x + (cell_x + x_off)];

          if (cell && cell.length) {
            for (let a = 0, l = cell.length; a < l; a++) {
              const particle = cell.close[a];

              if (particle !== this) {
                const dfx = particle.x - this.x;
                const dfy = particle.y - this.y;
                const distance = Math.sqrt(dfx * dfx + dfy * dfy);

                if (distance < spacing) {
                  const m = 1 - (distance / spacing);
                  force += Math.pow(m, 2);
                  force_b += Math.pow(m, 3) / 2;
                  particle.m = m;
                  particle.dfx = (dfx / distance) * m;
                  particle.dfy = (dfy / distance) * m;
                  close.push(particle);
                }
              }
            }
          }
        }
      }

      force = (force - 3) * 0.5;

      for (let i = 0, l = close.length; i < l; i++) {
        const neighbor = close[i];
        let press = force + force_b * neighbor.m;

        if (this.type !== neighbor.type) press *= 0.35;

        const dx = neighbor.dfx * press * 0.5;
        const dy = neighbor.dfy * press * 0.5;

        neighbor.x += dx;
        neighbor.y += dy;
        this.x -= dx;
        this.y -= dy;
      }

      if (this.x < limit) this.x = limit;
      else if (this.x > width - limit) this.x = width - limit;

      if (this.y < limit) this.y = limit;
      else if (this.y > height - limit) this.y = height - limit;

      this.draw();
    }

    draw() {
      const size = radius * 2;

      meta_ctx.drawImage(
        textures[this.type],
        this.x - radius,
        this.y - radius,
        size,
        size
      );
    }
  }

  return {
    init(canvas, w, h) {
      particles = [];
      grid = [];
      textures = [];

      const canvasElement = document.getElementById(canvas);
      ctx = canvasElement.getContext('2d', { willReadFrequently: true });
      canvasElement.height = h || window.innerHeight;
      canvasElement.width = w || window.innerWidth;
      width = canvasElement.width;
      height = canvasElement.height;
      
      const metaCanvas = document.createElement("canvas");
      metaCanvas.width = width;
      metaCanvas.height = height;
      meta_ctx = metaCanvas.getContext("2d", { willReadFrequently: true });

      for (let i = 0; i < GROUPS.length; i++) {
        const color = GROUP_COLORS[i] || `hsla(${Math.round(Math.random() * 360)}, 60%, 80%`;

        textures[i] = document.createElement("canvas");
        textures[i].width = radius * 2;
        textures[i].height = radius * 2;
        const nCtx = textures[i].getContext("2d", { willReadFrequently: true });

        const grad = nCtx.createRadialGradient(
          radius,
          radius,
          0,
          radius,
          radius,
          radius
        );

        grad.addColorStop(0, `${color},.9)`);
        grad.addColorStop(1, `${color},0)`);
        nCtx.fillStyle = grad;
        nCtx.beginPath();
        nCtx.arc(radius, radius, radius, 0, Math.PI * 2, true);
        nCtx.closePath();
        nCtx.fill();
      }

      canvasElement.onmousedown = function (e) {
        mouse.down = true;
        return false;
      };

      canvasElement.onmouseup = function (e) {
        mouse.down = false;
        return false;
      };

      canvasElement.onmousemove = function (e) {
        const rect = canvasElement.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        return false;
      };

      canvasElement.addEventListener('touchstart', function(e) {
        mouse.down = true; 
        return false;
      });

      canvasElement.addEventListener('touchend', function(e) {
        mouse.down = false;
        return false;
      });

      canvasElement.addEventListener('touchmove', function(e) {
        let touch = e.touches[0]; 
        let touchPositionX = touch.clientX;
        let touchPositionY = touch.clientY;

        mouse.x = touchPositionX;
        mouse.y = touchPositionY; 
        return false;
      });

      num_x = Math.round(width / spacing) + 1;
      num_y = Math.round(height / spacing) + 1;

      for (let i = 0; i < num_x * num_y; i++) {
        grid[i] = {
          length: 0,
          close: [],
        };
      }

      for (let i = 0; i < GROUPS.length; i++) {
        for (let k = 0; k < GROUPS[i]; k++) {
          particles.push(
            new Particle(
              i,
              radius + Math.random() * (width - radius * 3),
              radius + Math.random() * (height - radius * 2)
            )
          );
        }
      }

      num_particles = particles.length;
      play = true;
      run();
    },

    stop() {
      play = false;
    },
  };
})();


fluid.init('canvas', window.innerWidth, window.innerHeight);


function isMobileDevice() {
  let mobileDevices = ['Android', 'webOS', 'iPhone', 'iPad', 'iPod', 'BlackBerry', 'Windows Phone']
  for (var i = 0; i < mobileDevices.length; i++) {
      if (navigator.userAgent.match(mobileDevices[i])) {
        return true;
      }
  }
  return false;
}

if (isMobileDevice()) {
  window.addEventListener('click', function() { 
    if (typeof DeviceOrientationEvent.requestPermission === 'function') { 
      DeviceOrientationEvent.requestPermission()
      .then(permissionState => { 
      if (permissionState === 'granted') {
        window.addEventListener('deviceorientation', handleOrientation);
      } else { 
      } 
    })
    .catch((err) => { 
      console.log(err);
    }); 
    } else {
    }
  })  
}

window.addEventListener('deviceorientation', handleOrientation);