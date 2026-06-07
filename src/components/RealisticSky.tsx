import { useThree } from '@react-three/fiber';
import { RGBELoader } from 'three-stdlib';
import * as THREE from 'three';
import { useEffect } from 'react';

const HDR_URL = '/chianti/textures/sky/kloofendal_48d_partly_cloudy_puresky_4k.hdr';

export function RealisticSky() {
	const scene = useThree(state => state.scene);

	// Fog + lighting are set up synchronously so the hillside renders
	// immediately, without waiting on the (large) HDR skybox download.
	useEffect(() => {
		scene.fog = new THREE.Fog('#c3a486', 120, 400);

		// Atmospheric placeholder background until the HDR finishes loading,
		// so the scene comes up looking intentional rather than blank white.
		const placeholder = new THREE.Color('#c3a486');
		scene.background = placeholder;

		const ambientLight = new THREE.AmbientLight('#c3a486', 0.7);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight('#ffffff', 0.6);
		directionalLight.position.set(50, 100, 50);
		scene.add(directionalLight);

		return () => {
			scene.remove(ambientLight);
			scene.remove(directionalLight);
			ambientLight.dispose();
			directionalLight.dispose();
			scene.fog = null;
		};
	}, [scene]);

	// Skybox loads in the background and swaps in when ready — it never
	// blocks the scene from rendering.
	useEffect(() => {
		let cancelled = false;

		new RGBELoader().load(HDR_URL, hdr => {
			if (cancelled) {
				hdr.dispose();
				return;
			}
			hdr.mapping = THREE.EquirectangularReflectionMapping;
			scene.background = hdr;
		});

		return () => {
			cancelled = true;
			if (scene.background instanceof THREE.Texture) {
				scene.background.dispose();
			}
			scene.background = null;
		};
	}, [scene]);

	return null;
}
