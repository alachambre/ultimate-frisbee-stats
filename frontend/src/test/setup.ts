import { afterEach, beforeAll, afterAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { setupServer } from "msw/node";
import { createElement, forwardRef } from "react";
import { handlers, resetMockData } from "./mocks/handlers";
import i18n from "../locales";

type MockChartDataset = {
  data?: unknown[];
  label?: string;
  pointBackgroundColor?: unknown;
  pointBorderColor?: unknown;
  pointBorderWidth?: unknown;
  pointRadius?: unknown;
  pointStyle?: unknown;
};

type MockTooltipItem = {
  dataIndex: number;
  dataset: MockChartDataset;
  datasetIndex: number;
  parsed: {
    x: number;
    y: number;
  };
};

type MockChartOptions = {
  plugins?: {
    tooltip?: {
      callbacks?: {
        afterLabel?: (item: MockTooltipItem) => unknown;
        label?: (item: MockTooltipItem) => unknown;
        title?: (items: MockTooltipItem[]) => unknown;
      };
    };
  };
};

function serializeChartDatasets(props: Record<string, unknown>) {
  const data = props.data as { datasets?: MockChartDataset[] } | undefined;

  return JSON.stringify(
    (data?.datasets ?? []).map((dataset) => ({
      dataCount: dataset.data?.length ?? 0,
      label: dataset.label ?? "",
      pointBackgroundColor: dataset.pointBackgroundColor,
      pointBorderColor: dataset.pointBorderColor,
      pointBorderWidth: dataset.pointBorderWidth,
      pointRadius: dataset.pointRadius,
      pointStyle: dataset.pointStyle,
    })),
  );
}

function getMockTooltipItem(
  dataset: MockChartDataset,
  datasetIndex: number,
): MockTooltipItem {
  const dataIndex = Math.max(0, (dataset.data?.length ?? 1) - 1);
  const rawValue = dataset.data?.[dataIndex];
  const parsed =
    typeof rawValue === "object" && rawValue !== null
      ? {
          x:
            typeof (rawValue as { x?: unknown }).x === "number"
              ? (rawValue as { x: number }).x
              : dataIndex,
          y:
            typeof (rawValue as { y?: unknown }).y === "number"
              ? (rawValue as { y: number }).y
              : 0,
        }
      : {
          x: dataIndex,
          y: typeof rawValue === "number" ? rawValue : 0,
        };

  return {
    dataIndex,
    dataset,
    datasetIndex,
    parsed,
  };
}

function serializeChartTooltipItems(props: Record<string, unknown>) {
  const data = props.data as { datasets?: MockChartDataset[] } | undefined;
  const options = props.options as MockChartOptions | undefined;
  const callbacks = options?.plugins?.tooltip?.callbacks;

  if (!callbacks?.label) {
    return "[]";
  }

  try {
    return JSON.stringify(
      (data?.datasets ?? []).slice(0, 2).map((dataset, datasetIndex) => {
        const item = getMockTooltipItem(dataset, datasetIndex);

        return {
          afterLabel: callbacks.afterLabel?.(item),
          label: callbacks.label?.(item),
          title: callbacks.title?.([item]),
        };
      }),
    );
  } catch {
    return "[]";
  }
}

vi.mock("react-chartjs-2", () => ({
  Chart: forwardRef(function MockChart(props: Record<string, unknown>, ref) {
    void ref;

    return createElement("div", {
      "data-testid": "chartjs-chart",
      "data-chart-type": props.type,
      "data-chart-datasets": serializeChartDatasets(props),
      "data-chart-tooltip-items": serializeChartTooltipItems(props),
      role: props.role ?? "img",
      "aria-label": props["aria-label"] ?? "Chart preview",
    });
  }),
  Line: forwardRef(function MockLine(props: Record<string, unknown>, ref) {
    void ref;

    return createElement("div", {
      "data-testid": "chartjs-line",
      "data-chart-datasets": serializeChartDatasets(props),
      "data-chart-tooltip-items": serializeChartTooltipItems(props),
      role: "img",
      "aria-label": "Chart preview",
    });
  }),
}));

// Set up MSW server
const server = setupServer(...handlers);

// Export server for use in tests that need to override handlers
export { server };

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });

  // Initialize i18n for tests
  if (!i18n.isInitialized) {
    i18n.init({
      lng: 'en',
      fallbackLng: 'en',
      defaultNS: 'common',
      react: { useSuspense: false },
    });
  } else {
    // If already initialized, change to English
    i18n.changeLanguage('en');
  }
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockData();
});

// Stop server after all tests
afterAll(() => {
  server.close();
});
