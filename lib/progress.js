// 存档读取边界：只接受已知字段和有限的非负整数，兼容旧版数字字符串。
(() => {
  function count(value, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
    if (typeof value !== "number" && typeof value !== "string") return fallback;
    if (typeof value === "string" && !value.trim()) return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.floor(n))) : fallback;
  }

  function record(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function load(inventoryDefaults, maxLevel) {
    const { loadStr, loadJson } = window.GameUtil;
    const raw = loadJson("yyy_inventory", null);
    const inventory = { ...inventoryDefaults };
    if (record(raw)) {
      for (const key of Object.keys(inventory)) {
        inventory[key] = count(Object.hasOwn(raw, key) ? raw[key] : 0);
      }
    }
    return {
      stars: count(loadStr("yyy_stars", 0)),
      maxCleared: count(loadStr("yyy_cleared", 0), 0, maxLevel),
      inventory,
    };
  }

  function loadRedeemedCodes() {
    const raw = window.GameUtil.loadJson("yyy_redeemed_codes", null);
    const codes = Object.create(null);
    if (record(raw)) {
      for (const [key, value] of Object.entries(raw)) {
        const timestamp = count(value);
        if (timestamp > 0) codes[key] = timestamp;
      }
    }
    return codes;
  }

  window.GameProgress = { load, loadRedeemedCodes };
})();
