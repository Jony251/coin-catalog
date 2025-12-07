/**
 * RulerImage Component
 * Displays ruler portrait with automatic fallback to local images
 */

import { Image } from 'react-native';
import { getRulerImage } from '../utils/images';

export function RulerImage({ rulerId, imageUrl, style, ...props }) {
  // Always use local image if available, fallback to URL
  const source = getRulerImage(rulerId, imageUrl);

  return (
    <Image
      source={source}
      style={style}
      {...props}
    />
  );
}
