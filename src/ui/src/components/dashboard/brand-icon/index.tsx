// src/components/BrandIcon/index.tsx
import React from 'react';

import type { BrandIconName } from './brand-icons.types';

interface BrandIconProps extends React.SVGProps<SVGSVGElement> {
	name: BrandIconName; // Restricts inputs directly to your 426 file names
	size?: number | string;
}

export const BrandIcon = ({
	name,
	size = '1em',
	className = '',
	...props
}: BrandIconProps) => {
	// Gracefully handles standard absolute paths as well as custom Vite subfolder deployments
	const spritePath = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/sprite.svg#${name}`;

	return (
		<svg
			className={`inline-block align-middle ${className}`}
			style={{ width: size, height: size }}
			{...props}
		>
			<use href={spritePath} />
		</svg>
	);
};

export default BrandIcon;
