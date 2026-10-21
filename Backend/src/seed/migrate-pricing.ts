import { connectDb, disconnectDb } from '../config/db.js';
import { PricingConfig } from '../models/PricingConfig.js';
import { DEFAULT_PEAK_WINDOWS, getPricingConfig } from '../services/pricing.service.js';

async function run() {
  await connectDb();
  await getPricingConfig(); // makes sure the document exists

  await PricingConfig.updateOne(
    { _id: 'default' },
    { $set: { peakWindows: DEFAULT_PEAK_WINDOWS }, $inc: { version: 1 } },
  );

  const updated = await PricingConfig.findById('default');
  console.log(
    `Pricing windows migrated. Rates unchanged: normal ${updated?.normalPaise}, peak ${updated?.peakPaise}, commission ${updated?.commissionPercent}%. Version ${updated?.version}.`,
  );
  await disconnectDb();
}

run().catch((err) => {
  console.error('Pricing migration failed:', err);
  process.exit(1);
});