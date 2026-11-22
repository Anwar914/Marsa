import type { CarPart, ModuleId, ModuleInfo } from '../types';
import { exterior } from './parts/exterior';
import { interior } from './parts/interior';
import { engine } from './parts/engine';
import { engineTypes } from './parts/engineTypes';
import { brakes } from './parts/brakes';
import { suspension } from './parts/suspension';
import { drivetrain } from './parts/drivetrain';
import { tires } from './parts/tires';
import { electrical } from './parts/electrical';
import { filters } from './parts/filters';
import { jack } from './parts/jack';
import { wiper } from './parts/wiper';

export const PARTS: CarPart[] = [
  ...exterior, ...interior, ...engine, ...engineTypes, ...brakes, ...suspension,
  ...drivetrain, ...tires, ...electrical, ...filters, ...jack, ...wiper,
];
export const PART_MAP: Record<string, CarPart> = Object.fromEntries(PARTS.map((p) => [p.id, p]));
export const getPart = (id: string | null | undefined) => (id ? PART_MAP[id] : undefined);

export const MODULES: ModuleInfo[] = [
  { id: 'exterior', letter: 'A', nameEn: 'Exterior car parts', nameDe: 'Karosserie außen', descEn: 'Body panels, glass, lights, wheels. Use X-ray to see the systems inside.', descDe: 'Karosserieteile, Scheiben, Leuchten, Räder. Mit Röntgenmodus die Technik darunter sehen.', hasAnimation: true, animLabelEn: 'Drive (wheels, engine, wipers)', animLabelDe: 'Fahren (Räder, Motor, Wischer)' },
  { id: 'interior', letter: 'B', nameEn: 'Interior & dashboard', nameDe: 'Innenraum & Armaturen', descEn: 'Cockpit, pedals and safety equipment. The body is shown transparent.', descDe: 'Cockpit, Pedale und Sicherheitsausstattung. Die Karosserie ist transparent.', hasAnimation: false },
  { id: 'engine', letter: 'C', nameEn: 'Engine anatomy', nameDe: 'Motoraufbau', descEn: 'Inline-four petrol engine with a cutaway and the four-stroke cycle.', descDe: 'Reihenvierzylinder-Ottomotor im Schnitt mit Viertakt-Animation.', hasAnimation: true, animLabelEn: 'Four-stroke cycle', animLabelDe: 'Viertaktprinzip' },
  { id: 'engineTypes', letter: 'D', nameEn: 'Types of engines', nameDe: 'Motorbauarten', descEn: 'Compare inline-four, V6 and V8 cylinder layouts and crankshafts.', descDe: 'Reihenvierzylinder, V6 und V8 im Vergleich.', hasAnimation: true, animLabelEn: 'Run engine', animLabelDe: 'Motor laufen lassen' },
  { id: 'brakes', letter: 'E', nameEn: 'Braking systems', nameDe: 'Bremsanlagen', descEn: 'Disc brake and drum brake with hydraulic actuation.', descDe: 'Scheiben- und Trommelbremse mit hydraulischer Betätigung.', hasAnimation: true, animLabelEn: 'Brake application', animLabelDe: 'Bremsvorgang' },
  { id: 'suspension', letter: 'F', nameEn: 'Suspension & steering', nameDe: 'Fahrwerk & Lenkung', descEn: 'MacPherson front axle with rack-and-pinion steering and the rear axle.', descDe: 'McPherson-Vorderachse mit Zahnstangenlenkung und Hinterachse.', hasAnimation: true, animLabelEn: 'Steer & bump', animLabelDe: 'Lenken & Einfedern' },
  { id: 'drivetrain', letter: 'G', nameEn: 'Transmission & drivetrain', nameDe: 'Getriebe & Antriebsstrang', descEn: 'Front engine, rear-wheel drive: torque flow from crankshaft to wheels.', descDe: 'Frontmotor, Hinterradantrieb: Kraftfluss von der Kurbelwelle zu den Rädern.', hasAnimation: true, animLabelEn: 'Torque flow', animLabelDe: 'Kraftfluss' },
  { id: 'tires', letter: 'H', nameEn: 'Tires & wheels', nameDe: 'Reifen & Räder', descEn: 'Radial tyre cutaway with all layers.', descDe: 'Radialreifen im Schnitt mit allen Schichten.', hasAnimation: false },
  { id: 'electrical', letter: 'I', nameEn: 'Electrical & ignition', nameDe: 'Elektrik & Zündung', descEn: 'Battery cutaway, spark plug, ignition coil and alternator.', descDe: 'Batterie im Schnitt, Zündkerze, Zündspule und Lichtmaschine.', hasAnimation: true, animLabelEn: 'Spark', animLabelDe: 'Zündfunke' },
  { id: 'filters', letter: 'J', nameEn: 'Filters & air intake', nameDe: 'Filter & Ansaugung', descEn: 'Air path from intake to throttle body, plus oil and foam filters.', descDe: 'Luftweg von der Ansaugung bis zur Drosselklappe, dazu Öl- und Schaumfilter.', hasAnimation: true, animLabelEn: 'Air flow', animLabelDe: 'Luftstrom' },
  { id: 'jack', letter: 'K', nameEn: 'Automotive jack', nameDe: 'Wagenheber', descEn: 'Scissor jack with threaded spindle.', descDe: 'Scherenwagenheber mit Gewindespindel.', hasAnimation: true, animLabelEn: 'Lift & lower', animLabelDe: 'Heben & Senken' },
  { id: 'wiper', letter: 'L', nameEn: 'Windshield wiper', nameDe: 'Scheibenwischer', descEn: 'Wiper motor, four-bar linkage, arms and blades.', descDe: 'Wischermotor, Viergelenk-Gestänge, Arme und Blätter.', hasAnimation: true, animLabelEn: 'Wipe', animLabelDe: 'Wischen' },
];
export const MODULE_MAP = Object.fromEntries(MODULES.map((m) => [m.id, m])) as Record<ModuleId, ModuleInfo>;
export const partsOfModule = (m: ModuleId) => PARTS.filter((p) => p.modules.includes(m));
