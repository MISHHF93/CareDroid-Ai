/**
 * HolographicText
 * 3D text rendering component using @react-three/drei Text primitive.
 * Renders labels, data values, and annotations inside a Canvas context.
 */

import React from 'react';
import { Text } from '@react-three/drei';

/**
 * @param {object} props
 * @param {string}  props.children                        - Text to render
 * @param {[number,number,number]} [props.position=[0,0,0]]
 * @param {number}  [props.fontSize=0.3]
 * @param {string}  [props.color='#00e5ff']
 * @param {string}  [props.anchorX='center']
 * @param {string}  [props.anchorY='middle']
 * @param {number}  [props.maxWidth=10]
 * @param {boolean} [props.billboard=false]  - Face camera always
 */
export default function HolographicText({
  children,
  position = [0, 0, 0],
  fontSize = 0.3,
  color = '#00e5ff',
  anchorX = 'center',
  anchorY = 'middle',
  maxWidth = 10,
  billboard = false,
}) {
  return (
    <Text
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX={anchorX}
      anchorY={anchorY}
      maxWidth={maxWidth}
      outlineColor="#000000"
      outlineOpacity={0.85}
      outlineWidth={0.004}
      billboard={billboard}
    >
      {children}
    </Text>
  );
}
