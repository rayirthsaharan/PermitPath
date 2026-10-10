export type Source = { id: string; title: string; note: string; url?: string };

export const SOURCES: Source[] = [
  {
    id: 'tn-handbook',
    title: 'Tennessee Driver Handbook / Graduated Driver License (GDL) rules',
    note: 'Tennessee Department of Safety & Homeland Security. Official source for permit hours, night driving, curfew, and certification requirements. Always verify current rules here.',
  },
  {
    id: 'mj-sap',
    title: 'Mt. Juliet Safety Action Plan',
    note: 'City of Mt. Juliet. Source of the high-injury roadway network used for candidate practice corridors. Corridor locations in this app are approximate and pending verification.',
  },
  {
    id: 'tdh-teen-crash',
    title: 'Tennessee Department of Health teen crash snapshot, 2011-2015',
    note: 'Wilson County ranked 76th of 95 Tennessee counties in this snapshot. Risk is real but not unusually high; this app is about deliberate practice, not a claim of crash reduction.',
  },
];
