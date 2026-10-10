import type { Skill, SkillCategory } from '../domain/types';

export const SKILL_CATEGORIES: SkillCategory[] = [
  { id: 'basics', title: 'Vehicle basics' },
  { id: 'residential', title: 'Residential streets' },
  { id: 'intersections', title: 'Intersections & right-of-way' },
  { id: 'roundabouts', title: 'Roundabouts' },
  { id: 'arterials', title: 'Arterials & lane changes' },
  { id: 'interstate', title: 'Interstate (I-40)' },
  { id: 'night', title: 'Night' },
  { id: 'weather', title: 'Weather & hazards' },
  { id: 'parking', title: 'Parking' },
];

export const SKILLS: Skill[] = [
  // Vehicle basics
  {
    id: 'adjust-mirrors-seat',
    category: 'basics',
    title: 'Seat, mirrors, and controls setup',
    whatGoodLooksLike:
      'Sets seat, steering wheel, and all mirrors before moving, without being reminded. Can find lights, wipers, hazards, and defrost by feel.',
  },
  {
    id: 'smooth-accel-brake',
    category: 'basics',
    title: 'Smooth acceleration and braking',
    whatGoodLooksLike:
      'Starts and stops gently enough that a full cup of water would not spill. Begins slowing early and eases off the brake at the end of a stop.',
  },
  {
    id: 'steering-control',
    category: 'basics',
    title: 'Steering and lane position',
    whatGoodLooksLike:
      'Hand-over-hand or shuffle steering with both hands on the wheel. Keeps the car centered in the lane, including through gentle curves.',
  },
  {
    id: 'scanning-habits',
    category: 'basics',
    title: 'Scanning and mirror checks',
    whatGoodLooksLike:
      'Eyes move every few seconds: far ahead, mirrors, sides. Looks 12-15 seconds down the road rather than at the hood.',
  },
  // Residential
  {
    id: 'speed-residential',
    category: 'residential',
    title: 'Speed control on neighborhood streets',
    whatGoodLooksLike:
      'Holds a steady, appropriate speed without checking the speedometer constantly. Slows for blind driveways, parked cars, and children or pets.',
  },
  {
    id: 'turns-right-left',
    category: 'residential',
    title: 'Right and left turns',
    whatGoodLooksLike:
      'Signals early, slows before the turn (not in it), and finishes in the correct lane without cutting or swinging wide.',
  },
  {
    id: 'stop-signs',
    category: 'residential',
    title: 'Full stops at stop signs',
    whatGoodLooksLike:
      'Stops completely behind the line, looks left-right-left, and only goes when the way is clear and right-of-way is understood.',
  },
  {
    id: 'sharing-road',
    category: 'residential',
    title: 'Sharing the road with walkers and cyclists',
    whatGoodLooksLike:
      'Spots pedestrians and cyclists early, gives wide clearance, and yields to anyone crossing without being asked.',
  },
  // Intersections
  {
    id: 'signals-yellow',
    category: 'intersections',
    title: 'Traffic signals and yellow lights',
    whatGoodLooksLike:
      'Reads the signal early, covers the brake on a stale green, and chooses to stop on yellow whenever it is safe to do so.',
  },
  {
    id: 'left-turn-gap',
    category: 'intersections',
    title: 'Unprotected left turns',
    whatGoodLooksLike:
      'Waits with wheels straight, judges the gap in oncoming traffic patiently, and does not feel pressured by cars behind.',
  },
  {
    id: 'right-on-red',
    category: 'intersections',
    title: 'Right turn on red',
    whatGoodLooksLike:
      'Stops fully first, checks left, right, and left again, watches for pedestrians and cyclists, then turns only when clear.',
  },
  {
    id: 'right-of-way',
    category: 'intersections',
    title: 'Right-of-way at 4-way stops and driveways',
    whatGoodLooksLike:
      'Knows who goes first, makes eye contact, and yields when unsure rather than insisting on the right-of-way.',
  },
  // Roundabouts
  {
    id: 'rb-approach-yield',
    category: 'roundabouts',
    title: 'Approach, slow, and yield',
    whatGoodLooksLike:
      'Slows well before the entry, reads the signs and lane arrows, and yields to traffic already circulating in the circle.',
  },
  {
    id: 'rb-lane-choice',
    category: 'roundabouts',
    title: 'Choosing a lane and exiting',
    whatGoodLooksLike:
      'Picks the correct lane before the entry, stays in it through the circle, signals the exit, and yields to pedestrians at the exit crosswalk.',
  },
  {
    id: 'rb-multilane',
    category: 'roundabouts',
    title: 'Multi-lane roundabouts',
    whatGoodLooksLike:
      'Watches for cars beside them in the circle, does not change lanes inside, and never stops in the circle unless required for safety.',
  },
  // Arterials
  {
    id: 'lane-change',
    category: 'arterials',
    title: 'Lane changes',
    whatGoodLooksLike:
      'Mirror, signal, over-the-shoulder check, then a smooth move into a real gap. Cancels the signal afterward.',
  },
  {
    id: 'following-distance',
    category: 'arterials',
    title: 'Following distance (3-4 seconds)',
    whatGoodLooksLike:
      'Keeps at least a 3-second gap in normal conditions and widens it when speeds rise, roads are wet, or a large vehicle is ahead.',
  },
  {
    id: 'turn-lanes-merging',
    category: 'arterials',
    title: 'Turn lanes and driveway traffic',
    whatGoodLooksLike:
      'Moves into turn lanes early, anticipates cars pulling out of businesses, and covers the brake near busy driveways.',
  },
  {
    id: 'speed-differential',
    category: 'arterials',
    title: 'Matching traffic speed safely',
    whatGoodLooksLike:
      'Holds a speed consistent with the flow and posted limit, without tailgating or holding up traffic by driving far below it.',
  },
  // Interstate
  {
    id: 'on-ramp-merge',
    category: 'interstate',
    title: 'Merging onto the interstate',
    whatGoodLooksLike:
      'Uses the full on-ramp to match highway speed, checks mirror and blind spot, signals, and merges into a gap rather than stopping at the end.',
  },
  {
    id: 'exit-ramp',
    category: 'interstate',
    title: 'Exiting and ramp speed',
    whatGoodLooksLike:
      'Moves to the exit lane early, signals, and slows on the ramp (not on the highway) to the posted ramp speed.',
  },
  {
    id: 'highway-spacing',
    category: 'interstate',
    title: 'Highway spacing and lane discipline',
    whatGoodLooksLike:
      'Leaves a generous gap, avoids lingering in blind spots of trucks, and keeps right except to pass.',
  },
  // Night
  {
    id: 'night-headlights',
    category: 'night',
    title: 'Headlights and visibility at night',
    whatGoodLooksLike:
      'Turns lights on at dusk without prompting, knows when to use low versus high beams, and dims for oncoming traffic.',
  },
  {
    id: 'night-speed-scan',
    category: 'night',
    title: 'Night speed and scanning',
    whatGoodLooksLike:
      'Adjusts speed so the car can stop within the lit area, scans road edges for animals and pedestrians, and avoids staring at oncoming lights.',
  },
  {
    id: 'night-fatigue',
    category: 'night',
    title: 'Recognizing fatigue and glare',
    whatGoodLooksLike:
      'Speaks up when tired or dazzled, and agrees to pause or end the drive without feeling embarrassed.',
  },
  // Weather
  {
    id: 'wet-roads',
    category: 'weather',
    title: 'Driving on wet roads',
    whatGoodLooksLike:
      'Slows down, doubles following distance, brakes earlier and more gently, and turns on wipers and headlights.',
  },
  {
    id: 'low-visibility',
    category: 'weather',
    title: 'Fog and low visibility',
    whatGoodLooksLike:
      'Uses low beams, reduces speed, increases following distance, and pulls off safely if visibility is too poor.',
  },
  {
    id: 'hazard-response',
    category: 'weather',
    title: 'Responding to sudden hazards',
    whatGoodLooksLike:
      'Stays calm, looks where they want to go, brakes firmly in a straight line, and avoids overcorrecting.',
  },
  // Parking
  {
    id: 'parallel-park',
    category: 'parking',
    title: 'Parallel parking',
    whatGoodLooksLike:
      'Aligns, backs in on a controlled angle, and ends within about a foot and a half of the curb, parallel to it, without hitting it.',
  },
  {
    id: 'perpendicular-park',
    category: 'parking',
    title: 'Angle and perpendicular parking',
    whatGoodLooksLike:
      'Approaches wide, turns in slowly, straightens, and finishes centered in the space. Can back out while checking all directions.',
  },
  {
    id: 'three-point-turn',
    category: 'parking',
    title: 'Three-point turn and backing up',
    whatGoodLooksLike:
      'Checks all directions, uses slow steady speed, and looks over the shoulder rather than relying on the camera alone.',
  },
];
