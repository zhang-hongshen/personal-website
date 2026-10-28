import { useEffect, useRef, useState } from "react";
import type { Mesh } from "three";
import { useTranslation } from "react-i18next";

import modelUrl from "~/assets/ferry/ferry.glb?url";
import { cn } from "~/lib/utils";

// The ferry from Ferry's app icon (exported by scripts/export-ferry-model.py), standing on the page:
// drag to turn it. Zoom is off so the wheel and vertical swipes still scroll the page. three.js loads
// only in the browser, once the page is running.

// The icon render's camera: 46° around from the bow side, 22° up.
const AZIMUTH = (46 * Math.PI) / 180;
const ELEVATION = (22 * Math.PI) / 180;

export function FerryModel({ className }: { className?: string }) {
    const { t } = useTranslation();
    const host = useRef<HTMLDivElement>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const el = host.current;
        if (!el) return;
        let disposed = false;
        let cleanup = () => {};

        (async () => {
            const THREE = await import("three");
            const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
            const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
            const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
            const gltf = await new GLTFLoader().loadAsync(modelUrl);
            if (disposed) return;

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.toneMapping = THREE.NeutralToneMapping;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.VSMShadowMap;
            renderer.domElement.className = "size-full cursor-grab touch-pan-y outline-none active:cursor-grabbing";
            el.appendChild(renderer.domElement);

            const scene = new THREE.Scene();
            const pmrem = new THREE.PMREMGenerator(renderer);
            scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
            scene.environmentIntensity = 0.55;

            const ferry = gltf.scene;
            ferry.traverse((o) => {
                if ((o as Mesh).isMesh) o.castShadow = true;
            });
            scene.add(ferry);
            const box = new THREE.Box3().setFromObject(ferry);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            const sun = new THREE.DirectionalLight(0xffffff, 2.4);
            sun.position.set(-2, 14, 3);
            sun.castShadow = true;
            sun.shadow.mapSize.set(2048, 2048);
            sun.shadow.radius = 12;
            sun.shadow.blurSamples = 16;
            const reach = Math.max(size.x, size.z);
            Object.assign(sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 30 });
            scene.add(sun, new THREE.HemisphereLight(0xffffff, 0x8a96a8, 1.1));

            // Catches the ferry's shadow and nothing else, so it sits on the page.
            const ground = new THREE.Mesh(new THREE.CircleGeometry(reach * 0.9, 48), new THREE.ShadowMaterial({ opacity: 0.12 }));
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            scene.add(ground);

            const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
            const distance = size.length() * 1.75;
            const home = new THREE.Vector3(
                Math.cos(ELEVATION) * Math.cos(AZIMUTH),
                Math.sin(ELEVATION),
                -Math.cos(ELEVATION) * Math.sin(AZIMUTH),
            ).multiplyScalar(distance).add(center);

            const controls = new OrbitControls(camera, renderer.domElement);
            controls.target.copy(center);
            controls.enableDamping = true;
            controls.enablePan = false;
            controls.enableZoom = false;
            controls.maxPolarAngle = Math.PI / 2 - 0.05; // stay above the water line
            controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            controls.autoRotateSpeed = 0.8;
            controls.addEventListener("start", () => { controls.autoRotate = false; });

            camera.position.copy(home);
            controls.update();

            const resize = () => {
                const { clientWidth: w, clientHeight: h } = el;
                if (!w || !h) return;
                renderer.setSize(w, h, false);
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            };
            const resizer = new ResizeObserver(resize);
            resizer.observe(el);
            resize();

            // Draw only while the viewer is on screen.
            let frame = 0;
            const loop = () => {
                controls.update();
                renderer.render(scene, camera);
                frame = requestAnimationFrame(loop);
            };
            const visibility = new IntersectionObserver(([entry]) => {
                cancelAnimationFrame(frame);
                if (entry.isIntersecting) frame = requestAnimationFrame(loop);
            });
            visibility.observe(el);
            setLoaded(true);

            cleanup = () => {
                cancelAnimationFrame(frame);
                visibility.disconnect();
                resizer.disconnect();
                controls.dispose();
                pmrem.dispose();
                scene.traverse((o) => {
                    const mesh = o as Mesh;
                    if (!mesh.isMesh) return;
                    mesh.geometry.dispose();
                    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => m.dispose());
                });
                renderer.dispose();
                renderer.domElement.remove();
            };
        })().catch((error) => console.error("Ferry model failed to load", error));

        return () => {
            disposed = true;
            cleanup();
        };
    }, []);

    return (
        <div
            ref={host}
            className={cn("mx-auto aspect-[4/3] w-full max-w-[880px] transition-opacity duration-700", loaded ? "opacity-100" : "opacity-0", className)}
            role="img"
            aria-label={t("ferry.model_label")}
        />
    );
}
