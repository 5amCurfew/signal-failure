import { LayoutAnimation, Platform, UIManager } from "react-native";

const severityOfLine = (line) => {
  const raw = Number(line?.lineStatuses?.[0]?.statusSeverity);
  return Number.isFinite(raw) ? raw : 10;
};

const getLineName = (line) => line?.name || line?.id || "";

const sortLinesByStatus = (lineList) => {
  return [...lineList].sort((a, b) => {
    const aSeverity = severityOfLine(a);
    const bSeverity = severityOfLine(b);
    const aDelayed = aSeverity < 10;
    const bDelayed = bSeverity < 10;

    if (aDelayed !== bDelayed) {
      return aDelayed ? -1 : 1;
    }

    if (aSeverity !== bSeverity) {
      return aSeverity - bSeverity;
    }

    return getLineName(a).localeCompare(getLineName(b));
  });
};

const shouldAnimateReorder = (prevLines = [], nextLines = []) => {
  if (!prevLines.length) {
    return false;
  }

  if (prevLines.length !== nextLines.length) {
    return true;
  }

  for (let i = 0; i < nextLines.length; i += 1) {
    if (prevLines[i]?.id !== nextLines[i]?.id) {
      return true;
    }

    if (severityOfLine(prevLines[i]) !== severityOfLine(nextLines[i])) {
      return true;
    }
  }

  return false;
};

export const enableCardReorderAnimation = () => {
  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
};

export const prepareAnimatedLineList = (prev, next) => {
  const safeNext = Array.isArray(next) ? next : [];
  const sortedNext = sortLinesByStatus(safeNext);
  if (shouldAnimateReorder(prev, sortedNext)) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }
  return sortedNext;
};
