import { useThree } from '@react-three/fiber';
import { useLoader } from '@react-three/fiber';
import { RGBELoader } from 'three-stdlib';
import * as THREE from 'three';
import { useEffect } from 'react';

export function RealisticSky() {
	const scene = useThree(state => state.scene);
	const hdr = useLoader(RGBELoader, '/chianti/textures/sky/kloofendal_48d_partly_cloudy_puresky_4k.hdr');

	useEffect(() => {
		hdr.mapping = THREE.EquirectangularReflectionMapping;
		scene.background = hdr;

		// Add fog for atmospheric depth
		scene.fog = new THREE.Fog('#c3a486', 120, 400);

		// Simplified lighting setup for performance
		const ambientLight = new THREE.AmbientLight('#c3a486', 0.7);
		scene.add(ambientLight);

		// Single directional light for basic shadows
		const directionalLight = new THREE.DirectionalLight('#ffffff', 0.6);
		directionalLight.position.set(50, 100, 50);
		scene.add(directionalLight);
	}, [hdr, scene]);

	return null;
}
