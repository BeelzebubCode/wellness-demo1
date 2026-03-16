const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/cron/sync-ai-context/route.ts',
  'src/app/api/v2/master/universities/[code]/route.ts',
  'src/app/api/v2/me/profile/route.ts',
  'src/services/ai-agent/tools/booking.ts',
  'src/services/booking/handlers/createBooking.ts',
  'src/services/booking/handlers/getMyBookings.ts',
  'src/services/booking/handlers/setOnlineChannel.ts',
  'src/services/booking/handlers/startBooking.ts',
  'src/services/dashboards/handlers/advisorAnalytics.ts',
  'src/services/dashboards/handlers/analyticsService.ts',
  'src/services/dashboards/handlers/getAdvisorDashboard.ts',
  'src/services/dashboards/handlers/getDeanDashboard.ts',
  'src/services/dashboards/handlers/getHeadDepartmentDashboard.ts',
  'src/services/dashboards/handlers/getRectorDashboard.ts',
];

let found = 0;
for (const f of files) {
  const full = path.join(__dirname, f);
  if (!fs.existsSync(full)) continue;
  const buf = fs.readFileSync(full);
  let count = 0;
  for (let i = 0; i < buf.length - 1; i++) {
    if (buf[i] === 0x0D && buf[i + 1] === 0x0D) count++;
  }
  if (count > 0) {
    console.log(`CORRUPT: ${f} (${count} double-CR)`);
    // Fix: replace \r\r\n with \r\n
    const content = fs.readFileSync(full, 'utf8');
    const fixed = content.replace(/\r\r\n/g, '\r\n');
    fs.writeFileSync(full, fixed, 'utf8');
    console.log(`  -> FIXED`);
    found++;
  }
}
if (found === 0) {
  console.log('All files OK - no double-CR corruption found');
} else {
  console.log(`\nFixed ${found} files`);
}
