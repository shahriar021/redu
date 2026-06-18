import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export type JobStatus = "pending" | "active" | "completed";

export type JobCardData = {
    id: string;
    jobId: string;
    vehicleType: string;
    status: JobStatus;
    pickupAddress: string;
    dropAddress: string;
    distance: number;   // km/mi as number
    duration: number;   // minutes as number
    fare: number;
    scheduleDate?: string;
    scheduleTime?: string;
    workNotes?: string;
    customerEmail?: string;
    // completed extras
    rating?: number;
    completionDate?: string;
    totalEarnings?: string;
};

type Props = {
    job: JobCardData;
    onPress: (job: JobCardData) => void;
    /** Override the primary button label */
    primaryLabel?: string;
    /** Hide the action button entirely */
    hideButton?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig: Record<JobStatus, { label: string; color: string }> = {
    pending: { label: "PENDING", color: "#3B82F6" },
    active: { label: "DISPATCHED", color: "#F59E0B" },
    completed: { label: "PAID", color: "#10B981" },
};

const formatDistance = (d: number) => `${d.toFixed(1)} mi`;

const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const renderStars = (rating: number) => {
    return (
        <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Text key={i} style={styles.star}>
                    {i <= Math.floor(rating) ? "⭐" : "☆"}
                </Text>
            ))}
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────

const JobCard: React.FC<Props> = ({ job, onPress, primaryLabel, hideButton = false }) => {
    const { label, color } = statusConfig[job.status] ?? statusConfig.pending;

    const btnLabel =
        primaryLabel ??
        (job.status === "completed" ? "ACCEPT JOB" : "ACCEPT JOB");

    return (
        <TouchableOpacity
            activeOpacity={0.82}
            style={styles.card}
            onPress={() => onPress(job)}
        >
            {/* ── Header ── */}
            <View style={styles.cardHeader}>
                <Text style={styles.jobId}>{job.jobId}</Text>
                <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.statusBadge, { color }]}>{label}</Text>
                    {job.status === "completed" && job.totalEarnings && (
                        <Text style={styles.headerEarnings}>{job.totalEarnings}</Text>
                    )}
                </View>
            </View>

            {/* ── Star Rating (completed) ── */}
            {job.status === "completed" && job.rating != null && (
                <View style={styles.ratingContainer}>
                    {renderStars(job.rating)}
                </View>
            )}

            {/* ── Info Pills ── */}
            <View style={styles.infoRow}>
                <View style={styles.infoPill}>
                    <Text style={styles.pillLabel}>Customer</Text>
                    <Text style={styles.pillValue} numberOfLines={1}>
                        {job.customerEmail ?? "—"}
                    </Text>
                </View>
                <View style={styles.infoPill}>
                    <Text style={styles.pillLabel}>Vehicle</Text>
                    <Text style={styles.pillValue}>{job.vehicleType}</Text>
                </View>
            </View>

            {/* ── Pickup ── */}
            <View style={styles.locationRow}>
                <Ionicons name="location" size={18} color="#F59E0B" style={styles.locIcon} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.locLabel}>PICKUP LOCATION</Text>
                    <Text style={styles.locText}>{job.pickupAddress}</Text>
                </View>
            </View>

            {/* ── Drop-off ── */}
            <View style={styles.locationRow}>
                <Ionicons name="location" size={18} color="#10B981" style={styles.locIcon} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.locLabel}>DROP-OFF LOCATION</Text>
                    <Text style={styles.locText}>{job.dropAddress}</Text>
                </View>
            </View>

            {/* ── Meta Row ── */}
            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Ionicons name="navigate" size={15} color="#9CA3AF" />
                    <Text style={styles.metaLabel}>Distance</Text>
                    <Text style={styles.metaValue}>{formatDistance(job.distance)}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="time" size={15} color="#9CA3AF" />
                    <Text style={styles.metaLabel}>Est. Time</Text>
                    <Text style={styles.metaValue}>{formatDuration(job.duration)}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="cash-outline" size={15} color="#9CA3AF" />
                    <Text style={styles.metaLabel}>Fare</Text>
                    <Text style={styles.metaValue}>${job.fare}</Text>
                </View>
            </View>

            {/* ── Schedule + Notes (pending/active) ── */}
            {(job.scheduleDate || job.workNotes) && job.status !== "completed" && (
                <View style={styles.scheduleBox}>
                    {job.scheduleDate && (
                        <View style={styles.scheduleRow}>
                            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                            <Text style={styles.scheduleText}>
                                {new Date(job.scheduleDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })}{" "}
                                {job.scheduleTime ? `• ${job.scheduleTime}` : ""}
                            </Text>
                        </View>
                    )}
                    {job.workNotes && (
                        <View style={styles.scheduleRow}>
                            <Ionicons name="document-text-outline" size={14} color="#6B7280" />
                            <Text style={styles.scheduleText} numberOfLines={2}>
                                {job.workNotes}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* ── Completion Date (completed) ── */}
            {job.status === "completed" && job.completionDate && (
                <View style={styles.completionRow}>
                    <Ionicons name="calendar" size={14} color="#9CA3AF" />
                    <View style={{ marginLeft: 8 }}>
                        <Text style={styles.completionLabel}>Completion Date</Text>
                        <Text style={styles.completionText}>{job.completionDate}</Text>
                    </View>
                </View>
            )}

            {/* ── Total Earnings (completed) ── */}
            {job.status === "completed" && job.totalEarnings && (
                <View style={styles.earningsRow}>
                    <Text style={styles.earningsLabel}>TOTAL Earnings</Text>
                    <Text style={styles.earningsValue}>{job.totalEarnings}</Text>
                </View>
            )}

            {/* ── Action Button ── */}
            {!hideButton && (
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.btnFull}
                    onPress={() => onPress(job)}
                >
                    <Text style={styles.btnText}>{btnLabel}</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

export default JobCard;

// ─── Styles ───────────────────────────────────────────────────────────────────

const GREEN = "#43B047";
const BORDER = "#E5E7EB";
const TEXT_GRAY = "#9CA3AF";

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 8 },
            },
            android: { elevation: 2 },
        }),
    },

    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    jobId: { fontSize: 13, fontWeight: "700", color: "#6B7280" },
    statusBadge: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
    headerEarnings: { fontSize: 18, fontWeight: "800", color: "#111827", marginTop: 4 },

    ratingContainer: { marginBottom: 10 },
    starsRow: { flexDirection: "row", alignItems: "center", gap: 2 },
    star: { fontSize: 12 },
    ratingText: { fontSize: 12, fontWeight: "700", color: "#111827", marginLeft: 6 },

    infoRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
    infoPill: {
        flex: 1,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    pillLabel: { fontSize: 11, fontWeight: "600", color: TEXT_GRAY, marginBottom: 2 },
    pillValue: { fontSize: 13, fontWeight: "700", color: "#111827" },

    locationRow: { flexDirection: "row", marginBottom: 10, alignItems: "flex-start" },
    locIcon: { marginRight: 10, marginTop: 2 },
    locLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: "#6B7280",
        letterSpacing: 0.3,
        marginBottom: 2,
    },
    locText: { fontSize: 13, fontWeight: "600", color: "#111827", lineHeight: 18 },

    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 10,
        marginVertical: 12,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    metaItem: { alignItems: "center", gap: 3 },
    metaLabel: { fontSize: 10, fontWeight: "600", color: TEXT_GRAY },
    metaValue: { fontSize: 12, fontWeight: "700", color: "#111827" },

    scheduleBox: {
        backgroundColor: "#F9FAFB",
        borderRadius: 10,
        padding: 10,
        gap: 6,
        marginBottom: 10,
    },
    scheduleRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
    scheduleText: { fontSize: 12, fontWeight: "600", color: "#374151", flex: 1 },

    completionRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 8,
    },
    completionLabel: { fontSize: 10, fontWeight: "600", color: TEXT_GRAY },
    completionText: { fontSize: 12, fontWeight: "700", color: "#111827", marginTop: 2 },

    earningsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        marginBottom: 4,
    },
    earningsLabel: { fontSize: 11, fontWeight: "700", color: "#6B7280", letterSpacing: 0.3 },
    earningsValue: { fontSize: 18, fontWeight: "800", color: "#111827" },

    btnFull: {
        width: "100%",
        height: 46,
        borderRadius: 12,
        backgroundColor: GREEN,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 14,
    },
    btnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", letterSpacing: 0.4 },
});