import { useState, useDeferredValue, useEffect, useMemo } from 'react';
import { HillScene } from './components/HillScene';
import { placementMethods, getRandomPlacementMethod } from './utils/plants';
import {
	PlantType,
	DEFAULT_GRID_SIZE,
	DEFAULT_PLANT_SIZE,
	DEFAULT_PLANT_SPACING,
	DEFAULT_NUM_VORONOI_CELLS,
	DEFAULT_ROUGHNESS,
	DEFAULT_NUM_HILLS,
	DEFAULT_HEIGHT_SCALE,
	SHOW_CONFIG_CONTROLS,
} from './types/scene';

function getPlantType(_x: number, y: number): PlantType {
	if (y > 0.4) return PlantType.BUSH;

	const random = Math.random();
	// 80% chance for bush, 10% chance for bale, 10% chance for cypress.
	if (random < 0.8) {
		return PlantType.BUSH;
	} else if (random < 0.9) {
		return PlantType.BALE;
	} else {
		return PlantType.CYPRESS;
	}
}

function getPlantPlacement(plantType: PlantType) {
	if (plantType === PlantType.BALE || plantType === PlantType.CYPRESS) {
		return placementMethods.placeSparse;
	}
	return getRandomPlacementMethod();
}

function App() {
	// Flag to control whether to show the controls UI
	const showControls = SHOW_CONFIG_CONTROLS;

	// All controls that affect scene generation
	const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
	const [plantSize, setPlantSize] = useState(DEFAULT_PLANT_SIZE);
	const [plantSpacing, setPlantSpacing] = useState(DEFAULT_PLANT_SPACING);
	const [voronoiCells, setVoronoiCells] = useState(DEFAULT_NUM_VORONOI_CELLS);
	const [heightScale, setHeightScale] = useState(DEFAULT_HEIGHT_SCALE);
	const [roughness, setRoughness] = useState(DEFAULT_ROUGHNESS);
	const [numHills, setNumHills] = useState(DEFAULT_NUM_HILLS);

	// Add regeneration counter to force terrain regeneration
	const [regenerationCounter, setRegenerationCounter] = useState(0);

	// Keyboard event listener for 'R' key to regenerate terrain
	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent) => {
			// Only trigger if not typing in an input field
			if (
				event.key.toLowerCase() === 'r' &&
				!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
			) {
				setRegenerationCounter(prev => prev + 1);
			}
		};

		window.addEventListener('keydown', handleKeyPress);
		return () => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	}, []);

	// Defer all values that affect scene generation to prevent UI blocking
	const deferredGridSize = useDeferredValue(gridSize);
	const deferredPlantSize = useDeferredValue(plantSize);
	const deferredPlantSpacing = useDeferredValue(plantSpacing);
	const deferredVoronoiCells = useDeferredValue(voronoiCells);
	const deferredHeightScale = useDeferredValue(heightScale);
	const deferredRoughness = useDeferredValue(roughness);
	const deferredNumHills = useDeferredValue(numHills);
	const deferredRegenerationCounter = useDeferredValue(regenerationCounter);

	// Memoize the deferred values object to prevent unnecessary re-renders
	const deferredValues = useMemo(
		() => ({
			gridSize: deferredGridSize,
			plantSize: deferredPlantSize,
			plantSpacing: deferredPlantSpacing,
			voronoiCells: deferredVoronoiCells,
			heightScale: deferredHeightScale,
			roughness: deferredRoughness,
			numHills: deferredNumHills,
			regenerationCounter: deferredRegenerationCounter,
		}),
		[
			deferredGridSize,
			deferredPlantSize,
			deferredPlantSpacing,
			deferredVoronoiCells,
			deferredHeightScale,
			deferredRoughness,
			deferredNumHills,
			deferredRegenerationCounter,
		]
	);

	// Check if we're using deferred values (indicates pending update)
	const isPending =
		deferredGridSize !== gridSize ||
		deferredPlantSize !== plantSize ||
		deferredPlantSpacing !== plantSpacing ||
		deferredVoronoiCells !== voronoiCells ||
		deferredHeightScale !== heightScale ||
		deferredRoughness !== roughness ||
		deferredNumHills !== numHills ||
		deferredRegenerationCounter !== regenerationCounter;

	return (
		<div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
			{showControls && (
				<div
					style={{
						padding: '15px',
						background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
						borderBottom: '2px solid #4a5568',
						boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
					}}
				>
					<h2
						style={{
							margin: '0 0 15px 0',
							color: 'white',
							fontSize: '24px',
							fontWeight: '600',
							textShadow: '0 1px 2px rgba(0,0,0,0.3)',
						}}
					>
						Configuration
						{isPending && (
							<span
								style={{
									marginLeft: '10px',
									fontSize: '14px',
									opacity: 0.8,
									fontWeight: 'normal',
								}}
							>
								🔄 Updating scene...
							</span>
						)}
					</h2>
					<div
						style={{
							marginBottom: '15px',
							color: 'white',
							fontSize: '14px',
							opacity: 0.9,
							fontStyle: 'italic',
						}}
					>
						💡 Press{' '}
						<kbd
							style={{
								background: 'rgba(255,255,255,0.2)',
								padding: '2px 6px',
								borderRadius: '3px',
								fontFamily: 'monospace',
							}}
						>
							R
						</kbd>{' '}
						to regenerate terrain
					</div>

					{/* All Controls - All values are deferred for smooth interaction */}
					<div
						style={{
							display: 'flex',
							gap: '25px',
							alignItems: 'center',
							flexWrap: 'wrap',
						}}
					>
						<div
							style={{
								background: 'rgba(255,255,255,0.95)',
								padding: '12px 16px',
								borderRadius: '8px',
								boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
								minWidth: '200px',
								border: isPending ? '2px solid #f6ad55' : '2px solid transparent',
								opacity: isPending ? 0.8 : 1,
							}}
						>
							<label
								style={{
									display: 'block',
									marginBottom: '8px',
									fontWeight: '600',
									color: '#2d3748',
								}}
							>
								Heightmap Size: {gridSize}
								{isPending && <span style={{ color: '#f6ad55', marginLeft: '5px' }}>⏳</span>}
							</label>
							<input
								type="range"
								min="16"
								max="1024"
								step="16"
								value={gridSize}
								onChange={e => setGridSize(Number(e.target.value))}
								style={{
									width: '100%',
									height: '6px',
									borderRadius: '3px',
									background: '#e2e8f0',
									outline: 'none',
									cursor: 'pointer',
								}}
							/>
						</div>

						<div
							style={{
								background: 'rgba(255,255,255,0.95)',
								padding: '12px 16px',
								borderRadius: '8px',
								boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
								minWidth: '200px',
								border: isPending ? '2px solid #f6ad55' : '2px solid transparent',
								opacity: isPending ? 0.8 : 1,
							}}
						>
							<label
								style={{
									display: 'block',
									marginBottom: '8px',
									fontWeight: '600',
									color: '#2d3748',
								}}
							>
								Voronoi Cells: {voronoiCells}
								{isPending && <span style={{ color: '#f6ad55', marginLeft: '5px' }}>⏳</span>}
							</label>
							<input
								type="range"
								min="4"
								max="256"
								step="4"
								value={voronoiCells}
								onChange={e => setVoronoiCells(Number(e.target.value))}
								style={{
									width: '100%',
									height: '6px',
									borderRadius: '3px',
									background: '#e2e8f0',
									outline: 'none',
									cursor: 'pointer',
								}}
							/>
						</div>

						<div
							style={{
								background: 'rgba(255,255,255,0.95)',
								padding: '12px 16px',
								borderRadius: '8px',
								boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
								minWidth: '200px',
								border: isPending ? '2px solid #f6ad55' : '2px solid transparent',
								opacity: isPending ? 0.8 : 1,
							}}
						>
							<label
								style={{
									display: 'block',
									marginBottom: '8px',
									fontWeight: '600',
									color: '#2d3748',
								}}
							>
								Plant Size: {plantSize}
								{isPending && <span style={{ color: '#f6ad55', marginLeft: '5px' }}>⏳</span>}
							</label>
							<input
								type="range"
								min="0.05"
								max="5"
								step="0.05"
								value={plantSize}
								onChange={e => setPlantSize(Number(e.target.value))}
								style={{
									width: '100%',
									height: '6px',
									borderRadius: '3px',
									background: '#e2e8f0',
									outline: 'none',
									cursor: 'pointer',
								}}
							/>
						</div>

						<div
							style={{
								background: 'rgba(255,255,255,0.95)',
								padding: '12px 16px',
								borderRadius: '8px',
								boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
								minWidth: '200px',
								border: isPending ? '2px solid #f6ad55' : '2px solid transparent',
								opacity: isPending ? 0.8 : 1,
							}}
						>
							<label
								style={{
									display: 'block',
									marginBottom: '8px',
									fontWeight: '600',
									color: '#2d3748',
								}}
							>
								Height Scale: {heightScale}
								{isPending && <span style={{ color: '#f6ad55', marginLeft: '5px' }}>⏳</span>}
							</label>
							<input
								type="range"
								min="1"
								max="100"
								step="1"
								value={heightScale}
								onChange={e => setHeightScale(Number(e.target.value))}
								style={{
									width: '100%',
									height: '6px',
									borderRadius: '3px',
									background: '#e2e8f0',
									outline: 'none',
									cursor: 'pointer',
								}}
							/>
						</div>

						<div
							style={{
								background: 'rgba(255,255,255,0.95)',
								padding: '12px 16px',
								borderRadius: '8px',
								boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
								minWidth: '200px',
								border: isPending ? '2px solid #f6ad55' : '2px solid transparent',
								opacity: isPending ? 0.8 : 1,
							}}
						>
							<label
								style={{
									display: 'block',
									marginBottom: '8px',
									fontWeight: '600',
									color: '#2d3748',
								}}
							>
								Roughness: {roughness}
								{isPending && <span style={{ color: '#f6ad55', marginLeft: '5px' }}>⏳</span>}
							</label>
							<input
								type="range"
								min="0.1"
								max="1.0"
								step="0.1"
								value={roughness}
								onChange={e => setRoughness(Number(e.target.value))}
								style={{
									width: '100%',
									height: '6px',
									borderRadius: '3px',
									background: '#e2e8f0',
									outline: 'none',
									cursor: 'pointer',
								}}
							/>
						</div>

						<div
							style={{
								background: 'rgba(255,255,255,0.95)',
								padding: '12px 16px',
								borderRadius: '8px',
								boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
								minWidth: '200px',
								border: isPending ? '2px solid #f6ad55' : '2px solid transparent',
								opacity: isPending ? 0.8 : 1,
							}}
						>
							<label
								style={{
									display: 'block',
									marginBottom: '8px',
									fontWeight: '600',
									color: '#2d3748',
								}}
							>
								Plant Spacing: {plantSpacing}
								{isPending && <span style={{ color: '#f6ad55', marginLeft: '5px' }}>⏳</span>}
							</label>
							<input
								type="range"
								min="0.1"
								max="5.0"
								step="0.1"
								value={plantSpacing}
								onChange={e => setPlantSpacing(Number(e.target.value))}
								style={{
									width: '100%',
									height: '6px',
									borderRadius: '3px',
									background: '#e2e8f0',
									outline: 'none',
									cursor: 'pointer',
								}}
							/>
						</div>

						<div
							style={{
								background: 'rgba(255,255,255,0.95)',
								padding: '12px 16px',
								borderRadius: '8px',
								boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
								minWidth: '200px',
								border: isPending ? '2px solid #f6ad55' : '2px solid transparent',
								opacity: isPending ? 0.8 : 1,
							}}
						>
							<label
								style={{
									display: 'block',
									marginBottom: '8px',
									fontWeight: '600',
									color: '#2d3748',
								}}
							>
								Number of Hills: {numHills}
								{isPending && <span style={{ color: '#f6ad55', marginLeft: '5px' }}>⏳</span>}
							</label>
							<input
								type="range"
								min="0"
								max="16"
								step="1"
								value={numHills}
								onChange={e => setNumHills(Number(e.target.value))}
								style={{
									width: '100%',
									height: '6px',
									borderRadius: '3px',
									background: '#e2e8f0',
									outline: 'none',
									cursor: 'pointer',
								}}
							/>
						</div>
					</div>
				</div>
			)}
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
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<div
							style={{
								width: '16px',
								height: '16px',
								border: '2px solid #f6ad55',
								borderTop: '2px solid transparent',
								borderRadius: '50%',
								animation: 'spin 1s linear infinite',
							}}
						></div>
						Updating scene...
					</div>
				)}
				<HillScene
					gridWidth={deferredValues.gridSize}
					gridHeight={deferredValues.gridSize}
					numVoronoiCells={deferredValues.voronoiCells}
					plantSize={deferredValues.plantSize}
					roughness={deferredValues.roughness}
					plantSpacing={deferredValues.plantSpacing}
					heightScale={deferredValues.heightScale}
					numHills={deferredValues.numHills}
					regenerationCounter={deferredValues.regenerationCounter}
					getPlantType={getPlantType}
					getPlantPlacement={getPlantPlacement}
				/>
			</div>

			<style>{`
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
				
				@keyframes fadeInOut {
					0% { opacity: 0; transform: translateY(-10px); }
					20% { opacity: 1; transform: translateY(0); }
					80% { opacity: 1; transform: translateY(0); }
					100% { opacity: 0; transform: translateY(-10px); }
				}
				
				input[type="range"]::-webkit-slider-thumb {
					-webkit-appearance: none;
					appearance: none;
					width: 20px;
					height: 20px;
					border-radius: 50%;
					background: #667eea;
					cursor: pointer;
					box-shadow: 0 2px 4px rgba(0,0,0,0.2);
				}
				
				input[type="range"]::-moz-range-thumb {
					width: 20px;
					height: 20px;
					border-radius: 50%;
					background: #667eea;
					cursor: pointer;
					border: none;
					box-shadow: 0 2px 4px rgba(0,0,0,0.2);
				}
			`}</style>
		</div>
	);
}

export default App;
