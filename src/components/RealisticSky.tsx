import { useThree } from '@react-three/fiber';
import { RGBELoader } from 'three-stdlib';
import * as THREE from 'three';
import { useEffect } from 'react';

const HDR_URL = `${import.meta.env.BASE_URL}textures/sky/kloofendal_48d_partly_cloudy_puresky_4k.hdr`;
const ATMOSPHERE = '#c3a486';

export function RealisticSky() {
	const scene = useThree(state => state.scene);
	const gl = useThree(state => state.gl);

	// Fog + lighting are set up synchronously so the hillside renders
	// immediately, without waiting on the (large) HDR skybox download.
	useEffect(() => {
		scene.fog = new THREE.Fog(ATMOSPHERE, 120, 400);

		// Atmospheric placeholder background until the HDR finishes loading,
		// so the scene comes up looking intentional rather than blank white.
		scene.background = new THREE.Color(ATMOSPHERE);

		const ambientLight = new THREE.AmbientLight(ATMOSPHERE, 0.7);
		scene.add(ambientLight);

		const sunLight = new THREE.DirectionalLight('#fff4e0', 1.1);
		sunLight.position.set(50, 100, 50);
		scene.add(sunLight);

		// A dim sky-colored fill from below softens the shadowed undersides.
		const skyFill = new THREE.HemisphereLight('#bcd4ff', ATMOSPHERE, 0.4);
		scene.add(skyFill);

		return () => {
			scene.remove(ambientLight);
			scene.remove(sunLight);
			scene.remove(skyFill);
			ambientLight.dispose();
			sunLight.dispose();
			skyFill.dispose();
			scene.fog = null;
		};
	}, [scene]);

	// Skybox loads in the background and swaps in when ready — it never
	// blocks the scene from rendering. The equirectangular HDR is turned into
	// a GPU cubemap once, then used for both background and image-based
	// reflections.
	useEffect(() => {
		let cancelled = false;
		const pmrem = new THREE.PMREMGenerator(gl);

		new RGBELoader().load(HDR_URL, hdr => {
			if (cancelled) {
				hdr.dispose();
				pmrem.dispose();
				return;
			}
			hdr.mapping = THREE.EquirectangularReflectionMapping;
			const envMap = pmrem.fromEquirectangular(hdr).texture;
			scene.background = hdr;
			scene.environment = envMap;
			pmrem.dispose();
		});

		return () => {
			cancelled = true;
			if (scene.background instanceof THREE.Texture) scene.background.dispose();
			if (scene.environment) scene.environment.dispose();
			scene.background = null;
			scene.environment = null;
		};
	}, [scene, gl]);

	return null;
}
