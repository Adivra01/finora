const KEY = 'fintrack-hide-amounts';
let hidden = typeof localStorage !== 'undefined' && localStorage.getItem(KEY) === '1';
const listeners = new Set<() => void>();

export const MASK = '••••••';
export const isAmountsHidden = () => hidden;
export const setAmountsHidden = (v: boolean) => {
  hidden = v;
  localStorage.setItem(KEY, v ? '1' : '0');
  listeners.forEach((l) => l());
};
export const subscribePrivacy = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
/** Returns the formatted value, or a mask when amounts are hidden. */
export const mask = (formatted: string) => (hidden ? MASK : formatted);
