// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
// Glossary of crime statistics terminology

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  { term: 'ANZSOC', definition: 'Australian and New Zealand Standard Offence Classification — the national standard for categorising criminal offences across all jurisdictions.' },
  { term: 'Rate per 100K', definition: 'The number of offences per 100,000 residents. Allows fair comparison between areas with different populations.' },
  { term: 'Victimisation rate', definition: 'The number of victims of crime per 100,000 population. One incident may have multiple victims.' },
  { term: 'Recorded crime', definition: 'Offences that have been reported to and recorded by police. Does not include unreported crime.' },
  { term: 'LGA', definition: 'Local Government Area — the administrative boundary of a local council (e.g. City of Sydney, Blacktown).' },
  { term: 'YoY change', definition: 'Year-on-year change — the percentage difference between this year and last year.' },
  { term: 'Homicide', definition: 'Includes murder, attempted murder, manslaughter, and driving causing death.' },
  { term: 'Assault', definition: 'Physical assault offences, including both domestic-violence-related and non-DV assault.' },
  { term: 'Sexual assault', definition: 'Sexual assault and related sexual offences as recorded by police.' },
  { term: 'Robbery', definition: 'Theft involving force or threat of force, including armed and unarmed robbery.' },
  { term: 'Unlawful entry', definition: 'Break and enter offences, also called burglary. Includes both dwelling and non-dwelling premises.' },
  { term: 'Motor vehicle theft', definition: 'Theft or attempted theft of a motor vehicle (car, motorcycle, truck).' },
  { term: 'Other theft', definition: 'All theft offences not involving a vehicle or break-in — shoplifting, pickpocketing, bicycle theft, etc.' },
  { term: 'Fraud', definition: 'Deception and dishonesty offences including identity fraud, credit card fraud, and online scams.' },
  { term: 'Property damage', definition: 'Criminal damage to property, including vandalism, graffiti, and arson.' },
  { term: 'Drug offences', definition: 'Possession, use, trafficking, and manufacturing of illicit drugs.' },
  { term: 'Per capita', definition: 'Per person — used to normalise data by population so areas of different sizes can be compared fairly.' },
  { term: 'ERP', definition: 'Estimated Resident Population — the ABS estimate of people usually living in an area, used as the population denominator for rates.' },
  { term: 'ABS', definition: 'Australian Bureau of Statistics — the national statistical agency that publishes standardised crime data.' },
  { term: 'BOCSAR', definition: 'Bureau of Crime Statistics and Research — NSW\'s crime statistics agency, producing the most granular state-level data.' },
  { term: 'Dark figure', definition: 'The gap between actual crime and recorded crime — offences that occur but are never reported to police.' },
  { term: 'Median', definition: 'The middle value when all values are sorted. Less affected by extreme outliers than the average (mean).' },
  { term: 'Anomaly', definition: 'A data point that is significantly different from the expected pattern — a spike, drop, or outlier.' },
];

export const GLOSSARY_MAP = new Map(GLOSSARY.map(g => [g.term.toLowerCase(), g]));

export function findGlossaryTerm(term: string): GlossaryTerm | undefined {
  return GLOSSARY_MAP.get(term.toLowerCase());
}
