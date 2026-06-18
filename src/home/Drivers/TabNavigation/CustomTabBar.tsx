import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Platform } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width: W } = Dimensions.get("window");

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const H = 72;                 // bar height
    const sidePad = 18;           // left/right padding
    const barW = W - sidePad * 2; // pill width
    const notchR = 40;            // notch radius
    const fabR = 32;              // fab button radius (icon circle)
    const notchDepth = 30;        // notch deepness
    const cx = barW / 2;          // center x

    const d = `
    M 20 0
    H ${cx - notchR - 18}
    C ${cx - notchR - 6} 0, ${cx - notchR - 6} ${notchDepth}, ${cx - 8} ${notchDepth}
    C ${cx - 2} ${notchDepth}, ${cx - 2} ${notchDepth}, ${cx} ${notchDepth}
    C ${cx + 2} ${notchDepth}, ${cx + 2} ${notchDepth}, ${cx + 8} ${notchDepth}
    C ${cx + notchR + 6} ${notchDepth}, ${cx + notchR + 6} 0, ${cx + notchR + 18} 0
    H ${barW - 20}
    C ${barW - 9} 0, ${barW} 9, ${barW} 20
    V ${H - 20}
    C ${barW} ${H - 9}, ${barW - 9} ${H}, ${barW - 20} ${H}
    H 20
    C 9 ${H}, 0 ${H - 9}, 0 ${H - 20}
    V 20
    C 0 9, 9 0, 20 0
    Z
  `;

    return (
        <View style={styles.wrapper} pointerEvents="box-none">
            <View style={[styles.shadowWrap, { width: barW, height: H }]}>
                {/* SVG Background (pill + notch) */}
                <Svg width={barW} height={H} style={StyleSheet.absoluteFill}>
                    <Path d={d} fill="#FFFFFF" />
                </Svg>

                {/* Tabs Row */}
                <View style={[styles.row, { width: barW, height: H }]}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const focused = state.index === index;

                        // Middle route = Truck (floating button)
                        if (route.name === "Truck") {
                            return (
                                <View key={route.key} style={{ width: 90, alignItems: "center" }}>
                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={() => navigation.navigate(route.name)}
                                        style={styles.fabOuter}
                                    >
                                        <View style={[styles.fab, { width: fabR * 2, height: fabR * 2, borderRadius: fabR }]}>
                                            <MaterialCommunityIcons name="dump-truck" size={28} color="#fff" />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            );
                        }

                        const onPress = () => {
                            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                        };

                        let label = route.name;
                        let icon: any = "home-outline";
                        if (route.name === "HomeTab") { label = "HOME"; icon = focused ? "home" : "home-outline"; }
                        if (route.name === "CartTab") { label = "JOBS"; icon = focused ? "briefcase" : "briefcase-outline"; }
                        if (route.name === "MenuTab") { label = "ACTIVITY"; icon = focused ? "notifications" : "notifications-outline"; }
                        if (route.name === "ProfileTab") { label = "PROFILE"; icon = focused ? "person" : "person-outline"; }

                        return (
                            <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.8} style={styles.tabBtn}>
                                <Ionicons size={22} name={icon} color={focused ? "#49B44A" : "#9CA3AF"} />
                                <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 10,
        alignItems: "center",
    },
    shadowWrap: {
        borderRadius: 24,
        overflow: Platform.OS === "android" ? "hidden" : "visible",
        shadowColor: "#000",
        shadowOpacity: 0.10,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 18,
        backgroundColor: "transparent",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
    },
    tabBtn: {
        width: 70,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },
    label: {
        fontSize: 11,
        letterSpacing: 0.4,
        color: "#9CA3AF",
        fontWeight: "600",
    },
    labelActive: {
        color: "#49B44A",
    },
    fabOuter: {
        top: -26, // notch এর উপর উঠিয়ে দিল
        alignItems: "center",
        justifyContent: "center",
    },
    fab: {
        backgroundColor: "#49B44A",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 8,
        borderColor: "#FFFFFF",
        shadowColor: "#49B44A",
        shadowOpacity: 0.35,   // glow vibe
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 22,
    },
});
