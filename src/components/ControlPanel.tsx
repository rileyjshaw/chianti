import type { CSSProperties, Dispatch, SetStateAction } from 'react';
import type { SceneConfig } from '../types/scene';

interface SliderDef {
	key: keyof SceneConfig;
	label: string;
	min: number;
	max: number;
	step: number;
}

const SLIDERS: SliderDef[] = [
	{ key: 'gridSize', label: 'Heightmap Size', min: 16, max: 1024, step: 16 },
	{ key: 'voronoiCells', label: 'Voronoi Cells', min: 4, max: 256, step: 4 },
	{ key: 'plantSize', label: 'Plant Size', min: 0.05, max: 5, step: 0.05 },
	{ key: 'heightScale', label: 'Height Scale', min: 1, max: 100, step: 1 },
	{ key: 'roughness', label: 'Roughness', min: 0.1, max: 1, step: 0.1 },
	{ key: 'plantSpacing', label: 'Plant Spacing', min: 0.1, max: 5, step: 0.1 },
	{ key: 'numHills', label: 'Number of Hills', min: 0, max: 16, step: 1 },
];

const cardStyle = (isPending: boolean): CSSProperties => ({
	background: 'rgba(255,255,255,0.95)',
	padding: '12px 16px',
	borderRadius: '8px',
	boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
	minWidth: '200px',
	border: isPending ? '2px solid #f6ad55' : '2px solid transparent',
	opacity: isPending ? 0.8 : 1,
});

interface ControlPanelProps {
	config: SceneConfig;
	onChange: Dispatch<SetStateAction<SceneConfig>>;
	isPending: boolean;
}

export function ControlPanel({ config, onChange, isPending }: ControlPanelProps) {
	return (
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
					fontWeight: 600,
					textShadow: '0 1px 2px rgba(0,0,0,0.3)',
				}}
			>
				Configuration
				{isPending && (
					<span style={{ marginLeft: '10px', fontSize: '14px', opacity: 0.8, fontWeight: 'normal' }}>
						🔄 Updating scene...
					</span>
				)}
			</h2>
			<div style={{ marginBottom: '15px', color: 'white', fontSize: '14px', opacity: 0.9, fontStyle: 'italic' }}>
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

			<div style={{ display: 'flex', gap: '25px', alignItems: 'center', flexWrap: 'wrap' }}>
				{SLIDERS.map(({ key, label, min, max, step }) => {
					const inputId = `scene-config-${key}`;
					return (
						<div key={key} style={cardStyle(isPending)}>
							<label
								htmlFor={inputId}
								style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#2d3748' }}
							>
								{label}: {config[key]}
								{isPending && <span style={{ color: '#f6ad55', marginLeft: '5px' }}>⏳</span>}
							</label>
							<input
								id={inputId}
								type="range"
								min={min}
								max={max}
								step={step}
								value={config[key]}
								onChange={event => {
									const value = Number(event.currentTarget.value);
									onChange(current => ({ ...current, [key]: value }));
								}}
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
					);
				})}
			</div>
		</div>
	);
}
