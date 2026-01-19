import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  FlatList,
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
  const severity = statusInfo.statusSeverity ?? 0;
  const severityDescription = statusInfo.statusSeverityDescription ?? "Unknown";
  const reason = statusInfo.reason?.trim();
  const hasDelay = severity < 9;
  const chipLabel = hasDelay
    ? `⚠️ ${severityDescription}`
    : severityDescription;
  const reasonText = hasDelay && reason ? `⚠️ ${reason}` : reason;

  const chipStyle = [
    styles.statusChip,
    severity >= 9
      ? styles.statusChipGood
      : severity >= 7
        ? styles.statusChipMinor
        : styles.statusChipSevere,
  ];

  const translateY = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  return (
    <Animated.View
      style={[styles.card, { opacity: fadeAnim, transform: [{ translateY }] }]}
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
