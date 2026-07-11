import { useDeferredValue, useEffect, useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { HillScene } from './components/HillScene';
import { getRandomPlacementMethod, placementMethods } from './utils/plants';
import type { Rng } from './utils/random';
import { DEFAULT_SCENE_CONFIG, PlantType, SHOW_CONFIG_CONTROLS } from './types/scene';

function getPlantType(_x: number, y: number, _z: number, rng: Rng): PlantType {
	// High ground is all scrub; lower down, mostly bushes with the occasional
	// bale field or cypress grove.
	if (y > 0.4) return PlantType.BUSH;

	const random = rng();
	if (random < 0.8) return PlantType.BUSH;
	if (random < 0.9) return PlantType.BALE;
	return PlantType.CYPRESS;
}

function getPlantPlacement(plantType: PlantType, _x: number, _y: number, _z: number, rng: Rng) {
	if (plantType === PlantType.BALE || plantType === PlantType.CYPRESS) {
		return placementMethods.sparse;
	}
	return getRandomPlacementMethod(rng);
}

function App() {
	const [config, setConfig] = useState(DEFAULT_SCENE_CONFIG);
	const [seed, setSeed] = useState(0);

	// Press R to regenerate the landscape with a new seed.
	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent) => {
			if (
				event.key.toLowerCase() === 'r' &&
				!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
			) {
				setSeed(prev => prev + 1);
			}
		};

		window.addEventListener('keydown', handleKeyPress);
		return () => window.removeEventListener('keydown', handleKeyPress);
	}, []);

	// Defer generation inputs so slider interaction stays responsive while
	// the scene rebuilds.
	const deferredConfig = useDeferredValue(config);
	const deferredSeed = useDeferredValue(seed);
	const isPending = deferredConfig !== config || deferredSeed !== seed;

	return (
		<div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
			{SHOW_CONFIG_CONTROLS && <ControlPanel config={config} onChange={setConfig} isPending={isPending} />}
			<div style={{ flex: 1, position: 'relative' }}>
				{isPending && (
					<div
						style={{
							position: 'absolute',
							top: '20px',
							right: '20px',
							background: 'rgba(0,0,0,0.8)',
							color: 'white',
							padding: '10px 15px',
							borderRadius: '6px',
							zIndex: 1000,
							fontSize: '14px',
						}}
					>
						Updating scene...
					</div>
				)}
				<HillScene
					config={deferredConfig}
					seed={deferredSeed}
					getPlantType={getPlantType}
					getPlantPlacement={getPlantPlacement}
				/>
			</div>
		</div>
	);
}

export default App;
