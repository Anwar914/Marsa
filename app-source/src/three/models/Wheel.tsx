import { Part } from '../Part';
import { Lathe, C, B, T } from '../shapes';

export const WHEEL_R = 0.32;
const TIRE: [number, number][] = [[0.205, -0.088], [0.24, -0.1], [0.295, -0.1], [0.312, -0.094], [0.32, -0.078], [0.32, 0.078], [0.312, 0.094], [0.295, 0.1], [0.24, 0.1], [0.205, 0.088]];

/** Road wheel: axis = local Z, outer face = +Z. */
export function Wheel({ group = 'wheel', hubcap = true }: { group?: string; hubcap?: boolean }) {
  return (
    <group>
      <Part id="tire" group={group}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <Lathe pts={TIRE} m="rubber" seg={64} />
          {[-0.055, 0, 0.055].map((y) => <T key={y} a={[0.3205, 0.006, 6, 96]} p={[0, y, 0]} r={[Math.PI / 2, 0, 0]} m="black" />)}
        </group>
      </Part>
      <Part id="rim" group={group}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <Lathe pts={[[0.2, -0.09], [0.2, 0.09], [0.19, 0.09], [0.17, 0.02], [0.17, -0.02], [0.19, -0.09]]} m="steel" seg={48} />
          <C a={[0.17, 0.17, 0.012]} p={[0, -0.04, 0]} m="steel" />
          {[0, 1, 2, 3, 4].map((k) => <C key={k} a={[0.009, 0.009, 0.02]} p={[Math.cos(k * 1.2566) * 0.055, -0.03, Math.sin(k * 1.2566) * 0.055]} m="chrome" />)}
        </group>
      </Part>
      {hubcap && (
        <Part id="hubcap" group={group}>
          <group rotation={[Math.PI / 2, 0, 0]}>
            <Lathe pts={[[0, -0.075], [0.06, -0.073], [0.15, -0.065], [0.172, -0.055], [0.175, -0.045], [0.165, -0.045]]} m="chrome" seg={48} />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => <B key={k} a={[0.01, 0.004, 0.08]} p={[Math.cos(k * 0.785) * 0.11, -0.07, Math.sin(k * 0.785) * 0.11]} r={[0, -k * 0.785, 0]} m="darkSteel" />)}
          </group>
        </Part>
      )}
    </group>
  );
}
