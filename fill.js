const fs = require('fs');
const path = require('path');

const files = [
    'src/components/tour/AppTour.js',
    'src/components/navigation/NavBar.js',
    'src/components/ai-assistant/YaraAssistant.js',
    'src/screens/Home.js',
    'src/screens/Nutrition.js',
    'src/screens/PostureAI.js',
    'src/screens/Training.js',
    'src/screens/Insights.js',
    'src/screens/Profile.js',
    'src/screens/onboarding/OnboardingGoal.js',
    'src/screens/nutrition/MealLogger.js',
    'src/screens/workout/WorkoutActive.js',
    'src/screens/workout/WorkoutSummary.js',
    'src/screens/sleep/SleepLog.js'
];

const filled = [];

for (const f of files) {
    const p = path.join(__dirname, f);
    if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8').trim() === '') {
        fs.mkdirSync(path.dirname(p), { recursive: true });

        // Default mock component
        let content = "import { View, Text } from 'react-native';\n\nexport default function MockComp() { return <View><Text>Mock " + f + "</Text></View>; }";

        if (f === 'src/components/tour/AppTour.js') {
            content = "export const resetTour = async () => {};\n" + content;
        }

        fs.writeFileSync(p, content);
        filled.push(f);
    }
}

console.log('Filled missing files:', filled.length);
