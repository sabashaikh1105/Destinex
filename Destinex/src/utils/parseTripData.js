export function tryParseTripData(raw) {
  if (raw == null) return null;
  if (typeof raw !== "string") return raw;

  const trimmed = raw.trim().replace(/^\uFEFF/, "");
  if (!trimmed) return null;

  const stripCodeFences = (text) =>
    text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

  const tryJsonParse = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const unwrapped = stripCodeFences(trimmed);
  const direct = tryJsonParse(unwrapped);
  if (direct) return direct;

  const firstObj = unwrapped.indexOf("{");
  const lastObj = unwrapped.lastIndexOf("}");
  if (firstObj !== -1 && lastObj !== -1 && lastObj > firstObj) {
    const sliced = unwrapped.slice(firstObj, lastObj + 1);
    const parsed = tryJsonParse(sliced);
    if (parsed) return parsed;
  }

  const firstArr = unwrapped.indexOf("[");
  const lastArr = unwrapped.lastIndexOf("]");
  if (firstArr !== -1 && lastArr !== -1 && lastArr > firstArr) {
    const sliced = unwrapped.slice(firstArr, lastArr + 1);
    const parsed = tryJsonParse(sliced);
    if (parsed) return parsed;
  }

  return null;
}

