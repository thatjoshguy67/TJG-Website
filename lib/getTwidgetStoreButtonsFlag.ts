import 'server-only';

/** Resolve the server flag, including the Settings developer override. */
export async function getTwidgetStoreButtonsEnabled(): Promise<boolean> {
  try {
    const { cookies } = await import('next/headers');
    const override = (await cookies()).get('ff-twidget-store-buttons-enabled');
    if (override) return override.value === 'true';
  } catch {
    // Cookies are unavailable outside a request.
  }

  if (!process.env.FLAGS && !process.env.VERCEL_OIDC_TOKEN) return false;

  try {
    const { twidgetStoreButtonsEnabled } = await import('../flags');
    return Boolean(await twidgetStoreButtonsEnabled());
  } catch {
    return false;
  }
}
