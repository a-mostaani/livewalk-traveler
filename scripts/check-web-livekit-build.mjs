import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const approvedUrl = 'wss://livelywalk-ef00mosq.livekit.cloud';
const approvedHostname = 'livelywalk-ef00mosq.livekit.cloud';
const retiredHostname = 'livewalk-test.livekit.cloud';
const outputDirectory = fileURLToPath(new URL('../dist-web/', import.meta.url));

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  }));
  return files.flat();
}

const files = await listFiles(outputDirectory);
const browserAssets = files.filter((file) => /\.(?:css|html|js|json|map|txt)$/i.test(file));
const output = (await Promise.all(browserAssets.map((file) => readFile(file, 'utf8')))).join('\n');

if (!output.includes(approvedUrl)) {
  throw new Error(`Built web output does not contain approved LiveKit URL ${approvedUrl}.`);
}

if (output.includes(retiredHostname)) {
  throw new Error(`Built web output contains retired LiveKit host ${retiredHostname}.`);
}

const bundledLiveKitHosts = new Set(output.match(/[a-z0-9.-]+\.livekit\.cloud/gi) ?? []);
const unexpectedHosts = [...bundledLiveKitHosts].filter((hostname) => hostname !== approvedHostname);
if (unexpectedHosts.length > 0) {
  throw new Error(`Built web output contains non-approved LiveKit host(s): ${unexpectedHosts.join(', ')}.`);
}

console.log(`Verified built web output uses ${approvedUrl} and excludes retired LiveKit hosts.`);
