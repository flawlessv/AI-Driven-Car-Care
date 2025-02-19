const mongoose = require('mongoose');
require('dotenv').config();

const vehicleSchema = new mongoose.Schema({
  brand: String,
  model: String,
  year: Number,
  licensePlate: String,
  vin: String,
  mileage: Number,
  status: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ownerName: String,
  ownerContact: String,
  createdAt: Date,
  updatedAt: Date,
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  phone: String,
}));

async function migrateVehicleOwners() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const vehicles = await Vehicle.find({ owner: { $exists: true }, ownerName: { $exists: false } });
    console.log(`Found ${vehicles.length} vehicles to migrate`);

    for (const vehicle of vehicles) {
      try {
        const user = await User.findById(vehicle.owner);
        if (user) {
          await Vehicle.findByIdAndUpdate(vehicle._id, {
            $set: {
              ownerName: user.name || '未知车主',
              ownerContact: user.phone || '未知联系方式',
            },
            $unset: { owner: 1 },
          });
          console.log(`Migrated vehicle ${vehicle.licensePlate}`);
        } else {
          await Vehicle.findByIdAndUpdate(vehicle._id, {
            $set: {
              ownerName: '未知车主',
              ownerContact: '未知联系方式',
            },
            $unset: { owner: 1 },
          });
          console.log(`Set default owner for vehicle ${vehicle.licensePlate}`);
        }
      } catch (error) {
        console.error(`Error migrating vehicle ${vehicle.licensePlate}:`, error);
      }
    }

    console.log('Migration completed');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateVehicleOwners(); 