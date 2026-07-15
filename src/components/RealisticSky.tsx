import { useThree } from '@react-three/fiber';
import { RGBELoader } from 'three-stdlib';
import * as THREE from 'three';
import { useEffect, useState } from 'react';

const HDR_URL = `${import.meta.env.BASE_URL}textures/sky/kloofendal_48d_partly_cloudy_puresky_4k.hdr`;
const ATMOSPHERE = '#c3a486';
const SUN_POSITION: [number, number, number] = [50, 100, 50];

interface SkyTextures {
	background: THREE.DataTexture;
	environmentTarget: THREE.WebGLRenderTarget;
}

export function RealisticSky() {
	const gl = useThree(state => state.gl);
	const [textures, setTextures] = useState<SkyTextures | null>(null);

	useEffect(() => {
		let cancelled = false;
		let hdr: THREE.DataTexture | null = null;
		let environmentTarget: THREE.WebGLRenderTarget | null = null;
		const pmrem = new THREE.PMREMGenerator(gl);
		pmrem.compileEquirectangularShader();

		// The HDR loads in the background. Once available, turn it into a PMREM
		// for image-based lighting while retaining the sharp source as the sky.
		new RGBELoader().load(
			HDR_URL,
			loadedHdr => {
				if (cancelled) {
					loadedHdr.dispose();
					return;
				}

				loadedHdr.mapping = THREE.EquirectangularReflectionMapping;
				hdr = loadedHdr;
				environmentTarget = pmrem.fromEquirectangular(loadedHdr);
				setTextures({ background: loadedHdr, environmentTarget });
				pmrem.dispose();
			},
			undefined,
			() => {
				if (!cancelled) pmrem.dispose();
			}
		);

		return () => {
			cancelled = true;
			hdr?.dispose();
			environmentTarget?.dispose();
			pmrem.dispose();
		};
	}, [gl]);

	return (
		<>
			<fog attach="fog" args={[ATMOSPHERE, 120, 400]} />
			{textures ? (
				<>
					<primitive attach="background" object={textures.background} />
					<primitive attach="environment" object={textures.environmentTarget.texture} />
				</>
			) : (
				<color attach="background" args={[ATMOSPHERE]} />
			)}
			<ambientLight color={ATMOSPHERE} intensity={0.7} />
			<directionalLight color="#fff4e0" intensity={1.1} position={SUN_POSITION} />
			<hemisphereLight args={['#bcd4ff', ATMOSPHERE, 0.4]} />
		</>
	);
}
