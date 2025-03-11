/* eslint-disable */
/* @ts-nocheck @ts-ignore  */

/**
 * buildMapping.js
 *
 * Usage:
 *   node buildMapping.js path/to/2024.json [outputFile]
 *
 * Produces:
 *   - A JSON object: { "eventId": "nextEventId", ... }
 *   - Excludes "First Four" games as keys
 *   - No entry for the championship game (there's no "next" game)
 */

const fs = require('fs');
const path = require('path');

/**
 * Determine if an event is a "First Four" game.
 * Checks the competitions[0].notes array for "First Four."
 */
function isFirstFour(event) {
  if (!event.competitions || !event.competitions[0] || !event.competitions[0].notes) {
    return false;
  }
  return event.competitions[0].notes.some((note) => {
    return note.type === 'event' && note.headline && note.headline.includes('First Four');
  });
}

/**
 * Extract the winner's team ID for a given event.
 * Returns null/undefined if the game has no winner yet.
 */
function getWinnerTeamId(event) {
  const competitors = event.competitions?.[0]?.competitors || [];
  const winner = competitors.find((c) => c.winner === true);
  return winner?.team?.id ?? null;
}

/**
 * Build the mapping:
 *   eventId -> nextEventId (where nextEventId is the game in which the winner next appears)
 *
 * Steps:
 *   1) Sort events by date in ascending order.
 *   2) For each event, find the winning team’s ID.
 *   3) Look for the first strictly later event that includes that same team ID in its competitors.
 *   4) Exclude "First Four" games from being keys in the final map.
 *   5) Omit any final game that has no subsequent matchup (e.g., the Championship).
 */
function buildProgressionMap(events) {
  // Sort events by date (chronological)
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  // filter events with no notes
  events = events.filter((event) => event.competitions?.[0]?.notes);

  // We'll store eventId -> nextEventId in a plain object
  const progression = {};

  for (let i = 0; i < events.length; i++) {
    const currentEvent = events[i];
    const currentEventId = currentEvent.id;
    const currentDate = new Date(currentEvent.date);
    const winnerTeamId = getWinnerTeamId(currentEvent);
    if (!winnerTeamId) {
      // No winner found (unplayed or partial data)
      continue;
    }

    // Look for the next event that includes winnerTeamId
    for (let j = i + 1; j < events.length; j++) {
      const nextEvent = events[j];
      const nextDate = new Date(nextEvent.date);
      if (nextDate <= currentDate) {
        // Must be strictly after the current event
        continue;
      }
      // Check if the winner's team ID is a competitor
      const competitors = nextEvent.competitions?.[0]?.competitors || [];
      const found = competitors.some((c) => c.team?.id === winnerTeamId);
      if (found) {
        progression[currentEventId] = nextEvent.id;
        break;
      }
    }
  }

  // Remove keys for First Four games
  for (const ev of events) {
    if (isFirstFour(ev)) {
      delete progression[ev.id];
    }
  }

  return progression;
}

// Entry point if run from the command line
if (require.main === module) {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3] || 'progression.json';

  if (!inputPath) {
    console.error('Usage: node buildMapping.js /path/to/2024.json [outputFile]');
    process.exit(1);
  }

  // Load the JSON data
  const raw = fs.readFileSync(path.resolve(inputPath), 'utf8');
  const data = JSON.parse(raw);
  const events = data.events || [];

  // Build the progression mapping
  const progression = buildProgressionMap(events);

  // Write out a JSON file
  fs.writeFileSync(
    path.resolve(outputPath),
    JSON.stringify(progression, null, 2),
    'utf8'
  );

  console.log(`Wrote mapping to ${outputPath}.`);
}

module.exports = { buildProgressionMap };
