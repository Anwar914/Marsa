import { P } from '../helper';
const W = 'wiper' as const;
export const wiper = [
  P('wiper-arm', 'Wiper arm', 'Wischerarm', '/ˈwaɪ.pər ˌɑːm/', W, {
    a1: 'The wiper arm holds the wiper blade.',
    b2: 'The spring-loaded wiper arm is fixed to the pivot shaft and presses the blade against the glass with a defined force.',
    de: 'Der gefederte Wischerarm sitzt auf der Wischerwelle und drückt das Wischblatt mit definierter Kraft auf die Scheibe.',
    fn: 'Holds the blade and presses it onto the glass.',
    ex: [['Lift the wiper arm to change the blade.', 'Klapp den Wischerarm hoch, um das Blatt zu wechseln.'], ['The arm has a strong spring.', 'Der Arm hat eine starke Feder.']],
    rel: ['wiper-blade', 'pivot-shaft'], kw: ['hold', 'blade', 'press', 'glass'] }),
  P('wiper-blade', 'Wiper blade', 'Wischerblatt', '/ˈwaɪ.pə ˌbleɪd/', W, {
    a1: 'The wiper blade moves over the glass.',
    b2: 'The wiper blade distributes the arm force evenly along the rubber via a frame or flat spring steel (flat blade).',
    de: 'Das Wischerblatt verteilt die Anpresskraft über Bügel oder Federstahl gleichmäßig auf den Gummi.',
    fn: 'Spreads the pressure evenly along the rubber.',
    ex: [['The wiper blades are old.', 'Die Wischerblätter sind alt.'], ['Change the blades in autumn.', 'Wechsle die Blätter im Herbst.']],
    rel: ['wiper-rubber', 'wiper-arm'], kw: ['glass', 'move', 'pressure', 'even'] }),
  P('wiper-rubber', 'Wiper rubber', 'Wischgummi', '/ˈwaɪ.pə ˌrʌb.ə/', W, {
    a1: 'The wiper rubber touches the glass and removes the water.',
    b2: 'The wiper rubber has a thin lip that flips over at each reversal and squeegees water off the glass.',
    de: 'Der Wischgummi hat eine dünne Lippe, die bei jeder Umkehr umklappt und das Wasser abzieht.',
    fn: 'Wipes the water off the glass.',
    ex: [['The wiper rubber leaves streaks.', 'Der Wischgummi hinterlässt Schlieren.'], ['The rubber is cracked.', 'Der Gummi ist rissig.']],
    rel: ['wiper-blade'], kw: ['water', 'glass', 'rubber', 'wipe'], tr: 'Streaks and chattering mean the rubber is hardened or worn.' }),
  P('pivot-shaft', 'Pivot shaft', 'Wischerwelle', '/ˈpɪv.ət ˌʃɑːft/', W, {
    a1: 'The pivot shaft turns the wiper arm.',
    b2: 'The pivot shaft is supported in a bearing on the cowl and converts the linkage motion into an oscillating rotation of the arm.',
    de: 'Die Wischerwelle ist im Windlauf gelagert und setzt die Gestängebewegung in eine Pendeldrehung des Arms um.',
    fn: 'Oscillates and drives the wiper arm.',
    ex: [['The wiper arm is fixed on the pivot shaft.', 'Der Wischerarm ist auf der Wischerwelle befestigt.'], ['The pivot shaft turns back and forth.', 'Die Wischerwelle dreht sich hin und her.']],
    rel: ['wiper-arm', 'wiper-linkage'], kw: ['turn', 'arm', 'oscillat', 'shaft'] }),
  P('articulation', 'Articulation', 'Gelenk', '/ɑːˌtɪk.jəˈleɪ.ʃən/', W, { alt: 'Ball joint of the linkage',
    a1: 'The articulation is a small joint in the wiper linkage.',
    b2: 'The articulations are small ball joints connecting the linkage rods to the motor crank and the pivot levers so the rods can change angle.',
    de: 'Die Gelenke sind kleine Kugelgelenke zwischen Gestängestangen, Motorkurbel und Hebeln.',
    fn: 'Lets the linkage rods change angle.',
    ex: [['A worn articulation makes noise.', 'Ein ausgeschlagenes Gelenk macht Geräusche.'], ['The rods are connected by articulations.', 'Die Stangen sind durch Gelenke verbunden.']],
    rel: ['wiper-linkage', 'wiper-motor'], kw: ['joint', 'angle', 'connect', 'move'] }),
  P('wiper-linkage', 'Wiper linkage', 'Wischergestänge', '/ˈwaɪ.pə ˌlɪŋ.kɪdʒ/', W, {
    a1: 'The wiper linkage connects the motor to the wipers.',
    b2: 'The wiper linkage is a four-bar mechanism that converts the continuous rotation of the motor crank into the back-and-forth swing of both pivot shafts.',
    de: 'Das Wischergestänge ist ein Viergelenkgetriebe, das die Drehung der Motorkurbel in die Pendelbewegung beider Wischerwellen umsetzt.',
    fn: 'Converts motor rotation into oscillating wiper motion.',
    ex: [['The linkage is under the cowl.', 'Das Gestänge liegt unter dem Windlauf.'], ['The linkage moves both wipers.', 'Das Gestänge bewegt beide Wischer.']],
    rel: ['wiper-motor', 'pivot-shaft', 'articulation'], kw: ['connect', 'motor', 'rotat', 'back and forth', 'four-bar'] }),
  P('wiper-motor', 'Wiper motor', 'Wischermotor', '/ˈwaɪ.pə ˌməʊ.tə/', W, {
    a1: 'The wiper motor is an electric motor. It moves the wipers.',
    b2: 'The wiper motor is a DC motor with a worm gear that drives a crank continuously; a park switch stops the wipers in their rest position.',
    de: 'Der Wischermotor ist ein Gleichstrommotor mit Schneckengetriebe, der eine Kurbel antreibt; ein Endschalter parkt die Wischer.',
    fn: 'Drives the linkage with a rotating crank.',
    ex: [['The wiper motor is broken.', 'Der Wischermotor ist defekt.'], ['The motor turns all the time.', 'Der Motor dreht sich ständig.']],
    rel: ['wiper-linkage', 'articulation'], kw: ['electric', 'motor', 'drive', 'turn'], note: 'Added: needed to show the drive.' }),
];
