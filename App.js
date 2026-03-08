import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import { Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { registerRootComponent } from "expo";

// Auth (Zeineb's)
import { supabase } from "./mobile-frontend/lib/supabase";
import { AuthProvider, useAuth } from "./mobile-frontend/context/AuthContext";
import SignIn from "./mobile-frontend/auth/SignIn";
import SignUp from "./mobile-frontend/auth/SignUp";
import OnBoardingGoal from "./mobile-frontend/screens/OnBoardingGoal";

// Navigation & Layout (Zeineb's)
import NavBar from "./mobile-frontend/components/NavBar";

// Shared Screens - use Zeineb's versions as base
import Profile from "./mobile-frontend/screens/Profile";
import Nutrition from "./mobile-frontend/screens/Nutrition";
import Training from "./mobile-frontend/screens/Training";
import Insights from "./mobile-frontend/screens/Insights";
import Home from "./mobile-frontend/screens/Home";
import ExerciseInfo from "./mobile-frontend/screens/ExerciseInfo";
import ExerciseCard from "./mobile-frontend/components/ExerciseCard";

// Nutrition & Sleep & Workout (Zeineb's)
import MealLogger from "./mobile-frontend/screens/nutrition/MealLogger";
import FoodDetail from "./mobile-frontend/screens/nutrition/FoodDetail";
import SleepLog from "./mobile-frontend/screens/sleep/SleepLog";
import WorkoutActive from "./mobile-frontend/screens/workout/WorkoutActive";
import WorkoutSummary from "./mobile-frontend/screens/workout/WorkoutSummary";

// Your unique screens & components
import FoodScannerScreen from "./src/components/food-scanner/FoodScannerScreen";
import PostureAI from "./src/screens/PostureAI";
import YaraAssistant from "./src/components/ai-assistant/YaraAssistant";
import AppTour, { resetTour } from "./src/components/tour/AppTour";

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

function Navigation({ userProfile }) {
  const { user, isNewUser, loading } = useAuth();

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6F4BF2" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Not logged in → auth screens
        <>
          <Stack.Screen name="SignIn" component={SignIn} />
          <Stack.Screen name="SignUp" component={SignUp} />
        </>
      ) : isNewUser ? (
        // Onboarding
        <Stack.Screen name="OnBoarding" component={OnBoardingGoal} />
      ) : (
        // Main app
        <>
          <Stack.Screen name="MainApp" component={NavBar} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="Nutrition" component={Nutrition} />
          <Stack.Screen name="Training" component={Training} />
          <Stack.Screen name="Insights" component={Insights} />
          <Stack.Screen name="MealLogger" component={MealLogger} />
          <Stack.Screen name="FoodDetail" component={FoodDetail} />
          <Stack.Screen name="SleepLog" component={SleepLog} />
          <Stack.Screen name="WorkoutActive" component={WorkoutActive} />
          <Stack.Screen name="WorkoutSummary" component={WorkoutSummary} />
          <Stack.Screen name="ExerciseCard" component={ExerciseCard} />
          <Stack.Screen name="ExerciseInfo" component={ExerciseInfo} />
          {/* Your unique screens */}
          <Stack.Screen name="PostureAI" component={PostureAI} />
          <Stack.Screen name="FoodScanner" component={FoodScannerScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [tourKey, setTourKey] = useState(0);
  const [activeTab, setActiveTab] = useState("Home");

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          "Outfit-Regular": Outfit_400Regular,
          "Outfit-Medium": Outfit_500Medium,
          "Outfit-SemiBold": Outfit_600SemiBold,
          "Outfit-Bold": Outfit_700Bold,
          "Inter-Regular": Inter_400Regular,
          "Inter-SemiBold": Inter_600SemiBold,
        });

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.log("Supabase connection error:", error.message);
        } else {
          console.log("Successfully connected to Supabase!");
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) return null;

  const replayTour = async () => {
    await resetTour();
    setTourKey((k) => k + 1);
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <View style={styles.container} onLayout={onLayoutRootView}>
          <StatusBar style="auto" />
          <NavigationContainer>
            <Navigation userProfile={userProfile} />
          </NavigationContainer>
          {/* Your unique floating components */}
          <YaraAssistant userProfile={userProfile} />
          <AppTour
            key={tourKey}
            activeTab={activeTab}
            onTabPress={setActiveTab}
          />
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0B1E",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
});

registerRootComponent(App);