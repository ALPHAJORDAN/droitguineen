const id = "19918d0f-692d-4e58-aef9-bef2a0f547e7cc6b";
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12,16}$/i;
const cuidRegex = /^c[a-z0-9]{24,}$/;

console.log(`Testing ID: ${id}`);
console.log(`Length: ${id.length}`);
console.log(`Regex match: ${uuidRegex.test(id)}`);

// Test components
const parts = id.split('-');
console.log('Parts:', parts);
console.log('Part 5 length:', parts[4]?.length);
