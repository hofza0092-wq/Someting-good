const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('webgl-container').appendChild(renderer.domElement);

const vertexShader = `
  uniform float u_time;
  uniform vec2 u_mouse;
  varying vec2 v_uv;
  varying vec3 v_position;
  varying vec3 v_normal;
  void main() {
    v_uv = uv;
    v_normal = normal;
    vec3 pos = position;
    float wave1 = sin(pos.x * 4.0 + u_time * 2.0) * cos(pos.y * 4.0 + u_time * 1.5) * 0.08;
    float wave2 = sin(length(pos.xy) * 6.0 - u_time * 1.5) * 0.05;
    float mouseDist = length(pos.xy - (u_mouse - 0.5) * 3.0);
    float mouseInfluence = smoothstep(1.0, 0.0, mouseDist) * 0.4;
    pos.z += wave1 + wave2 + mouseInfluence;
    v_position = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_time;
  varying vec2 v_uv;
  varying vec3 v_position;
  varying vec3 v_normal;
  void main() {
    vec3 viewDir = normalize(vec3(0.0, 0.0, 5.0) - v_position);
    vec3 normal = normalize(v_normal);
    vec3 baseColor = vec3(0.72, 0.73, 0.75);
    vec3 highlight = vec3(0.92, 0.94, 0.96);
    vec3 shadow = vec3(0.45, 0.46, 0.48);
    float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 2.0);
    vec3 color = mix(shadow, highlight, fresnel * 0.8);
    color = mix(color, baseColor, 0.5);
    gl_FragColor = vec4(color, 0.85 + fresnel * 0.1);
  }
`;

const uniforms = {
  u_time: { value: 0 },
  u_mouse: { value: new THREE.Vector2(0.5, 0.5) }
};

const geometry = new THREE.PlaneGeometry(6, 6, 256, 256);
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const blobGeometry = new THREE.IcosahedronGeometry(1.2, 4);
const blobMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    uniform float u_time;
    varying vec3 v_normal;
    void main() {
      vec3 pos = position;
      float noise = sin(pos.x * 8.0 + u_time * 3.0) * cos(pos.y * 8.0 + u_time * 2.0) * 0.05;
      pos *= 1.0 + noise + sin(u_time) * 0.05;
      v_normal = normalize(pos);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float u_time;
    varying vec3 v_normal;
    void main() {
      vec3 baseColor = vec3(0.72, 0.73, 0.75);
      vec3 highlight = vec3(0.95, 0.97, 0.99);
      vec3 shadow = vec3(0.40, 0.42, 0.45);
      float fresnel = pow(1.0 - dot(v_normal, vec3(0.0, 0.0, 1.0)), 2.0);
      vec3 color = mix(shadow, highlight, fresnel);
      gl_FragColor = vec4(color, 0.9);
    }
  `,
  transparent: true
});

const blob = new THREE.Mesh(blobGeometry, blobMaterial);
blob.position.set(0, 1.8, 0);
scene.add(blob);

document.addEventListener('mousemove', (e) => {
  uniforms.u_mouse.value.x = e.clientX / window.innerWidth;
  uniforms.u_mouse.value.y = 1 - e.clientY / window.innerHeight;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  uniforms.u_time.value += 0.008;
  mesh.rotation.z = Math.sin(uniforms.u_time.value * 0.2) * 0.05;
  blob.rotation.y = uniforms.u_time.value * 0.3;
  blob.rotation.x = Math.sin(uniforms.u_time.value * 0.5) * 0.2;
  renderer.render(scene, camera);
}

animate();