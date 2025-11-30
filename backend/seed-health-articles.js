const mongoose = require('mongoose');
require('dotenv').config();

const HealthArticle = require('./models/HealthArticle');

const generateSlug = (title) => {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const articles = [
  {
    title: '10 Tips for a Healthy Heart',
    slug: generateSlug('10 Tips for a Healthy Heart'),
    content: `Maintaining a healthy heart is crucial for overall well-being. Here are 10 essential tips:

1. **Exercise Regularly**: Aim for at least 30 minutes of moderate exercise most days of the week.

2. **Eat a Balanced Diet**: Include plenty of fruits, vegetables, whole grains, and lean proteins.

3. **Manage Stress**: Practice relaxation techniques like meditation or deep breathing.

4. **Get Enough Sleep**: Aim for 7-9 hours of quality sleep each night.

5. **Quit Smoking**: Smoking is a major risk factor for heart disease.

6. **Limit Alcohol**: If you drink, do so in moderation.

7. **Monitor Blood Pressure**: Keep track of your blood pressure regularly.

8. **Maintain Healthy Weight**: Being overweight increases heart disease risk.

9. **Stay Hydrated**: Drink plenty of water throughout the day.

10. **Regular Check-ups**: Visit your doctor for regular heart health screenings.`,
    excerpt: 'Learn simple lifestyle changes that can significantly improve your cardiovascular health and reduce the risk of heart disease.',
    category: 'general_health',
    tags: ['heart health', 'cardiovascular', 'lifestyle', 'prevention'],
    authorName: 'Dr. Rajesh Sharma',
    authorCredentials: 'MD, Cardiologist',
    readTime: 5,
    isPublished: true,
    isFeatured: true,
    publishedAt: new Date()
  },
  {
    title: 'The Importance of Mental Health',
    slug: generateSlug('The Importance of Mental Health'),
    content: `Mental health is just as important as physical health. Here's why you should prioritize it:

**Understanding Mental Health**
Mental health includes our emotional, psychological, and social well-being. It affects how we think, feel, and act.

**Signs You Need Support**
- Persistent sadness or anxiety
- Extreme mood changes
- Withdrawal from friends and activities
- Significant tiredness or low energy
- Difficulty concentrating

**Ways to Improve Mental Health**
1. Talk to someone you trust
2. Stay physically active
3. Practice mindfulness
4. Maintain social connections
5. Seek professional help when needed

Remember, seeking help is a sign of strength, not weakness.`,
    excerpt: 'Understanding why mental health is just as important as physical health and how to maintain it.',
    category: 'mental_health',
    tags: ['mental health', 'wellness', 'self-care', 'anxiety', 'depression'],
    authorName: 'Dr. Priya Patel',
    authorCredentials: 'MD, Psychiatrist',
    readTime: 7,
    isPublished: true,
    publishedAt: new Date()
  },
  {
    title: 'Balanced Diet for Better Living',
    slug: generateSlug('Balanced Diet for Better Living'),
    content: `A balanced diet is the foundation of good health. Here's your comprehensive guide:

**The Five Food Groups**
1. Fruits and Vegetables
2. Grains and Cereals
3. Protein Foods
4. Dairy Products
5. Healthy Fats

**Daily Recommendations**
- 5 servings of fruits and vegetables
- 6 servings of grains (preferably whole grains)
- 2-3 servings of protein
- 2-3 servings of dairy

**Tips for Healthy Eating**
- Plan your meals ahead
- Cook at home more often
- Read nutrition labels
- Control portion sizes
- Stay hydrated with water`,
    excerpt: 'A comprehensive guide to maintaining a balanced diet for optimal health and energy.',
    category: 'nutrition',
    tags: ['nutrition', 'diet', 'healthy eating', 'food groups'],
    authorName: 'Dr. Anita Gupta',
    authorCredentials: 'MD, Nutritionist',
    readTime: 6,
    isPublished: true,
    publishedAt: new Date()
  },
  {
    title: 'Exercise Routines for Beginners',
    slug: generateSlug('Exercise Routines for Beginners'),
    content: `Starting a fitness journey? Here's your beginner-friendly guide:

**Week 1-2: Building Foundation**
- 15-minute walks daily
- Basic stretching
- Light bodyweight exercises

**Week 3-4: Increasing Intensity**
- 20-30 minute walks
- Add squats and lunges
- Include push-ups (modified if needed)

**Sample Beginner Workout**
1. Warm-up: 5 minutes walking
2. Squats: 10 reps x 3 sets
3. Push-ups: 5-10 reps x 3 sets
4. Lunges: 10 reps each leg x 2 sets
5. Plank: 20-30 seconds x 3
6. Cool-down: 5 minutes stretching

**Important Tips**
- Start slow and progress gradually
- Listen to your body
- Stay consistent
- Rest between workout days`,
    excerpt: 'Start your fitness journey with these easy-to-follow exercise routines designed for beginners.',
    category: 'fitness',
    tags: ['fitness', 'exercise', 'workout', 'beginners', 'health'],
    authorName: 'Dr. Vikram Singh',
    authorCredentials: 'Sports Medicine Specialist',
    readTime: 8,
    isPublished: true,
    publishedAt: new Date()
  },
  {
    title: 'Preventing Common Diseases',
    slug: generateSlug('Preventing Common Diseases'),
    content: `Prevention is better than cure. Here's how to protect yourself:

**Vaccination**
Stay up-to-date with recommended vaccines for your age group.

**Hand Hygiene**
Wash hands frequently with soap for at least 20 seconds.

**Healthy Lifestyle**
- Maintain a healthy weight
- Exercise regularly
- Eat nutritious foods
- Get adequate sleep

**Regular Screenings**
- Blood pressure checks
- Cholesterol tests
- Diabetes screening
- Cancer screenings as recommended

**Avoid Risk Factors**
- Don't smoke
- Limit alcohol
- Avoid processed foods
- Manage stress`,
    excerpt: 'Simple preventive measures to protect yourself from common illnesses and maintain good health.',
    category: 'prevention',
    tags: ['prevention', 'health tips', 'disease prevention', 'wellness'],
    authorName: 'Dr. Suresh Kumar',
    authorCredentials: 'MD, General Medicine',
    readTime: 5,
    isPublished: true,
    publishedAt: new Date()
  },
  {
    title: 'Stress Management Techniques',
    slug: generateSlug('Stress Management Techniques'),
    content: `Stress is a part of life, but managing it is essential. Here are effective techniques:

**Breathing Exercises**
- Deep breathing: Inhale for 4 counts, hold for 4, exhale for 4
- Practice for 5-10 minutes daily

**Physical Activity**
- Regular exercise releases endorphins
- Even a 10-minute walk can help

**Mindfulness and Meditation**
- Start with 5 minutes daily
- Use guided meditation apps
- Focus on the present moment

**Time Management**
- Prioritize tasks
- Learn to say no
- Take regular breaks

**Social Support**
- Talk to friends and family
- Join support groups
- Seek professional help if needed

**Healthy Habits**
- Get enough sleep
- Limit caffeine and alcohol
- Eat balanced meals`,
    excerpt: 'Effective techniques to manage stress and improve your quality of life.',
    category: 'lifestyle',
    tags: ['stress', 'mental health', 'relaxation', 'wellness', 'self-care'],
    authorName: 'Dr. Meera Reddy',
    authorCredentials: 'MD, Psychiatrist',
    readTime: 6,
    isPublished: true,
    publishedAt: new Date()
  }
];

async function seedArticles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment');
    console.log('Connected to MongoDB');

    // Clear existing articles
    await HealthArticle.deleteMany({});
    console.log('Cleared existing articles');

    // Insert new articles
    const result = await HealthArticle.insertMany(articles);
    console.log(`Inserted ${result.length} health articles`);

    console.log('\nArticles created:');
    result.forEach(article => {
      console.log(`- ${article.title} (${article.category})`);
    });

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedArticles();
