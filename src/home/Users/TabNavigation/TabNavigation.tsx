import { IPA_BASE } from "@env";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AuthStackParamList } from "../../../Navigation/type";
import { socketService } from "../services/socket.service";
import Home from "../screens/UserHome/Home";
import Alert from "./Alert";
import Jobs from "./Jobs";
import UserProfile from "./UserProfile";

const Tab = createBottomTabNavigator();

function CenterButton({ children, onPress }: any) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.fabContainer}>
            <View style={styles.fabButton}>{children}</View>
        </TouchableOpacity>
    );
}

export default function UserMainTabs() {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const [badgeCount, setBadgeCount] = useState(0)

    useEffect(() => {
        // Fetch initial unread count
        AsyncStorage.getItem('vToken').then((token) => {
            if (!token) return
            axios.get(`${IPA_BASE}/user/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { limit: 50 },
                timeout: 8000,
            }).then((res) => {
                const notifs: any[] = res.data?.data?.notifications ?? []
                setBadgeCount(notifs.filter((n: any) => !n.isRead).length)
            }).catch(() => {})
        })

        // Increment badge when a new notification arrives via socket
        const handleNew = () => setBadgeCount((prev) => prev + 1)
        socketService.connect().then(() => socketService.onNotification(handleNew))
        return () => socketService.offNotification(handleNew)
    }, [])

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
            }}
        >

            <Tab.Screen
                name="Home"
                component={Home}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.tabItem}>
                            <Ionicons
                                name={focused ? "home" : "home-outline"}
                                size={22}
                                color={focused ? "#4CAF50" : "#9CA3AF"}
                            />
                            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                                Home
                            </Text>
                        </View>
                    ),
                }}
            />


            <Tab.Screen
                name="Jobs"
                component={Jobs}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.tabItem}>
                            <FontAwesome5 name="clipboard-list"
                                size={22}
                                color={focused ? "#4CAF50" : "#9CA3AF"}
                            />
                            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                                Jobs
                            </Text>
                        </View>
                    ),
                }}
            />


            <Tab.Screen
                name="Truck"
                component={Home}
                listeners={{
                    tabPress: (e) => {
                        e.preventDefault()
                        navigation.navigate('UserLiveTracking', {})
                    },
                }}
                options={{
                    tabBarIcon: () => (
                        <MaterialCommunityIcons name="dump-truck" size={32} color="white" />
                    ),
                    tabBarButton: (props) => <CenterButton {...props} />,
                }}
            />

            {/* Menu Tab */}
            <Tab.Screen
                name="Alerts"
                component={Alert}
                listeners={{ tabPress: () => setBadgeCount(0) }}
                options={{
                    tabBarBadge: badgeCount > 0 ? badgeCount : undefined,
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.tabItem}>
                            <Ionicons
                                name={focused ? "notifications" : "notifications-outline"}
                                size={24}
                                color={focused ? "#4CAF50" : "#9CA3AF"}
                            />
                            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                                Alerts
                            </Text>
                        </View>
                    ),
                }}
            />

            {/* Profile Tab */}
            <Tab.Screen
                name="Profile"
                component={UserProfile}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.tabItem}>
                            <Ionicons
                                name={focused ? "person" : "person-outline"}
                                size={22}
                                color={focused ? "#4CAF50" : "#9CA3AF"}
                            />
                            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                                Profile
                            </Text>
                        </View>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    // Tab Bar Container
    tabBar: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 80,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 0,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 20 : 40,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 20,

    },

    // Tab Item
    tabItem: {
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        minWidth: 60,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: "500",
        color: "#9CA3AF",
        marginTop: 2,
    },
    tabLabelActive: {
        color: "#4CAF50",
        fontWeight: "600",
    },

    // Center FAB Button
    fabContainer: {
        top: -22,
        alignItems: "center",
        justifyContent: "center",
    },
    fabButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#4CAF50",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#FFFFFF",
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 20,
        borderWidth: 8,
        borderColor: "#FFFFFF",
    },
});