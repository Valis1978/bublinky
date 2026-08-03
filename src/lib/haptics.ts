// Haptic feedback helpers — no-ops on web, real taps inside the iOS shell.
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = () => Capacitor.isNativePlatform();

/** light tick — buttons, tab switches */
export async function hapticTap(): Promise<void> {
  if (!isNative()) return;
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* unsupported */ }
}

/** medium thump — actions that land (feed, buy, equip) */
export async function hapticBump(): Promise<void> {
  if (!isNative()) return;
  try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch { /* unsupported */ }
}

/** success notification — gift claimed, sticker earned, level up */
export async function hapticSuccess(): Promise<void> {
  if (!isNative()) return;
  try { await Haptics.notification({ type: NotificationType.Success }); } catch { /* unsupported */ }
}

/** warning — blocked action (not enough coins, cooldown) */
export async function hapticWarn(): Promise<void> {
  if (!isNative()) return;
  try { await Haptics.notification({ type: NotificationType.Warning }); } catch { /* unsupported */ }
}
