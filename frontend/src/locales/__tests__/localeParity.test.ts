import { describe, expect, it } from "vitest";

type LocaleJson = Record<string, unknown>;

function flattenKeys(data: LocaleJson, prefix = ""): string[] {
  return Object.entries(data).flatMap(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return flattenKeys(value as LocaleJson, nextKey);
    }
    return [nextKey];
  });
}

function unwrapLocaleModule(moduleValue: unknown): LocaleJson {
  if (
    moduleValue &&
    typeof moduleValue === "object" &&
    "default" in moduleValue
  ) {
    return (moduleValue as { default: LocaleJson }).default;
  }

  return moduleValue as LocaleJson;
}

function collectLocaleModules(
  modules: Record<string, unknown>
): Map<string, LocaleJson> {
  const localesByFile = new Map<string, LocaleJson>();

  Object.entries(modules).forEach(([modulePath, moduleValue]) => {
    const fileName = modulePath.split("/").at(-1);
    if (!fileName) {
      return;
    }

    localesByFile.set(fileName, unwrapLocaleModule(moduleValue));
  });

  return localesByFile;
}

const enLocalesByFile = collectLocaleModules(
  import.meta.glob("../en/*.json", { eager: true })
);
const frLocalesByFile = collectLocaleModules(
  import.meta.glob("../fr/*.json", { eager: true })
);
const localeFiles = [...enLocalesByFile.keys()].sort();

describe("locale parity", () => {
  it("keeps EN and FR locale files aligned", () => {
    const frFiles = [...frLocalesByFile.keys()].sort();
    expect(frFiles).toEqual(localeFiles);
  });

  localeFiles.forEach((file) => {
    it(`keeps FR keys aligned with EN for ${file}`, () => {
      const enLocale = enLocalesByFile.get(file) as LocaleJson;
      const frLocale = frLocalesByFile.get(file) as LocaleJson;

      const enKeys = flattenKeys(enLocale);
      const frKeys = flattenKeys(frLocale);

      const missingInFr = enKeys.filter((key) => !frKeys.includes(key));
      const extraInFr = frKeys.filter((key) => !enKeys.includes(key));

      expect(missingInFr).toEqual([]);
      expect(extraInFr).toEqual([]);
    });
  });
});
