/**
 * seed.js — Populate the cebu_cartour database with initial data.
 * Safe to run multiple times: uses INSERT IGNORE for most records.
 *
 * Usage:
 *   node seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool   = require('./db');

const SALT_ROUNDS = 10;

// ─── helpers ────────────────────────────────────────────────────────────────

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// ─── seed functions ──────────────────────────────────────────────────────────

async function seedUsers(conn) {
  console.log('Seeding users…');

  const users = [
    {
      id: 99,
      name: 'Admin User',
      email: 'admin@islatravel.ph',
      password: 'admin123',
      role: 'admin',
      status: 'active',
      approvalStatus: 'approved',
      approved: true,
      company: '',
      phone: '',
      address: '',
      idType: '',
      idNumber: '',
      services: null,
      bio: '',
      joined: '2024-01-01',
    },
    {
      id: 2,
      name: 'TravelEastern PH',
      email: 'vendor1@example.com',
      password: 'vendor123',
      role: 'vendor',
      status: 'active',
      approvalStatus: 'approved',
      approved: true,
      company: 'TravelEastern PH',
      phone: '09171234567',
      address: 'Tacloban City, Leyte',
      idType: 'Business Permit',
      idNumber: 'BP-2025-001',
      services: ['Car Rental', 'Island Tours'],
      bio: 'We are a premier travel company operating in Eastern Visayas since 2018.',
      joined: '2025-01-10',
    },
    {
      id: 3,
      name: 'VisayasTours Co.',
      email: 'vendor2@example.com',
      password: 'vendor123',
      role: 'vendor',
      status: 'pending',
      approvalStatus: 'pending',
      approved: false,
      company: 'VisayasTours Co.',
      phone: '09281234567',
      address: 'Ormoc City, Leyte',
      idType: 'DTI Registration',
      idNumber: 'DTI-2025-887',
      services: ['Tour Packages', 'Adventure Tours'],
      bio: 'Specializing in adventure and cultural tours around Leyte and Samar.',
      joined: '2025-06-01',
    },
    {
      id: 1,
      name: 'Maria Santos',
      email: 'maria@example.com',
      password: 'pass123',
      role: 'customer',
      status: 'active',
      approvalStatus: 'approved',
      approved: true,
      company: '',
      phone: '',
      address: '',
      idType: '',
      idNumber: '',
      services: null,
      bio: '',
      joined: '2025-01-15',
    },
    {
      id: 4,
      name: 'Juan Cruz',
      email: 'juan@example.com',
      password: 'pass123',
      role: 'customer',
      status: 'active',
      approvalStatus: 'approved',
      approved: true,
      company: '',
      phone: '',
      address: '',
      idType: '',
      idNumber: '',
      services: null,
      bio: '',
      joined: '2025-02-20',
    },
    {
      id: 5,
      name: 'Ana Reyes',
      email: 'ana@example.com',
      password: 'pass123',
      role: 'customer',
      status: 'active',
      approvalStatus: 'approved',
      approved: true,
      company: '',
      phone: '',
      address: '',
      idType: '',
      idNumber: '',
      services: null,
      bio: '',
      joined: '2025-03-05',
    },
    {
      id: 6,
      name: 'Pedro Lim',
      email: 'pedro@example.com',
      password: 'vendor123',
      role: 'vendor',
      status: 'active',
      approvalStatus: 'approved',
      approved: true,
      company: 'Leyte Car Rentals',
      phone: '09391234567',
      address: 'Palo, Leyte',
      idType: 'Business Permit',
      idNumber: 'BP-2024-412',
      services: ['Car Rental'],
      bio: 'Trusted car rental provider with a fleet of well-maintained vehicles.',
      joined: '2025-02-14',
    },
    {
      id: 7,
      name: 'Rosa Mendoza',
      email: 'rosa@example.com',
      password: 'vendor123',
      role: 'vendor',
      status: 'pending',
      approvalStatus: 'pending',
      approved: false,
      company: 'Samar Adventure Tours',
      phone: '09451234567',
      address: 'Catbalogan City, Samar',
      idType: 'SEC Registration',
      idNumber: 'SEC-2025-334',
      services: ['Adventure Tours', 'Trekking'],
      bio: 'Expert guides for cave exploration, river trekking, and eco-tourism in Samar.',
      joined: '2025-06-10',
    },
  ];

  for (const u of users) {
    const hashed = await hashPassword(u.password);
    await conn.query(
      `INSERT IGNORE INTO users
         (id, name, email, password, role, status, approvalStatus, approved,
          company, phone, address, idType, idNumber, services, bio,
          rejectionReason, dob, country, city, postalCode,
          deletionRequested, deletionReason, deletionRequestedAt, joined)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', '', '', '',
               FALSE, '', ?, ?)`,
      [
        u.id,
        u.name,
        u.email,
        hashed,
        u.role,
        u.status,
        u.approvalStatus,
        u.approved,
        u.company,
        u.phone,
        u.address,
        u.idType,
        u.idNumber,
        u.services ? JSON.stringify(u.services) : null,
        u.bio,
        '',    // deletionRequestedAt placeholder mapped from ''
        u.joined,
      ]
    );
    console.log(`  inserted/ignored user id=${u.id} (${u.email})`);
  }

  // Ensure AUTO_INCREMENT starts above the highest seeded id
  await conn.query('ALTER TABLE users AUTO_INCREMENT = 100');
  console.log('  AUTO_INCREMENT set to 100');
}

async function seedCars(conn) {
  console.log('Seeding cars…');

  const cars = [
    {
      id: 1,
      vendorId: 2,
      name: 'Toyota HiAce Van',
      type: 'Van',
      location: 'Tacloban City',
      price: 3500,
      seats: 12,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      fuel: 'Diesel',
      transmission: 'Manual',
      available: true,
      rating: 4.8,
      reviews: 24,
      description: 'Perfect for group tours. Spacious, air-conditioned, with experienced driver.',
    },
    {
      id: 2,
      vendorId: 2,
      name: 'Ford Ranger 4x4',
      type: 'SUV',
      location: 'Ormoc City',
      price: 2800,
      seats: 5,
      image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80',
      fuel: 'Diesel',
      transmission: 'Automatic',
      available: true,
      rating: 4.6,
      reviews: 18,
      description: 'Rugged 4x4 ideal for off-road adventures and mountain trails.',
    },
    {
      id: 3,
      vendorId: 3,
      name: 'Honda City Sedan',
      type: 'Sedan',
      location: 'Palo, Leyte',
      price: 1800,
      seats: 4,
      image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80',
      fuel: 'Gasoline',
      transmission: 'Automatic',
      available: true,
      rating: 4.5,
      reviews: 31,
      description: 'Comfortable sedan for city driving and short trips.',
    },
    {
      id: 4,
      vendorId: 2,
      name: 'Mitsubishi Montero',
      type: 'SUV',
      location: 'Tacloban City',
      price: 3200,
      seats: 7,
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80',
      fuel: 'Diesel',
      transmission: 'Automatic',
      available: true,
      rating: 4.7,
      reviews: 15,
      description: 'Premium SUV with powerful engine, perfect for family trips.',
    },
    {
      id: 5,
      vendorId: 3,
      name: 'Toyota Innova',
      type: 'MPV',
      location: 'Ormoc City',
      price: 2500,
      seats: 8,
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80',
      fuel: 'Diesel',
      transmission: 'Manual',
      available: false,
      rating: 4.4,
      reviews: 22,
      description: 'Family-friendly MPV with ample luggage space.',
    },
    {
      id: 6,
      vendorId: 2,
      name: 'Multicab Jeepney',
      type: 'Jeepney',
      location: 'Baybay City',
      price: 1200,
      seats: 14,
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
      fuel: 'Diesel',
      transmission: 'Manual',
      available: true,
      rating: 4.2,
      reviews: 9,
      description: 'Local transport, great for island-hopping groups.',
    },
  ];

  for (const c of cars) {
    await conn.query(
      `INSERT IGNORE INTO cars
         (id, vendorId, name, type, location, fuel, transmission, image,
          price, seats, available, rating, reviews, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id, c.vendorId, c.name, c.type, c.location, c.fuel,
        c.transmission, c.image, c.price, c.seats, c.available,
        c.rating, c.reviews, c.description,
      ]
    );
    console.log(`  inserted/ignored car id=${c.id} (${c.name})`);
  }

  await conn.query('ALTER TABLE cars AUTO_INCREMENT = 10');
  console.log('  AUTO_INCREMENT set to 10');
}

async function seedTours(conn) {
  console.log('Seeding tours…');

  const tours = [
    {
      id: 1,
      vendorId: 3,
      name: 'Kalanggaman Island Escapade',
      location: 'Palompon, Leyte',
      price: 1500,
      duration: '1 Day',
      groupSize: 15,
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
      category: 'Island Tour',
      available: true,
      rating: 4.9,
      reviews: 47,
      includes: ['Boat transfer', 'Snorkeling gear', 'Lunch', 'Guide'],
      description:
        'Experience the breathtaking white sandbars of Kalanggaman Island with crystal-clear waters and vibrant marine life.',
    },
    {
      id: 2,
      vendorId: 2,
      name: 'Leyte Heritage & History Tour',
      location: 'Tacloban City',
      price: 850,
      duration: '1 Day',
      groupSize: 20,
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80',
      category: 'Cultural Tour',
      available: true,
      rating: 4.6,
      reviews: 33,
      includes: ['Transport', 'Tour guide', 'Museum fees', 'Snacks'],
      description:
        "Explore Tacloban's rich WWII history, MacArthur's landing site, and vibrant cultural heritage.",
    },
    {
      id: 3,
      vendorId: 3,
      name: 'Sohoton Cave & Lagoon Adventure',
      location: 'Basey, Samar',
      price: 2200,
      duration: '2 Days',
      groupSize: 10,
      image: 'https://images.unsplash.com/photo-1604537466158-719b1972feb8?w=600&q=80',
      category: 'Adventure Tour',
      available: true,
      rating: 4.8,
      reviews: 28,
      includes: ['Overnight accommodation', 'All meals', 'Boat tours', 'Cave guide'],
      description:
        'Journey through the mystical Sohoton Natural Bridge and explore stunning cave systems and natural pools.',
    },
    {
      id: 4,
      vendorId: 2,
      name: 'Eastern Samar Surfing Safari',
      location: 'Borongan, Samar',
      price: 3500,
      duration: '3 Days',
      groupSize: 8,
      image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&q=80',
      category: 'Adventure Tour',
      available: true,
      rating: 4.7,
      reviews: 19,
      includes: ['Surfboard rental', '2 nights lodging', 'Breakfast', 'Surf instructor'],
      description:
        "Ride the legendary waves of Eastern Samar, one of the Philippines' best-kept surfing secrets.",
    },
    {
      id: 5,
      vendorId: 3,
      name: 'Camotes Island Hopper',
      location: 'Cebu-Leyte Route',
      price: 1800,
      duration: '2 Days',
      groupSize: 12,
      image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&q=80',
      category: 'Island Tour',
      available: true,
      rating: 4.5,
      reviews: 41,
      includes: ['Ferry tickets', '1 night stay', 'Island transfers', 'Breakfast'],
      description:
        'Discover the hidden lakes, caves, and pristine beaches of the Camotes island group.',
    },
    {
      id: 6,
      vendorId: 2,
      name: 'Mt. Nacolod Trekking Adventure',
      location: 'Carigara, Leyte',
      price: 1200,
      duration: '1 Day',
      groupSize: 15,
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80',
      category: 'Trekking',
      available: false,
      rating: 4.4,
      reviews: 12,
      includes: ['Trekking guide', 'Packed lunch', 'First aid kit', 'Certificate'],
      description:
        'Conquer the lush trails of Mt. Nacolod and enjoy panoramic views of Leyte Gulf.',
    },
  ];

  for (const t of tours) {
    await conn.query(
      `INSERT IGNORE INTO tours
         (id, vendorId, name, location, image, category, duration, groupSize,
          price, available, rating, reviews, includes, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id, t.vendorId, t.name, t.location, t.image, t.category,
        t.duration, t.groupSize, t.price, t.available,
        t.rating, t.reviews, JSON.stringify(t.includes), t.description,
      ]
    );
    console.log(`  inserted/ignored tour id=${t.id} (${t.name})`);
  }

  await conn.query('ALTER TABLE tours AUTO_INCREMENT = 10');
  console.log('  AUTO_INCREMENT set to 10');
}

async function seedBookings(conn) {
  console.log('Seeding bookings…');

  const bookings = [
    {
      id: 'BK001',
      userId: 1,
      type: 'car',
      itemId: 1,
      vendorId: 2,
      status: 'pending',
      vendorStatus: 'pending',
      date: '2025-06-10',
      returnDate: '2025-06-12',
      pickup: 'Tacloban Airport',
      dropoff: '',
      guests: 8,
      total: 7000,
      name: 'Maria Santos',
      email: 'maria@example.com',
      phone: '09171234567',
      notes: 'Need early pickup at 6am',
      paymentMethod: '',
      paid: false,
    },
    {
      id: 'BK002',
      userId: 4,
      type: 'tour',
      itemId: 1,
      vendorId: 3,
      status: 'approved',
      vendorStatus: 'confirmed',
      date: '2025-06-15',
      returnDate: '2025-06-15',
      pickup: 'Palompon Port',
      dropoff: '',
      guests: 4,
      total: 6000,
      name: 'Juan Cruz',
      email: 'juan@example.com',
      phone: '09281234567',
      notes: '',
      paymentMethod: '',
      paid: false,
    },
    {
      id: 'BK003',
      userId: 5,
      type: 'car',
      itemId: 3,
      vendorId: 3,
      status: 'cancelled',
      vendorStatus: 'cancelled',
      date: '2025-06-08',
      returnDate: '2025-06-10',
      pickup: 'Palo Terminal',
      dropoff: '',
      guests: 2,
      total: 3600,
      name: 'Ana Reyes',
      email: 'ana@example.com',
      phone: '09391234567',
      notes: 'Cancelled due to typhoon warning',
      paymentMethod: '',
      paid: false,
    },
  ];

  for (const b of bookings) {
    await conn.query(
      `INSERT IGNORE INTO bookings
         (id, userId, vendorId, itemId, type, status, vendorStatus,
          date, returnDate, pickup, dropoff, name, email, phone,
          guests, total, notes, paymentMethod, paid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.id, b.userId, b.vendorId, b.itemId, b.type, b.status,
        b.vendorStatus, b.date, b.returnDate, b.pickup, b.dropoff,
        b.name, b.email, b.phone, b.guests, b.total,
        b.notes, b.paymentMethod, b.paid,
      ]
    );
    console.log(`  inserted/ignored booking ${b.id}`);
  }
}

async function seedDestinations(conn) {
  console.log('Seeding destinations…');

  const destinations = [
    {
      name: 'Kawasan Falls',
      tag: 'Waterfall',
      tagColor: '#0D9488',
      img: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80',
      location: 'Badian, Cebu',
      bestTime: 'November to May',
      duration: '1 Day',
      difficulty: 'Easy',
      distance: '80 km from Cebu City',
      description:
        'One of the most stunning waterfalls in the Philippines, featuring turquoise waters perfect for canyoneering adventures.',
      highlights: ['Canyoneering', 'Swimming', 'Bamboo Rafting', 'Nature Trekking'],
    },
    {
      name: 'Malapascua Island',
      tag: 'Diving',
      tagColor: '#2563EB',
      img: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80',
      location: 'Daanbantayan, Cebu',
      bestTime: 'March to June',
      duration: '2-3 Days',
      difficulty: 'Moderate',
      distance: '70 km from Cebu City',
      description:
        'A world-class diving destination famous for thresher shark sightings and pristine coral reefs.',
      highlights: ['Thresher Shark Diving', 'Snorkeling', 'White Sand Beach', 'Sunset Views'],
    },
    {
      name: 'Oslob Whale Sharks',
      tag: 'Wildlife',
      tagColor: '#7C3AED',
      img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      location: 'Oslob, Cebu',
      bestTime: 'November to June',
      duration: '1 Day',
      difficulty: 'Easy',
      distance: '115 km from Cebu City',
      description:
        'Swim alongside the gentle giants of the ocean — whale sharks — in the crystal-clear waters of Oslob.',
      highlights: ['Whale Shark Swimming', 'Snorkeling', 'Tumalog Falls', 'Local Market'],
    },
    {
      name: 'Bantayan Island',
      tag: 'Beach',
      tagColor: '#F97316',
      img: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800&q=80',
      location: 'Santa Fe, Cebu',
      bestTime: 'December to May',
      duration: '2-3 Days',
      difficulty: 'Easy',
      distance: '100 km from Cebu City',
      description:
        'A laid-back paradise with powdery white sand beaches, clear turquoise waters, and fresh seafood.',
      highlights: ['White Sand Beaches', 'Island Hopping', 'Fresh Seafood', 'Relaxation'],
    },
    {
      name: 'Sirao Flower Farm',
      tag: 'Nature',
      tagColor: '#059669',
      img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
      location: 'Cebu City',
      bestTime: 'October to February',
      duration: 'Half Day',
      difficulty: 'Easy',
      distance: '18 km from Cebu City',
      description:
        "Cebu's Little Amsterdam — a hillside flower farm bursting with colorful celosias and cool mountain air.",
      highlights: ['Flower Fields', 'Mountain Views', 'Photography', 'Cool Climate'],
    },
  ];

  for (const d of destinations) {
    // Use name as unique key guard — skip if name already exists
    const [existing] = await conn.query(
      'SELECT id FROM destinations WHERE name = ?',
      [d.name]
    );
    if (existing.length > 0) {
      console.log(`  skipped destination (already exists): ${d.name}`);
      continue;
    }
    await conn.query(
      `INSERT INTO destinations
         (name, tag, tagColor, img, location, bestTime, duration,
          difficulty, distance, description, highlights)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d.name, d.tag, d.tagColor, d.img, d.location, d.bestTime,
        d.duration, d.difficulty, d.distance, d.description,
        JSON.stringify(d.highlights),
      ]
    );
    console.log(`  inserted destination: ${d.name}`);
  }
}

async function seedAppSettings(conn) {
  console.log('Seeding app_settings…');

  await conn.query(
    `INSERT IGNORE INTO app_settings (name, value) VALUES ('serviceFee', '5')`
  );
  console.log('  inserted/ignored serviceFee = 5');
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('Database connection acquired.\n');

    await seedUsers(conn);
    await seedCars(conn);
    await seedTours(conn);
    await seedBookings(conn);
    await seedDestinations(conn);
    await seedAppSettings(conn);

    console.log('\nSeeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
    await pool.end();
    console.log('Connection pool closed.');
  }
}

main();
