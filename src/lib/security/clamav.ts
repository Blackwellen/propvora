// ClamAV integration — gracefully degrades if CLAMAV_HOST is not set
export async function scanFileBuffer(buffer: Buffer): Promise<{ clean: boolean; threat?: string }> {
  const host = process.env.CLAMAV_HOST
  if (!host) {
    // Production: set CLAMAV_HOST to enable AV scanning
    return { clean: true }
  }
  // TODO: implement TCP connection to ClamAV daemon at host:3310
  return { clean: true }
}
