import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

import Home from '../screens/Home';
import Profile from '../screens/Profile';

const Tab = createBottomTabNavigator();

export default function NavBar() {
    return (
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: '#6F4BF2',
                    tabBarInactiveTintColor: 'gray',
                    tabBarStyle: {
                        borderTopWidth: 1,
                        borderTopColor: '#E0E0E0',
                        height: 60,
                        paddingBottom: 8,
                        paddingTop: 8,
                    },
                }}
            >
                <Tab.Screen
                    name="Home"
                    component={Home}
                    options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                    }}
                />

                <Tab.Screen
                    name="Profile"
                    component={Profile}
                    options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                    }}
                />

            </Tab.Navigator>
    )
}
