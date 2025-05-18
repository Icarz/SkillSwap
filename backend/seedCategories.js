require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

const categories = [
  // Tech
  { name: "programming", icon: "💻", description: "Coding and software development" },
  { name: "web-development", icon: "🌐", description: "Frontend/backend web technologies" },
  { name: "mobile-dev", icon: "📱", description: "iOS/Android development" },
  { name: "devops", icon: "🛠️", description: "Infrastructure and deployment" },
  { name: "ai-ml", icon: "🧠", description: "Artificial intelligence" },
  
  // Creative
  { name: "graphic-design", icon: "🎨", description: "Visual design tools" },
  { name: "video-editing", icon: "🎬", description: "Video production" },
  { name: "photography", icon: "📷", description: "Photo techniques" },
  { name: "3d-modeling", icon: "🖥️", description: "Blender/Maya etc" },
  
  // Languages
  { name: "english", icon: "🇬🇧", description: "English language" },
  { name: "spanish", icon: "🇪🇸", description: "Spanish language" },
  { name: "japanese", icon: "🇯🇵", description: "Japanese language" },
  
  // Business
  { name: "marketing", icon: "📈", description: "Digital marketing" },
  { name: "finance", icon: "💰", description: "Financial skills" },
  { name: "entrepreneurship", icon: "🚀", description: "Startup knowledge" },
  
  // Crafts
  { name: "woodworking", icon: "🪵", description: "Carpentry skills" },
  { name: "knitting", icon: "🧶", description: "Textile crafts" },
  
  // Music
  { name: "guitar", icon: "🎸", description: "Guitar playing" },
  { name: "piano", icon: "🎹", description: "Piano skills" }
];

async function seed() {
  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');

    // 2. Clear existing categories
    await Category.deleteMany({});
    console.log('🗑️ Cleared existing categories');

    // 3. Insert new categories
    const result = await Category.insertMany(categories);
    console.log(`🌱 Seeded ${result.length} categories:`);
    
    // 4. Log inserted categories
    result.forEach(cat => {
      console.log(`- ${cat.name} ${cat.icon}`);
    });

    // 5. Exit
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();