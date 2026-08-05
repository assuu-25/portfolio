// ─── THREE.JS 3D BACKGROUND ───
const canvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 0, 30);

let mouseX = 0, mouseY = 0, targetMX = 0, targetMY = 0;
document.addEventListener('mousemove', e => {
  targetMX = (e.clientX / window.innerWidth - 0.5) * 2;
  targetMY = (e.clientY / window.innerHeight - 0.5) * 2;
});

// — Particles —
const COUNT = 1800;
const pos = new Float32Array(COUNT * 3);
const sizes = new Float32Array(COUNT);
const cols = new Float32Array(COUNT * 3);
const palette = [
  new THREE.Color(0x7effd4),
  new THREE.Color(0x5b6ef5),
  new THREE.Color(0xff6b9d),
  new THREE.Color(0x8888cc),
];
for (let i = 0; i < COUNT; i++) {
  const r = 25 + Math.random() * 45;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
  pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
  pos[i*3+2] = r * Math.cos(phi);
  sizes[i] = 0.3 + Math.random() * 1.8;
  const c = palette[Math.floor(Math.random() * palette.length)];
  cols[i*3] = c.r; cols[i*3+1] = c.g; cols[i*3+2] = c.b;
}
const pgeo = new THREE.BufferGeometry();
pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
pgeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
pgeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
const pmat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader: `
    attribute float size; attribute vec3 color;
    varying vec3 vColor; varying float vA;
    uniform float time;
    void main() {
      vColor = color;
      vec3 p = position;
      p.y += sin(time*0.3 + position.x*0.1) * 0.4;
      p.x += cos(time*0.2 + position.z*0.08) * 0.3;
      vec4 mv = modelViewMatrix * vec4(p,1.0);
      gl_PointSize = size*(280.0/-mv.z);
      vA = smoothstep(0.0,1.0,(size-0.3)/1.5);
      gl_Position = projectionMatrix*mv;
    }
  `,
  fragmentShader: `
    varying vec3 vColor; varying float vA;
    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if(d>0.5) discard;
      gl_FragColor = vec4(vColor, (1.0-d*2.0)*0.7);
    }
  `,
  transparent: true, depthWrite: false,
  blending: THREE.AdditiveBlending, vertexColors: true,
});
const particles = new THREE.Points(pgeo, pmat);
scene.add(particles);

// — Shapes —
const shapes = [];
function mkShape(geo, x, y, z, color, opacity) {
  const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.userData = {
    rs: new THREE.Vector3((Math.random()-.5)*.006,(Math.random()-.5)*.008,(Math.random()-.5)*.004),
    fs: 0.3+Math.random()*0.4, fa: 0.5+Math.random()*1, iy: y, ph: Math.random()*Math.PI*2
  };
  scene.add(mesh); shapes.push(mesh);
}
mkShape(new THREE.IcosahedronGeometry(3.5,0), -12,  4, -8,  0x7effd4, 0.12);
mkShape(new THREE.IcosahedronGeometry(2.5,0),  14, -3, -12, 0x5b6ef5, 0.12);
mkShape(new THREE.IcosahedronGeometry(1.8,0),   2,  8, -15, 0xff6b9d, 0.12);
mkShape(new THREE.IcosahedronGeometry(2.0,0), -18, -6, -10, 0x4aaeff, 0.1);
mkShape(new THREE.OctahedronGeometry(2.2,0),   10,  9, -6,  0x7effd4, 0.1);
mkShape(new THREE.OctahedronGeometry(1.6,0),  -7, -10, -9,  0xff6b9d, 0.1);

const tGeo1 = new THREE.TorusGeometry(3, 0.08, 8, 60);
const tMat1 = new THREE.MeshBasicMaterial({ color: 0x5b6ef5, transparent: true, opacity: 0.1 });
const torus1 = new THREE.Mesh(tGeo1, tMat1);
torus1.position.set(16, 5, -14);
torus1.userData = { rs: new THREE.Vector3(0.004,0.007,0.002), fs:0.25, fa:0.8, iy:5, ph:1 };
scene.add(torus1); shapes.push(torus1);

const tGeo2 = new THREE.TorusGeometry(2, 0.06, 6, 40);
const tMat2 = new THREE.MeshBasicMaterial({ color: 0x7effd4, transparent: true, opacity: 0.08 });
const torus2 = new THREE.Mesh(tGeo2, tMat2);
torus2.position.set(-15, 8, -10);
torus2.userData = { rs: new THREE.Vector3(0.006,0.003,0.008), fs:0.35, fa:1.2, iy:8, ph:2.5 };
scene.add(torus2); shapes.push(torus2);

// — Lines —
const lpos = [];
for (let i = 0; i < 60; i++) {
  const x1=(Math.random()-.5)*50, y1=(Math.random()-.5)*40, z1=-5-Math.random()*20;
  lpos.push(x1,y1,z1, x1+(Math.random()-.5)*12, y1+(Math.random()-.5)*10, z1+(Math.random()-.5)*5);
}
const lgeo = new THREE.BufferGeometry();
lgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lpos),3));
const lmat = new THREE.LineBasicMaterial({ color:0x7effd4, transparent:true, opacity:0.04, blending:THREE.AdditiveBlending });
scene.add(new THREE.LineSegments(lgeo, lmat));

let scrollY = 0;
window.addEventListener('scroll', () => { scrollY = window.scrollY; });

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  pmat.uniforms.time.value = t;
  mouseX += (targetMX - mouseX) * 0.05;
  mouseY += (targetMY - mouseY) * 0.05;
  camera.position.x = mouseX * 2;
  camera.position.y = -mouseY * 1.5 - scrollY * 0.003;
  camera.lookAt(0, -scrollY * 0.003, 0);
  particles.rotation.y = t * 0.025;
  particles.rotation.x = t * 0.015;
  shapes.forEach(s => {
    const u = s.userData;
    s.rotation.x += u.rs.x; s.rotation.y += u.rs.y; s.rotation.z += u.rs.z;
    s.position.y = u.iy + Math.sin(t * u.fs + u.ph) * u.fa;
  });
  lmat.opacity = 0.03 + Math.sin(t * 0.5) * 0.015;
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── CURSOR ───
const cur = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let cx=0,cy=0,rx=0,ry=0;
document.addEventListener('mousemove', e => { cx=e.clientX; cy=e.clientY; });
(function tick() {
  rx += (cx-rx)*0.12; ry += (cy-ry)*0.12;
  cur.style.left=cx+'px'; cur.style.top=cy+'px';
  ring.style.left=rx+'px'; ring.style.top=ry+'px';
  requestAnimationFrame(tick);
})();
document.querySelectorAll('a,button').forEach(el => {
  el.addEventListener('mouseenter', () => { ring.style.width='56px'; ring.style.height='56px'; ring.style.borderColor='rgba(126,255,212,0.6)'; cur.style.opacity='0'; });
  el.addEventListener('mouseleave', () => { ring.style.width='36px'; ring.style.height='36px'; ring.style.borderColor='rgba(126,255,212,0.4)'; cur.style.opacity='1'; });
});

// ─── SCROLL REVEAL ───
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal,.tl-entry,.sk-card,.proj-card,.ach-card,.skill-meter').forEach(el => obs.observe(el));
document.querySelectorAll('.sk-card').forEach((c,i) => c.style.transitionDelay=i*0.07+'s');
document.querySelectorAll('.ach-card').forEach((c,i) => c.style.transitionDelay=i*0.07+'s');
document.querySelectorAll('.proj-card').forEach((c,i) => c.style.transitionDelay=i*0.1+'s');
document.querySelectorAll('.skill-meter').forEach((c,i) => c.style.transitionDelay=i*0.08+'s');

// Animate bars
const barObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const fill = e.target.querySelector('.sm-fill');
      if (fill) { const w = fill.getAttribute('data-w'); fill.style.width = w + '%'; }
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.skill-meter').forEach(m => barObs.observe(m));