import { useState, useDeferredValue } from 'react';
import { HillScene } from './components/HillScene';
import { placementMethods } from './utils/plants';

function App() {
	// All controls that affect scene generation
	const [gridSize, setGridSize] = useState(24);
	const [plantSize, setPlantSize] = useState(0.5);
	const [cellSize, setCellSize] = useState(16);
	const [heightScale, setHeightScale] = useState(50);
	const [roughness, setRoughness] = useState(0.5);
	const [numHills, setNumHills] = useState(2);

	// Defer all values that affect scene generation to prevent UI blocking
	const deferredGridSize = useDeferredValue(gridSize);
	const deferredPlantSize = useDeferredValue(plantSize);
	const deferredCellSize = useDeferredValue(cellSize);
	const deferredHeightScale = useDeferredValue(heightScale);
	const deferredRoughness = useDeferredValue(roughness);
	const deferredNumHills = useDeferredValue(numHills);

	// Check if we're using deferred values (indicates pending update)
	const isPending =
		deferredGridSize !== gridSize ||
		deferredPlantSize !== plantSize ||
		deferredCellSize !== cellSize ||
		deferredHeightScale !== heightScale ||
		deferredRoughness !== roughness ||
		deferredNumHills !== numHills;

	return (
		<div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
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
					Hill Scene Test
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
							Grid Size: {gridSize}
							{isPending && <span style={{ color: '#f6ad55', marginLeft: '5px' }}>⏳</span>}
						</label>
						<input
							type="range"
							min="4"
							max="32"
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
							Cell Size: {cellSize}
							{isPending && <span style={{ color: '#f6ad55', marginLeft: '5px' }}>⏳</span>}
						</label>
						<input
							type="range"
							min="8"
							max="32"
							step="8"
							value={cellSize}
							onChange={e => setCellSize(Number(e.target.value))}
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
					gridX={deferredGridSize}
					gridY={deferredGridSize}
					cellX={deferredCellSize}
					cellY={deferredCellSize}
					plantSize={deferredPlantSize}
					roughness={deferredRoughness}
					cellSpacing={2}
					heightScale={deferredHeightScale}
					numHills={deferredNumHills}
					getPlantPlacement={() => placementMethods.placeRows}
				/>
			</div>

			<style>{`
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
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
