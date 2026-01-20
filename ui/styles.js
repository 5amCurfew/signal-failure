import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
    backgroundColor: "#f7fafc",
    alignItems: "center",
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 520,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  timestamp: {
    fontSize: 14,
    color: "#4b5563",
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeSuccess: {
    backgroundColor: "#bbf7d0",
  },
  badgeWarning: {
    backgroundColor: "#fde68a",
  },
  badgeText: {
    fontWeight: "600",
    color: "#1f2937",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  error: {
    color: "#dc2626",
    marginBottom: 12,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  placeholderText: {
    marginTop: 12,
    color: "#4b5563",
  },
  list: {
    width: "100%",
  },
  listContent: {
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderTopWidth: 6,
    borderTopColor: "#0ea5e9",
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  cardDetail: {
    color: "#1f2937",
    fontSize: 14,
    marginBottom: 8,
  },
  cardMeta: {
    marginTop: 6,
    fontSize: 13,
    color: "#6b7280",
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusChipGood: {
    backgroundColor: "#dcfce7",
  },
  statusChipMinor: {
    backgroundColor: "#fbbf24",
  },
  statusChipModerate: {
    backgroundColor: "#fdba74",
  },
  statusChipSevere: {
    backgroundColor: "#fca5a5",
  },
  statusChipVerySevere: {
    backgroundColor: "#f87171",
  },
  statusChipClosed: {
    backgroundColor: "#fecdd3",
  },
  statusChipSpecial: {
    backgroundColor: "#ddd6fe",
  },
  statusChipInfo: {
    backgroundColor: "#bae6fd",
  },
  chipText: {
    fontWeight: "700",
    color: "#111827",
    fontSize: 14,
  },
});

export default styles;
