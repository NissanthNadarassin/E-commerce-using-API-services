const db = require("./app/models");
const UserAddress = db.userAddress;
const User = db.user;

const addresses = [
  {
    userId: 1,
    label: "Home",
    address_line1: "15 Rue de la Paix",
    address_line2: "Apt 4B",
    city: "Paris",
    postal_code: "75002",
    country: "France",
    phone: "+33612345678",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 2,
    label: "Work",
    address_line1: "28 Avenue des Champs-Élysées",
    address_line2: null,
    city: "Paris",
    postal_code: "75008",
    country: "France",
    phone: "+33612345679",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 3,
    label: "Home",
    address_line1: "42 Boulevard Saint-Germain",
    address_line2: "3rd Floor",
    city: "Paris",
    postal_code: "75005",
    country: "France",
    phone: "+33612345680",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 4,
    label: "Home",
    address_line1: "89 Rue du Faubourg Saint-Honoré",
    address_line2: null,
    city: "Paris",
    postal_code: "75008",
    country: "France",
    phone: "+33612345681",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 5,
    label: "Apartment",
    address_line1: "56 Rue de Rivoli",
    address_line2: "Building A",
    city: "Paris",
    postal_code: "75001",
    country: "France",
    phone: "+33612345682",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 6,
    label: "Home",
    address_line1: "73 Avenue Montaigne",
    address_line2: null,
    city: "Paris",
    postal_code: "75008",
    country: "France",
    phone: "+33612345683",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 7,
    label: "Office",
    address_line1: "134 Rue La Fayette",
    address_line2: "Suite 200",
    city: "Paris",
    postal_code: "75010",
    country: "France",
    phone: "+33612345684",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 8,
    label: "Home",
    address_line1: "21 Rue de Turenne",
    address_line2: null,
    city: "Paris",
    postal_code: "75003",
    country: "France",
    phone: "+33612345685",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 9,
    label: "Home",
    address_line1: "67 Rue des Archives",
    address_line2: "Apt 12",
    city: "Paris",
    postal_code: "75003",
    country: "France",
    phone: "+33612345686",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 10,
    label: "Residence",
    address_line1: "95 Boulevard Haussmann",
    address_line2: null,
    city: "Paris",
    postal_code: "75008",
    country: "France",
    phone: "+33612345687",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 11,
    label: "Home",
    address_line1: "38 Rue du Bac",
    address_line2: "2nd Floor",
    city: "Paris",
    postal_code: "75007",
    country: "France",
    phone: "+33612345688",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 12,
    label: "Apartment",
    address_line1: "112 Rue de la Roquette",
    address_line2: null,
    city: "Paris",
    postal_code: "75011",
    country: "France",
    phone: "+33612345689",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 13,
    label: "Home",
    address_line1: "49 Rue Oberkampf",
    address_line2: "Building C",
    city: "Paris",
    postal_code: "75011",
    country: "France",
    phone: "+33612345690",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 14,
    label: "Home",
    address_line1: "81 Avenue de la République",
    address_line2: null,
    city: "Paris",
    postal_code: "75011",
    country: "France",
    phone: "+33612345691",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 15,
    label: "Studio",
    address_line1: "27 Rue des Martyrs",
    address_line2: "5th Floor",
    city: "Paris",
    postal_code: "75009",
    country: "France",
    phone: "+33612345692",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 16,
    label: "Home",
    address_line1: "103 Rue de Belleville",
    address_line2: null,
    city: "Paris",
    postal_code: "75019",
    country: "France",
    phone: "+33612345693",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 17,
    label: "Home",
    address_line1: "58 Rue de Charonne",
    address_line2: "Apt 7",
    city: "Paris",
    postal_code: "75011",
    country: "France",
    phone: "+33612345694",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 18,
    label: "Work",
    address_line1: "145 Boulevard Voltaire",
    address_line2: null,
    city: "Paris",
    postal_code: "75011",
    country: "France",
    phone: "+33612345695",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 19,
    label: "Home",
    address_line1: "32 Rue Saint-Antoine",
    address_line2: "4th Floor",
    city: "Paris",
    postal_code: "75004",
    country: "France",
    phone: "+33612345696",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    userId: 20,
    label: "Home",
    address_line1: "76 Rue de Rennes",
    address_line2: null,
    city: "Paris",
    postal_code: "75006",
    country: "France",
    phone: "+33612345697",
    is_default_shipping: true,
    is_default_billing: true,
  },
  // Additional addresses for some users
  {
    userId: 1,
    label: "Work",
    address_line1: "200 Avenue Victor Hugo",
    address_line2: "Floor 6",
    city: "Paris",
    postal_code: "75016",
    country: "France",
    phone: "+33612345678",
    is_default_shipping: false,
    is_default_billing: false,
  },
  {
    userId: 3,
    label: "Parents",
    address_line1: "18 Rue de Vaugirard",
    address_line2: null,
    city: "Paris",
    postal_code: "75006",
    country: "France",
    phone: "+33612345680",
    is_default_shipping: false,
    is_default_billing: false,
  },
];

async function seedUser_address() {
  try {
    console.log("Starting user addresses seeding...");

    // Check if addresses already exist
    const existingCount = await UserAddress.count();
    if (existingCount > 0) {
      console.log(`${existingCount} user addresses already exist. Skipping user addresses seeding.`);
      return;
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const addressData of addresses) {
      // Verify user exists
      const user = await User.findByPk(addressData.userId);
      if (!user) {
        console.log(`User with ID ${addressData.userId} not found. Skipping address...`);
        skippedCount++;
        continue;
      }

      await UserAddress.create(addressData);
      createdCount++;
      console.log(`Address "${addressData.label}" for user #${addressData.userId} created successfully`);
    }

    console.log(`User addresses seeding completed! Created ${createdCount} addresses, skipped ${skippedCount}.`);
  } catch (error) {
    console.error("Error seeding user addresses:", error.message);
  }
}

module.exports = seedUser_address;
