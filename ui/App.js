import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import EventSource from "react-native-event-source";

import {
  enableCardReorderAnimation,
  prepareAnimatedLineList,
} from "./lineAnimation";
import styles from "./styles";

const normalizeLineKey = (value = "") =>
  value.toLowerCase().replace(/[^a-z]/g, "");

// TfL brand colors for each line so cards visually match their routes.
const LINE_COLORS = {
  bakerloo: "#B36305",
  central: "#E32017",
  circle: "#FFD300",
  district: "#00782A",
  hammersmithcity: "#F4A9BE",
  jubilee: "#A0A5A9",
  metropolitan: "#9B0056",
  northern: "#000000",
  piccadilly: "#003688",
  victoria: "#0098D4",
  waterloocity: "#95CDBA",
  dlr: "#00A4A7",
  londonoverground: "#EE7C0E",
  elizabethline: "#6950A1",
  tram: "#84B817",
  cablecar: "#E21836",
};

const SEVERITY_CONFIG = {
  0: { emoji: "✨", styleKey: "statusChipSpecial", flagReason: true },
  1: { emoji: "🛑", styleKey: "statusChipClosed", flagReason: true },
  2: { emoji: "🛑", styleKey: "statusChipClosed", flagReason: true },
  3: { emoji: "⛔️", styleKey: "statusChipVerySevere", flagReason: true },
  4: { emoji: "⛔️", styleKey: "statusChipVerySevere", flagReason: true },
  5: { emoji: "⛔️", styleKey: "statusChipSevere", flagReason: true },
  6: { emoji: "🚨", styleKey: "statusChipSevere", flagReason: true },
  7: { emoji: "🟠", styleKey: "statusChipModerate", flagReason: true },
  8: { emoji: "🚌", styleKey: "statusChipModerate", flagReason: true },
  9: { emoji: "⚠️", styleKey: "statusChipMinor", flagReason: true },
  10: { emoji: "✅", styleKey: "statusChipGood", flagReason: false },
  11: { emoji: "⛔️", styleKey: "statusChipVerySevere", flagReason: true },
  12: { emoji: "🚪", styleKey: "statusChipSpecial", flagReason: true },
  13: { emoji: "♿️", styleKey: "statusChipInfo", flagReason: true },
  14: { emoji: "🔁", styleKey: "statusChipModerate", flagReason: true },
  15: { emoji: "↗️", styleKey: "statusChipInfo", flagReason: true },
  16: { emoji: "🛑", styleKey: "statusChipClosed", flagReason: true },
  17: { emoji: "ℹ️", styleKey: "statusChipInfo", flagReason: true },
  18: { emoji: "✅", styleKey: "statusChipGood", flagReason: false },
  19: { emoji: "ℹ️", styleKey: "statusChipInfo", flagReason: true },
  20: { emoji: "🛑", styleKey: "statusChipClosed", flagReason: true },
};

// Custom web scrollbar so the feed frame feels branded.
const SCROLLBAR_STYLE = `
  body {
    scrollbar-width: thin;
    scrollbar-color: rgba(30, 41, 59, 0.35) transparent;
  }

  body::-webkit-scrollbar {
    width: 8px;
    background: transparent;
  }

  body::-webkit-scrollbar-track {
    background: transparent;
  }

  body::-webkit-scrollbar-thumb {
    background: rgba(30, 41, 59, 0.35);
    border-radius: 999px;
    border: 2px solid transparent;
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.4);
  }

  body::-webkit-scrollbar-thumb:hover {
    background: rgba(30, 64, 175, 0.55);
  }
`;

const getLineColor = (line) => {
  const idKey = normalizeLineKey(line?.id ?? "");
  const nameKey = normalizeLineKey(line?.name ?? "");
  return LINE_COLORS[idKey] || LINE_COLORS[nameKey] || "#0ea5e9";
};

const DEFAULT_SEVERITY = {
  emoji: "✅",
  styleKey: "statusChipGood",
  flagReason: false,
};

const getSeverityPresentation = (severity = 0) => {
  if (typeof severity === "number" && severity in SEVERITY_CONFIG) {
    return SEVERITY_CONFIG[severity];
  }
  return DEFAULT_SEVERITY;
};

const attachWebScrollbarStyles = () => {
  if (typeof document === "undefined") {
    return () => {};
  }

  const existing = document.getElementById("tube-scrollbar-theme");
  if (existing) {
    existing.textContent = SCROLLBAR_STYLE;
    return () => {};
  }

  const styleElement = document.createElement("style");
  styleElement.id = "tube-scrollbar-theme";
  styleElement.textContent = SCROLLBAR_STYLE;
  document.head.appendChild(styleElement);

  return () => {
    styleElement.remove();
  };
};

const getBaseUrl = () => {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
};

const SSE_URL = `${getBaseUrl()}/events`;

const normalizeLines = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload?.lines && Array.isArray(payload.lines)) {
    return payload.lines;
  }
  return [];
};

export default function App() {
  const [lines, setLines] = useState([]);
  const [status, setStatus] = useState("connecting");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastPulse, setLastPulse] = useState(null);

  useEffect(() => {
    enableCardReorderAnimation();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return undefined;
    }
    return attachWebScrollbarStyles();
  }, []);

  useEffect(() => {
    // Open a single SSE connection and progressively hydrate the feed with new payloads
    setStatus("connecting");
    const source = new EventSource(SSE_URL);

    const handleOpen = () => {
      setStatus("open");
      setErrorMessage("");
    };

    const handleMessage = (event) => {
      try {
        const envelope = JSON.parse(event.data);
        let upstreamPayload = envelope.Data;
        if (
          typeof upstreamPayload === "string" &&
          upstreamPayload.trim().length > 0
        ) {
          upstreamPayload = JSON.parse(upstreamPayload);
        }
        const nextLines = normalizeLines(upstreamPayload);

        setLines((prev) => prepareAnimatedLineList(prev, nextLines));
        setLastPulse(
          envelope.ReceivedAt ? new Date(envelope.ReceivedAt) : new Date(),
        );
        setErrorMessage("");
      } catch (err) {
        setErrorMessage(`Unable to parse event payload: ${err}`);
      }
    };

    const handleError = (event) => {
      setStatus("error");
    };

    source.addEventListener("open", handleOpen);
    source.addEventListener("message", handleMessage);
    source.addEventListener("error", handleError);

    return () => {
      source.removeEventListener("open", handleOpen);
      source.removeEventListener("message", handleMessage);
      source.removeEventListener("error", handleError);
      source.close();
    };
  }, []);

  const lastPulseLabel = useMemo(() => {
    if (!lastPulse) {
      return "Waiting for first Pulse";
    }
    return lastPulse.toLocaleString();
  }, [lastPulse]);

  const renderLine = ({ item, index }) => (
    <LineCard line={item} delay={Math.min(index * 80, 400)} />
  );

  const connectionLabel = useMemo(() => {
    if (status === "open") {
      return "Connected";
    }
    if (status === "connecting") {
      return "Connecting";
    }
    return "Reconnecting";
  }, [status]);

  const badgeStyle = useMemo(() => {
    if (status === "open") {
      return [styles.badge, styles.badgeSuccess];
    }
    return [styles.badge, styles.badgeWarning];
  }, [status]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Tube Status</Text>
            <Text style={styles.timestamp}>Last Pulse: {lastPulseLabel}</Text>
          </View>
          <View style={badgeStyle}>
            <Text style={styles.badgeText}>{connectionLabel}</Text>
          </View>
        </View>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        {lines.length === 0 ? (
          <View style={styles.placeholder}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.placeholderText}>
              Waiting for status updates...
            </Text>
          </View>
        ) : (
          <FlatList
            data={lines}
            keyExtractor={(item) => `${item.id}`}
            renderItem={renderLine}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const LineCard = React.memo(({ line, delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      delay,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, delay]);

  const statusInfo = line.lineStatuses?.[0] ?? {};
  const rawSeverity = Number(statusInfo.statusSeverity);
  const severity = Number.isFinite(rawSeverity) ? rawSeverity : 0;
  const severityDescription = statusInfo.statusSeverityDescription ?? "Unknown";
  const reason = statusInfo.reason?.trim();
  const severityPresentation = getSeverityPresentation(severity);
  const chipEmoji = severityPresentation.emoji ?? "";
  const chipLabel = chipEmoji
    ? `${chipEmoji} ${severityDescription}`
    : severityDescription;
  const reasonText =
    reason && severityPresentation.flagReason
      ? `${chipEmoji ? `${chipEmoji} ` : ""}${reason}`
      : reason;
  const lineColor = getLineColor(line);

  const chipStyle = [
    styles.statusChip,
    styles[severityPresentation.styleKey] ?? styles.statusChipGood,
  ];

  const translateY = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          borderTopColor: lineColor,
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{line.name}</Text>
        <View style={chipStyle}>
          <Text style={styles.chipText}>{chipLabel}</Text>
        </View>
      </View>
      {reasonText ? <Text style={styles.cardDetail}>{reasonText}</Text> : null}
      <Text style={styles.cardMeta}>Mode: {line.modeName}</Text>
    </Animated.View>
  );
});
