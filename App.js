import { registerRootComponent } from 'expo';
import { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';

import AppTour, { resetTour } from './src/components/tour/AppTour';
import NavBar        from './src/components/navigation/NavBar';
import YaraAssistant from './src/components/ai-assistant/YaraAssistant';

import Home          from './src/screens/Home';
import Insights      from './src/screens/Insights';
import Nutrition     from './src/screens/Nutrition';
import PostureAI     from './src/screens/PostureAI';
import Profile       from './src/screens/Profile';
import Training      from './src/screens/Training';

import FoodScannerScreen from './src/components/food-scanner/FoodScannerScreen';
import MealLogger        from './src/screens/nutrition/MealLogger';
import OnboardingGoal    from './src/screens/onboarding/OnboardingGoal';
import SleepLog          from './src/screens/sleep/SleepLog';
import WorkoutActive     from './src/screens/workout/WorkoutActive';
import WorkoutSummary    from './src/screens/workout/WorkoutSummary';

export default function App() {
  const [onboarded,   setOnboarded]   = useState(false);
  const [tourKey,     setTourKey]     = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab,   setActiveTab]   = useState('Home');
  const [subScreen,   setSubScreen]   = useState(null);

  const navigate = (screen, props = {}) => setSubScreen({ screen, props });
  const goBack   = () => setSubScreen(null);

  if (!onboarded) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0B1E" />
        <OnboardingGoal onComplete={(profile) => {
          setUserProfile(profile);
          setOnboarded(true);
        }} />
      </View>
    );
  }

  if (subScreen) {
    const { screen, props } = subScreen;

    if (screen === 'WorkoutActive') return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" />
        <WorkoutActive
          workout={props.workout}
          onFinish={(result) => navigate('WorkoutSummary', {
            result, workoutName: props.workout?.name, workout: props.workout,
          })}
        />
      </View>
    );

    if (screen === 'WorkoutSummary') return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" />
        <WorkoutSummary
          result={props.result} workoutName={props.workoutName}
          onHome={goBack}
          onGoAgain={() => navigate('WorkoutActive', { workout: props.workout })}
        />
      </View>
    );

    if (screen === 'MealLogger') return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" />
        <MealLogger
          mealSlot={props.mealSlot}
          onSave={() => { props.onSaved?.(); goBack(); }}
          onClose={goBack}
        />
      </View>
    );

    if (screen === 'SleepLog') return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" />
        <SleepLog onSave={goBack} onClose={goBack} />
      </View>
    );

    if (screen === 'FoodScanner') return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" />
        <FoodScannerScreen
          currentCalories={props.currentCalories ?? 0}
          currentProtein={props.currentProtein   ?? 0}
          currentCarbs={props.currentCarbs       ?? 0}
          currentFat={props.currentFat           ?? 0}
          goalCalories={props.goalCalories       ?? 2000}
          goalProtein={props.goalProtein         ?? 150}
          goalCarbs={props.goalCarbs             ?? 250}
          goalFat={props.goalFat                 ?? 65}
          onLogged={() => { props.onLogged?.(); goBack(); }}
          onClose={goBack}
        />
      </View>
    );
  }

  const replayTour = async () => { await resetTour(); setTourKey(k => k + 1); };

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home':      return <Home      navigate={navigate} />;
      case 'Nutrition': return <Nutrition navigate={navigate} />;
      case 'PostureAI': return <PostureAI navigate={navigate} />;
      case 'Training':  return <Training  navigate={navigate} />;
      case 'Insights':  return <Insights  navigate={navigate} />;
      case 'Profile':   return <Profile   navigate={navigate} replayTour={replayTour} />;
      default:          return <Home      navigate={navigate} />;
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0B1E" />
      <View style={s.screen}>{renderScreen()}</View>
      <NavBar activeTab={activeTab} onTabPress={setActiveTab} />
      <YaraAssistant userProfile={userProfile} />
      <AppTour key={tourKey} activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0F0B1E' },
  screen: { flex: 1 },
});

registerRootComponent(App);