import type { Corridor } from '../domain/types';

// ALL COORDINATES BELOW ARE APPROXIMATE AND UNVERIFIED.
// Release gate: every corridor must be verified against the Mt. Juliet Safety
// Action Plan high-injury network maps and city roundabout locations (and
// reviewed with Mt. Juliet PD / THSO partners) before public release.
// Mt. Juliet city center is roughly 36.2001, -86.5186; I-40 runs south of town.

const SAP_SOURCE =
  'Candidate corridor. Approximate location, not yet verified against the Mt. Juliet Safety Action Plan high-injury network map.';

export const CORRIDORS: Corridor[] = [
  {
    id: 'n-mt-juliet-rd',
    name: 'N. Mt. Juliet Rd (SR-171)',
    kind: 'arterial',
    // APPROXIMATE: north-south road through town center toward the I-40 interchange.
    waypoints: [
      { lat: 36.2145, lng: -86.5175 },
      { lat: 36.2001, lng: -86.5186 },
      { lat: 36.1855, lng: -86.5165 },
    ],
    whyItMatters:
      'Listed among the high-injury roadways in the Mt. Juliet Safety Action Plan (verify). Frequent driveways, turning conflicts, and signals make it a good place to practice scanning and gap judgment, starting off-peak.',
    source: SAP_SOURCE,
    verified: false,
  },
  {
    id: 'lebanon-rd-us70',
    name: 'Lebanon Rd (US-70)',
    kind: 'arterial',
    // APPROXIMATE: east-west corridor through Mt. Juliet.
    waypoints: [
      { lat: 36.1985, lng: -86.5480 },
      { lat: 36.2001, lng: -86.5186 },
      { lat: 36.2060, lng: -86.4870 },
    ],
    whyItMatters:
      'Listed among the high-injury roadways in the Mt. Juliet Safety Action Plan (verify). A busy commercial road with many driveways, multiple lanes, and a mix of turning and through traffic.',
    source: SAP_SOURCE,
    verified: false,
  },
  {
    id: 'central-pike',
    name: 'Central Pike',
    kind: 'arterial',
    // APPROXIMATE: roughly parallel to and north of Lebanon Rd.
    waypoints: [
      { lat: 36.2150, lng: -86.5420 },
      { lat: 36.2175, lng: -86.5150 },
      { lat: 36.2200, lng: -86.4850 },
    ],
    whyItMatters:
      'Candidate road in the Mt. Juliet area. Speed differences between through traffic and turning vehicles, plus intersection conflicts, are the general hazards to rehearse. Confirm status in the Safety Action Plan (verify).',
    source: SAP_SOURCE,
    verified: false,
  },
  {
    id: 'golden-bear-gateway',
    name: 'Golden Bear Gateway',
    kind: 'arterial',
    // APPROXIMATE: connector near the I-40 / SR-171 area.
    waypoints: [
      { lat: 36.1930, lng: -86.5120 },
      { lat: 36.1810, lng: -86.5080 },
    ],
    whyItMatters:
      'Connector near the I-40 interchange area. Practice merging traffic, lane choice before intersections, and speed matching. Confirm status in the Safety Action Plan (verify).',
    source: SAP_SOURCE,
    verified: false,
  },
  {
    id: 'beckwith-rd',
    name: 'Beckwith Rd',
    kind: 'arterial',
    // APPROXIMATE: road leading toward the I-40 Exit 229 interchange.
    waypoints: [
      { lat: 36.1865, lng: -86.4690 },
      { lat: 36.1700, lng: -86.4660 },
    ],
    whyItMatters:
      'Listed among the high-injury roadways in the Mt. Juliet Safety Action Plan (verify). Feeds the I-40 interchange, so expect speed changes, merges, and turning conflicts near the ramps.',
    source: SAP_SOURCE,
    verified: false,
  },
  {
    id: 'old-lebanon-dirt-rd',
    name: 'Old Lebanon Dirt Rd',
    kind: 'arterial',
    // APPROXIMATE: location and extent need verification.
    waypoints: [
      { lat: 36.2040, lng: -86.5620 },
      { lat: 36.2090, lng: -86.5350 },
    ],
    whyItMatters:
      'Candidate road with narrower lanes and mixed residential access. Good for practicing lane position, oncoming traffic on curves, and speed choice. Confirm status in the Safety Action Plan (verify).',
    source: SAP_SOURCE,
    verified: false,
  },
  {
    id: 'i40-exit-226',
    name: 'I-40 Exit 226 (SR-171)',
    kind: 'interchange',
    // APPROXIMATE: Exit 226 is roughly 36.169, -86.515.
    waypoints: [
      { lat: 36.1855, lng: -86.5165 },
      { lat: 36.169, lng: -86.515 },
    ],
    whyItMatters:
      'Interchange ramps involve speed differential and merging. Practice matching speed on the ramp, checking the blind spot, and exiting early. General hazard description; no crash data is claimed here.',
    source:
      'Candidate interchange. Approximate coordinates, not verified. Confirm exit numbers and ramp layout before release.',
    verified: false,
  },
  {
    id: 'i40-exit-229',
    name: 'I-40 Exit 229 (Beckwith Rd)',
    kind: 'interchange',
    // APPROXIMATE: Exit 229 is roughly 36.170, -86.466.
    waypoints: [
      { lat: 36.1865, lng: -86.469 },
      { lat: 36.17, lng: -86.466 },
    ],
    whyItMatters:
      'Interchange ramps involve speed differential and merging, and the connecting road has turning conflicts. General hazard description; no crash data is claimed here.',
    source:
      'Candidate interchange. Approximate coordinates, not verified. Confirm exit numbers and ramp layout before release.',
    verified: false,
  },
  {
    id: 'mj-roundabouts',
    name: 'Mt. Juliet roundabouts (locations pending verification)',
    kind: 'roundabout',
    // Intentionally empty until city roundabout locations are verified.
    waypoints: [],
    whyItMatters:
      'Roundabouts reward a slow approach, careful yielding, and clear lane choice. Exact Mt. Juliet locations are pending verification; until then, the parent picks a roundabout they know.',
    source: 'Pending: City of Mt. Juliet roundabout locations to be confirmed.',
    verified: false,
  },
];

export function getCorridor(id: string): Corridor | undefined {
  return CORRIDORS.find((c) => c.id === id);
}
