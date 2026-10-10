import type { CoachingCard, Lesson, Stage } from '../domain/types';

const watch = (title: string, body: string): CoachingCard => ({ kind: 'watch', title, body });
const say = (title: string, body: string): CoachingCard => ({ kind: 'say', title, body });
const mistake = (title: string, body: string): CoachingCard => ({ kind: 'mistake', title, body });
const why = (title: string, body: string): CoachingCard => ({ kind: 'why', title, body });

// ---------------------------------------------------------------- Stage 1
const s1l1: Lesson = {
  id: 's1-l1',
  stageId: 1,
  title: 'Controls and the empty lot',
  goal: 'Get comfortable with the car: setup, controls, and gentle starts and stops in a big empty space.',
  estimatedMinutes: 25,
  bestTimes: 'Sunday 7-9 AM (empty lots)',
  corridorIds: [],
  skillIds: ['adjust-mirrors-seat', 'smooth-accel-brake', 'steering-control'],
  routeMode: 'nearby',
  coachingCards: [
    watch(
      'Setup before the key',
      'Before moving, check that the seat, wheel, and all three mirrors are set, seatbelts are on, and the teen can reach the pedals comfortably. Let the teen do it without prompting.',
    ),
    say('Keep it low-pressure', "\"There's no traffic here. Take your time. We'll do this a few times.\""),
    watch(
      'Smooth is the goal',
      'Look for gentle pedal pressure. Try a challenge: stop at a marked spot using only light brake pressure that starts early.',
    ),
    mistake(
      'Looking at the hood',
      'New drivers often stare close to the car. Coach: "Look where you want to go." Pick a far-off point (a light pole, the lot entrance) and steer toward it.',
    ),
    why(
      'Why an empty lot first',
      'Learning pedal feel and steering with no traffic lets the teen build habits before adding decisions. Skills practiced here show up in every later lesson.',
    ),
  ],
  debriefPrompts: [
    'What felt easiest about the car today, and what felt strange?',
    'Which stops felt smoothest? What did you do differently?',
    'What do you want to practice again next time?',
  ],
};

const s1l2: Lesson = {
  id: 's1-l2',
  stageId: 1,
  title: 'Turns, backing, and scanning in the lot',
  goal: 'Practice turning, backing up, and the scan habit: mirrors, over-the-shoulder, and far ahead.',
  estimatedMinutes: 25,
  bestTimes: 'Sunday 7-9 AM (empty lots)',
  corridorIds: [],
  skillIds: ['scanning-habits', 'steering-control', 'three-point-turn'],
  routeMode: 'nearby',
  coachingCards: [
    watch(
      'Eyes move',
      'Watch the teen\'s head and eyes. Do they check mirrors every few seconds? Narrate what you see: "I noticed you checked your left mirror before turning. Nice."',
    ),
    say('Backing slowly', "\"Walk speed. Look over your right shoulder. Stop any time you're unsure.\""),
    mistake(
      'Turning too early',
      'Turning before the corner makes the car cut across lanes. Practice with cones or painted lines: wait until the front wheels reach the corner point, then turn.',
    ),
    watch(
      'Hand position',
      'Both hands on the wheel, at 9 and 3 or 8 and 4. Practice hand-over-hand for turns and returning the wheel to center.',
    ),
    why(
      'Why scanning early',
      'Habits formed in the first hours tend to stick. A scan that becomes automatic in a quiet lot is far easier to keep when traffic arrives.',
    ),
  ],
  debriefPrompts: [
    'When did you remember to check your mirrors without being reminded?',
    'What is the trick to backing up smoothly?',
  ],
};

// ---------------------------------------------------------------- Stage 2
const s2l1: Lesson = {
  id: 's2-l1',
  stageId: 2,
  title: 'A quiet-street loop near home',
  goal: 'Drive a short loop on quiet residential streets: steady speed, lane position, and turns.',
  estimatedMinutes: 30,
  bestTimes: 'Weekend mornings, 8-10 AM',
  corridorIds: [],
  skillIds: ['speed-residential', 'turns-right-left', 'sharing-road'],
  routeMode: 'nearby',
  coachingCards: [
    watch(
      'Pick the route first',
      'Choose a loop of low-traffic streets you know. Right turns first; save left turns for the end of the drive.',
    ),
    say('Speed check', "\"Let's hold a steady speed. A little lighter on the gas here.\""),
    watch(
      'Hidden hazards',
      'Look for driveways, parked cars, mailboxes, kids, and pets. Ask the teen to name what could appear from behind each one.',
    ),
    mistake(
      'Drifting toward the curb or centerline',
      'Many new drivers hug one side. Suggest looking farther ahead and use light steering corrections.',
    ),
    why(
      'Why quiet streets matter',
      'Residential streets still have conflicts, such as walkers and cars backing out, but at low speeds. They are a forgiving place to build judgment.',
    ),
  ],
  debriefPrompts: [
    'What was the most surprising thing you noticed on the street?',
    'Where did you feel most relaxed? Where did you tense up?',
    'What would you do differently on the same loop next time?',
  ],
};

const s2l2: Lesson = {
  id: 's2-l2',
  stageId: 2,
  title: 'Stop signs and neighborhood right-of-way',
  goal: 'Make complete stops, look in the right order, and understand who goes first at small intersections.',
  estimatedMinutes: 30,
  bestTimes: 'Weekend mornings, 8-10 AM',
  corridorIds: [],
  skillIds: ['stop-signs', 'right-of-way', 'turns-right-left'],
  routeMode: 'nearby',
  coachingCards: [
    watch(
      'Full stop behind the line',
      'The car should stop completely, with a slight pause after, before the front bumper passes the line. A "rolling stop" may feel fine but is not.',
    ),
    say('Look, then decide', '"Left, right, left. Tell me who is there and who goes first."'),
    mistake(
      'Assuming other drivers will yield',
      'Teens often pull out on a wave or a glance. Coach the habit of making sure the other driver sees them before proceeding.',
    ),
    watch(
      'Four-way stops',
      'The first to arrive goes first; if tied, the driver on the right goes. Rehearse by narrating the order out loud.',
    ),
    why(
      'Why narrating works',
      'Saying out loud what they see and what they plan builds the mental model that quick decisions need later.',
    ),
  ],
  debriefPrompts: [
    'Which stop felt the most complicated? What was going on?',
    'How do you decide who goes first at a 4-way stop?',
  ],
};

// ---------------------------------------------------------------- Stage 3
const s3l1: Lesson = {
  id: 's3-l1',
  stageId: 3,
  title: 'Collector roads and your first signals',
  goal: 'Handle a road with a higher speed limit and a few traffic signals, staying calm with traffic behind.',
  estimatedMinutes: 40,
  bestTimes: 'Sunday 9-11 AM',
  corridorIds: [],
  skillIds: ['signals-yellow', 'following-distance', 'speed-differential'],
  routeMode: 'nearby',
  coachingCards: [
    watch(
      'Signals ahead',
      'Practice reading the light early. Is the green fresh or stale? Teach "stale green" thinking: if it has been green a while, be ready to stop.',
    ),
    say('On yellow', '"Yellow means get ready to stop. Can we stop safely? Yes, so we stop."'),
    watch(
      'Following distance',
      'Pick a fixed object and count: when the car ahead passes it, you should reach it 3 seconds later or more.',
    ),
    mistake(
      'Speeding up for yellow',
      'It is common to speed up to beat a light. Reframe: waiting a cycle costs a minute; running a red costs far more.',
    ),
    why(
      'Why increase difficulty gradually',
      'Collector roads add speed and signals without the density of arterial roads. This stage is a bridge to the busier corridors later.',
    ),
  ],
  debriefPrompts: [
    'When did you decide to stop for a yellow? What helped you decide?',
    'How far back did you keep from the car ahead? How did you check?',
  ],
};

const s3l2: Lesson = {
  id: 's3-l2',
  stageId: 3,
  title: 'Left turns and right on red',
  goal: 'Practice protected and unprotected left turns and turning right on red safely.',
  estimatedMinutes: 40,
  bestTimes: 'Sunday 9-11 AM',
  corridorIds: [],
  skillIds: ['left-turn-gap', 'right-on-red', 'sharing-road'],
  routeMode: 'nearby',
  coachingCards: [
    watch(
      'Wheels straight while waiting',
      'When waiting to turn left, the wheels should point straight. If someone bumps from behind, the car will not be pushed into oncoming traffic.',
    ),
    say('Patience on gaps', "\"You don't have to take this one. Wait for a gap that feels easy.\""),
    mistake(
      'Rushing the gap',
      'Pressure from cars behind leads to bad gap choices. It is fine to wait. Reassure: "Let them wait."',
    ),
    watch(
      'Right on red',
      'The teen should stop fully, look left, right, and left again, and check for pedestrians in the crosswalk and cyclists to the right before turning.',
    ),
    why(
      'Why left turns are a focus',
      'Turning across oncoming traffic requires judging speed and distance at once, and it takes practice. Starting at quieter intersections lets the teen learn the timing.',
    ),
  ],
  debriefPrompts: [
    'Tell me about a gap you passed up. What made it feel wrong?',
    'What do you check before turning right on red?',
    'What would you do if a driver behind you honked?',
  ],
};

// ---------------------------------------------------------------- Stage 4
const s4l1: Lesson = {
  id: 's4-l1',
  stageId: 4,
  title: 'Your first roundabout',
  goal: 'Enter, circulate, and exit a single-lane roundabout confidently, yielding correctly.',
  estimatedMinutes: 25,
  bestTimes: 'Sunday 7-9 AM',
  corridorIds: ['mj-roundabouts'],
  skillIds: ['rb-approach-yield', 'rb-lane-choice'],
  routeMode: 'nearby',
  coachingCards: [
    watch(
      'Slow before you see it',
      'The teen should be at a slow speed (often 15-20 mph) before the entry yield line. Look for the yield sign and the splitter island.',
    ),
    say('Yield to the left', '"Traffic in the circle has the right-of-way. Look left. Is there a gap?"'),
    mistake(
      'Stopping in the circle',
      'Some drivers stop mid-circle out of nervousness. The fix is to take the entry slowly, decide before entering, and go only when clearly open.',
    ),
    watch(
      'Signal and exit',
      'Signal right as you pass the exit before yours, then exit. Watch the crosswalk at the exit for pedestrians.',
    ),
    why(
      'Why roundabouts feel unfamiliar',
      'Many drivers learned on signalized intersections. Roundabouts reward a slow, observant approach, so practice in a quiet one first. The exact Mt. Juliet locations are pending verification, so pick one you know.',
    ),
  ],
  debriefPrompts: [
    'What did you look for before entering?',
    'When did you feel most unsure? What would help next time?',
  ],
};

const s4l2: Lesson = {
  id: 's4-l2',
  stageId: 4,
  title: 'Multi-lane roundabouts and lane choice',
  goal: 'Choose the correct lane early and stay in it through a multi-lane roundabout.',
  estimatedMinutes: 30,
  bestTimes: 'Sunday 7-9 AM',
  corridorIds: ['mj-roundabouts'],
  skillIds: ['rb-multilane', 'rb-lane-choice', 'rb-approach-yield'],
  routeMode: 'nearby',
  coachingCards: [
    watch(
      'Read the signs early',
      'Look at the lane arrows on the approach and decide on a lane before reaching the splitter island.',
    ),
    say('Stay in your lane', "\"Stay in the lane you picked all the way around. Don't switch inside.\""),
    mistake(
      'Drifting toward the car beside you',
      'In a two-lane circle, cars may run side by side. Keep the car centered in the lane and watch the car next to you at the exit.',
    ),
    watch(
      'Trucks and wide vehicles',
      'Larger vehicles may use extra space. Give them room and do not drive beside them.',
    ),
    why(
      'Why a second visit helps',
      'The second time through, the teen already knows the shape of a roundabout and can focus on lane choice and gaps. Repeat until it feels routine.',
    ),
  ],
  debriefPrompts: [
    'How did you choose your lane before entering?',
    'What did you notice about the cars beside you in the circle?',
  ],
};

// ---------------------------------------------------------------- Stage 5
const s5l1: Lesson = {
  id: 's5-l1',
  stageId: 5,
  title: 'N. Mt. Juliet Rd (SR-171), off-peak',
  goal: 'Drive a busy arterial when traffic is light: lane position, signals, driveways, and turning conflicts.',
  estimatedMinutes: 40,
  bestTimes: 'Sunday 7-9 AM, then weekdays 10 AM-2 PM',
  corridorIds: ['n-mt-juliet-rd'],
  skillIds: ['turn-lanes-merging', 'lane-change', 'following-distance'],
  routeMode: 'corridor',
  coachingCards: [
    watch(
      'Driveways everywhere',
      'Ask the teen to name driveways and side streets as you pass. Cars may pull out; cover the brake when approaching busy entrances.',
    ),
    say('Early lane choice', "\"Let's get into the turn lane early so we're not rushing.\""),
    mistake(
      'Late lane changes',
      'Changing lanes close to an intersection is a common error. Plan one block ahead: mirror, signal, check, go.',
    ),
    watch(
      'Gaps at lights',
      'Watch for cars cutting in from side streets at signals. Keep a cushion rather than tailgating.',
    ),
    why(
      'Why this road',
      'Listed among the high-injury roadways in the Mt. Juliet Safety Action Plan (verify). Dense turning traffic and speed differences are the general hazards; starting off-peak lets the teen learn them with less pressure.',
    ),
  ],
  debriefPrompts: [
    'Which side streets or driveways worried you? Why?',
    'When did you feel rushed? What could you change?',
    'Next time, how could we drive this road at a busier time?',
  ],
};

const s5l2: Lesson = {
  id: 's5-l2',
  stageId: 5,
  title: 'Lebanon Rd (US-70) and Central Pike',
  goal: 'Practice multi-lane driving, lane changes, and turning traffic on two busy corridors, starting off-peak.',
  estimatedMinutes: 45,
  bestTimes: 'Sunday 8-10 AM, then weekday midday',
  corridorIds: ['lebanon-rd-us70', 'central-pike'],
  skillIds: ['lane-change', 'speed-differential', 'turn-lanes-merging'],
  routeMode: 'corridor',
  coachingCards: [
    watch(
      'Speed and flow',
      'Match the flow of traffic within the posted limit. Avoid sitting in blind spots of other vehicles.',
    ),
    say('Lane change coaching', '"Mirror, signal, shoulder check. Is the gap big enough? Go."'),
    mistake(
      'Overreacting to a honk',
      'A honk is not an order. Coach a slow breath and a steady response. Pull over if needed.',
    ),
    watch(
      'Turning vehicles',
      'Cars ahead may brake suddenly to turn into driveways. Keep the 3-second gap so you have time.',
    ),
    why(
      'Why more than one road',
      'Lebanon Rd is listed among the high-injury roadways in the Mt. Juliet Safety Action Plan (verify). Seeing a couple of road types builds adaptable habits.',
    ),
  ],
  debriefPrompts: [
    'What was the hardest decision you made on these roads?',
    'How did you decide when a lane change gap was big enough?',
  ],
};

// ---------------------------------------------------------------- Stage 6
const s6l1: Lesson = {
  id: 's6-l1',
  stageId: 6,
  title: 'I-40 Exit 226 (SR-171): merge and exit',
  goal: 'Practice merging onto the interstate with enough speed and exiting calmly, at a quiet time.',
  estimatedMinutes: 35,
  bestTimes: 'Sunday 7-9 AM',
  corridorIds: ['i40-exit-226', 'n-mt-juliet-rd'],
  skillIds: ['on-ramp-merge', 'exit-ramp', 'highway-spacing'],
  routeMode: 'corridor',
  coachingCards: [
    watch(
      'Use the whole ramp',
      'The on-ramp is for gaining speed. By the end the car should be close to the speed of traffic, with a gap picked out.',
    ),
    say('Merge cues', '"Signal. Check your mirror. Shoulder check. Pick a gap and ease in."'),
    mistake(
      'Slow merge or stopping on the ramp',
      'Merging too slowly is a common risk. Accelerate firmly on the ramp and merge into a gap; only slow if the lane is truly blocked.',
    ),
    watch(
      'Exit planning',
      'Move to the right lane early and look for the exit sign. Slow on the exit ramp, not on the highway.',
    ),
    why(
      'Why merges',
      'Merging involves a speed difference between ramp and highway traffic, which is a general hazard for new drivers. Practicing at a quiet time keeps the focus on technique.',
    ),
  ],
  debriefPrompts: [
    'What helped you pick a gap?',
    'How did the car feel at highway speed?',
    'What should we do differently on the next merge?',
  ],
};

const s6l2: Lesson = {
  id: 's6-l2',
  stageId: 6,
  title: 'I-40 Exit 229 (Beckwith Rd) and ramp speeds',
  goal: 'Repeat merging and exiting at a second interchange, adding lane discipline and spacing.',
  estimatedMinutes: 40,
  bestTimes: 'Sunday 7-9 AM',
  corridorIds: ['i40-exit-229', 'beckwith-rd'],
  skillIds: ['on-ramp-merge', 'exit-ramp', 'highway-spacing', 'lane-change'],
  routeMode: 'corridor',
  coachingCards: [
    watch(
      'Trucks',
      'Large trucks have big blind spots and need more room to stop. Pass them without lingering beside them.',
    ),
    say('Keep right', "\"Stay in the right lane unless we're passing. Plenty of space ahead?\""),
    mistake(
      'Following too closely',
      'At highway speeds, 3 seconds may not be enough. Add more in rain or with a large vehicle ahead.',
    ),
    watch(
      'Surface streets after the exit',
      'After exiting, the teen has to drop speed quickly. Check the speedometer and watch for the first signal.',
    ),
    why(
      'Why a second interchange',
      'Each interchange has its own layout. Repeating at a different one helps the teen learn the pattern instead of memorizing one spot. Beckwith Rd is listed among the high-injury roadways in the Mt. Juliet Safety Action Plan (verify).',
    ),
  ],
  debriefPrompts: [
    'What was different about this interchange compared to the first?',
    'When did you feel most comfortable at highway speed?',
  ],
};

// ---------------------------------------------------------------- Stage 7
const s7l1: Lesson = {
  id: 's7-l1',
  stageId: 7,
  title: 'Night repeat: quiet streets and collectors',
  goal: 'Revisit familiar roads after dark to build night judgment. Counts toward the 10 night hours.',
  estimatedMinutes: 40,
  bestTimes: 'Dusk to 9:30 PM (the permit curfew applies; verify)',
  corridorIds: [],
  skillIds: ['night-headlights', 'night-speed-scan', 'night-fatigue'],
  routeMode: 'nearby',
  isNight: true,
  coachingCards: [
    watch(
      'Lights on at dusk',
      'The teen should turn on headlights before it gets dark, and know how to switch beams.',
    ),
    say('Scan the edges', '"Look at the edges of the road for eyes, reflectors, or people. Slow down a bit."'),
    mistake(
      'Overdriving the headlights',
      'Driving faster than you can stop within the lit area is common at night. Coach a slightly lower speed than in daylight.',
    ),
    watch(
      'Glare',
      'Oncoming headlights can dazzle. Teach looking toward the right edge line until the car passes.',
    ),
    why(
      'Why night practice is required',
      'Visibility and depth perception change after dark, so a skill that is easy in daylight can feel different. Familiar roads let the teen focus on the new conditions.',
    ),
  ],
  debriefPrompts: [
    'What was harder in the dark than in the day?',
    'Did glare bother you? How did you handle it?',
    'How tired do you feel? What would help?',
  ],
};

const s7l2: Lesson = {
  id: 's7-l2',
  stageId: 7,
  title: 'Night repeat: signals, turns, and arterials',
  goal: 'Practice turns and busier roads at night. Keep it calm and end early if either of you is tired.',
  estimatedMinutes: 40,
  bestTimes: 'Dusk to 9:30 PM (the permit curfew applies; verify)',
  corridorIds: ['n-mt-juliet-rd', 'lebanon-rd-us70'],
  skillIds: ['night-speed-scan', 'left-turn-gap', 'lane-change', 'night-fatigue'],
  routeMode: 'corridor',
  isNight: true,
  coachingCards: [
    watch(
      'Judging gaps at night',
      'Headlights are harder to judge for distance and speed. Encourage waiting for a larger gap on left turns.',
    ),
    say('Permission to stop', "\"If you're tired or it feels like too much, tell me. We can head home.\""),
    mistake(
      'Looking at taillights only',
      'Staring at the car ahead leads to missing hazards on the sides. Keep scanning.',
    ),
    watch(
      'Pedestrians',
      'People in dark clothing are hard to see. Slow near crosswalks, bus stops, and shopping areas.',
    ),
    why(
      'Why repeat busy roads',
      'Familiar roads with new lighting conditions are a good test of what the teen has learned. Listed corridors are candidates only (verify) and the parent decides whether conditions are right.',
    ),
  ],
  debriefPrompts: [
    'How did judging gaps feel at night?',
    'What do you want to do differently on the next night drive?',
  ],
};

const s7l3: Lesson = {
  id: 's7-l3',
  stageId: 7,
  title: 'Rain and reduced visibility',
  goal: 'Practice wet-road driving: longer stops, gentler inputs, and wipers and lights, when conditions are safe.',
  estimatedMinutes: 30,
  bestTimes: 'Light to moderate rain, daytime, familiar roads',
  corridorIds: [],
  skillIds: ['wet-roads', 'low-visibility', 'hazard-response', 'following-distance'],
  routeMode: 'nearby',
  weatherFocus: 'rain',
  coachingCards: [
    watch(
      'Only in manageable conditions',
      'Choose light or moderate rain on familiar roads. Skip heavy rain, flooding, or storms; the parent decides.',
    ),
    say('Gentle inputs', '"Ease the brake a bit earlier and a bit softer than normal."'),
    mistake(
      'Cruise control in the rain',
      'Cruise control can be unsafe on wet roads. Keep manual control of speed.',
    ),
    watch(
      'Visibility',
      'Check that wipers, headlights, and defrost work. Low beams only in fog. Keep extra distance behind other cars.',
    ),
    why(
      'Why practice in the wet',
      'Stopping distances are longer on wet pavement. Having felt it on a calm drive makes it easier to adjust later.',
    ),
  ],
  debriefPrompts: [
    'What was different about stopping on wet roads?',
    'What would make you decide to pull over or stop a drive in the rain?',
  ],
};

// ---------------------------------------------------------------- Stages
export const STAGES: Stage[] = [
  {
    id: 1,
    title: 'Foundations',
    theme: 'Empty lot, controls, smooth braking',
    gate: { minHours: 0, skillReqs: [] },
    lessons: [s1l1, s1l2],
  },
  {
    id: 2,
    title: 'Quiet residential streets',
    theme: 'Neighborhood streets near home',
    gate: { minHours: 2, skillReqs: [{ categoryId: 'basics', minLevel: 1 }] },
    lessons: [s2l1, s2l2],
  },
  {
    id: 3,
    title: 'Collector roads & signals',
    theme: 'Higher speeds and signalized intersections',
    gate: { minHours: 6, skillReqs: [{ categoryId: 'residential', minLevel: 2 }] },
    lessons: [s3l1, s3l2],
  },
  {
    id: 4,
    title: 'Roundabouts',
    theme: 'Mt. Juliet roundabouts',
    gate: { minHours: 10, skillReqs: [{ categoryId: 'intersections', minLevel: 2 }] },
    lessons: [s4l1, s4l2],
  },
  {
    id: 5,
    title: 'High-injury corridors',
    theme: 'Off-peak first: N. Mt. Juliet Rd, Lebanon Rd, Central Pike',
    gate: { minHours: 16, skillReqs: [], requiresLessonsFromStages: [3, 4] },
    lessons: [s5l1, s5l2],
  },
  {
    id: 6,
    title: 'I-40 merges & exits',
    theme: 'Exit 226 (SR-171) and Exit 229 (Beckwith Rd)',
    gate: { minHours: 24, skillReqs: [{ categoryId: 'arterials', minLevel: 2 }] },
    lessons: [s6l1, s6l2],
  },
  {
    id: 7,
    title: 'Night & weather',
    theme: 'Repeat earlier stages after dark and in the rain',
    gate: { minHours: 30, skillReqs: [] },
    lessons: [s7l1, s7l2, s7l3],
  },
];

export const LESSONS: Lesson[] = STAGES.flatMap((s) => s.lessons);

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function getStage(id: number): Stage | undefined {
  return STAGES.find((s) => s.id === id);
}
